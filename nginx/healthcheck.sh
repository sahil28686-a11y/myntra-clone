#!/bin/sh
# Health check script for Myntra Clone services
# Used by monitoring systems (UptimeRobot, BetterStack, etc.)

set -e

BASE_URL="${1:-http://localhost}"

echo "{
  \"status\": \"checking\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"checks\": {"

first=true

# Check storefront
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}/" 2>/dev/null || echo "000")
if [ "$first" = true ]; then first=false; else echo ","; fi
echo "    \"storefront\": {\"status\": $( [ "$STATUS" = "200" ] && echo '"up"' || echo '"down"'), \"http_code\": $STATUS }"

# Check API
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}/health" 2>/dev/null || echo "000")
echo ",    \"api\": {\"status\": $( [ "$STATUS" = "200" ] && echo '"up"' || echo '"down"'), \"http_code\": $STATUS }"

# Check Medusa health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}:9000/health" 2>/dev/null || echo "000")
echo ",    \"medusa\": {\"status\": $( [ "$STATUS" = "200" ] && echo '"up"' || echo '"down"'), \"http_code\": $STATUS }"

echo "  }
}"
