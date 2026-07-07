#!/usr/bin/env bash
# =============================================================================
# Myntra Clone — Production Deployment Script
# =============================================================================
# Usage:
#   ./deploy.sh                    # Full deploy (build + migrate + seed + start)
#   ./deploy.sh --skip-build       # Skip Docker build step
#   ./deploy.sh --skip-migrate     # Skip database migration
#   ./deploy.sh --skip-seed        # Skip data seeding
#   ./deploy.sh --skip-ssl         # Skip SSL setup
#   ./deploy.sh --rollback         # Rollback to previous version
#   ./deploy.sh --status           # Check service status
# =============================================================================

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Config ---
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
MONITORING_FILE="${PROJECT_DIR}/docker-compose.monitoring.yml"
ENV_FILE="${PROJECT_DIR}/.env"
NGINX_DIR="${PROJECT_DIR}/nginx"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_DIR}/deploy-${TIMESTAMP}.log"

# --- Parse flags ---
SKIP_BUILD=false
SKIP_MIGRATE=false
SKIP_SEED=false
SKIP_SSL=false
ROLLBACK=false
STATUS=false

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --skip-seed) SKIP_SEED=true ;;
    --skip-ssl) SKIP_SSL=true ;;
    --rollback) ROLLBACK=true ;;
    --status) STATUS=true ;;
    *) echo -e "${RED}Unknown option: $arg${NC}"; exit 1 ;;
  esac
done

# --- Logging ---
log() {
  local level="$1"
  local msg="$2"
  local color="$NC"
  case "$level" in
    INFO) color="$BLUE" ;;
    OK)   color="$GREEN" ;;
    WARN) color="$YELLOW" ;;
    ERR)  color="$RED" ;;
  esac
  echo -e "${color}[${level}]${NC} ${msg}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${msg}" >> "$LOG_FILE"
}

# --- Pre-flight checks ---
preflight() {
  log "INFO" "Running pre-flight checks..."

  # Check Docker
  if ! command -v docker &> /dev/null; then
    log "ERR" "Docker is not installed. Install Docker first: https://docs.docker.com/engine/install/"
    exit 1
  fi

  # Check Docker Compose
  if ! docker compose version &> /dev/null; then
    log "ERR" "Docker Compose is not available."
    exit 1
  fi

  # Check .env file
  if [ ! -f "$ENV_FILE" ]; then
    log "WARN" ".env file not found. Creating from .env.production.example..."
    if [ -f "${PROJECT_DIR}/.env.production.example" ]; then
      cp "${PROJECT_DIR}/.env.production.example" "$ENV_FILE"
      log "WARN" "⚠️  Edit .env with your actual secrets before continuing!"
      log "WARN" "   Run: nano $ENV_FILE"
      exit 1
    else
      log "ERR" "No .env.production.example found. Cannot proceed."
      exit 1
    fi
  fi

  # Source .env
  set -a
  source "$ENV_FILE"
  set +a

  # Check required vars (COD-only pass: Razorpay keys NOT required per §6.1)
  local required_vars=("JWT_SECRET" "COOKIE_SECRET")
  local missing=false
  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ] || [[ "${!var}" == CHANGE_ME* ]]; then
      log "WARN" "Required variable $var is not set or still has placeholder value."
      missing=true
    fi
  done
  if [ "$missing" = true ]; then
    log "ERR" "Please set all required variables in .env and re-run."
    exit 1
  fi

  # Create backup directory
  mkdir -p "$BACKUP_DIR"

  log "OK" "Pre-flight checks passed."
}

# --- Database backup ---
backup_db() {
  log "INFO" "Backing up database..."
  local backup_file="${BACKUP_DIR}/myntra-db-${TIMESTAMP}.sql.gz"
  docker exec myntra-postgres pg_dump -U "${POSTGRES_USER:-myntra}" "${POSTGRES_DB:-myntra_store}" | gzip > "$backup_file"
  log "OK" "Database backed up to: $backup_file"
}

# --- Pull latest code ---
pull_code() {
  log "INFO" "Pulling latest code..."
  if [ -d "${PROJECT_DIR}/.git" ]; then
    git pull origin main 2>&1 | tee -a "$LOG_FILE"
    log "OK" "Code pulled successfully."
  else
    log "WARN" "Not a git repository. Skipping pull."
  fi
}

# --- Build Docker images ---
build_images() {
  if [ "$SKIP_BUILD" = true ]; then
    log "INFO" "Skipping Docker build."
    return
  fi

  log "INFO" "Building Docker images..."

  # Build backend
  log "INFO" "Building Medusa backend image..."
  docker compose -f "$COMPOSE_FILE" build medusa 2>&1 | tee -a "$LOG_FILE"

  # Build storefront
  log "INFO" "Building Storefront image..."
  docker compose -f "$COMPOSE_FILE" build storefront 2>&1 | tee -a "$LOG_FILE"

  log "OK" "Docker images built successfully."
}

# --- Run database migrations ---
run_migrations() {
  if [ "$SKIP_MIGRATE" = true ]; then
    log "INFO" "Skipping database migration."
    return
  fi

  log "INFO" "Running database migrations..."

  # Start postgres and redis if not running
  docker compose -f "$COMPOSE_FILE" up -d postgres redis 2>&1 | tee -a "$LOG_FILE"

  # Wait for postgres
  log "INFO" "Waiting for PostgreSQL to be ready..."
  docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-myntra}" -d "${POSTGRES_DB:-myntra_store}" --timeout=30 || {
    log "ERR" "PostgreSQL did not become ready in time."
    exit 1
  }

  # Run migrations via medusa container — v2 command: medusa db:migrate
  # (NOT v1 "medusa migrations run")
  log "INFO" "Running Medusa migrations (v2: medusa db:migrate)..."
  docker compose -f "$COMPOSE_FILE" run --rm medusa sh -c "npx medusa db:migrate" 2>&1 | tee -a "$LOG_FILE"

  log "OK" "Database migrations completed."
}

# --- Seed data ---
seed_data() {
  if [ "$SKIP_SEED" = true ]; then
    log "INFO" "Skipping data seeding."
    return
  fi

  log "INFO" "Seeding data (v2 unified seed script)..."

  # Run the unified v2 seed script: src/scripts/seed.ts
  # This seeds region, categories, products (paise prices), pincodes, GST tax
  # rates, payment provider (COD), AND the default admin user
  # (admin@myntra-clone.com / admin123). See docs/deployment-guide.md.
  log "INFO" "Running: medusa exec src/scripts/seed.ts"
  docker compose -f "$COMPOSE_FILE" run --rm medusa sh -c "npx medusa exec src/scripts/seed.ts" 2>&1 | tee -a "$LOG_FILE" || {
    log "WARN" "Seed script failed (data may already be seeded). Continuing..."
  }

  log "OK" "Data seeding completed."
}

# --- Setup SSL with Let's Encrypt ---
setup_ssl() {
  if [ "$SKIP_SSL" = true ]; then
    log "INFO" "Skipping SSL setup."
    return
  fi

  log "INFO" "Setting up SSL certificates with Let's Encrypt..."

  # Check if certbot is installed
  if ! command -v certbot &> /dev/null; then
    log "INFO" "Installing certbot..."
    apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx 2>&1 | tee -a "$LOG_FILE"
  fi

  # Get domain from .env
  local domain="${DOMAIN:-myntra-clone.local}"
  local admin_domain="${ADMIN_DOMAIN:-admin.myntra-clone.local}"
  local api_domain="${API_DOMAIN:-api.myntra-clone.local}"
  local uploads_domain="${UPLOADS_DOMAIN:-uploads.myntra-clone.local}"

  # Obtain certificates
  log "INFO" "Obtaining SSL certificate for ${domain}..."
  certbot --nginx -d "$domain" -d "www.${domain}" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@${domain}}" --redirect 2>&1 | tee -a "$LOG_FILE" || {
    log "WARN" "SSL setup for ${domain} failed. Check DNS records and try again."
    log "WARN" "Ensure DNS A records point to this server's IP address."
  }

  log "INFO" "Obtaining SSL certificate for ${admin_domain}..."
  certbot --nginx -d "$admin_domain" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@${domain}}" --redirect 2>&1 | tee -a "$LOG_FILE" || true

  log "INFO" "Obtaining SSL certificate for ${api_domain}..."
  certbot --nginx -d "$api_domain" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@${domain}}" --redirect 2>&1 | tee -a "$LOG_FILE" || true

  log "INFO" "Obtaining SSL certificate for ${uploads_domain}..."
  certbot --nginx -d "$uploads_domain" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@${domain}}" --redirect 2>&1 | tee -a "$LOG_FILE" || true

  # Set up auto-renewal
  log "INFO" "Setting up SSL auto-renewal..."
  (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'docker compose -f ${COMPOSE_FILE} restart nginx'") | crontab -

  log "OK" "SSL setup completed."
}

# --- Start services ---
start_services() {
  log "INFO" "Starting all services..."

  # Start with production compose file
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"

  # Start monitoring if file exists
  if [ -f "$MONITORING_FILE" ]; then
    docker compose -f "$MONITORING_FILE" up -d 2>&1 | tee -a "$LOG_FILE"
  fi

  log "OK" "All services started."
}

# --- Check service status ---
check_status() {
  log "INFO" "Checking service status..."
  echo ""
  docker compose -f "$COMPOSE_FILE" ps 2>&1
  echo ""

  if [ -f "$MONITORING_FILE" ]; then
    docker compose -f "$MONITORING_FILE" ps 2>&1
    echo ""
  fi

  # Health checks
  log "INFO" "Running health checks..."
  local services=("postgres" "redis" "medusa" "storefront")
  for svc in "${services[@]}"; do
    local container="myntra-${svc}"
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
      local status
      status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
      log "INFO" "  ${container}: ${status}"
    else
      log "WARN" "  ${container}: NOT RUNNING"
    fi
  done
}

# --- Rollback ---
rollback() {
  log "INFO" "Rolling back to previous version..."

  # Find the most recent backup
  local latest_backup
  latest_backup=$(ls -t "${BACKUP_DIR}/myntra-db-"*.sql.gz 2>/dev/null | head -1)

  if [ -z "$latest_backup" ]; then
    log "WARN" "No database backups found. Skipping DB restore."
  else
    log "INFO" "Restoring database from: $latest_backup"
    docker compose -f "$COMPOSE_FILE" up -d postgres
    gunzip -c "$latest_backup" | docker exec -i myntra-postgres psql -U "${POSTGRES_USER:-myntra}" -d "${POSTGRES_DB:-myntra_store}"
    log "OK" "Database restored."
  fi

  # Pull previous Docker images
  log "INFO" "Pulling previous Docker images..."
  docker compose -f "$COMPOSE_FILE" pull 2>&1 | tee -a "$LOG_FILE"

  # Restart services
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate 2>&1 | tee -a "$LOG_FILE"

  log "OK" "Rollback completed."
}

# --- Post-deploy tasks ---
post_deploy() {
  log "INFO" "Running post-deployment tasks..."

  # NOTE: The default admin user (admin@myntra-clone.com / admin123) is created
  # by the seed script (src/scripts/seed.ts). We do NOT create it again here to
  # avoid duplicates. If you need a different admin, run manually after deploy:
  #   docker compose -f docker-compose.prod.yml exec medusa \
  #     npx medusa user -e <email> -p <password>
  #
  # IMPORTANT: Change the default admin password (admin123) immediately after
  # first boot — see docs/deployment-guide.md.

  # Clean up old images
  log "INFO" "Cleaning up old Docker images..."
  docker image prune -f 2>&1 | tee -a "$LOG_FILE"

  log "OK" "Post-deployment tasks completed."
}

# --- Print summary ---
print_summary() {
  local domain="${DOMAIN:-myntra-clone.com}"
  echo ""
  echo "============================================"
  echo -e "${GREEN}  Myntra Clone — Deployment Complete!${NC}"
  echo "============================================"
  echo ""
  echo -e "  Storefront:  ${BLUE}https://${domain}${NC}"
  echo -e "  Admin Panel: ${BLUE}https://admin.${domain}/app${NC}"
  echo -e "  API:         ${BLUE}https://api.${domain}${NC}"
  echo ""
  echo -e "  Deploy log:  ${YELLOW}${LOG_FILE}${NC}"
  echo ""
  echo "============================================"
  echo ""
}

# --- Main ---
main() {
  echo ""
  echo "============================================"
  echo -e "${BLUE}  Myntra Clone — Deployment Script${NC}"
  echo "============================================"
  echo ""

  if [ "$STATUS" = true ]; then
    check_status
    exit 0
  fi

  if [ "$ROLLBACK" = true ]; then
    preflight
    rollback
    exit 0
  fi

  preflight
  backup_db
  pull_code
  build_images
  run_migrations
  seed_data
  start_services
  setup_ssl
  post_deploy
  print_summary
}

main "$@"
