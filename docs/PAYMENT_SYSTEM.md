# Payment System Documentation

**Multi-Currency Payment Processing with Razorpay & Stripe**

---

## Overview

GEMA Events supports multi-currency payments (INR/USD) with dual gateway integration and offline verification workflow.

---

## Payment Modes

### 1. Online Payment
**INR → Razorpay** | **USD → Stripe**

**Flow**:
```
School selects batch → Initiate payment → Gateway redirect → Complete payment → Webhook verification → Invoice generation
```

**Features**:
- Real-time processing
- Automatic verification
- Instant invoice generation
- Webhook backup confirmation

### 2. Offline Payment
**Bank Transfer + Receipt Upload**

**Flow**:
```
School views bank details → Makes transfer → Uploads receipt → Admin verifies → Invoice generation
```

**Features**:
- Manual verification by admin
- Receipt storage (Cloudinary)
- Approve/reject workflow
- Notes and reference tracking

---

## Currency Resolution

**Automatic Detection**:
- India → INR → Razorpay
- All other countries → USD → Stripe

**Price Display**:
- Events store both prices: `base_fee_inr`, `base_fee_usd`
- School sees price in their currency
- Discounts applied before gateway

---

## Payment Endpoints

### School Endpoints
```
POST /api/v1/payments/initiate
POST /api/v1/payments/verify/razorpay
POST /api/v1/payments/verify/stripe
POST /api/v1/payments/offline
GET  /api/v1/payments/school/my-payments
GET  /api/v1/payments/:paymentId
```

### Admin Endpoints
```
PUT  /api/v1/payments/:paymentId/verify
PUT  /api/v1/payments/:paymentId/reject
GET  /admin/payments/pending
```

### Webhooks
```
POST /api/v1/webhooks/razorpay
POST /api/v1/webhooks/stripe
```

---

## Payment States

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `PENDING` | Payment initiated | Complete payment or cancel |
| `PROCESSING` | Gateway processing | Wait for confirmation |
| `COMPLETED` | Payment successful | Invoice generated |
| `FAILED` | Payment failed | Retry payment |
| `PENDING_VERIFICATION` | Offline payment submitted | Admin review |
| `REFUNDED` | Payment refunded | N/A |

---

## Discount Application

**Order of Application**:
1. Promo code (if provided)
2. Early bird discount (date-based)
3. Bulk discount (student count)

**Example**:
```
Base: ₹500 × 100 students = ₹50,000
Bulk (100+): -15% = -₹7,500
Early Bird: -10% = -₹4,250
Total: ₹38,250
```

---

## Security

**Razorpay**:
- HMAC SHA256 signature verification
- Order ID validation
- Webhook signature check

**Stripe**:
- Payment intent confirmation
- Webhook signature verification (Stripe SDK)
- Client secret validation

**Offline**:
- Admin-only verification
- Receipt file validation
- Secure upload to Cloudinary

---

## Error Handling

### Online Payment Failures
- User redirected to failure page
- Can retry payment
- Batch remains in `PENDING_PAYMENT`

### Offline Payment Rejection
- School notified (email pending)
- Can resubmit with corrections
- Batch status reset to `DRAFT`

---

## Invoice Generation

**Automatic After**:
- Online payment verification
- Offline payment approval
- Webhook confirmation

**Invoice Contents**:
- School details
- Event and batch info
- Student count
- Price breakdown with discounts
- Payment details
- Unique invoice number

**Storage**: Cloudinary (`gema/invoices/{year}/`)

---

## Testing

**Test Mode**:
- Razorpay: `rzp_test_...`
- Stripe: `pk_test_...`, `sk_test_...`

**Test Cards**:
- Razorpay: 4111 1111 1111 1111
- Stripe: 4242 4242 4242 4242

---

## Configuration

**Environment Variables**:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Frontend**:
```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

---

## Related Files

**Backend**:
- `server/src/services/razorpay.service.js`
- `server/src/services/stripe.service.js`
- `server/src/controllers/payment/payment.controller.js`
- `server/src/controllers/payment/webhook.controller.js`
- `server/src/models/Payment.js`

**Frontend**:
- `client/src/pages/school/payments/MakePayment.jsx`
- `client/src/pages/school/payments/PaymentSuccess.jsx`
- `client/src/pages/admin/payments/PendingVerifications.jsx`

---

## Troubleshooting

**Payment stuck in PROCESSING**:
- Check webhook delivery
- Verify payment gateway status
- Manual verification via admin panel

**Invoice not generated**:
- Check Cloudinary credentials
- Verify payment status is COMPLETED
- Manual regeneration: `POST /api/v1/invoices/regenerate/:batchReference`

**Webhook failures**:
- Verify webhook URL in gateway dashboard
- Check signature secrets
- Review webhook logs

---

**Last Updated**: December 29, 2025
