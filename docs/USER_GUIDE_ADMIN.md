# Admin User Guide

Complete guide for administrators managing the GEMA Events platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Event Management](#event-management)
4. [School Management](#school-management)
5. [Payment Verification](#payment-verification)
6. [Media Library](#media-library)
7. [Analytics & Reports](#analytics--reports)
8. [Admin Management](#admin-management)
9. [Settings](#settings)

---

## Getting Started

### Login Process

1. Navigate to `/admin/login`
2. Enter admin email and password
3. Click "Login"
4. Redirected to `/admin/dashboard`

### First-Time Setup

**Super Admin** should:
1. Create additional admin accounts
2. Upload organization logo to media library
3. Configure system settings
4. Create first event

### Navigation

**Sidebar Menu**:
- Dashboard
- Events
- Schools
- Payments
- Media Library
- Analytics
- Settings (Super Admin only)
- Admin Management (Super Admin only)

---

## Dashboard Overview

Location: `/admin/dashboard`

### Key Metrics (Top Cards)

1. **Total Schools**
   - Active schools count
   - Click to view schools list

2. **Active Events**
   - Currently accepting registrations
   - Click to view events list

3. **Total Revenue**
   - Sum of all verified payments
   - All-time revenue

4. **Pending Verifications**
   - Offline payments awaiting approval
   - Click to review queue

### Recent Activity Feed

Shows last 10 actions:
- New school registrations
- Payment submissions
- Event publications
- Batch uploads

### Quick Actions

- Create New Event
- View Pending Payments
- Approve Schools

---

## Event Management

### Creating a New Event

#### Step 1: Navigate to Create Event

**Path**: Dashboard → Events → Create Event
**URL**: `/admin/events/create`

#### Step 2: Fill Basic Information

**Required Fields**:

- **Title**
  - Event name (max 200 characters)
  - Example: "Annual Science Fair 2024"

- **Slug**
  - Auto-generated from title
  - Can be edited (URL-friendly, lowercase, hyphens)
  - Example: `annual-science-fair-2024`
  - Used in event URL: `/school/events/annual-science-fair-2024`

- **Description**
  - Rich text editor
  - Include event details, schedule, rules
  - Supports formatting, lists, links

- **Category**
  - Select from dropdown:
    - Academic Competition
    - Sports Event
    - Cultural Program
    - Workshop/Training
    - Conference
    - Other

- **Event Dates**
  - **Start Date**: When event begins
  - **End Date**: When event ends
  - **Registration Deadline**: Last date to register (must be before start date)

**Optional Fields**:

- **Venue**: Physical location or "Online"
- **Max Participants**: Total student limit (leave empty for unlimited)
- **Banner Image**: Select from media library (recommended: 1200x630px)

#### Step 3: Build Registration Form

Click "Form Builder" tab.

**Default Fields** (cannot be removed):
- Student Name (text, required)
- Date of Birth (date, required)
- Gender (select: Male/Female/Other, required)
- Grade/Class (number, required)

**Add Custom Fields**:

1. Click "Add Field" button

2. Select field type:
   - **Text**: Single-line text input
   - **Number**: Numeric input
   - **Email**: Email address
   - **Phone**: Phone number with country code
   - **Date**: Date picker
   - **Select**: Dropdown (single choice)
   - **Multi-Select**: Checkboxes (multiple choices)
   - **Textarea**: Multi-line text

3. Configure field:
   ```
   Field Name: tshirt_size (internal name, lowercase, underscores)
   Label: T-Shirt Size (shown to users)
   Help Text: Choose student's t-shirt size (optional)
   Required: ✓ Yes  ⃝ No
   ```

4. For Select/Multi-Select, add options:
   ```
   Options (one per line):
   XS
   S
   M
   L
   XL
   XXL
   ```

5. Add validation rules:
   - Min length, Max length (for text)
   - Min value, Max value (for number)
   - Date range (for date)
   - Min selections, Max selections (for multi-select)

6. Click "Save Field"

7. Repeat for all required fields

**Tips**:
- Keep field names short and descriptive
- Use help text for complex fields
- Don't ask for sensitive data unless necessary
- Test form by previewing

#### Step 4: Set Pricing & Discounts

Click "Pricing" tab.

**Basic Pricing**:
```
Base Price per Student: 500
Currency: INR ▼
Tax/GST (%): 0 (optional)
```

**Add Discount Rules**:

**Early Bird Discount**:
1. Click "Add Early Bird Discount"
2. Fill details:
   ```
   Discount Percentage: 15
   Start Date: 2024-01-01
   End Date: 2024-01-31
   Description: Register before Jan 31 for 15% off
   ```
3. Click "Save"

**Bulk Discount**:
1. Click "Add Bulk Discount"
2. Add tiers:
   ```
   Tier 1:
   Min Students: 10
   Discount: 5%

   Tier 2:
   Min Students: 50
   Discount: 10%

   Tier 3:
   Min Students: 100
   Discount: 15%
   ```
3. Click "Save"

**Promo Codes**:
1. Click "Add Promo Code"
2. Fill details:
   ```
   Code: WELCOME2024
   Discount: 20%
   Max Uses: 100
   Valid From: 2024-01-01
   Valid Until: 2024-12-31
   ```
3. Click "Save"

#### Step 5: Configure Settings

Click "Settings" tab.

**Payment Methods**:
- ✓ Online Payment (Razorpay/Stripe)
- ✓ Offline Payment (Bank Transfer)

**Confirmation Message** (shown after successful registration):
```
Thank you for registering! You will receive a confirmation email shortly.
```

**Terms & Conditions**:
```
[Paste event-specific terms and conditions]
```

**Contact Email**:
```
support@gemaedu.org
```

#### Step 6: Publish or Save as Draft

**Save as Draft**:
- Click "Save as Draft"
- Event saved but not visible to schools
- Can edit later

**Publish Immediately**:
1. Select status: **Active**
2. Click "Publish Event"
3. Event now visible to all schools at `/school/events`

---

### Editing an Event

1. Navigate to Events list (`/admin/events`)
2. Click event name or "View Details"
3. Click "Edit Event" button
4. Make changes to any section
5. Click "Update Event"

**Note**: Changing form fields after schools have registered may cause data inconsistencies. Exercise caution.

---

### Viewing Event Details

**Location**: `/admin/events/:eventId`

**Information Displayed**:
- Event details and status
- Registration statistics:
  - Total students registered
  - Number of schools participated
  - Revenue generated
  - Pending payments
- Form fields preview
- Pricing and discount rules
- List of registered schools with batch counts

**Actions Available**:
- Edit Event
- View Analytics
- Download Participant List (Excel)
- Change Event Status
- Delete Event (if no registrations)

---

### Event Analytics

**Location**: `/admin/events/:eventId/analytics`

**Metrics Displayed**:

**Overview Cards**:
- Total registrations (student count)
- Total revenue (verified payments)
- Pending payments (count and amount)
- Participating schools count

**Charts**:
- **Registration Timeline**: Daily registration trends
- **Payment Methods**: Online vs Offline breakdown
- **School Distribution**: Top participating schools
- **Discount Usage**: Early bird, bulk, promo code usage

**Export Options**:
- Download participant list (Excel)
- Export analytics report (PDF) - TODO

---

## School Management

### Viewing Schools List

**Location**: `/admin/schools`

**Columns Displayed**:
- School Code (unique 6-char identifier)
- School Name
- Contact Person
- Email
- Phone
- Status (Active/Inactive/Pending Approval)
- Registration Date

**Filters**:
- Status: All / Active / Inactive / Pending
- Currency: All / INR / USD
- Search: By name, code, or email

---

### Approving New Schools

1. Navigate to Schools list
2. Filter by "Pending Approval"
3. Click school name to view details
4. Review school information:
   - Name and contact details
   - Address
   - Contact person details
5. Click "Approve School" button
6. School account activated
7. School can now register for events

**Rejection** (if needed):
1. Click "Reject" instead
2. Add rejection reason
3. School notified to update details (TODO: email)

---

### Viewing School Details

**Location**: `/admin/schools/:schoolId`

**Tabs**:

**Overview**:
- School information
- Contact person
- Address
- Status and verification details

**Batches**:
- All batches uploaded by this school
- Event name, batch reference, student count
- Payment status
- Click to view batch details

**Payments**:
- Payment history
- Transaction details
- Total amount paid

**Activity Log**:
- Recent actions by this school
- Batch uploads, payments, profile updates

**Actions**:
- Edit School Details
- Suspend School (deactivate account)
- Reactivate School (if suspended)
- View as School (impersonate - Super Admin only)

---

### Editing School Information

**Location**: `/admin/schools/:schoolId/edit`

**Editable Fields**:

**Basic Information**:
- School Name
- Admin Notes (internal, not visible to school)

**Contact Person**:
- Name
- Email
- Phone
- Designation

**Address**:
- Street Address
- City
- State/Province
- Postal Code
- Country

**Actions**:
- Update School
- Cancel (return to details page)

---

### Suspending a School

**Use Case**: Prevent school from accessing platform temporarily

**Steps**:
1. Go to school details page
2. Click "Suspend School"
3. Confirm action
4. School's `is_active` set to `false`
5. School cannot login
6. Existing batches unaffected

**To Reactivate**:
1. Click "Reactivate School"
2. School can login again

---

## Payment Verification

### Viewing Pending Payments

**Location**: `/admin/payments/pending`

**List Shows**:
- School name
- Event name
- Batch reference
- Amount
- Payment receipt thumbnail
- Transaction reference number
- Submitted date
- Days pending

**Sort Options**:
- Oldest first (default)
- Newest first
- Highest amount
- Lowest amount

---

### Approving Offline Payment

**Location**: `/admin/payments/:paymentId`

**Steps**:

1. Click pending payment from list

2. Review payment details:
   ```
   School: ABC International School
   Event: Annual Science Fair 2024
   Batch: BAT-2024-001234
   Students: 75
   Amount: ₹33,750
   Transaction Ref: TXN123456789
   Submitted: 2024-03-15 10:30 AM
   ```

3. View uploaded receipt:
   - Click to view full size
   - Download receipt if needed

4. Verify transaction:
   - Check bank account for matching transaction
   - Verify amount and reference number
   - Ensure school details match

5. Add internal notes (optional):
   ```
   Verified with SBI statement. Transaction ID matches.
   Amount received on 15-03-2024.
   ```

6. Click "Approve Payment"

7. Confirmation dialog appears → Click "Confirm"

8. Payment verified:
   - Batch status updated to `PAID`
   - Invoice automatically generated
   - School notified (TODO: email)
   - Payment removed from pending queue

---

### Rejecting a Payment

**When to Reject**:
- Amount doesn't match
- Transaction not found in bank account
- Receipt is invalid or unclear
- Duplicate submission

**Steps**:

1. View payment details as above

2. Click "Reject Payment"

3. **Rejection reason is required**:
   ```
   Example reasons:
   - Amount mismatch: Expected ₹33,750 but transaction shows ₹30,000
   - Transaction not found in our bank account
   - Receipt is unclear, please upload a clearer copy
   - Duplicate submission of payment for BAT-2024-001233
   ```

4. Click "Confirm Rejection"

5. Payment rejected:
   - Batch status reverted to `PENDING_PAYMENT`
   - School notified with rejection reason (TODO: email)
   - School can re-upload correct receipt or choose online payment

---

### Viewing All Payments

**Location**: `/admin/payments`

**Columns**:
- Payment ID
- School
- Event
- Batch Reference
- Amount
- Method (Online/Offline)
- Status (Verified/Pending/Rejected)
- Date

**Filters**:
- Status: All / Verified / Pending / Rejected
- Method: All / Online / Offline
- Date Range: Custom date picker
- Event: Dropdown of all events
- School: Search school

**Export**:
- Download filtered list as Excel
- Useful for accounting and reconciliation

---

## Media Library

**Location**: `/admin/media`

### Uploading Images

**Steps**:

1. Navigate to Media Library

2. Click "Upload Images" button

3. Select files:
   - **Formats**: JPEG, PNG, GIF, WebP
   - **Size Limit**: 10MB per file
   - **Multiple**: Up to 10 files at once

4. Files upload with progress indicators

5. Images appear in grid upon completion

**Storage**:
- Cloud: Cloudinary (default)
- Local: Server filesystem (fallback)
- Set via `STORAGE_PROVIDER` environment variable

---

### Organizing Media

**Grid View**:
- Thumbnail preview
- File name
- File size
- Upload date
- Storage provider icon

**Actions per Image**:
- **Preview**: Click image to view full size
- **Download**: Download original file
- **Copy URL**: Copy public URL to clipboard
- **Delete**: Remove from library (confirmation required)

**Bulk Actions**:
1. Select multiple images (checkboxes)
2. Click "Delete Selected"
3. Confirm deletion

---

### Searching Media

**Search Bar**: Filter by filename

**Filters**:
- **Type**: All / JPEG / PNG / GIF / WebP
- **Storage**: All / Cloudinary / Local
- **Date**: Upload date range

**Sort Options**:
- Newest first (default)
- Oldest first
- Largest file size
- Smallest file size

---

### Using Media in Events

When creating/editing events:

1. Go to "Banner Image" field
2. Click "Select from Library"
3. Media library modal opens
4. Click desired image
5. Image preview shown
6. Click "Use This Image"
7. Image URL saved to event

---

## Analytics & Reports

### Global Analytics

**Location**: `/admin/analytics`

**Overview Cards**:
- Total Events Created
- Total Schools Registered
- Total Students Registered
- Total Revenue Generated

**Revenue Breakdown**:
- By Event (bar chart)
- By Month (line chart)
- By Payment Method (pie chart)
- By Currency (INR vs USD)

**School Statistics**:
- Most Active Schools (by registration count)
- Schools by Currency Preference
- School Registration Timeline

**Event Performance**:
- Most Popular Events (by student count)
- Highest Revenue Events
- Events with Pending Payments

**Export**:
- Download comprehensive report (Excel)
- Includes all metrics and charts data

---

## Admin Management

**Available to**: Super Admin only
**Location**: `/admin/admins`

### Viewing Admins

**List Shows**:
- Admin Name
- Email
- Role (Super Admin / Admin / Moderator)
- Permissions summary
- Status (Active/Inactive)
- Last Login

---

### Creating New Admin

**Steps**:

1. Click "Add Admin"

2. Fill form:
   ```
   Name: John Doe
   Email: john@gemaedu.org
   Password: [Auto-generated or manual]
   Role: Admin ▼ (Super Admin / Admin / Moderator)
   ```

3. Configure permissions (if role is Admin or Moderator):
   - ✓ Can Manage Events
   - ✓ Can Verify Payments
   - ✓ Can Manage Schools
   - ✓ Can View Analytics
   - ⃝ Can Manage Admins (Admin only, not Moderator)
   - ⃝ Can Manage Settings (Super Admin only)

4. Click "Create Admin"

5. Admin receives email with login credentials (TODO: email integration)

---

### Editing Admin

**Steps**:

1. Click admin name from list

2. Click "Edit"

3. Update details:
   - Name, Email (cannot change)
   - Role (careful: demoting Super Admin requires another Super Admin)
   - Permissions

4. Click "Update Admin"

---

### Deactivating Admin

**Use Case**: Temporarily disable admin access

**Steps**:

1. View admin details

2. Click "Deactivate"

3. Confirm action

4. Admin cannot login

5. To reactivate: Click "Activate"

---

## Settings

**Available to**: Super Admin only
**Location**: `/admin/settings`

### General Settings

- **Organization Name**: Displayed in emails and invoices
- **Support Email**: Contact email for schools
- **Support Phone**: Contact phone number

### Payment Gateway Configuration

**Razorpay (INR)**:
```
API Key ID: [hidden]
API Key Secret: [hidden]
Webhook Secret: [hidden]
Test Mode: ⃝ Enabled  ✓ Disabled
```

**Stripe (USD)**:
```
Publishable Key: [hidden]
Secret Key: [hidden]
Webhook Secret: [hidden]
Test Mode: ⃝ Enabled  ✓ Disabled
```

**Bank Details (for offline payments)**:
```
Bank Name: State Bank of India
Account Holder: GEMA Events
Account Number: 1234567890
IFSC Code: SBIN0001234
Branch: Mumbai Central
```

### Email Settings

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: noreply@gemaedu.org
SMTP Password: [hidden]
From Name: GEMA Events
From Email: noreply@gemaedu.org
```

**Email Templates**: Configure templates for:
- School registration confirmation
- Payment verification
- Event reminders
- Invoice emails

### Storage Settings

```
Provider: Cloudinary ▼ (Cloudinary / Local)

Cloudinary Config:
Cloud Name: [hidden]
API Key: [hidden]
API Secret: [hidden]
```

### System Settings

- **Max Students per Batch**: 500 (default)
- **Max File Size (Excel)**: 10 MB
- **Max File Size (Images)**: 10 MB
- **Session Timeout**: 24 hours
- **Rate Limiting**: 100 requests per 15 minutes

---

## Best Practices

### Event Creation
- Create events well in advance of registration deadline
- Test form fields by creating a draft and previewing
- Set realistic early bird dates to encourage early registrations
- Always upload a banner image for better visibility

### Payment Verification
- Review pending payments daily
- Verify transaction details in bank account before approving
- Add clear rejection reasons to help schools correct issues
- Download receipts for accounting records

### School Management
- Approve schools promptly to avoid registration delays
- Verify contact details during approval
- Add internal notes for future reference
- Monitor school activity for suspicious behavior

### Media Library
- Use descriptive filenames for images
- Delete unused media to save storage
- Organize by naming convention (e.g., `event-name-banner.jpg`)
- Optimize images before upload (compress large files)

### Analytics
- Review analytics weekly to track performance
- Identify events with pending payments and follow up
- Use data to improve future events
- Export reports for stakeholder presentations

---

## Troubleshooting

### Cannot Login
- Verify email and password
- Check if admin account is active
- Clear browser cache and cookies
- Contact Super Admin if locked out

### Payment Not Showing in Pending Queue
- Check if payment was already approved/rejected
- Verify school uploaded receipt correctly
- Check database directly if issue persists

### Event Not Visible to Schools
- Verify event status is "ACTIVE"
- Check registration deadline hasn't passed
- Ensure event is not archived

### Media Upload Failing
- Check file size (max 10MB)
- Verify file format (JPEG/PNG/GIF/WebP)
- Check storage provider configuration
- Review server logs for errors

### Discount Not Applying
- Verify discount dates are current
- Check if promo code is valid and not exceeded max uses
- Ensure bulk discount thresholds are met
- Review discount calculation logic in event settings

---

## Keyboard Shortcuts

- `Ctrl+K`: Global search
- `Ctrl+N`: Create new event (when on events page)
- `Ctrl+E`: Edit current item
- `Esc`: Close modals/dialogs

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Event Lifecycle](./EVENT_LIFECYCLE.md)
- [School User Guide](./USER_GUIDE_SCHOOL.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
