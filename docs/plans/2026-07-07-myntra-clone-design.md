# Myntra Clone — Full E-Commerce Platform Design Document

> A complete, production-grade Myntra.com clone built on Medusa.js + Next.js 14
> **Date:** 2026-07-07

---

## 1. Architecture Overview

```
myntra-clone/
├── backend/                    # Medusa v2 + custom modules
│   ├── medusa-config.js
│   ├── src/
│   │   ├── admin/              # Custom admin pages
│   │   ├── api/                # Custom endpoints
│   │   ├── models/             # Custom entities
│   │   ├── scripts/            # Seed scripts
│   │   ├── subscribers/       # Event subscribers
│   │   └── strategies/         # Custom payment/fulfillment
│   ├── uploads/                # Product images (Docker volume)
│   └── package.json
├── storefront/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                # Route groups
│   │   ├── components/         # UI components
│   │   ├── lib/                # API clients, utils
│   │   └── styles/             # CSS/SCSS
│   └── package.json
├── docker-compose.yml           # postgres, redis, medusa, storefront
├── .env.example
├── setup.sh
└── progress.md
```

### Key Architectural Decisions

- **Medusa v2** for core commerce (products, orders, cart, auth, payments)
- **Next.js 14 App Router** with Server Components for storefront
- **Docker Compose** for local dev and VPS deployment
- **Sub-agents** for parallel development to avoid context rot
- **progress.md** for cross-session state tracking

---

## 2. Data Models

### Core Medusa Entities (used as-is)
- `Product`, `ProductVariant`, `ProductCollection`, `ProductCategory`
- `Order`, `Cart`, `LineItem`, `Payment`, `Fulfillment`, `Return`
- `Customer`, `Address`, `Region`, `SalesChannel`
- `Discount`, `GiftCard`

### Custom Entities

#### Pincode
```typescript
pincode: string         // 6 digits, unique, indexed
is_serviceable: boolean
estimated_days: number
city: string
state: string
```

#### Review
```typescript
product_id: string      // FK to Product
customer_id: string     // FK to Customer
rating: number          // 1-5
title: string
body: string
images: string[]        // URLs
is_verified: boolean
created_at: timestamp
```

#### Wishlist
```typescript
customer_id: string     // FK to Customer
product_id: string      // FK to Product
variant_id: string      // FK to ProductVariant (optional)
created_at: timestamp
```

#### ReturnRequest
```typescript
order_id: string        // FK to Order
customer_id: string     // FK to Customer
items: JSON             // { line_item_id, quantity, reason }
status: enum            // pending | approved | picked_up | refunded | rejected
pickup_address: JSON
pickup_date: timestamp
created_at: timestamp
```

---

## 3. API Design

### Custom Endpoints (Medusa backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/store/pincodes/:code` | Pincode serviceability check |
| GET | `/store/reviews/:product_id` | Get product reviews |
| POST | `/store/reviews` | Submit review |
| GET | `/store/wishlist` | Get customer wishlist |
| POST | `/store/wishlist` | Add to wishlist |
| DELETE | `/store/wishlist/:id` | Remove from wishlist |
| POST | `/store/returns` | Request return |
| GET | `/store/returns` | Get customer returns |
| POST | `/admin/products/bulk-upload` | Bulk product import (CSV/Excel) |
| GET | `/admin/analytics/dashboard` | Admin analytics data |
| POST | `/admin/upload` | Upload product images |

### Medusa Native Endpoints (heavily used)

- `GET /store/products` — Product listing with filters
- `GET /store/products/:id` — Product detail
- `GET /store/products/:id/variants` — Variants (size/color)
- `POST /store/carts` — Create cart
- `POST /store/carts/:id/line-items` — Add to cart
- `POST /store/carts/:id/payment-sessions` — Initiate payment
- `POST /store/orders` — Complete order
- `GET /store/orders` — Customer orders
- `POST /store/customers` — Register
- `POST /store/auth` — Login

---

## 4. Storefront Pages & Components

### Page Routes

| Route | Page | Key Components |
|-------|------|----------------|
| `/` | Homepage | Hero banner, category grid, trending products, footer |
| `/products` | Product Listing | Filter sidebar, product grid, sort, pagination |
| `/products/[handle]` | Product Detail | Image gallery, size/color picker, pincode checker, reviews |
| `/cart` | Cart | Cart items, quantity controls, coupon, price summary |
| `/checkout` | Checkout | Address form, shipping selection, payment (Razorpay/COD) |
| `/account` | Login/Register | Auth forms |
| `/account/dashboard` | Dashboard | Order summary, wishlist, saved addresses |
| `/account/orders` | Order History | Order list with status |
| `/account/orders/[id]` | Order Detail | Order items, tracking, return option |
| `/account/wishlist` | Wishlist | Saved items |
| `/account/addresses` | Saved addresses | Address CRUD |
| `/search` | Search Results | Search bar, filters, results grid |
| `/collections/[handle]` | Collection | Curated product collection |

### Shared Components

- `Header` — Logo, search bar, nav categories, cart icon, user menu
- `Footer` — Links, social, newsletter, app download
- `ProductCard` — Image, name, price, rating, quick add
- `FilterSidebar` — Category, size, color, price range, brand, discount
- `ImageGallery` — Thumbnails, zoom, lightbox
- `PincodeChecker` — Input, validation, ETA display
- `ReviewCard` — Star rating, text, images, verified badge
- `CartDrawer` — Slide-out cart summary
- `MobileNav` — Hamburger menu for mobile

---

## 5. Theme & Design System

### Myntra Design Tokens (to be extracted)

- **Primary color:** #FF3F6C (Myntra pink/red)
- **Secondary:** #526CD0 (blue accents)
- **Background:** #FFFFFF
- **Text:** #282C3F (dark navy)
- **Muted text:** #94969F
- **Border:** #E5E5E5
- **Font:** Whitelabel (custom) → fallback to system sans-serif
- **Header height:** 80px (desktop), 56px (mobile)
- **Max content width:** 1280px

### Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 6. Payment Integration

### Razorpay
- Medusa plugin: `@devx-commerce/razorpay` or custom integration
- Keys via `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- Flow: Create payment session → Open Razorpay modal → Handle success/callback

### Cash on Delivery
- Medusa native Manual Payment provider
- Enabled for India region only

---

## 7. Seed Data

### Categories (Myntra-style)
- Men (Topwear, Bottomwear, Footwear, Accessories)
- Women (Ethnic, Western, Footwear, Accessories)
- Kids
- Home & Living
- Beauty

### Products
- ~100 sample fashion products with images (scraped from Myntra)
- Variants: size (S, M, L, XL) and color options
- Prices in INR

### Pincodes
- ~500 Indian pincodes (metros + tier-2 cities)
- All marked serviceable with ETAs

### Tax Rates
- GST slabs: 0%, 5%, 12%, 18%, 28%

---

## 8. Deployment (VPS)

### Docker Compose Services

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | `postgres:15` | 5432 | Main database |
| `redis` | `redis:alpine` | 6379 | Jobs & sessions |
| `medusa` | Node.js (custom) | 9000 | Backend + Admin |
| `storefront` | Next.js (custom) | 3000 | Customer site |
| `nginx` | `nginx:alpine` | 80/443 | Reverse proxy + SSL |

### VPS Requirements
- 2GB RAM minimum, 4GB recommended
- Docker + Docker Compose
- Domain with DNS pointing to VPS IP
- SSL via Let's Encrypt (Certbot)

---

## 9. Implementation Order (Phased)

### Phase 1: Foundation
- [ ] Docker Compose setup (postgres, redis)
- [ ] Medusa backend scaffold
- [ ] Next.js storefront scaffold
- [ ] Custom entities (pincode, review, wishlist, return)
- [ ] Seed scripts

### Phase 2: Frontend Clone (Autonomous UI Loop)
- [ ] Extract Myntra homepage HTML/CSS/assets
- [ ] Build homepage with pixel-perfect matching
- [ ] Extract & build product listing page
- [ ] Extract & build product detail page
- [ ] Extract & build cart page
- [ ] Extract & build checkout flow
- [ ] Extract & build account pages
- [ ] Extract & build search

### Phase 3: Backend Integration
- [ ] Connect storefront to Medusa API
- [ ] Implement custom API endpoints
- [ ] Razorpay integration
- [ ] Bulk product upload
- [ ] Review/rating system
- [ ] Wishlist functionality
- [ ] Return/exchange workflow

### Phase 4: Admin Panel
- [ ] Product management (CRUD)
- [ ] Order management
- [ ] User management
- [ ] Discount/coupon management
- [ ] Analytics dashboard

### Phase 5: Deployment
- [ ] Docker Compose production config
- [ ] Nginx reverse proxy + SSL
- [ ] CI/CD pipeline
- [ ] Domain setup
- [ ] Monitoring
