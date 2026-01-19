# Database Schema

Complete data model documentation for GEMA Events platform.

**Database**: MongoDB
**ODM**: Mongoose
**Naming Convention**: snake_case for fields

---

## Table of Contents

1. [School Model](#school-model)
2. [Admin Model](#admin-model)
3. [Event Model](#event-model)
4. [Batch Model](#batch-model)
5. [Registration Model](#registration-model)
6. [Payment Model](#payment-model)
7. [Invoice Model](#invoice-model)
8. [Media Model](#media-model)
9. [Relationships](#relationships)
10. [Indexes](#indexes)

---

## School Model

**Collection**: `schools`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `school_code` | String | Yes | Yes | Auto | 6-char unique code (ABC123) |
| `name` | String | Yes | No | - | School name (max 200 chars) |
| `email` | String | Yes | Yes | - | Login email (lowercase) |
| `password_hash` | String | Yes | No | - | Bcrypt hashed password |
| `contact_person` | Object | Yes | No | - | Contact details |
| `contact_person.name` | String | Yes | No | - | Contact name |
| `contact_person.email` | String | Yes | No | - | Contact email |
| `contact_person.phone` | String | Yes | No | - | Contact phone |
| `contact_person.designation` | String | No | No | - | Job title |
| `address` | Object | Yes | No | - | School address |
| `address.street` | String | No | No | - | Street address |
| `address.city` | String | No | No | - | City |
| `address.state` | String | No | No | - | State/Province |
| `address.postal_code` | String | No | No | - | Postal/ZIP code |
| `address.country` | String | Yes | No | 'IN' | 2-letter country code |
| `currency` | String | Yes | No | 'INR' | INR or USD |
| `is_verified` | Boolean | No | No | false | Email verified |
| `is_active` | Boolean | No | No | false | Admin approved |
| `verification_token` | String | No | No | - | Email verification token |
| `verification_token_expires` | Date | No | No | - | Token expiry |
| `password_reset_token` | String | No | No | - | Password reset token |
| `password_reset_expires` | Date | No | No | - | Reset token expiry |
| `last_login` | Date | No | No | - | Last login timestamp |
| `admin_notes` | String | No | No | - | Internal admin notes |
| `created_at` | Date | Auto | No | now | Creation timestamp |
| `updated_at` | Date | Auto | No | now | Update timestamp |

### Validations

- `email`: Valid email format, lowercase
- `password_hash`: Bcrypt with 10 salt rounds
- `school_code`: 6 uppercase alphanumeric characters
- `contact_person.phone`: E.164 format recommended (+[country][number])
- `currency`: Enum ['INR', 'USD']
- `address.country`: ISO 3166-1 alpha-2 code

### Virtual Fields

- `batches`: Populated from Batch model (school_id reference)
- `payments`: Populated from Payment model (school_id reference)

### Methods

- `comparePassword(password)`: Compare password with hash
- `generateVerificationToken()`: Create email verification token
- `generatePasswordResetToken()`: Create password reset token

### Pre-save Hooks

- Generate `school_code` if not present (unique 6-char)
- Hash password if modified
- Lowercase email

---

## Admin Model

**Collection**: `admins`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `name` | String | Yes | No | - | Admin name |
| `email` | String | Yes | Yes | - | Login email (lowercase) |
| `password_hash` | String | Yes | No | - | Bcrypt hashed password |
| `role` | String | Yes | No | 'ADMIN' | User role |
| `permissions` | Object | No | No | {} | Permission flags |
| `permissions.can_manage_events` | Boolean | No | No | false | Create/edit/delete events |
| `permissions.can_verify_payments` | Boolean | No | No | false | Approve/reject payments |
| `permissions.can_manage_schools` | Boolean | No | No | false | Approve/suspend schools |
| `permissions.can_view_analytics` | Boolean | No | No | false | Access analytics |
| `permissions.can_manage_admins` | Boolean | No | No | false | Manage admin users |
| `permissions.can_manage_settings` | Boolean | No | No | false | System settings |
| `is_active` | Boolean | No | No | true | Account active status |
| `last_login` | Date | No | No | - | Last login timestamp |
| `created_at` | Date | Auto | No | now | Creation timestamp |
| `updated_at` | Date | Auto | No | now | Update timestamp |

### Validations

- `email`: Valid email format, lowercase
- `role`: Enum ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']
- `password_hash`: Bcrypt with 10 salt rounds

### Virtual Fields

- `can_manage_events_check`: Role-based permission check
- `can_verify_payments_check`: Role-based permission check
- `can_manage_schools_check`: Role-based permission check
- `can_view_analytics_check`: Role-based permission check
- `can_manage_admins_check`: SUPER_ADMIN or explicit permission
- `can_manage_settings_check`: SUPER_ADMIN only

### Methods

- `comparePassword(password)`: Compare password with hash

### Pre-save Hooks

- Initialize permissions based on role if empty
- Hash password if modified
- Lowercase email

### Role Hierarchy

1. **SUPER_ADMIN**: All permissions, cannot be restricted
2. **ADMIN**: Configurable permissions, cannot manage admins or settings
3. **MODERATOR**: Limited permissions, view-only analytics

---

## Event Model

**Collection**: `events`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `title` | String | Yes | No | - | Event title (max 200 chars) |
| `slug` | String | Yes | Yes | - | URL-friendly identifier |
| `description` | String | Yes | No | - | Full event description |
| `category` | String | Yes | No | - | Event category |
| `status` | String | No | No | 'DRAFT' | Event status |
| `start_date` | Date | Yes | No | - | Event start date |
| `end_date` | Date | Yes | No | - | Event end date |
| `registration_deadline` | Date | Yes | No | - | Last registration date |
| `venue` | String | No | No | - | Event location |
| `max_participants` | Number | No | No | null | Max students (null = unlimited) |
| `banner_image` | String | No | No | - | Media ID or URL |
| `form_schema` | Object | Yes | No | - | Registration form definition |
| `form_schema.fields` | Array | Yes | No | [] | Array of field definitions |
| `base_price` | Number | Yes | No | - | Price per student |
| `currency` | String | Yes | No | 'INR' | INR or USD |
| `tax_percentage` | Number | No | No | 0 | Tax/GST percentage |
| `discount_rules` | Object | No | No | {} | Discount configurations |
| `discount_rules.early_bird` | Array | No | No | [] | Early bird discounts |
| `discount_rules.bulk` | Array | No | No | [] | Bulk discounts |
| `discount_rules.promo_codes` | Array | No | No | [] | Promo codes |
| `terms_and_conditions` | String | No | No | - | Event-specific T&C |
| `confirmation_message` | String | No | No | - | Post-registration message |
| `contact_email` | String | No | No | - | Event support email |
| `payment_methods_enabled` | Object | No | No | - | Enabled payment methods |
| `payment_methods_enabled.online` | Boolean | No | No | true | Online payments allowed |
| `payment_methods_enabled.offline` | Boolean | No | No | true | Offline payments allowed |
| `created_by` | ObjectId | Yes | No | - | Admin ID who created |
| `created_at` | Date | Auto | No | now | Creation timestamp |
| `updated_at` | Date | Auto | No | now | Update timestamp |

### Field Schema Structure

Each field in `form_schema.fields`:
```javascript
{
  field_name: String,        // Internal name (e.g., 'tshirt_size')
  label: String,             // Display label
  type: String,              // 'text', 'number', 'email', 'phone', 'date', 'select', 'multi-select', 'textarea'
  is_required: Boolean,      // Required validation
  options: [String],         // For select/multi-select types
  validation_rules: Object,  // Min, max, pattern, etc.
  help_text: String,         // Optional help text
  order: Number              // Display order
}
```

### Discount Rules Structure

**Early Bird**:
```javascript
{
  discount_percentage: Number,    // e.g., 15
  start_date: Date,               // Discount valid from
  end_date: Date,                 // Discount valid until
  description: String
}
```

**Bulk Discount**:
```javascript
{
  min_students: Number,           // e.g., 50
  discount_percentage: Number,    // e.g., 10
  description: String
}
```

**Promo Code**:
```javascript
{
  code: String,                   // e.g., 'WELCOME2024'
  discount_percentage: Number,    // e.g., 20
  max_uses: Number,               // e.g., 100
  current_uses: Number,           // Tracked usage
  valid_from: Date,
  valid_until: Date,
  description: String
}
```

### Validations

- `slug`: Lowercase, hyphens only, unique
- `status`: Enum ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']
- `category`: Enum [predefined categories]
- `currency`: Enum ['INR', 'USD']
- `base_price`: Positive number
- `max_participants`: Positive integer or null
- `registration_deadline`: Must be <= start_date

### Virtual Fields

- `current_registrations`: Count of students registered
- `total_revenue`: Sum of verified payments
- `is_registration_open`: Computed from deadline and status

### Methods

- `calculateDiscount(studentCount, promoCode)`: Calculate applicable discount
- `generateExcelTemplate()`: Create Excel template for registration

---

## Batch Model

**Collection**: `batches`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `batch_reference` | String | Yes | Yes | Auto | Unique reference (BAT-YYYY-NNNNNN) |
| `event_id` | ObjectId | Yes | No | - | Reference to Event |
| `school_id` | ObjectId | Yes | No | - | Reference to School |
| `students` | Array | Yes | No | [] | Array of student objects |
| `total_students` | Number | Yes | No | - | Count of students |
| `total_amount` | Number | Yes | No | - | Total amount after discounts |
| `base_amount` | Number | Yes | No | - | Amount before discounts |
| `discount_applied` | Object | No | No | {} | Breakdown of discounts |
| `discount_applied.early_bird` | Number | No | No | 0 | Early bird discount amount |
| `discount_applied.bulk` | Number | No | No | 0 | Bulk discount amount |
| `discount_applied.promo_code` | Number | No | No | 0 | Promo code discount amount |
| `promo_code_used` | String | No | No | - | Promo code if used |
| `status` | String | No | No | 'PENDING_PAYMENT' | Batch status |
| `excel_file_url` | String | No | No | - | Uploaded Excel file URL |
| `validation_errors` | Array | No | No | [] | Validation errors if any |
| `created_at` | Date | Auto | No | now | Upload timestamp |
| `updated_at` | Date | Auto | No | now | Update timestamp |

### Student Object Structure

Each student in `students` array:
```javascript
{
  student_name: String,
  dob: Date,
  gender: String,               // 'Male', 'Female', 'Other'
  grade: Number,
  // ... dynamic fields from event form_schema
  tshirt_size: String,          // Example custom field
  parent_email: String,         // Example custom field
  // etc.
}
```

### Validations

- `batch_reference`: Format 'BAT-YYYY-NNNNNN', unique
- `status`: Enum ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED']
- `total_students`: Must match `students.length`
- `total_amount`: Positive number

### Virtual Fields

- `event`: Populated Event object
- `school`: Populated School object
- `payment`: Populated Payment object (if exists)
- `invoice`: Populated Invoice object (if exists)

### Pre-save Hooks

- Generate `batch_reference` if not present
- Calculate `total_students` from students array length
- Validate student data against event form schema

---

## Registration Model

**Collection**: `registrations`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `event_id` | ObjectId | Yes | No | - | Reference to Event |
| `school_id` | ObjectId | Yes | No | - | Reference to School |
| `batch_id` | ObjectId | Yes | No | - | Reference to Batch |
| `student_data` | Object | Yes | No | - | Student information |
| `registration_number` | String | Yes | Yes | Auto | Unique registration number |
| `status` | String | No | No | 'PENDING' | Registration status |
| `created_at` | Date | Auto | No | now | Registration timestamp |

### Validations

- `registration_number`: Format 'REG-YYYY-NNNNNN', unique
- `status`: Enum ['PENDING', 'CONFIRMED', 'CANCELLED']

### Virtual Fields

- `event`: Populated Event object
- `school`: Populated School object
- `batch`: Populated Batch object

### Notes

- One registration per student
- Created when batch payment is verified
- Used for attendance, results, certificates

---

## Payment Model

**Collection**: `payments`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `batch_id` | ObjectId | Yes | No | - | Reference to Batch |
| `school_id` | ObjectId | Yes | No | - | Reference to School |
| `event_id` | ObjectId | Yes | No | - | Reference to Event |
| `amount` | Number | Yes | No | - | Payment amount |
| `currency` | String | Yes | No | 'INR' | INR or USD |
| `method` | String | Yes | No | - | Payment method |
| `gateway` | String | No | No | - | Payment gateway used |
| `status` | String | No | No | 'PENDING' | Payment status |
| `transaction_id` | String | No | No | - | Gateway transaction ID |
| `gateway_order_id` | String | No | No | - | Gateway order ID |
| `gateway_payment_id` | String | No | No | - | Gateway payment ID |
| `gateway_signature` | String | No | No | - | Gateway signature (Razorpay) |
| `transaction_reference` | String | No | No | - | Bank transaction ref (offline) |
| `transaction_date` | Date | No | No | - | Transaction date (offline) |
| `receipt_url` | String | No | No | - | Receipt upload URL (offline) |
| `verified_by` | ObjectId | No | No | - | Admin who verified (offline) |
| `verified_at` | Date | No | No | - | Verification timestamp |
| `rejection_reason` | String | No | No | - | Reason if rejected |
| `rejected_by` | ObjectId | No | No | - | Admin who rejected |
| `rejected_at` | Date | No | No | - | Rejection timestamp |
| `admin_notes` | String | No | No | - | Internal admin notes |
| `refund_id` | String | No | No | - | Refund transaction ID |
| `refund_amount` | Number | No | No | - | Refunded amount |
| `refund_date` | Date | No | No | - | Refund date |
| `created_at` | Date | Auto | No | now | Payment creation timestamp |
| `updated_at` | Date | Auto | No | now | Update timestamp |

### Validations

- `method`: Enum ['ONLINE', 'OFFLINE']
- `gateway`: Enum ['RAZORPAY', 'STRIPE', null]
- `status`: Enum ['PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED', 'REJECTED', 'REFUNDED']
- `currency`: Enum ['INR', 'USD']
- `amount`: Positive number

### Virtual Fields

- `batch`: Populated Batch object
- `school`: Populated School object
- `event`: Populated Event object
- `verified_by_admin`: Populated Admin object
- `rejected_by_admin`: Populated Admin object

### Indexes

- `batch_id`: Unique (one payment per batch)
- `transaction_id`: Indexed for fast lookup
- `status`: Indexed for filtering
- Compound: `(school_id, status)` for school payment history

---

## Invoice Model

**Collection**: `invoices`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `invoice_number` | String | Yes | Yes | Auto | Unique invoice number |
| `batch_id` | ObjectId | Yes | No | - | Reference to Batch |
| `payment_id` | ObjectId | Yes | No | - | Reference to Payment |
| `school_id` | ObjectId | Yes | No | - | Reference to School |
| `event_id` | ObjectId | Yes | No | - | Reference to Event |
| `total_students` | Number | Yes | No | - | Number of students |
| `base_amount` | Number | Yes | No | - | Amount before discounts |
| `discount_amount` | Number | No | No | 0 | Total discount |
| `tax_amount` | Number | No | No | 0 | Tax/GST amount |
| `total_amount` | Number | Yes | No | - | Final amount |
| `currency` | String | Yes | No | 'INR' | INR or USD |
| `issue_date` | Date | Yes | No | now | Invoice issue date |
| `invoice_url` | String | No | No | - | PDF file URL |
| `created_at` | Date | Auto | No | now | Creation timestamp |

### Validations

- `invoice_number`: Format 'INV-YYYY-NNNNNN', unique
- `currency`: Enum ['INR', 'USD']
- `total_amount`: Positive number

### Virtual Fields

- `batch`: Populated Batch object
- `payment`: Populated Payment object
- `school`: Populated School object
- `event`: Populated Event object

### Methods

- `generatePDF()`: Create PDF invoice using PDFKit

### Pre-save Hooks

- Generate `invoice_number` if not present

---

## Media Model

**Collection**: `media`

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | - | Primary key |
| `filename` | String | Yes | No | - | Original filename |
| `file_url` | String | Yes | No | - | Public access URL (proxy) |
| `storage_url` | String | Yes | No | - | Actual storage URL |
| `public_id` | String | Yes | No | - | Cloudinary public_id or local path |
| `mime_type` | String | Yes | No | - | File MIME type |
| `file_size` | Number | Yes | No | - | File size in bytes |
| `storage_provider` | String | Yes | No | 'cloudinary' | Storage provider |
| `uploaded_by` | ObjectId | Yes | No | - | Admin who uploaded |
| `created_at` | Date | Auto | No | now | Upload timestamp |

### Validations

- `mime_type`: Enum ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
- `storage_provider`: Enum ['cloudinary', 'local']
- `file_size`: Max 10MB (10485760 bytes)

### Virtual Fields

- `uploaded_by_admin`: Populated Admin object

### Indexes

- `storage_provider`: Indexed for filtering
- `mime_type`: Indexed for filtering
- `created_at`: Indexed for sorting

---

## Relationships

### Entity Relationship Diagram (Text)

```
School (1) ──< (N) Batch
School (1) ──< (N) Payment
School (1) ──< (N) Registration
School (1) ──< (N) Invoice

Event (1) ──< (N) Batch
Event (1) ──< (N) Payment
Event (1) ──< (N) Registration
Event (1) ──< (N) Invoice

Batch (1) ──< (N) Registration
Batch (1) ─── (1) Payment
Batch (1) ─── (1) Invoice

Payment (1) ─── (1) Invoice

Admin (1) ──< (N) Event (created_by)
Admin (1) ──< (N) Payment (verified_by)
Admin (1) ──< (N) Media (uploaded_by)
```

### Relationship Details

**School → Batch** (One-to-Many)
- A school can upload multiple batches
- Each batch belongs to one school
- Reference: `batch.school_id → school._id`

**School → Payment** (One-to-Many)
- A school can make multiple payments
- Each payment is from one school
- Reference: `payment.school_id → school._id`

**Event → Batch** (One-to-Many)
- An event can have multiple batches
- Each batch is for one event
- Reference: `batch.event_id → event._id`

**Batch → Payment** (One-to-One)
- Each batch has one payment
- Each payment is for one batch
- Reference: `payment.batch_id → batch._id` (unique)

**Batch → Invoice** (One-to-One)
- Each batch has one invoice (after payment)
- Each invoice is for one batch
- Reference: `invoice.batch_id → batch._id`

**Batch → Registration** (One-to-Many)
- Each batch creates multiple registrations (one per student)
- Each registration belongs to one batch
- Reference: `registration.batch_id → batch._id`

**Admin → Event** (One-to-Many - Creator)
- An admin can create multiple events
- Each event has one creator
- Reference: `event.created_by → admin._id`

**Admin → Payment** (One-to-Many - Verifier)
- An admin can verify multiple payments
- Each payment verified by one admin
- Reference: `payment.verified_by → admin._id`

---

## Indexes

### School Indexes

```javascript
{
  email: 1,                    // Unique index for login
  school_code: 1,              // Unique index
  is_active: 1,                // Filter active schools
  is_verified: 1,              // Filter verified schools
  currency: 1,                 // Filter by currency
  created_at: -1               // Sort by registration date
}
```

### Admin Indexes

```javascript
{
  email: 1,                    // Unique index for login
  role: 1,                     // Filter by role
  is_active: 1                 // Filter active admins
}
```

### Event Indexes

```javascript
{
  slug: 1,                     // Unique index for URL
  status: 1,                   // Filter by status
  category: 1,                 // Filter by category
  registration_deadline: 1,    // Filter/sort by deadline
  start_date: 1,               // Sort by start date
  created_at: -1               // Sort by creation
}
```

### Batch Indexes

```javascript
{
  batch_reference: 1,          // Unique index
  event_id: 1,                 // Filter by event
  school_id: 1,                // Filter by school
  status: 1,                   // Filter by status
  created_at: -1,              // Sort by upload date
  { school_id: 1, event_id: 1 }  // Compound: school's batches per event
}
```

### Payment Indexes

```javascript
{
  batch_id: 1,                 // Unique: one payment per batch
  transaction_id: 1,           // Fast lookup by transaction
  status: 1,                   // Filter by status
  method: 1,                   // Filter by method
  school_id: 1,                // School's payments
  event_id: 1,                 // Event's payments
  created_at: -1,              // Sort by date
  { school_id: 1, status: 1 }, // Compound: school's payment status
  { status: 1, method: 1 }     // Compound: pending offline payments
}
```

### Invoice Indexes

```javascript
{
  invoice_number: 1,           // Unique index
  school_id: 1,                // School's invoices
  batch_id: 1,                 // Batch's invoice
  created_at: -1               // Sort by issue date
}
```

### Registration Indexes

```javascript
{
  registration_number: 1,      // Unique index
  event_id: 1,                 // Event's registrations
  school_id: 1,                // School's registrations
  batch_id: 1,                 // Batch's registrations
  status: 1                    // Filter by status
}
```

### Media Indexes

```javascript
{
  storage_provider: 1,         // Filter by provider
  mime_type: 1,                // Filter by type
  created_at: -1,              // Sort by upload date
  uploaded_by: 1               // Admin's uploads
}
```

---

## Data Integrity Rules

### Cascade Deletes

**When deleting Event**:
- Cannot delete if batches exist (constraint)
- Must archive event instead

**When deleting School**:
- Cannot delete if payments exist (constraint)
- Must suspend school instead

**When deleting Batch**:
- Delete associated registrations
- Cannot delete if payment verified

**When deleting Media**:
- Remove from storage provider (Cloudinary/local)
- Check if used in events before deleting

### Referential Integrity

All ObjectId references are validated:
- `batch.event_id` must exist in events
- `batch.school_id` must exist in schools
- `payment.batch_id` must exist in batches
- `invoice.payment_id` must exist in payments

### Business Rules

**Batch Creation**:
- Event must be ACTIVE
- School must be verified and active
- Registration deadline not passed

**Payment Verification**:
- Batch must be PENDING_VERIFICATION
- Amount must match batch total_amount
- One payment per batch (unique constraint)

**Invoice Generation**:
- Payment must be VERIFIED
- Batch must be PAID
- One invoice per batch

---

## Migration Notes

### Version History

**v1.0** (Initial Schema)
- All models created
- Basic indexes added

**v1.1** (Media Proxy Update)
- Added `storage_url` to Media model
- Migrated `file_url` to proxy format
- Script: `update-media-urls.js`

### Pending Migrations

None at this time.

---

## Performance Considerations

### Query Optimization

1. **Always use indexed fields** in queries
2. **Limit fields** returned using `.select()`
3. **Paginate** large result sets
4. **Use lean()** for read-only queries
5. **Populate wisely** - only needed references

### Example Optimized Queries

**Get active events (paginated)**:
```javascript
Event.find({ status: 'ACTIVE' })
  .select('title slug start_date base_price')
  .sort({ start_date: 1 })
  .limit(10)
  .skip(0)
  .lean();
```

**Get school's paid batches**:
```javascript
Batch.find({ school_id, status: 'PAID' })
  .populate('event', 'title slug')
  .select('batch_reference total_students total_amount created_at')
  .sort({ created_at: -1 })
  .lean();
```

### Aggregation Examples

**Event revenue analytics**:
```javascript
Payment.aggregate([
  { $match: { event_id: eventId, status: 'VERIFIED' } },
  { $group: {
      _id: null,
      total_revenue: { $sum: '$amount' },
      total_payments: { $sum: 1 },
      avg_payment: { $avg: '$amount' }
  }}
]);
```

**Top schools by registration**:
```javascript
Batch.aggregate([
  { $match: { status: 'PAID' } },
  { $group: {
      _id: '$school_id',
      total_students: { $sum: '$total_students' },
      total_batches: { $sum: 1 }
  }},
  { $sort: { total_students: -1 } },
  { $limit: 10 },
  { $lookup: {
      from: 'schools',
      localField: '_id',
      foreignField: '_id',
      as: 'school'
  }}
]);
```

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Features Status](./FEATURES_STATUS.md)
- [Event Lifecycle](./EVENT_LIFECYCLE.md)
