# Stripe SaaS Billing MVP

A minimal, production-correct SaaS billing backend built with **NestJS**, **Stripe**, and **PostgreSQL (Supabase)**.

> Payment processing is handled by Stripe. The database is the source of truth. Webhooks are the final authority on all payment state.

---

## Table of Contents

- [Overview](#overview)
- [Core Principles](#core-principles)
- [Technology Stack](#technology-stack)
- [Scope](#scope)
- [Database Schema](#database-schema)
- [Payment Flow](#payment-flow)
- [Webhook Handling](#webhook-handling)
- [Idempotency](#idempotency)
- [Race Condition Safety](#race-condition-safety)
- [Out of Scope](#out-of-scope)

---

## Overview

This project implements a billing system scoped to the minimum required for a production-safe SaaS payment flow. It covers PaymentIntent creation, Stripe webhook processing, and subscription activation — nothing more.

The backend owns all financial state. The frontend is treated as an untrusted UI layer and is never consulted as a source of truth for payment outcomes.

---

## Core Principles

| Principle | Description |
|---|---|
| **Database is source of truth** | All payment and subscription state lives in the database |
| **Webhooks are final authority** | No subscription is activated without a verified Stripe webhook |
| **Idempotency by design** | Repeated requests produce the same result without side effects |
| **Race condition safety** | Concurrent requests cannot create duplicate charges or activations |
| **Stripe is external** | Stripe processes payments; it does not control application state |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS |
| ORM | TypeORM |
| Database | PostgreSQL (Supabase) |
| Payment Processor | Stripe (PaymentIntents + Webhooks) |

---

## Scope

This MVP is limited to the following capabilities:

### Payment Processing
- Create a Stripe PaymentIntent
- Return `client_secret` to the client
- Track payment lifecycle in the database

### Webhook Processing
- Receive and verify Stripe webhook signatures
- Reject duplicate or invalid events
- Update payment and subscription state based on verified events

### Subscription Management
- Activate subscriptions only after a successful payment webhook
- Maintain subscription state in the database
- Prevent duplicate activation

### Idempotency Handling
- Reject duplicate PaymentIntent creation using an `idempotencyKey`
- Return existing payment state for repeated requests

### Race Condition Safety
- Prevent concurrent requests from creating multiple charges
- Prevent concurrent webhook delivery from duplicating subscription activation
- Enforce constraints at the database level as the final safety layer

---

## Database Schema

The MVP uses exactly three tables. No additional tables are permitted within this scope.

| Table | Purpose |
|---|---|
| `payments` | Tracks PaymentIntent lifecycle and status |
| `webhook_events` | Records received Stripe events for deduplication |
| `subscriptions` | Stores subscription state, activated only after webhook confirmation |

---

## Payment Flow

```
Client                        Backend                        Stripe
  │                              │                              │
  │── POST /payments ──────────►│                              │
  │                              │── Create PaymentIntent ────►│
  │                              │◄── { client_secret } ───────│
  │◄── { client_secret } ───────│                              │
  │                              │                              │
  │── Stripe.js (client-side) ──────────────────────────────►│
  │                              │                              │
  │                              │◄── Webhook Event ───────────│
  │                              │  (payment_intent.succeeded) │
  │                              │                              │
  │                              │── Verify signature           │
  │                              │── Deduplicate event          │
  │                              │── Update payments table      │
  │                              │── Activate subscription      │
```

**Step-by-step:**

1. Client sends a payment initiation request to the backend
2. Backend checks the `idempotencyKey` against existing records
3. Backend creates a Stripe PaymentIntent
4. `client_secret` is returned to the client
5. Client completes payment using the Stripe SDK (client-side)
6. Stripe delivers a webhook event to the backend
7. Backend verifies the webhook signature using the Stripe secret
8. Event is checked for duplicates against `webhook_events`
9. Payment state is updated in the database
10. Subscription is activated if the event confirms success

---

## Webhook Handling

Stripe webhooks are the **only** trusted mechanism for confirming payment outcomes. Frontend confirmation is explicitly ignored.

- Every incoming webhook is signature-verified before processing
- Events are recorded in `webhook_events` before any state mutation
- Processing is skipped if the event ID already exists (idempotent)
- Subscription activation is gated entirely on webhook confirmation

---

## Idempotency

- Each payment request must include an `idempotencyKey`
- If a record with the same key already exists, the existing payment state is returned — no new PaymentIntent is created
- This prevents duplicate charges from retries or network errors

---

## Race Condition Safety

- Concurrent payment requests for the same `idempotencyKey` are handled at the database level using unique constraints
- Concurrent delivery of the same webhook event is deduplicated using the Stripe event ID
- Database constraints act as the final enforcement layer — application-level checks are supplementary

---

## Out of Scope

The following are explicitly excluded from this MVP:

- Authentication and user management (assumed to exist externally)
- Email or notification systems
- Background job queues or retry workers
- Microservices architecture
- Analytics, reporting, or dashboards
- Custom retry logic beyond Stripe's built-in behavior

---

## Design Goals

This MVP is built to satisfy the following guarantees:

- **No double charge is possible** under any concurrent or retry condition
- **No subscription is activated** without a verified Stripe webhook
- **Every payment state transition is traceable** in the database
- **Stripe remains an external processor** — it does not drive application logic