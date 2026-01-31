# Async Flow Diagram

**Document Status:** Draft — Pending Human Sign-off  
**Last Updated:** 2026-01-18  
**Version:** 1.0

---

## Overview

This document defines all asynchronous flows in the TrustCart Kenya e-commerce platform. It establishes queues, event triggers, retry logic, failure handling, and human approval points.

> [!NOTE]
> This is a conceptual async architecture document. Implementation details are intentionally excluded.

---

## 1. Async Architecture Overview

```mermaid
flowchart TB
    subgraph "Event Producers"
        API[API Server]
        WEBHOOK[Webhook Handlers]
        SCHEDULER[Scheduler / Cron]
    end

    subgraph "Message Broker"
        REDIS[(Redis)]
        subgraph "Queues"
            Q_PAY[payment-queue]
            Q_ORDER[order-queue]
            Q_NOTIF[notification-queue]
            Q_INV[inventory-queue]
            Q_SCHED[scheduled-queue]
        end
    end

    subgraph "Workers"
        W_PAY[Payment Worker]
        W_ORDER[Order Worker]
        W_EMAIL[Email Worker]
        W_SMS[SMS Worker]
        W_INV[Inventory Worker]
        W_SCHED[Scheduled Worker]
    end

    subgraph "External Services"
        MPESA[MPesa API]
        EMAIL_SVC[Email Service]
        SMS_SVC[SMS Gateway]
        COURIER[Courier API]
    end

    subgraph "Data Store"
        PG[(PostgreSQL)]
    end

    API --> REDIS
    WEBHOOK --> REDIS
    SCHEDULER --> REDIS

    REDIS --> Q_PAY --> W_PAY
    REDIS --> Q_ORDER --> W_ORDER
    REDIS --> Q_NOTIF --> W_EMAIL
    REDIS --> Q_NOTIF --> W_SMS
    REDIS --> Q_INV --> W_INV
    REDIS --> Q_SCHED --> W_SCHED

    W_PAY --> MPESA
    W_PAY --> PG
    W_ORDER --> PG
    W_EMAIL --> EMAIL_SVC
    W_SMS --> SMS_SVC
    W_INV --> PG
    W_SCHED --> PG
```

---

## 2. Queue Definitions

### 2.1 Queue Inventory

| Queue Name           | Purpose                                   | Priority    | Concurrency |
| -------------------- | ----------------------------------------- | ----------- | ----------- |
| `payment-queue`      | Payment verification, refund processing   | 🔴 Critical | 5           |
| `order-queue`        | Order state transitions, timeout handling | 🔴 Critical | 5           |
| `notification-queue` | Emails, SMS notifications                 | 🟡 Medium   | 10          |
| `inventory-queue`    | Reservation release, stock alerts         | 🟠 High     | 5           |
| `scheduled-queue`    | Scheduled jobs (cleanup, reports)         | 🟢 Low      | 2           |

### 2.2 Queue Configuration

| Queue                | Max Retries | Retry Delay                | Backoff     | TTL |
| -------------------- | ----------- | -------------------------- | ----------- | --- |
| `payment-queue`      | 5           | 30s, 60s, 120s, 300s, 600s | Exponential | 24h |
| `order-queue`        | 3           | 10s, 30s, 60s              | Exponential | 24h |
| `notification-queue` | 3           | 5s, 15s, 60s               | Exponential | 4h  |
| `inventory-queue`    | 3           | 5s, 15s, 60s               | Exponential | 1h  |
| `scheduled-queue`    | 1           | —                          | None        | 1h  |

---

## 3. Payment Async Flows

### 3.1 Payment Verification Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant API as API Server
    participant Q as payment-queue
    participant W as Payment Worker
    participant MP as MPesa API
    participant DB as Database

    C->>API: Initiate Payment
    API->>MP: STK Push Request
    MP-->>API: CheckoutRequestID
    API->>Q: Enqueue payment.verify
    API-->>C: "Waiting for confirmation"

    loop Until confirmed or timeout
        Q->>W: Dequeue job
        W->>DB: Check payment status
        alt Already confirmed
            W->>W: Job complete
        else Pending
            W->>MP: Query transaction status
            alt Confirmed
                W->>DB: Update payment CONFIRMED
                W->>Q: Enqueue order.confirm
                W->>Q: Enqueue notification.payment_success
            else Still pending
                W->>Q: Re-enqueue with delay
            else Failed
                W->>DB: Update payment FAILED
                W->>Q: Enqueue notification.payment_failed
            end
        end
    end
```

**Job Definition: `payment.verify`**

| Attribute   | Value                                                     |
| ----------- | --------------------------------------------------------- |
| **Trigger** | Payment initiated, MPesa callback received                |
| **Actor**   | System (Payment Worker)                                   |
| **Input**   | `{ orderId, paymentId, checkoutRequestId }`               |
| **Output**  | Payment status updated in DB                              |
| **Retry**   | 5 times, exponential backoff                              |
| **Failure** | Mark payment FAILED, notify customer, release reservation |

---

### 3.2 Refund Processing Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant API as API Server
    participant Q as payment-queue
    participant W as Payment Worker
    participant MP as MPesa API
    participant DB as Database

    A->>API: Approve Refund
    API->>DB: Create refund record (PENDING)
    API->>Q: Enqueue refund.process
    API-->>A: "Refund queued"

    Q->>W: Dequeue job
    W->>DB: Get original payment
    W->>MP: B2C Transfer (refund)

    alt Success
        MP-->>W: TransactionID
        W->>DB: Update refund COMPLETED
        W->>Q: Enqueue order.update_status (REFUNDED)
        W->>Q: Enqueue notification.refund_success
    else Failed
        W->>Q: Re-enqueue with delay
    end
```

**Job Definition: `refund.process`**

| Attribute             | Value                                            |
| --------------------- | ------------------------------------------------ |
| **Trigger**           | Manager approval of refund request               |
| **Actor**             | System (Payment Worker)                          |
| **Approval Required** | ⚠️ Manager must approve before job is enqueued   |
| **Input**             | `{ refundId, orderId, amount, phone }`           |
| **Output**            | Refund processed via MPesa B2C                   |
| **Retry**             | 5 times, exponential backoff                     |
| **Failure**           | Alert Finance team, manual intervention required |

---

## 4. Order Async Flows

### 4.1 Order Confirmation Flow

```mermaid
sequenceDiagram
    participant PW as Payment Worker
    participant Q as order-queue
    participant OW as Order Worker
    participant DB as Database
    participant NQ as notification-queue

    PW->>Q: Enqueue order.confirm
    Q->>OW: Dequeue job
    OW->>DB: Update order CONFIRMED
    OW->>DB: Log status history
    OW->>NQ: Enqueue notification.order_confirmed
    OW-->>OW: Job complete
```

**Job Definition: `order.confirm`**

| Attribute        | Value                     |
| ---------------- | ------------------------- |
| **Trigger**      | Payment confirmed         |
| **Actor**        | System (Order Worker)     |
| **Input**        | `{ orderId }`             |
| **Output**       | Order status → CONFIRMED  |
| **Side Effects** | Email notification queued |

---

### 4.2 Order Timeout Flow

```mermaid
sequenceDiagram
    participant SCH as Scheduler
    participant Q as order-queue
    participant OW as Order Worker
    participant DB as Database
    participant IQ as inventory-queue
    participant NQ as notification-queue

    SCH->>Q: Enqueue order.check_timeout (every 5 min)
    Q->>OW: Dequeue job
    OW->>DB: Find PENDING_PAYMENT orders > 24h

    loop For each expired order
        OW->>DB: Update order CANCELLED
        OW->>IQ: Enqueue inventory.release_reservation
        OW->>NQ: Enqueue notification.order_expired
    end
```

**Job Definition: `order.check_timeout`**

| Attribute        | Value                                     |
| ---------------- | ----------------------------------------- |
| **Trigger**      | Scheduler (every 5 minutes)               |
| **Actor**        | System (Scheduled Worker)                 |
| **Input**        | None                                      |
| **Output**       | Expired orders cancelled                  |
| **Side Effects** | Reservations released, customers notified |

---

### 4.3 Order State Change Flow

```mermaid
flowchart TD
    A[State Change Trigger] --> B{Valid Transition?}
    B -->|No| C[Reject Change]
    B -->|Yes| D{Approval Required?}
    D -->|Yes| E[⚠️ Create Approval Request]
    E --> F[Wait for Human Approval]
    F -->|Approved| G[Enqueue order.update_status]
    F -->|Rejected| H[Notify Requester]
    D -->|No| G
    G --> I[Order Worker Updates DB]
    I --> J[Log Status History]
    J --> K[Enqueue Notifications]
```

**Approval Required Transitions:**

| From State       | To State        | Approver      | Reason                   |
| ---------------- | --------------- | ------------- | ------------------------ |
| PROCESSING       | CANCELLED       | Manager       | Stock issue, operational |
| RETURN_REQUESTED | RETURN_APPROVED | Manager       | Return validation        |
| REFUND_PENDING   | REFUNDED        | Finance Admin | Money movement           |

---

## 5. Delivery Async Flows

### 5.1 Delivery Status Update Flow

```mermaid
sequenceDiagram
    participant COURIER as Courier Webhook
    participant WH as Webhook Handler
    participant Q as order-queue
    participant OW as Order Worker
    participant DB as Database
    participant NQ as notification-queue

    COURIER->>WH: Tracking event
    WH->>WH: Validate signature
    WH->>DB: Log DeliveryEvent
    WH->>Q: Enqueue order.delivery_update

    Q->>OW: Dequeue job
    OW->>DB: Update delivery status
    OW->>DB: Update order status (if applicable)
    OW->>NQ: Enqueue notification.delivery_update
```

**Job Definition: `order.delivery_update`**

| Attribute        | Value                                            |
| ---------------- | ------------------------------------------------ |
| **Trigger**      | Courier webhook event                            |
| **Actor**        | System (Order Worker)                            |
| **Input**        | `{ deliveryId, eventType, timestamp, location }` |
| **Output**       | Delivery and order status updated                |
| **Side Effects** | SMS/Email notification queued                    |

---

### 5.2 Delivery Notification Flow

```mermaid
flowchart LR
    subgraph "Delivery Events"
        A[DISPATCHED]
        B[OUT_FOR_DELIVERY]
        C[DELIVERED]
        D[DELIVERY_FAILED]
    end

    subgraph "Notifications"
        E[SMS: "Your order is on the way"]
        F[SMS: "Arriving today"]
        G[SMS + Email: "Delivered"]
        H[SMS: "Delivery failed, retry scheduled"]
    end

    A --> E
    B --> F
    C --> G
    D --> H
```

---

## 6. Notification Async Flows

### 6.1 Email Notification Flow

```mermaid
sequenceDiagram
    participant P as Producer (Any Service)
    participant Q as notification-queue
    participant EW as Email Worker
    participant ES as Email Service
    participant DB as Database

    P->>Q: Enqueue notification.email
    Q->>EW: Dequeue job
    EW->>DB: Get template + data
    EW->>EW: Render email
    EW->>ES: Send email (SendGrid/Mailgun)

    alt Success
        ES-->>EW: Success
        EW->>DB: Log email sent
    else Failure
        ES-->>EW: Error
        EW->>Q: Re-enqueue with backoff
    end
```

**Job Definition: `notification.email`**

| Attribute   | Value                                     |
| ----------- | ----------------------------------------- |
| **Trigger** | Various events (order, payment, delivery) |
| **Actor**   | System (Email Worker)                     |
| **Input**   | `{ template, recipientEmail, data }`      |
| **Output**  | Email sent                                |
| **Retry**   | 3 times                                   |
| **Failure** | Log error, alert ops (don't block flow)   |

---

### 6.2 SMS Notification Flow

```mermaid
sequenceDiagram
    participant P as Producer (Any Service)
    participant Q as notification-queue
    participant SW as SMS Worker
    participant SMS as SMS Gateway
    participant DB as Database

    P->>Q: Enqueue notification.sms
    Q->>SW: Dequeue job
    SW->>DB: Get message template + phone
    SW->>SMS: Send SMS (Africa's Talking)

    alt Success
        SMS-->>SW: MessageID
        SW->>DB: Log SMS sent
    else Failure
        SMS-->>SW: Error
        SW->>Q: Re-enqueue with backoff
    end
```

**Notification Events:**

| Event              | Template                                | Channel     |
| ------------------ | --------------------------------------- | ----------- |
| `order.confirmed`  | "Order #{{orderNumber}} confirmed"      | Email + SMS |
| `order.dispatched` | "Order shipped, tracking: {{tracking}}" | Email + SMS |
| `order.delivered`  | "Order delivered!"                      | Email + SMS |
| `payment.failed`   | "Payment failed, retry here"            | Email       |
| `refund.processed` | "Refund of KES {{amount}} processed"    | Email + SMS |
| `delivery.failed`  | "Delivery attempt failed"               | SMS         |

---

## 7. Inventory Async Flows

### 7.1 Reservation Release Flow

```mermaid
sequenceDiagram
    participant SCH as Scheduler
    participant Q as inventory-queue
    participant IW as Inventory Worker
    participant DB as Database

    SCH->>Q: Enqueue inventory.release_expired (every 5 min)
    Q->>IW: Dequeue job
    IW->>DB: Find expired reservations (> 30 min, no payment)

    loop For each expired reservation
        IW->>DB: Release reservation
        IW->>DB: Update quantityReserved
        IW->>DB: Log adjustment
    end
```

**Job Definition: `inventory.release_expired`**

| Attribute   | Value                         |
| ----------- | ----------------------------- |
| **Trigger** | Scheduler (every 5 minutes)   |
| **Actor**   | System (Inventory Worker)     |
| **Input**   | None                          |
| **Output**  | Expired reservations released |

---

### 7.2 Low Stock Alert Flow

```mermaid
sequenceDiagram
    participant OW as Order Worker
    participant Q as inventory-queue
    participant IW as Inventory Worker
    participant DB as Database
    participant NQ as notification-queue

    OW->>Q: Enqueue inventory.check_stock (after dispatch)
    Q->>IW: Dequeue job
    IW->>DB: Check stock level

    alt Stock < reorderThreshold
        IW->>NQ: Enqueue notification.low_stock_alert
    end
```

---

## 8. Scheduled Jobs

### 8.1 Job Schedule

| Job                         | Schedule       | Queue           | Description                    |
| --------------------------- | -------------- | --------------- | ------------------------------ |
| `order.check_timeout`       | Every 5 min    | scheduled-queue | Cancel expired pending orders  |
| `inventory.release_expired` | Every 5 min    | inventory-queue | Release expired reservations   |
| `cart.cleanup`              | Daily 3:00 AM  | scheduled-queue | Delete carts inactive > 7 days |
| `session.cleanup`           | Every 1 hour   | scheduled-queue | Expire old sessions            |
| `report.daily_sales`        | Daily 6:00 AM  | scheduled-queue | Generate daily sales report    |
| `report.weekly_inventory`   | Sunday 7:00 AM | scheduled-queue | Generate inventory report      |

### 8.2 Scheduler Flow

```mermaid
flowchart LR
    A[Cron Trigger] --> B[Scheduler Service]
    B --> C{Job exists?}
    C -->|Yes, not running| D[Enqueue Job]
    C -->|Already running| E[Skip]
    D --> F[Worker Processes]
```

---

## 9. Retry & Failure Handling

### 9.1 Retry Strategy

```mermaid
flowchart TD
    A[Job Fails] --> B{Retries Left?}
    B -->|Yes| C[Calculate Backoff]
    C --> D[Wait]
    D --> E[Re-enqueue]
    E --> F[Retry Job]
    B -->|No| G[Move to Dead Letter Queue]
    G --> H[Alert Operations]
    H --> I{Manual Intervention}
    I -->|Fix & Retry| J[Re-enqueue to Main Queue]
    I -->|Discard| K[Log & Archive]
```

### 9.2 Backoff Calculation

| Attempt | Delay (Exponential)  |
| ------- | -------------------- |
| 1       | 30 seconds           |
| 2       | 60 seconds           |
| 3       | 120 seconds (2 min)  |
| 4       | 300 seconds (5 min)  |
| 5       | 600 seconds (10 min) |

### 9.3 Dead Letter Queue Handling

| Queue                | DLQ Action                      | Alert            |
| -------------------- | ------------------------------- | ---------------- |
| `payment-queue`      | Immediate escalation to Finance | 🔴 PagerDuty     |
| `order-queue`        | Escalation to Operations        | 🟠 Slack + Email |
| `notification-queue` | Log only, no block              | 🟢 Log           |
| `inventory-queue`    | Alert Warehouse                 | 🟡 Slack         |

---

## 10. Human Approval Points

### 10.1 Approval-Gated Async Jobs

```mermaid
flowchart TD
    subgraph "Request Phase"
        A[Action Requested] --> B{Requires Approval?}
        B -->|No| C[Enqueue Job Directly]
        B -->|Yes| D[Create Approval Request]
    end

    subgraph "Approval Phase"
        D --> E[Notify Approver]
        E --> F{Decision}
        F -->|Approve| G[Enqueue Job with approval_id]
        F -->|Reject| H[Notify Requester]
        F -->|Timeout 48h| I[Escalate]
    end

    subgraph "Execution Phase"
        G --> J[Worker Validates approval_id]
        J -->|Valid| K[Execute Job]
        J -->|Invalid| L[Reject Job]
    end

    style D fill:#ffcc00
    style F fill:#ffcc00
```

### 10.2 Approval Matrix

| Job                             | Requires Approval   | Approver          | Timeout |
| ------------------------------- | ------------------- | ----------------- | ------- |
| `refund.process`                | ⚠️ Yes              | Manager + Finance | 48h     |
| `order.cancel_after_processing` | ⚠️ Yes              | Manager           | 24h     |
| `order.force_transition`        | ⚠️ Yes              | Super Admin       | 4h      |
| `inventory.large_adjustment`    | ⚠️ Yes (>100 units) | Manager           | 24h     |
| `promotion.high_discount`       | ⚠️ Yes (>50%)       | CEO               | 48h     |

---

## 11. Event Catalog

### 11.1 Event Definitions

| Event Name            | Producer         | Consumers               | Payload                           |
| --------------------- | ---------------- | ----------------------- | --------------------------------- |
| `payment.initiated`   | Payment Service  | — (logged)              | `{ orderId, amount, method }`     |
| `payment.confirmed`   | Payment Worker   | Order, Notification     | `{ orderId, paymentId, receipt }` |
| `payment.failed`      | Payment Worker   | Order, Notification     | `{ orderId, reason }`             |
| `order.created`       | Order Service    | — (logged)              | `{ orderId, customerId }`         |
| `order.confirmed`     | Order Worker     | Notification, Inventory | `{ orderId }`                     |
| `order.dispatched`    | Order Service    | Notification, Inventory | `{ orderId, trackingNumber }`     |
| `order.delivered`     | Order Worker     | Notification            | `{ orderId }`                     |
| `order.cancelled`     | Order Worker     | Inventory, Notification | `{ orderId, reason }`             |
| `refund.requested`    | Order Service    | — (approval workflow)   | `{ refundId, orderId, amount }`   |
| `refund.processed`    | Payment Worker   | Order, Notification     | `{ refundId, transactionId }`     |
| `delivery.updated`    | Webhook Handler  | Order, Notification     | `{ deliveryId, status }`          |
| `inventory.low_stock` | Inventory Worker | Notification            | `{ productId, quantity }`         |

---

## 12. Monitoring & Observability

### 12.1 Queue Metrics

| Metric                | Alert Threshold | Action           |
| --------------------- | --------------- | ---------------- |
| Queue depth           | > 1000 jobs     | Scale workers    |
| Job age (oldest)      | > 5 minutes     | Investigate      |
| Failed jobs (hourly)  | > 10            | Alert ops        |
| DLQ depth             | > 0             | Immediate review |
| Processing time (p95) | > 30s           | Optimize         |

### 12.2 Async Dashboards

| Dashboard     | Metrics Shown                        |
| ------------- | ------------------------------------ |
| Queue Health  | Depth, throughput, latency per queue |
| Worker Status | Active workers, processing rate      |
| Failed Jobs   | Failure rate, failure reasons        |
| DLQ Monitor   | Jobs awaiting manual intervention    |

---

## Artefact Cross-References

| Async Flow Aspect   | Source Artefact                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Order States        | [order-lifecycle-state-machine.md](file:///c:/Users/STEPH/Documents/Portfolio/Projects/modern-ecom/docs/planning/order-lifecycle-state-machine.md) |
| Payment Rules       | [business-model-revenue-flows.md](file:///c:/Users/STEPH/Documents/Portfolio/Projects/modern-ecom/docs/planning/business-model-revenue-flows.md)   |
| Approval Gates      | [agent-scope-authority.md](file:///c:/Users/STEPH/Documents/Portfolio/Projects/modern-ecom/docs/planning/agent-scope-authority.md)                 |
| Risk Points         | [risk-register-compliance.md](file:///c:/Users/STEPH/Documents/Portfolio/Projects/modern-ecom/docs/planning/risk-register-compliance.md)           |
| System Architecture | [system-architecture.md](file:///c:/Users/STEPH/Documents/Portfolio/Projects/modern-ecom/docs/architecture/system-architecture.md)                 |

---

## Document Approval

| Role                | Name | Status  | Date |
| ------------------- | ---- | ------- | ---- |
| Technical Architect | —    | Pending | —    |
| Tech Lead           | —    | Pending | —    |
| Operations Lead     | —    | Pending | —    |

---

_This document defines all asynchronous flows. All workers must implement proper retry, failure handling, and observability. Approval-gated jobs must validate approval before execution._
