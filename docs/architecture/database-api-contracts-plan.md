# Database & API Contracts Plan

**Document Status:** Implementation Plan — Pending Approval  
**Last Updated:** 2026-01-18  
**Version:** 1.0  
**Scope:** Local and Dev Environments Only

---

## Overview

This document defines the database schema and API contracts for the TrustCart Kenya e-commerce platform. It provides a complete, auditable mapping from **Domain Model → Database Tables → API Endpoints → Async Events**.

> [!IMPORTANT]
> **Scope Boundaries:**
>
> - ✅ Database schema definition (Prisma)
> - ✅ API endpoint contracts (OpenAPI-style)
> - ✅ Async queue/event contracts
> - ✅ Local and Dev environments only
> - ❌ No business logic implementation
> - ❌ No sensitive data or real secrets
> - ❌ No production deployment

---

## 1. Database Schema Design

### 1.1 Schema Overview

```mermaid
erDiagram
    User ||--o{ Address : has
    User ||--o{ Order : places
    User ||--o| Cart : has
    User ||--o{ Review : writes

    Cart ||--o{ CartItem : contains
    CartItem }o--|| Product : references

    Order ||--o{ OrderItem : contains
    Order ||--|| OrderAddress : ships_to
    Order ||--o{ PaymentTransaction : paid_by
    Order ||--o| Delivery : fulfilled_by
    Order ||--o{ OrderStatusHistory : tracks

    Product ||--o{ ProductImage : has
    Product }o--|| Category : belongs_to
    Product }o--o| Brand : made_by
    Product ||--o| InventoryRecord : stocked_as

    InventoryRecord ||--o{ StockAdjustment : adjusted_by

    Delivery }o--|| DeliveryProvider : handled_by
    Delivery ||--o{ DeliveryEvent : tracks

    PaymentTransaction ||--o| MpesaTransaction : details
    PaymentTransaction ||--o| Refund : refunded_as

    PromoCode ||--o{ PromoUsage : used_in
```

---

### 1.2 User Domain Tables

#### User

| Column           | Type        | Constraints       | Description                     |
| ---------------- | ----------- | ----------------- | ------------------------------- |
| `id`             | `String`    | PK, cuid          | Unique identifier               |
| `email`          | `String`    | Unique, Not Null  | Email address (🔒 PII)          |
| `password_hash`  | `String`    | Not Null          | Bcrypt hash                     |
| `first_name`     | `String`    | Not Null          | First name (🔒 PII)             |
| `last_name`      | `String`    | Not Null          | Last name (🔒 PII)              |
| `phone`          | `String?`   |                   | Phone number (🔒 PII)           |
| `role`           | `Enum`      | Default: CUSTOMER | CUSTOMER, STAFF, MANAGER, ADMIN |
| `is_active`      | `Boolean`   | Default: true     | Account status                  |
| `email_verified` | `Boolean`   | Default: false    | Email verification status       |
| `created_at`     | `DateTime`  | Default: now()    | Registration timestamp          |
| `updated_at`     | `DateTime`  | Auto-update       | Last update timestamp           |
| `last_login_at`  | `DateTime?` |                   | Last login timestamp            |

**Indexes:** email (unique), role, is_active  
**Data Ownership:** User Service (write), all services (read email/id only)

#### Address

| Column           | Type       | Constraints         | Description                 |
| ---------------- | ---------- | ------------------- | --------------------------- |
| `id`             | `String`   | PK, cuid            | Unique identifier           |
| `user_id`        | `String`   | FK → User, Not Null | Owner reference             |
| `label`          | `String`   | Not Null            | "Home", "Office", etc.      |
| `recipient_name` | `String`   | Not Null            | Delivery recipient (🔒 PII) |
| `phone`          | `String`   | Not Null            | Contact phone (🔒 PII)      |
| `line1`          | `String`   | Not Null            | Street address              |
| `line2`          | `String?`  |                     | Additional address info     |
| `city`           | `String`   | Not Null            | City name                   |
| `county`         | `String`   | Not Null            | County/Region               |
| `is_default`     | `Boolean`  | Default: false      | Default shipping address    |
| `created_at`     | `DateTime` | Default: now()      |                             |
| `updated_at`     | `DateTime` | Auto-update         |                             |

**Indexes:** user_id, is_default  
**Data Ownership:** User Service

---

### 1.3 Product Domain Tables

#### Category

| Column        | Type       | Constraints      | Description                      |
| ------------- | ---------- | ---------------- | -------------------------------- |
| `id`          | `String`   | PK, cuid         | Unique identifier                |
| `name`        | `String`   | Not Null         | Category name                    |
| `slug`        | `String`   | Unique, Not Null | URL-friendly name                |
| `description` | `String?`  |                  | Category description             |
| `parent_id`   | `String?`  | FK → Category    | Parent category (tree structure) |
| `image_url`   | `String?`  |                  | Category image                   |
| `sort_order`  | `Int`      | Default: 0       | Display order                    |
| `is_active`   | `Boolean`  | Default: true    | Visibility                       |
| `created_at`  | `DateTime` | Default: now()   |                                  |
| `updated_at`  | `DateTime` | Auto-update      |                                  |

**Indexes:** slug (unique), parent_id, is_active, sort_order

#### Brand

| Column       | Type       | Constraints      | Description       |
| ------------ | ---------- | ---------------- | ----------------- |
| `id`         | `String`   | PK, cuid         | Unique identifier |
| `name`       | `String`   | Not Null         | Brand name        |
| `slug`       | `String`   | Unique, Not Null | URL-friendly name |
| `logo_url`   | `String?`  |                  | Brand logo        |
| `is_active`  | `Boolean`  | Default: true    |                   |
| `created_at` | `DateTime` | Default: now()   |                   |

**Indexes:** slug (unique), is_active

#### Product

| Column              | Type       | Constraints             | Description                                               |
| ------------------- | ---------- | ----------------------- | --------------------------------------------------------- |
| `id`                | `String`   | PK, cuid                | Unique identifier                                         |
| `sku`               | `String`   | Unique, Not Null        | Stock keeping unit                                        |
| `name`              | `String`   | Not Null                | Product name                                              |
| `slug`              | `String`   | Unique, Not Null        | URL-friendly name                                         |
| `description`       | `String`   | Not Null                | Full description                                          |
| `short_description` | `String?`  |                         | Brief summary                                             |
| `price`             | `Int`      | Not Null                | Price in KES (VAT inclusive)                              |
| `compare_at_price`  | `Int?`     |                         | Original price for sales                                  |
| `condition`         | `Enum`     | Not Null                | BRAND_NEW, OPEN_BOX, CERTIFIED_REFURBISHED, EX_UK, EX_USA |
| `category_id`       | `String`   | FK → Category, Not Null | Category reference                                        |
| `brand_id`          | `String?`  | FK → Brand              | Brand reference                                           |
| `warranty_months`   | `Int`      | Default: 0              | Warranty period                                           |
| `is_active`         | `Boolean`  | Default: true           | Listed for sale                                           |
| `is_featured`       | `Boolean`  | Default: false          | Featured on homepage                                      |
| `created_at`        | `DateTime` | Default: now()          |                                                           |
| `updated_at`        | `DateTime` | Auto-update             |                                                           |

**Indexes:** sku (unique), slug (unique), category_id, brand_id, price, is_active, condition  
**Data Ownership:** Product Service

#### ProductImage

| Column       | Type      | Constraints            | Description        |
| ------------ | --------- | ---------------------- | ------------------ |
| `id`         | `String`  | PK, cuid               | Unique identifier  |
| `product_id` | `String`  | FK → Product, Not Null | Product reference  |
| `url`        | `String`  | Not Null               | Image URL          |
| `alt_text`   | `String?` |                        | Accessibility text |
| `sort_order` | `Int`     | Default: 0             | Display order      |
| `is_primary` | `Boolean` | Default: false         | Primary image      |

**Indexes:** product_id, sort_order

#### ProductAttribute

| Column       | Type     | Constraints            | Description                    |
| ------------ | -------- | ---------------------- | ------------------------------ |
| `id`         | `String` | PK, cuid               | Unique identifier              |
| `product_id` | `String` | FK → Product, Not Null | Product reference              |
| `name`       | `String` | Not Null               | Attribute name (e.g., "RAM")   |
| `value`      | `String` | Not Null               | Attribute value (e.g., "16GB") |

**Indexes:** product_id  
**Unique Constraint:** (product_id, name)

---

### 1.4 Inventory Domain Tables

#### InventoryRecord

| Column              | Type       | Constraints                    | Description           |
| ------------------- | ---------- | ------------------------------ | --------------------- |
| `id`                | `String`   | PK, cuid                       | Unique identifier     |
| `product_id`        | `String`   | FK → Product, Unique, Not Null | Product reference     |
| `quantity_on_hand`  | `Int`      | Not Null, Default: 0           | Physical stock        |
| `quantity_reserved` | `Int`      | Not Null, Default: 0           | Reserved for orders   |
| `reorder_threshold` | `Int`      | Default: 5                     | Low stock alert level |
| `updated_at`        | `DateTime` | Auto-update                    | Last update           |

**Computed:** `quantity_available = quantity_on_hand - quantity_reserved`  
**Indexes:** product_id (unique)  
**Data Ownership:** Inventory Service  
**⚠️ Critical:** Never allow negative `quantity_available`

#### StockAdjustment

| Column         | Type       | Constraints            | Description                                |
| -------------- | ---------- | ---------------------- | ------------------------------------------ |
| `id`           | `String`   | PK, cuid               | Unique identifier                          |
| `product_id`   | `String`   | FK → Product, Not Null | Product reference                          |
| `type`         | `Enum`     | Not Null               | PURCHASE, SALE, RETURN, DAMAGE, CORRECTION |
| `quantity`     | `Int`      | Not Null               | Adjustment amount (can be negative)        |
| `reason`       | `String?`  |                        | Explanation                                |
| `reference_id` | `String?`  |                        | Order ID or related reference              |
| `admin_id`     | `String?`  | FK → User              | Admin who made adjustment                  |
| `created_at`   | `DateTime` | Default: now()         |                                            |

**Indexes:** product_id, type, created_at

#### Reservation

| Column       | Type       | Constraints            | Description                           |
| ------------ | ---------- | ---------------------- | ------------------------------------- |
| `id`         | `String`   | PK, cuid               | Unique identifier                     |
| `product_id` | `String`   | FK → Product, Not Null | Product reference                     |
| `order_id`   | `String?`  | FK → Order             | Associated order                      |
| `cart_id`    | `String?`  | FK → Cart              | Associated cart (for checkout hold)   |
| `quantity`   | `Int`      | Not Null               | Reserved quantity                     |
| `status`     | `Enum`     | Not Null               | PENDING, CONFIRMED, RELEASED, EXPIRED |
| `expires_at` | `DateTime` | Not Null               | Reservation expiry                    |
| `created_at` | `DateTime` | Default: now()         |                                       |

**Indexes:** product_id, status, expires_at

---

### 1.5 Cart Domain Tables

#### Cart

| Column          | Type       | Constraints    | Description                |
| --------------- | ---------- | -------------- | -------------------------- |
| `id`            | `String`   | PK, cuid       | Unique identifier          |
| `user_id`       | `String?`  | FK → User      | Customer (null for guests) |
| `session_id`    | `String?`  |                | Guest session identifier   |
| `promo_code_id` | `String?`  | FK → PromoCode | Applied promo code         |
| `expires_at`    | `DateTime` |                | Guest cart expiration      |
| `created_at`    | `DateTime` | Default: now() |                            |
| `updated_at`    | `DateTime` | Auto-update    |                            |

**Indexes:** user_id, session_id, expires_at  
**Unique Constraint:** One active cart per user OR session

#### CartItem

| Column         | Type       | Constraints            | Description                 |
| -------------- | ---------- | ---------------------- | --------------------------- |
| `id`           | `String`   | PK, cuid               | Unique identifier           |
| `cart_id`      | `String`   | FK → Cart, Not Null    | Cart reference              |
| `product_id`   | `String`   | FK → Product, Not Null | Product reference           |
| `quantity`     | `Int`      | Not Null, Min: 1       | Item quantity               |
| `price_at_add` | `Int`      | Not Null               | Price when added (snapshot) |
| `added_at`     | `DateTime` | Default: now()         |                             |

**Indexes:** cart_id, product_id  
**Unique Constraint:** (cart_id, product_id)

---

### 1.6 Order Domain Tables

#### Order

| Column           | Type       | Constraints          | Description                        |
| ---------------- | ---------- | -------------------- | ---------------------------------- |
| `id`             | `String`   | PK, cuid             | Unique identifier                  |
| `order_number`   | `String`   | Unique, Not Null     | Human-readable order number        |
| `user_id`        | `String`   | FK → User, Not Null  | Customer reference                 |
| `email`          | `String`   | Not Null             | Contact email (snapshot)           |
| `phone`          | `String`   | Not Null             | Contact phone (snapshot)           |
| `status`         | `Enum`     | Not Null             | Order status (see enum below)      |
| `subtotal`       | `Int`      | Not Null             | Sum of items before fees/discounts |
| `delivery_fee`   | `Int`      | Not Null, Default: 0 | Shipping cost                      |
| `discount`       | `Int`      | Not Null, Default: 0 | Total discount applied             |
| `total`          | `Int`      | Not Null             | Final amount to pay                |
| `payment_method` | `Enum`     | Not Null             | MPESA_STK, MPESA_PAYBILL, POD_CASH |
| `promo_code_id`  | `String?`  | FK → PromoCode       | Applied promo                      |
| `notes`          | `String?`  |                      | Customer notes                     |
| `created_at`     | `DateTime` | Default: now()       | Order placed                       |
| `updated_at`     | `DateTime` | Auto-update          |                                    |

**Order Status Enum:**

- CREATED, PENDING_PAYMENT, PAYMENT_FAILED
- CONFIRMED, PROCESSING, READY_FOR_PICKUP
- DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, DELIVERY_FAILED
- RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED, RETURN_RECEIVED
- REFUND_PENDING, REFUNDED, PARTIAL_REFUND
- COMPLETED, CANCELLED, EXPIRED

**Indexes:** order_number (unique), user_id, status, created_at  
**Data Ownership:** Order Service

#### OrderItem

| Column         | Type     | Constraints            | Description                  |
| -------------- | -------- | ---------------------- | ---------------------------- |
| `id`           | `String` | PK, cuid               | Unique identifier            |
| `order_id`     | `String` | FK → Order, Not Null   | Order reference              |
| `product_id`   | `String` | FK → Product, Not Null | Original product             |
| `product_name` | `String` | Not Null               | Snapshot of product name     |
| `product_sku`  | `String` | Not Null               | Snapshot of SKU              |
| `quantity`     | `Int`    | Not Null               | Quantity ordered             |
| `unit_price`   | `Int`    | Not Null               | Price per unit at order time |
| `line_total`   | `Int`    | Not Null               | quantity × unit_price        |

**Indexes:** order_id, product_id

#### OrderAddress

| Column           | Type      | Constraints                  | Description             |
| ---------------- | --------- | ---------------------------- | ----------------------- |
| `id`             | `String`  | PK, cuid                     | Unique identifier       |
| `order_id`       | `String`  | FK → Order, Unique, Not Null | Order reference         |
| `recipient_name` | `String`  | Not Null                     | Recipient name (🔒 PII) |
| `phone`          | `String`  | Not Null                     | Contact phone (🔒 PII)  |
| `line1`          | `String`  | Not Null                     | Street address          |
| `line2`          | `String?` |                              | Additional info         |
| `city`           | `String`  | Not Null                     | City                    |
| `county`         | `String`  | Not Null                     | County                  |

**Indexes:** order_id (unique)

#### OrderStatusHistory

| Column            | Type       | Constraints          | Description             |
| ----------------- | ---------- | -------------------- | ----------------------- |
| `id`              | `String`   | PK, cuid             | Unique identifier       |
| `order_id`        | `String`   | FK → Order, Not Null | Order reference         |
| `from_status`     | `Enum?`    |                      | Previous status         |
| `to_status`       | `Enum`     | Not Null             | New status              |
| `changed_by_id`   | `String?`  | FK → User            | User who made change    |
| `changed_by_type` | `Enum`     |                      | CUSTOMER, STAFF, SYSTEM |
| `reason`          | `String?`  |                      | Change reason           |
| `created_at`      | `DateTime` | Default: now()       |                         |

**Indexes:** order_id, created_at

---

### 1.7 Payment Domain Tables

> [!CAUTION]
> **High-Risk Domain:** Payment tables require additional security controls.

#### PaymentTransaction

| Column            | Type        | Constraints          | Description                                      |
| ----------------- | ----------- | -------------------- | ------------------------------------------------ |
| `id`              | `String`    | PK, cuid             | Unique identifier                                |
| `order_id`        | `String`    | FK → Order, Not Null | Order reference                                  |
| `method`          | `Enum`      | Not Null             | MPESA_STK, MPESA_PAYBILL, POD_CASH               |
| `amount`          | `Int`       | Not Null             | Amount in KES                                    |
| `currency`        | `String`    | Default: "KES"       | Currency code                                    |
| `status`          | `Enum`      | Not Null             | INITIATED, PENDING, CONFIRMED, FAILED, CANCELLED |
| `provider_ref`    | `String?`   |                      | External transaction reference                   |
| `idempotency_key` | `String`    | Unique               | Prevents duplicate transactions                  |
| `initiated_at`    | `DateTime`  | Default: now()       |                                                  |
| `confirmed_at`    | `DateTime?` |                      | When confirmed                                   |
| `failed_at`       | `DateTime?` |                      | When failed                                      |

**Indexes:** order_id, status, provider_ref, idempotency_key (unique)  
**Data Ownership:** Payment Service (exclusive write)

#### MpesaTransaction

| Column                 | Type        | Constraints                     | Description                 |
| ---------------------- | ----------- | ------------------------------- | --------------------------- |
| `id`                   | `String`    | PK, cuid                        | Unique identifier           |
| `transaction_id`       | `String`    | FK → PaymentTransaction, Unique | Parent transaction          |
| `phone_number`         | `String`    | Not Null                        | Customer phone (🔒 PII)     |
| `checkout_request_id`  | `String`    | Not Null                        | Daraja request ID           |
| `merchant_request_id`  | `String?`   |                                 | Daraja merchant ID          |
| `mpesa_receipt`        | `String?`   |                                 | MPesa confirmation code     |
| `result_code`          | `Int?`      |                                 | Daraja result code          |
| `result_desc`          | `String?`   |                                 | Daraja result description   |
| `callback_received_at` | `DateTime?` |                                 | When callback was processed |

**Indexes:** checkout_request_id, mpesa_receipt

#### Refund

| Column            | Type        | Constraints                       | Description                                      |
| ----------------- | ----------- | --------------------------------- | ------------------------------------------------ |
| `id`              | `String`    | PK, cuid                          | Unique identifier                                |
| `order_id`        | `String`    | FK → Order, Not Null              | Order reference                                  |
| `transaction_id`  | `String`    | FK → PaymentTransaction, Not Null | Original payment                                 |
| `amount`          | `Int`       | Not Null                          | Refund amount                                    |
| `reason`          | `String`    | Not Null                          | Refund reason                                    |
| `status`          | `Enum`      | Not Null                          | PENDING, APPROVED, PROCESSING, COMPLETED, FAILED |
| `approved_by_id`  | `String?`   | FK → User                         | Manager who approved                             |
| `processed_by_id` | `String?`   | FK → User                         | Person who processed                             |
| `approved_at`     | `DateTime?` |                                   | Approval timestamp                               |
| `processed_at`    | `DateTime?` |                                   | Processing timestamp                             |
| `created_at`      | `DateTime`  | Default: now()                    |                                                  |

**Indexes:** order_id, status, created_at  
**⚠️ Approval Gate:** Refunds require manager approval

---

### 1.8 Delivery Domain Tables

#### DeliveryProvider

| Column          | Type      | Constraints      | Description       |
| --------------- | --------- | ---------------- | ----------------- |
| `id`            | `String`  | PK, cuid         | Unique identifier |
| `name`          | `String`  | Not Null         | Provider name     |
| `code`          | `String`  | Unique, Not Null | Short code        |
| `contact_phone` | `String?` |                  | Support phone     |
| `api_endpoint`  | `String?` |                  | Integration URL   |
| `is_active`     | `Boolean` | Default: true    |                   |

#### Delivery

| Column            | Type        | Constraints                     | Description                                                                    |
| ----------------- | ----------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `id`              | `String`    | PK, cuid                        | Unique identifier                                                              |
| `order_id`        | `String`    | FK → Order, Unique, Not Null    | Order reference                                                                |
| `provider_id`     | `String`    | FK → DeliveryProvider, Not Null | Courier                                                                        |
| `status`          | `Enum`      | Not Null                        | PENDING, ASSIGNED, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED |
| `zone`            | `Enum`      | Not Null                        | ZONE_1, ZONE_2, ZONE_3, ZONE_4                                                 |
| `fee`             | `Int`       | Not Null                        | Delivery fee charged                                                           |
| `tracking_number` | `String?`   |                                 | Courier tracking number                                                        |
| `scheduled_date`  | `DateTime?` |                                 | Scheduled delivery date                                                        |
| `delivered_at`    | `DateTime?` |                                 | Actual delivery time                                                           |
| `created_at`      | `DateTime`  | Default: now()                  |                                                                                |
| `updated_at`      | `DateTime`  | Auto-update                     |                                                                                |

**Indexes:** order_id (unique), provider_id, status, tracking_number

#### DeliveryEvent

| Column        | Type       | Constraints             | Description                |
| ------------- | ---------- | ----------------------- | -------------------------- |
| `id`          | `String`   | PK, cuid                | Unique identifier          |
| `delivery_id` | `String`   | FK → Delivery, Not Null | Delivery reference         |
| `event_type`  | `String`   | Not Null                | Event type code            |
| `description` | `String`   | Not Null                | Human-readable description |
| `location`    | `String?`  |                         | Event location             |
| `occurred_at` | `DateTime` | Not Null                | Event timestamp            |
| `created_at`  | `DateTime` | Default: now()          |                            |

**Indexes:** delivery_id, occurred_at

#### ProofOfDelivery

| Column           | Type       | Constraints                     | Description             |
| ---------------- | ---------- | ------------------------------- | ----------------------- |
| `id`             | `String`   | PK, cuid                        | Unique identifier       |
| `delivery_id`    | `String`   | FK → Delivery, Unique, Not Null | Delivery reference      |
| `recipient_name` | `String`   | Not Null                        | Who signed (🔒 PII)     |
| `signature_url`  | `String?`  |                                 | Digital signature image |
| `photo_url`      | `String?`  |                                 | Delivery photo          |
| `notes`          | `String?`  |                                 | Driver notes            |
| `collected_at`   | `DateTime` | Not Null                        | POD collected timestamp |

---

### 1.9 Promotion Domain Tables

#### PromoCode

| Column                   | Type       | Constraints      | Description                   |
| ------------------------ | ---------- | ---------------- | ----------------------------- |
| `id`                     | `String`   | PK, cuid         | Unique identifier             |
| `code`                   | `String`   | Unique, Not Null | Promo code                    |
| `discount_type`          | `Enum`     | Not Null         | PERCENT, FIXED, FREE_DELIVERY |
| `discount_value`         | `Int`      | Not Null         | Discount amount/percentage    |
| `min_order_value`        | `Int?`     |                  | Minimum order to apply        |
| `max_usage_total`        | `Int?`     |                  | Max total uses                |
| `max_usage_per_customer` | `Int`      | Default: 1       | Max uses per customer         |
| `starts_at`              | `DateTime` | Not Null         | Valid from                    |
| `expires_at`             | `DateTime` | Not Null         | Valid until                   |
| `is_active`              | `Boolean`  | Default: true    |                               |
| `created_at`             | `DateTime` | Default: now()   |                               |

**Indexes:** code (unique, case-insensitive), is_active, starts_at, expires_at

#### PromoUsage

| Column             | Type       | Constraints              | Description            |
| ------------------ | ---------- | ------------------------ | ---------------------- |
| `id`               | `String`   | PK, cuid                 | Unique identifier      |
| `promo_code_id`    | `String`   | FK → PromoCode, Not Null | Promo reference        |
| `user_id`          | `String`   | FK → User, Not Null      | Customer reference     |
| `order_id`         | `String`   | FK → Order, Not Null     | Order reference        |
| `discount_applied` | `Int`      | Not Null                 | Actual discount amount |
| `used_at`          | `DateTime` | Default: now()           |                        |

**Indexes:** promo_code_id, user_id  
**Unique Constraint:** (promo_code_id, order_id)

---

### 1.10 Review Domain Tables

#### Review

| Column            | Type        | Constraints            | Description                 |
| ----------------- | ----------- | ---------------------- | --------------------------- |
| `id`              | `String`    | PK, cuid               | Unique identifier           |
| `product_id`      | `String`    | FK → Product, Not Null | Product reviewed            |
| `user_id`         | `String`    | FK → User, Not Null    | Reviewer                    |
| `order_id`        | `String`    | FK → Order, Not Null   | Purchase proof              |
| `rating`          | `Int`       | Not Null, 1-5          | Star rating                 |
| `title`           | `String?`   |                        | Review title                |
| `body`            | `String?`   |                        | Review content              |
| `status`          | `Enum`      | Default: PENDING       | PENDING, APPROVED, REJECTED |
| `moderated_by_id` | `String?`   | FK → User              | Moderator                   |
| `moderated_at`    | `DateTime?` |                        | Moderation timestamp        |
| `created_at`      | `DateTime`  | Default: now()         |                             |

**Indexes:** product_id, user_id, status, rating  
**Unique Constraint:** (product_id, user_id)

---

### 1.11 Async Job Tables

#### AsyncJobLog

| Column         | Type        | Constraints    | Description                            |
| -------------- | ----------- | -------------- | -------------------------------------- |
| `id`           | `String`    | PK, cuid       | Unique identifier                      |
| `queue`        | `String`    | Not Null       | Queue name                             |
| `job_name`     | `String`    | Not Null       | Job type                               |
| `job_id`       | `String`    | Not Null       | BullMQ job ID                          |
| `payload`      | `Json`      |                | Job data (sanitized)                   |
| `status`       | `Enum`      | Not Null       | PENDING, PROCESSING, COMPLETED, FAILED |
| `attempts`     | `Int`       | Default: 0     | Retry count                            |
| `error`        | `String?`   |                | Error message if failed                |
| `started_at`   | `DateTime?` |                | Processing start                       |
| `completed_at` | `DateTime?` |                | Completion time                        |
| `created_at`   | `DateTime`  | Default: now() |                                        |

**Indexes:** queue, job_name, status, created_at

---

### 1.12 Data Ownership Matrix

| Table                                | Owner Service | Write Access                        | Read Access         |
| ------------------------------------ | ------------- | ----------------------------------- | ------------------- |
| User, Address                        | User          | User                                | All (masked PII)    |
| Product, Category, Brand             | Product       | Product                             | All                 |
| InventoryRecord, StockAdjustment     | Inventory     | Inventory                           | Order, Cart         |
| Cart, CartItem                       | Cart          | Cart                                | Checkout            |
| Order, OrderItem, OrderAddress       | Order         | Order                               | Payment, Delivery   |
| PaymentTransaction, MpesaTransaction | Payment       | Payment                             | Order (status only) |
| Refund                               | Payment       | Payment (create), Manager (approve) | Order               |
| Delivery, DeliveryEvent              | Delivery      | Delivery                            | Order               |
| PromoCode, PromoUsage                | Promotion     | Promotion                           | Cart, Order         |
| Review                               | Review        | Review                              | Product             |

---

### 1.13 Environment Data Strategy

| Environment | Data Strategy                                                               |
| ----------- | --------------------------------------------------------------------------- |
| **Local**   | Seed with synthetic data; PII uses faker.js patterns; passwords: `Test123!` |
| **Dev**     | Synthetic data; MPesa sandbox; no real customer data                        |
| **SIT/UAT** | Anonymized production snapshots (if available)                              |
| **Prod**    | Real data; full encryption; access controls enforced                        |

---

## 2. API Endpoint Contracts

### 2.1 Authentication Endpoints

#### POST /auth/register

- **Access:** Public
- **Request:**

```json
{
  "email": "string (email format)",
  "password": "string (min 8 chars, 1 upper, 1 number)",
  "firstName": "string",
  "lastName": "string",
  "phone": "string (254XXXXXXXXX format)?"
}
```

- **Response (201):**

```json
{
  "data": {
    "id": "user_xxx",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

- **Errors:** 409 DUPLICATE_RESOURCE, 422 VALIDATION_ERROR

#### POST /auth/login

- **Access:** Public
- **Request:**

```json
{
  "email": "string",
  "password": "string"
}
```

- **Response (200):**

```json
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 900,
    "user": {
      "id": "user_xxx",
      "email": "john@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

- **Errors:** 401 AUTHENTICATION_REQUIRED

#### POST /auth/refresh

- **Access:** Public (with valid refresh token)
- **Request:**

```json
{
  "refreshToken": "string"
}
```

- **Response (200):** Same as login

---

### 2.2 Product Endpoints

#### GET /products

- **Access:** Public
- **Query Params:** `page`, `limit`, `categoryId`, `brandId`, `condition`, `priceMin`, `priceMax`, `q` (search), `sort`
- **Response (200):**

```json
{
  "data": [
    {
      "id": "prod_xxx",
      "sku": "HP-EB840-G6",
      "name": "HP EliteBook 840 G6",
      "slug": "hp-elitebook-840-g6",
      "price": 45990,
      "condition": "EX_UK",
      "category": { "id": "cat_xxx", "name": "Laptops" },
      "brand": { "id": "brand_xxx", "name": "HP" },
      "primaryImage": { "url": "...", "altText": "..." },
      "isInStock": true
    }
  ],
  "pagination": { ... }
}
```

#### GET /products/{id}

- **Access:** Public
- **Response (200):** Full product details including images, attributes, stock status

---

### 2.3 Cart Endpoints

#### GET /cart

- **Access:** Authenticated (Customer)
- **Response (200):**

```json
{
  "data": {
    "id": "cart_xxx",
    "items": [
      {
        "id": "ci_xxx",
        "product": { "id": "...", "name": "...", "price": 45990 },
        "quantity": 1,
        "lineTotal": 45990
      }
    ],
    "subtotal": 45990,
    "discount": 0,
    "deliveryFee": 300,
    "total": 46290,
    "promoCode": null
  }
}
```

#### POST /cart/items

- **Access:** Authenticated
- **Request:**

```json
{
  "productId": "prod_xxx",
  "quantity": 1
}
```

- **Errors:** 409 INSUFFICIENT_STOCK, 404 RESOURCE_NOT_FOUND

#### PATCH /cart/items/{id}

- **Access:** Authenticated
- **Request:**

```json
{
  "quantity": 2
}
```

#### DELETE /cart/items/{id}

- **Access:** Authenticated
- **Response:** 204 No Content

#### POST /cart/promo

- **Access:** Authenticated
- **Request:**

```json
{
  "code": "SAVE10"
}
```

- **Errors:** 400 PROMO_CODE_INVALID, 400 PROMO_CODE_EXPIRED

---

### 2.4 Checkout & Order Endpoints

#### POST /checkout

- **Access:** Authenticated (Customer)
- **Request:**

```json
{
  "addressId": "addr_xxx",
  "paymentMethod": "MPESA_STK",
  "notes": "string?"
}
```

- **Response (201):**

```json
{
  "data": {
    "orderId": "ord_xxx",
    "orderNumber": "TC-2026-001234",
    "status": "PENDING_PAYMENT",
    "total": 46290,
    "paymentMethod": "MPESA_STK"
  }
}
```

- **Errors:** 409 INSUFFICIENT_STOCK, 400 VALIDATION_ERROR

#### GET /orders

- **Access:** Authenticated (Customer sees own only)
- **Response (200):** List of orders with pagination

#### GET /orders/{id}

- **Access:** Authenticated (Owner or Staff+)
- **Response (200):** Full order details with items, address, status history

#### POST /orders/{id}/cancel

- **Access:** Authenticated (Owner before DISPATCHED, Manager+ after)
- **Request:**

```json
{
  "reason": "string"
}
```

- **Errors:** 409 INVALID_STATE_TRANSITION

---

### 2.5 Payment Endpoints

> [!CAUTION]
> **High-Risk Endpoints:** Require careful implementation review.

#### POST /payments/initiate

- **Access:** Authenticated (Customer)
- **Idempotency-Key:** Required
- **Request:**

```json
{
  "orderId": "ord_xxx",
  "method": "MPESA_STK",
  "phone": "254712345678"
}
```

- **Response (202):**

```json
{
  "data": {
    "transactionId": "txn_xxx",
    "status": "INITIATED",
    "message": "Check your phone for MPesa prompt"
  }
}
```

- **Note:** In Local/Dev, this endpoint returns CONFIRMED immediately with fake receipt

#### GET /payments/{id}

- **Access:** Authenticated (Owner or Staff+)
- **Response (200):** Transaction details and status

---

### 2.6 Admin Endpoints

#### PATCH /admin/orders/{id}/status

- **Access:** Staff+
- **Request:**

```json
{
  "status": "PROCESSING",
  "reason": "string?"
}
```

- **⚠️ Approval Gate:** REFUND\_\*, CANCELLED (after DISPATCHED) require Manager+

#### POST /admin/orders/{id}/refund

- **Access:** Manager+
- **Request:**

```json
{
  "amount": 45990,
  "reason": "Customer returned item"
}
```

- **⚠️ High-Risk:** Logged, requires approval workflow

#### POST /admin/products

- **Access:** Manager+
- **Request:** Full product creation payload
- **Response (201):** Created product

#### PATCH /admin/inventory/{productId}/adjust

- **Access:** Staff+
- **Request:**

```json
{
  "type": "PURCHASE",
  "quantity": 10,
  "reason": "Supplier delivery #12345"
}
```

---

### 2.7 Webhook Endpoints

#### POST /webhooks/mpesa/callback

- **Access:** IP-restricted, signature-verified
- **Payload:** MPesa Daraja callback format
- **Action:** Update PaymentTransaction, trigger order confirmation

#### POST /webhooks/delivery/{provider}

- **Access:** IP-restricted
- **Payload:** Provider-specific tracking update
- **Action:** Create DeliveryEvent, update Delivery status

---

## 3. Async Queue & Event Contracts

### 3.1 Queue Definitions

| Queue                | Purpose                       | Priority | Concurrency |
| -------------------- | ----------------------------- | -------- | ----------- |
| `payment-queue`      | Payment verification, refunds | Critical | 5           |
| `order-queue`        | Status updates, timeouts      | Critical | 10          |
| `notification-queue` | Email, SMS                    | Medium   | 10          |
| `inventory-queue`    | Reservations, adjustments     | High     | 5           |
| `scheduled-queue`    | Cron jobs                     | Low      | 2           |

### 3.2 Event Contracts

#### payment.verify

```json
{
  "event": "payment.verify",
  "transactionId": "txn_xxx",
  "orderId": "ord_xxx",
  "checkoutRequestId": "ws_CO_xxx",
  "timestamp": "2026-01-18T10:30:00Z"
}
```

**Trigger:** After MPesa STK push initiated  
**Handler:** Poll MPesa or wait for callback, update status

#### order.confirmed

```json
{
  "event": "order.confirmed",
  "orderId": "ord_xxx",
  "userId": "user_xxx",
  "total": 46290,
  "timestamp": "2026-01-18T10:31:00Z"
}
```

**Trigger:** Payment confirmed  
**Handler:** Send confirmation email/SMS, update inventory

#### order.status_changed

```json
{
  "event": "order.status_changed",
  "orderId": "ord_xxx",
  "fromStatus": "PROCESSING",
  "toStatus": "DISPATCHED",
  "changedBy": "user_xxx",
  "timestamp": "2026-01-18T14:00:00Z"
}
```

**Trigger:** Status update  
**Handler:** Send notification, update delivery

#### notification.send

```json
{
  "event": "notification.send",
  "type": "EMAIL",
  "template": "order_confirmation",
  "recipient": "john@example.com",
  "data": {
    "orderNumber": "TC-2026-001234",
    "total": 46290
  }
}
```

**Trigger:** Various events  
**Handler:** Send via email/SMS provider

### 3.3 Retry Strategy

| Queue              | Max Retries | Backoff               |
| ------------------ | ----------- | --------------------- |
| payment-queue      | 5           | 30s, 60s, 2m, 5m, 10m |
| order-queue        | 5           | 30s, 60s, 2m, 5m, 10m |
| notification-queue | 3           | 1m, 5m, 15m           |
| inventory-queue    | 5           | 30s, 60s, 2m, 5m, 10m |
| scheduled-queue    | 2           | 5m, 15m               |

### 3.4 Dead Letter Queue

Failed jobs after max retries → `dlq-{queue-name}`  
**Alert:** Operations team notified  
**Action:** Manual review required

---

## 4. Environment Configuration

### 4.1 Local Environment

```env
# Database
DATABASE_URL="postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (dev-only secret)
JWT_SECRET=local-dev-secret-do-not-use-in-production

# MPesa (sandbox)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=sandbox_key
MPESA_CONSUMER_SECRET=sandbox_secret

# Feature Flags
PAYMENT_STUB_MODE=true
EMAIL_ENABLED=false
SMS_ENABLED=false
```

### 4.2 Dev Environment

Similar to Local but with:

- Managed database (cloud-hosted)
- Sandboxed MPesa integration
- Test email delivery (Mailhog/Mailtrap)

---

## 5. Execution Steps & Validation

### Phase 7A: Database Schema (Prisma)

| Step | Action                                 | Verification                                  | Success Criteria                               |
| ---- | -------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| 7A.1 | Update `schema.prisma` with all models | `npx prisma validate`                         | No validation errors                           |
| 7A.2 | Generate migration                     | `npx prisma migrate dev --name phase7_schema` | Migration file created in `prisma/migrations/` |
| 7A.3 | Create seed script with synthetic data | Create `prisma/seed.ts`                       | Script compiles without errors                 |
| 7A.4 | Run seed script                        | `npx prisma db seed`                          | Console shows "Seeding complete"               |
| 7A.5 | Verify in Prisma Studio                | `pnpm db:studio` → inspect tables             | All 22 tables visible with test data           |

#### Phase 7A Validation Checklist

- [ ] All enums defined (UserRole, OrderStatus, PaymentMethod, etc.)
- [ ] All relations have correct `@relation` annotations
- [ ] Indexes created for query performance
- [ ] Unique constraints applied to business-critical fields
- [ ] Cascading delete rules appropriate for each relation
- [ ] `@@map` annotations match snake_case table naming

**Validation Command:**

```bash
cd apps/api
npx prisma validate
npx prisma migrate dev --name phase7_schema
npx prisma db seed
```

**Expected Output:**

```
✓ Prisma schema validated
✓ Migration applied successfully
✓ Database seeded with:
  - 5 Users (1 admin, 1 manager, 1 staff, 2 customers)
  - 10 Categories
  - 5 Brands
  - 50 Products
  - 3 Promo Codes
  - 2 Delivery Providers
```

---

### Phase 7B: API Contracts (NestJS)

| Step | Action                                    | Verification                          | Success Criteria                       |
| ---- | ----------------------------------------- | ------------------------------------- | -------------------------------------- |
| 7B.1 | Create DTOs for all endpoints             | `pnpm --filter api type-check`        | No TypeScript errors                   |
| 7B.2 | Create NestJS modules                     | `pnpm --filter api dev`               | All modules loaded                     |
| 7B.3 | Create controllers (stub implementations) | Test with curl                        | Endpoints return placeholder responses |
| 7B.4 | Add OpenAPI/Swagger decorators            | Access `/api/docs`                    | All endpoints documented               |
| 7B.5 | Test public endpoints                     | `curl localhost:3001/api/v1/products` | Returns mock data                      |
| 7B.6 | Test auth flow                            | Login and access protected route      | JWT validation works                   |

#### Phase 7B Validation Checklist

- [ ] All DTOs have `class-validator` decorators
- [ ] All endpoints have `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- [ ] Role guards applied to admin endpoints
- [ ] Rate limiting configured
- [ ] Error responses follow standard format
- [ ] Pagination works on list endpoints

**Validation Commands:**

```bash
# Type check
pnpm --filter api type-check

# Start server and test
pnpm --filter api dev &

# Test health endpoint
curl http://localhost:3001/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}

# Test products list
curl http://localhost:3001/api/v1/products
# Expected: {"data":[...],"pagination":{...}}

# Test 404
curl http://localhost:3001/api/v1/products/nonexistent
# Expected: {"error":{"code":"RESOURCE_NOT_FOUND",...}}

# Access Swagger docs
# Browse to: http://localhost:3001/api/docs
```

**Expected Swagger Output:**

- All endpoint groups visible (Auth, Products, Cart, Orders, Payments, Admin)
- Request/Response schemas documented
- Authentication requirements shown
- Error codes listed

---

### Phase 7C: Async Contracts (BullMQ)

| Step | Action                      | Verification                   | Success Criteria         |
| ---- | --------------------------- | ------------------------------ | ------------------------ |
| 7C.1 | Install BullMQ dependencies | Check `package.json`           | `bullmq` in dependencies |
| 7C.2 | Create queue module         | `pnpm --filter api dev`        | QueueModule loads        |
| 7C.3 | Define job type interfaces  | `pnpm --filter api type-check` | Types compile            |
| 7C.4 | Create processor stubs      | Add test job                   | Job logged in console    |
| 7C.5 | Verify queues in Redis      | `redis-cli KEYS bull:*`        | Queue keys exist         |

#### Phase 7C Validation Checklist

- [ ] All 5 queues created (payment, order, notification, inventory, scheduled)
- [ ] Job types defined with TypeScript interfaces
- [ ] Retry policies configured
- [ ] Dead letter queue handlers registered
- [ ] Queue metrics endpoint available

**Validation Commands:**

```bash
# Verify Redis connection
docker exec trustcart-redis redis-cli PING
# Expected: PONG

# Verify queues exist (after server started)
docker exec trustcart-redis redis-cli KEYS "bull:*"
# Expected:
#   bull:payment-queue:id
#   bull:order-queue:id
#   bull:notification-queue:id
#   bull:inventory-queue:id
#   bull:scheduled-queue:id

# Test job addition (via API or script)
# Add a test notification job and verify it processes
```

**Expected Console Output (on job processing):**

```
[Nest] LOG [NotificationProcessor] Processing job: notification.send
[Nest] LOG [NotificationProcessor] Job completed: notification.send → SUCCESS
```

---

### Phase 7D: Integration Validation

| Step | Action              | Verification                      | Success Criteria                |
| ---- | ------------------- | --------------------------------- | ------------------------------- |
| 7D.1 | Full type-check     | `pnpm type-check`                 | Zero errors across all packages |
| 7D.2 | Lint check          | `pnpm lint`                       | No lint errors                  |
| 7D.3 | Unit test skeleton  | `pnpm test`                       | Test framework runs             |
| 7D.4 | CI pipeline dry-run | Commit and push to feature branch | GitHub Actions passes           |

**Final Validation Command:**

```bash
# Run all checks
pnpm type-check && pnpm lint && pnpm test

# Expected output:
# ✓ Type checking: 0 errors
# ✓ Linting: 0 warnings, 0 errors
# ✓ Tests: X passed, 0 failed
```

---

### Rollback Procedure

If any phase fails:

1. **Database (7A):** `npx prisma migrate reset` to revert to clean state
2. **API (7B):** Revert module imports in `app.module.ts`
3. **Queues (7C):** Remove queue entries from Redis: `docker exec trustcart-redis redis-cli FLUSHDB`

---

## Document Approval

| Role                | Name | Status  | Date |
| ------------------- | ---- | ------- | ---- |
| Technical Architect | —    | Pending | —    |
| Backend Lead        | —    | Pending | —    |
| Database Lead       | —    | Pending | —    |

---

_Upon approval, Phase 7A-D will be executed to establish the database schema, API contracts, and async event structure for Local and Dev environments._
