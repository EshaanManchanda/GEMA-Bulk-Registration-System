# Event Lifecycle

Complete guide to event creation, registration, payment, and management in the GEMA system.

## Event Statuses

Events progress through distinct states during their lifecycle:

| Status | Description | Visible to Schools | Can Register |
|--------|-------------|-------------------|--------------|
| `DRAFT` | Event created but not published | No | No |
| `ACTIVE` | Published and accepting registrations | Yes | Yes |
| `CLOSED` | Registration period ended | Yes | No |
| `ARCHIVED` | Event completed and archived | No | No |

### Status Transitions

```
DRAFT ──────────> ACTIVE ──────────> CLOSED ──────────> ARCHIVED
         Admin             Auto/Admin          Admin
        Publishes          (End Date)         Archives
```

## Phase 1: Event Creation (Admin)

### Step 1: Basic Information

Admin navigates to `/admin/events/create` and fills:

**Required Fields**:
- **Title**: Event name (max 200 chars)
- **Slug**: URL-friendly identifier (auto-generated, editable)
- **Description**: Full event details (rich text)
- **Category**: Select from predefined categories
- **Status**: DRAFT (default) or ACTIVE
- **Start Date**: Event start date
- **End Date**: Event end date
- **Registration Deadline**: Last date to register

**Optional Fields**:
- **Venue**: Event location
- **Max Participants**: Total student limit across all schools
- **Banner Image**: Upload event banner (from media library)

### Step 2: Form Builder

Admin designs custom registration form for student data collection.

**Default Fields** (auto-included):
- Student Name
- Date of Birth
- Gender
- Grade/Class

**Custom Field Types**:

1. **Text**: Single-line text input
   - Example: Middle Name, Father's Name
   - Validation: Required, Min/Max length

2. **Number**: Numeric input
   - Example: Age, Roll Number
   - Validation: Required, Min/Max value

3. **Email**: Email address
   - Example: Student Email, Parent Email
   - Validation: Email format, Required

4. **Phone**: Phone number
   - Example: Contact Number, Emergency Contact
   - Validation: Phone format, Required

5. **Date**: Date picker
   - Example: Previous Event Participation Date
   - Validation: Required, Date range

6. **Select**: Single choice dropdown
   - Example: T-Shirt Size, Food Preference
   - Options: Admin defines list of choices
   - Validation: Required

7. **Multi-Select**: Multiple choice
   - Example: Event Categories, Interests
   - Options: Admin defines list of choices
   - Validation: Required, Min/Max selections

8. **Textarea**: Multi-line text
   - Example: Special Requirements, Medical Conditions
   - Validation: Required, Max length

**Field Configuration**:
```javascript
{
  field_name: "tshirt_size",
  label: "T-Shirt Size",
  type: "select",
  is_required: true,
  options: ["XS", "S", "M", "L", "XL", "XXL"],
  validation_rules: {
    required: true
  },
  help_text: "Choose student's t-shirt size"
}
```

### Step 3: Pricing Configuration

**Fee Structure**:
- **Base Price per Student**: Amount in selected currency (INR/USD)
- **Currency**: INR (Razorpay) or USD (Stripe)
- **Tax/GST**: Optional percentage

**Discount Rules**:

#### Early Bird Discount
```javascript
{
  type: "early_bird",
  discount_percentage: 15,
  start_date: "2024-01-01",
  end_date: "2024-01-31",
  description: "Register before January 31st for 15% off"
}
```

#### Bulk Discount
```javascript
{
  type: "bulk",
  min_students: 50,
  discount_percentage: 10,
  description: "10% off for 50+ students"
}
```

Multiple bulk tiers supported:
- 10-49 students: 5% off
- 50-99 students: 10% off
- 100+ students: 15% off

#### Promo Codes
```javascript
{
  code: "WELCOME2024",
  discount_percentage: 20,
  max_uses: 100,
  valid_from: "2024-01-01",
  valid_until: "2024-12-31"
}
```

### Step 4: Additional Settings

- **Confirmation Message**: Shown after successful registration
- **Terms & Conditions**: Custom T&C for this event
- **Contact Email**: Event-specific support email
- **Payment Methods Enabled**: Online, Offline, or Both

### Step 5: Publish Event

Admin reviews all settings and clicks "Publish".

- If status set to ACTIVE: Event immediately visible to schools
- If status set to DRAFT: Saved for later publication

## Phase 1.5: Public Event Viewing (No Authentication Required)

**New Feature**: Events can now be viewed publicly without logging in.

**Public URL**: `/events/:slug` (e.g., `/events/test`)

**Available to**: Anyone with the link

**Features**:
- Full event details and description
- Banner image display
- Pricing information
- Registration requirements preview
- Bulk discount structure
- Event dates and venue
- Call-to-action buttons (Login/Register School)

**Purpose**: Marketing, information sharing, event promotion

**Limitations**: Cannot register students without school account

## Phase 2: School Registration Process

### Step 1: Browse Events

School logs in and navigates to `/school/events`.

**Event Card Display**:
- Event banner image
- Title and category
- Date range
- Price per student
- Active discounts badge
- "View Details" button

**Filters Available**:
- Category
- Date range
- Price range
- Search by keywords

### Step 2: View Event Details

School clicks event to see `/school/events/:slug`.

**Details Page Shows**:
- Full description
- Venue and dates
- Registration deadline
- Price breakdown with active discounts
- Form fields preview
- Terms & conditions
- "Register Now" button

### Step 3: Download Excel Template

School clicks "Register Now", redirected to `/school/batches/upload/:slug`.

**Template Generation**:
1. System generates Excel file with columns for:
   - All default fields (Name, DOB, Gender, Grade)
   - All custom fields defined in event form
2. First row: Column headers
3. Second row: Data type hints and validation rules
4. Third row: Example data

**Template Example**:
```
| Student Name* | DOB*      | Gender*   | Grade* | T-Shirt Size* | Emergency Contact* |
|---------------|-----------|-----------|--------|---------------|--------------------|
| (Text, Req)   | (Date)    | (M/F/O)   | (Num)  | (XS/S/M/L/XL) | (Phone)           |
| John Doe      | 2010-05-15| Male      | 8      | M             | +919876543210     |
```

School downloads template and fills student data offline.

### Step 4: Upload Batch

**Upload Process**:
1. School selects filled Excel file
2. System parses file and validates:
   - Column headers match template
   - No duplicate students within batch
   - All required fields present
   - Data types correct
   - Field validations pass

**Validation Errors**:
If validation fails, system shows detailed errors:
```
Row 5: Invalid email format for field 'parent_email'
Row 12: Missing required field 'tshirt_size'
Row 18: Date of birth must be before today
```

School fixes errors and re-uploads.

**Successful Upload**:
- Batch created with status `PENDING_PAYMENT`
- Unique batch reference generated (e.g., `BAT-2024-001234`)
- Students temporarily stored in database
- School redirected to payment page

### Step 5: Payment Selection

School lands on `/school/payments/make-payment?batch=BAT-2024-001234`.

**Payment Summary**:
```
Event: Annual Science Fair
Students: 75
Base Price: ₹500/student = ₹37,500
Bulk Discount (50+ students): -10% = -₹3,750
--------------------------------
Total Amount: ₹33,750
```

**Payment Options**:

#### Option A: Online Payment (Razorpay/Stripe)

1. School clicks "Pay Online"
2. System creates payment order with gateway
3. Razorpay/Stripe checkout modal opens
4. School completes payment
5. Webhook received from gateway
6. Payment auto-verified
7. Batch status updated to `PAID`
8. Invoice auto-generated
9. School redirected to success page

**Flow Diagram**:
```
School -> Click Pay -> Create Order -> Gateway Checkout
                                              |
Gateway -> Process Payment -> Send Webhook -> Server
                                              |
Server -> Verify Signature -> Update DB -> Generate Invoice
                                              |
School <- Redirect Success <- Return Control
```

#### Option B: Offline Payment (Bank Transfer)

1. School clicks "Offline Payment"
2. System shows bank account details
3. School makes bank transfer
4. School uploads payment receipt (PDF/Image)
5. School adds transaction reference number
6. Batch status updated to `PENDING_VERIFICATION`
7. Admin notified (TODO: email notification)

**Verification Workflow**:
```
School Uploads Receipt
       |
Admin Reviews Payment (at /admin/payments/pending)
       |
    Approve?
    /     \
  Yes      No
   |        |
Update     Add Rejection
to PAID    Note & Notify
   |        |
Generate   School Can
Invoice    Resubmit
```

## Phase 3: Admin Payment Verification

### Offline Payment Review

Admin navigates to `/admin/payments/pending`.

**Pending List Shows**:
- School name
- Event name
- Batch reference
- Amount
- Receipt preview
- Transaction ref number
- Submission date

**Admin Actions**:

#### Approve Payment
1. Admin clicks "View Details"
2. Reviews receipt and transaction details
3. Clicks "Approve Payment"
4. Optional: Add internal notes
5. System updates batch status to `PAID`
6. Invoice auto-generated
7. School notified (TODO: email)

#### Reject Payment
1. Admin clicks "Reject"
2. Adds rejection reason (required)
3. System updates batch status back to `PENDING_PAYMENT`
4. School notified to resubmit (TODO: email)

## Phase 4: Post-Payment Processing

### Invoice Generation

Automatically triggered when payment verified (online or offline).

**Invoice Contents**:
- Invoice number (unique, auto-generated)
- School details (name, address, contact)
- Event details (name, date, venue)
- Batch reference
- Student count
- Price breakdown:
  - Base price
  - Discounts applied
  - Tax/GST if applicable
  - Total amount
- Payment details (method, transaction ID, date)
- QR code for verification (optional)

**PDF Generation**:
- Uses PDFKit library
- Stored in `/uploads/invoices/` or Cloudinary
- Downloadable from `/school/invoices`

### Batch Finalization

Once payment verified:
- Batch status: `PAID`
- Student registrations marked as confirmed
- Students added to event's total participant count
- School can no longer edit this batch
- Registration confirmation sent (TODO: email)

## Phase 5: Event Completion

### During Event Period

**Admin Can**:
- View real-time registration stats
- Export participant lists
- Download Excel with all student data
- See school-wise breakdown
- Track payment status

**School Can**:
- View their registered batches
- Download invoices
- See payment history
- Cannot modify paid batches

### After Registration Deadline

Admin can manually close registration by changing event status to `CLOSED`.

**When CLOSED**:
- Event still visible to schools
- "Register Now" button disabled
- Schools can view their past registrations
- New batch uploads blocked

### Post-Event Archival

After event ends, admin can archive:
1. Navigate to `/admin/events/:eventId/edit`
2. Change status to `ARCHIVED`
3. Event removed from school event list
4. Data retained in database
5. Accessible via admin panel for reporting

## Special Workflows

### Batch Cancellation

Not currently implemented. Future feature:
- School requests cancellation
- Admin approves
- Refund processed
- Batch marked as cancelled

### Partial Payments

Not supported. Full payment required upfront.

### Edit Student Data After Upload

Not currently allowed. School must:
1. Upload new batch with corrected data
2. Pay for new batch
3. Request admin to delete old batch (manual process)

### Multiple Batches Per School

Allowed. School can upload multiple batches for same event:
- Each batch gets unique reference
- Separate payments required
- Discounts applied per batch (not cumulative across batches)

## Discount Calculation Logic

System applies discounts in this order:

1. **Promo Code**: Applied first if valid
2. **Early Bird**: Applied if within date range
3. **Bulk Discount**: Applied based on student count

**Stacking Rules**:
- Early bird + Bulk: Both apply (cumulative)
- Promo code + Early bird: Only highest applies
- Promo code + Bulk: Only highest applies

Example:
```
Base: ₹500 × 60 students = ₹30,000
Early Bird (15%): -₹4,500
Bulk 50+ (10%): -₹3,000 (applied to discounted amount)
---------------------------------
Final: ₹22,500
```

## Error Handling

### Common Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Column mismatch" | Excel columns don't match template | Re-download template |
| "Duplicate students" | Same student in batch twice | Remove duplicates |
| "Invalid date format" | Wrong date format | Use YYYY-MM-DD |
| "Phone number invalid" | Wrong phone format | Use +[country][number] |
| "Required field missing" | Empty cell for required field | Fill all required fields |
| "File too large" | Excel > 10MB | Reduce batch size or image embeds |

### Payment Failures

**Online Payment Fails**:
1. Gateway shows error message
2. School returns to payment page
3. Can retry payment
4. Batch remains in `PENDING_PAYMENT` status

**Offline Payment Rejected**:
1. Admin adds rejection note
2. School notified (TODO: email)
3. School can re-upload receipt
4. Or choose online payment instead

## Analytics & Reporting

### Event-Level Analytics

Admin can view at `/admin/events/:eventId/analytics`:

- Total registrations (student count)
- Total revenue
- Pending payments count
- School participation count
- Registration trend (timeline chart)
- Payment method breakdown (online vs offline)
- Discount usage statistics

### Global Analytics

Admin can view at `/admin/analytics`:

- All events summary
- Revenue across all events
- School activity statistics
- Payment gateway comparison
- Most popular events

## Automated Notifications (Planned)

Following email notifications are TODO:

1. **School Receives**:
   - Registration successful
   - Payment confirmed
   - Payment failed/rejected
   - Batch validated
   - Event updates

2. **Admin Receives**:
   - New offline payment submitted
   - New school registered
   - Event registration milestone reached

## Best Practices

### For Admins Creating Events

- Set clear registration deadlines
- Test form fields before publishing
- Upload high-quality banner images (1200x630px recommended)
- Provide detailed event descriptions
- Set reasonable early bird deadlines
- Enable both payment methods for flexibility

### For Schools Registering

- Download template immediately, don't modify column structure
- Validate data before uploading (check emails, phone numbers, dates)
- Upload in smaller batches if data is uncertain
- Keep transaction reference numbers for offline payments
- Download invoices immediately after payment

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Admin User Guide](./USER_GUIDE_ADMIN.md)
- [School User Guide](./USER_GUIDE_SCHOOL.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
