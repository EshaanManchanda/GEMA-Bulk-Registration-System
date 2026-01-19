# GEMA Events - System Overview

## Introduction

GEMA (Gujarat Educational Management Association) Events is a comprehensive bulk registration system designed to streamline the process of registering students for educational events, competitions, and programs. The system enables schools to register multiple students simultaneously while providing administrators with powerful tools to manage events, payments, and registrations.

## Core Purpose

The platform solves the complexity of managing mass registrations by:
- Allowing schools to upload student data in bulk via Excel
- Supporting multiple payment gateways (Razorpay for INR, Stripe for USD)
- Providing dynamic form builders for event-specific data collection
- Automating payment verification and invoice generation
- Offering real-time analytics and reporting

## Key Features

### Multi-Currency Support
- **INR (Indian Rupee)**: Integrated with Razorpay payment gateway
- **USD (US Dollar)**: Integrated with Stripe payment gateway
- Schools select their preferred currency during registration

### Bulk Upload System
- Excel-based batch upload for student registrations
- Dynamic template generation based on event requirements
- Real-time validation with detailed error reporting
- Support for up to 500 students per batch

### Dynamic Form Builder
- Custom field creation for each event
- Supported field types: text, number, date, email, phone, select, multi-select, textarea
- Field-level validation rules
- Form preview and testing capabilities

### Dual Payment Gateway Integration
- **Razorpay** (INR): Full webhook integration, automatic payment verification
- **Stripe** (USD): Checkout session support, automatic payment verification
- **Offline Payments**: Bank transfer support with manual verification workflow

### Discount Rules Engine
- Early bird discounts with date ranges
- Bulk registration discounts based on student count
- Promo code support
- Automatic discount calculation during checkout

### Media Management
- Cloudinary integration for cloud storage
- Local filesystem fallback option
- WebP, JPEG, PNG, GIF support (up to 10MB per file)
- Organized media library with search and filtering
- Public media serving via proxy endpoints

### Invoice Generation
- Automatic PDF invoice creation
- Downloadable from school dashboard
- Includes all batch and payment details

## User Roles & Permissions

### School Portal
**Role**: `SCHOOL`

**Capabilities**:
- Register and create account
- Browse active events
- Download event-specific Excel templates
- Upload student batches
- Make payments (online/offline)
- View payment history and invoices
- Manage profile and change password

**Restrictions**:
- Cannot access admin portal
- Cannot create events
- Cannot approve payments

### Admin Portal

#### Super Admin
**Role**: `SUPER_ADMIN`

**Full System Access**:
- Manage all admins and moderators
- Create, edit, delete events
- Approve/reject schools
- Verify offline payments
- Access all analytics
- Manage media library
- Configure system settings

#### Admin
**Role**: `ADMIN`

**Capabilities**:
- Create and manage events
- Verify payments
- View school details
- Access analytics
- Manage media library

**Restrictions**:
- Cannot manage other admins
- Cannot change system settings

#### Moderator
**Role**: `MODERATOR`

**Limited Access**:
- View events and schools
- Verify payments
- Basic analytics

**Restrictions**:
- Cannot create/edit events
- Cannot manage admins
- Cannot approve schools

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Excel Processing**: ExcelJS
- **PDF Generation**: PDFKit
- **Payment Gateways**: Razorpay SDK, Stripe SDK
- **File Storage**: Cloudinary SDK
- **Email**: Nodemailer (configured but not fully integrated)

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **State Management**: React Context API + React Query
- **Forms**: React Hook Form with Yup validation
- **UI Components**: Custom component library
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: React Icons (Feather Icons)

### Infrastructure
- **Storage**: Cloudinary (cloud) or Local Filesystem
- **API Architecture**: RESTful API with versioning (/api/v1)
- **CORS**: Configured for cross-origin requests
- **Security**: Helmet.js, rate limiting, input validation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ School Portal│  │ Admin Portal │  │ Public Pages │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTP/HTTPS (REST API)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   API Gateway (Express.js)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Auth MW     │  │ CORS        │  │ Rate Limit  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│ School Routes  │  │ Admin Routes   │  │Media Routes │
└───────┬────────┘  └───────┬────────┘  └──────┬──────┘
        │                   │                   │
┌───────▼───────────────────▼───────────────────▼──────┐
│              Controllers Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Auth    │  │  Events  │  │ Payments │  ...      │
│  └──────────┘  └──────────┘  └──────────┘           │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│              Services Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Payment  │  │  Excel   │  │  Media   │  ...      │
│  └──────────┘  └──────────┘  └──────────┘           │
└───────────────────────┬───────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐  ┌───▼────┐  ┌──────▼──────────┐
│   MongoDB      │  │Razorpay│  │   Cloudinary    │
│  (Mongoose)    │  │ Stripe │  │ Local Filesystem│
└────────────────┘  └────────┘  └─────────────────┘
```

## Data Flow

### School Registration Flow
1. School submits registration form
2. System creates account with `is_verified: false`
3. Verification email sent (TODO: email integration)
4. School verifies email via token
5. Admin approves school account
6. School can access full portal

### Event Registration Flow
1. School browses active events
2. Downloads event-specific Excel template
3. Fills student data and uploads batch
4. System validates all fields and rules
5. School selects payment method
6. Payment processed (online) or submitted for verification (offline)
7. Upon payment confirmation:
   - Batch status updated to PAID
   - Invoice generated automatically
   - Registration complete

### Payment Verification Flow (Offline)
1. School uploads bank transfer receipt
2. Admin reviews payment in pending queue
3. Admin approves/rejects with notes
4. If approved: invoice generated, batch marked PAID
5. If rejected: school notified, can resubmit

## Security Features

- **Authentication**: JWT tokens with expiry
- **Password Security**: Bcrypt hashing with salt rounds
- **Role-Based Access Control**: Middleware checks for every endpoint
- **Input Validation**: Yup schemas on frontend, manual validation on backend
- **File Upload Security**: MIME type checking, file size limits, sanitized filenames
- **Rate Limiting**: Prevents brute force attacks
- **CORS Configuration**: Controlled cross-origin access
- **Helmet.js**: Security headers
- **Media Proxy**: Hides storage implementation details

## Performance Optimizations

- **React Query**: Automatic caching and request deduplication
- **Pagination**: All list views support server-side pagination
- **Lazy Loading**: Route-based code splitting
- **Indexing**: Database indexes on frequently queried fields
- **CDN**: Cloudinary serves media with global CDN
- **Streaming**: Large file downloads use streaming

## Environment Configuration

Key environment variables:
```
NODE_ENV=development/production
PORT=5000
MONGO_URI=mongodb://localhost:27017/gema
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STORAGE_PROVIDER=cloudinary/local
BASE_URL=http://localhost:5000
```

## API Versioning

Current version: `v1`

All endpoints prefixed with `/api/v1/`

Example endpoints:
- `/api/v1/auth/school/register`
- `/api/v1/events`
- `/api/v1/school/batches`
- `/api/v1/admin/payments`

## Integration Points

### External Services
1. **Razorpay**: Payment processing for INR
2. **Stripe**: Payment processing for USD
3. **Cloudinary**: Cloud media storage
4. **Nodemailer**: Email notifications (configured but not fully integrated)

### Webhooks
- Razorpay webhook endpoint: `/api/v1/webhooks/razorpay`
- Stripe webhook endpoint: `/api/v1/webhooks/stripe`

## System Limits

- **Batch Size**: Maximum 500 students per upload
- **File Size**: 10MB for Excel files, 10MB for images
- **Image Formats**: JPEG, PNG, GIF, WebP
- **Excel Formats**: .xlsx, .xls
- **Concurrent Uploads**: 10 media files per request

## Known Limitations

1. **Email Notifications**: Configured but not fully integrated (13 TODO items)
2. **Certificate Generation**: Planned but not implemented
3. **Result Management**: Not implemented
4. **Attendance Marking**: Not implemented
5. **SMS Notifications**: Not implemented
6. **Multi-language Support**: Not implemented

## Related Documentation

- [Event Lifecycle](./EVENT_LIFECYCLE.md) - Complete event flow
- [Admin User Guide](./USER_GUIDE_ADMIN.md) - Admin workflows
- [School User Guide](./USER_GUIDE_SCHOOL.md) - School workflows
- [Features Status](./FEATURES_STATUS.md) - Working vs pending features
- [API Documentation](./API_DOCUMENTATION.md) - Complete endpoint reference
- [Database Schema](./DATABASE_SCHEMA.md) - Data models
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Developer setup
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

## Support

For technical support or questions, contact the system administrator.
