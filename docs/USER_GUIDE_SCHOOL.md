# School User Guide

Complete guide for schools registering students for GEMA events.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Registration](#account-registration)
3. [Browsing Events](#browsing-events)
4. [Bulk Student Registration](#bulk-student-registration)
5. [Making Payments](#making-payments)
6. [Managing Batches](#managing-batches)
7. [Payment History & Invoices](#payment-history--invoices)
8. [Profile Management](#profile-management)

---

## Getting Started

### What is GEMA Events?

GEMA Events is a platform that allows schools to register multiple students for educational events, competitions, and programs in bulk using Excel spreadsheets.

### Benefits for Schools

- **Bulk Upload**: Register hundreds of students at once via Excel
- **Multiple Payment Options**: Pay online (Razorpay/Stripe) or offline (Bank Transfer)
- **Automatic Invoices**: Download invoices immediately after payment
- **Real-time Tracking**: Monitor all your batches and payments
- **Multi-Currency**: Choose INR (Razorpay) or USD (Stripe) as your currency

---

## Account Registration

### Step 1: Create Account

1. Visit the platform homepage

2. Click "School Login" → "Register"

3. URL: `/school/register`

4. Fill registration form:

**School Information**:
```
School Name: ABC International School
School Email: admin@abcschool.edu
Password: [Create strong password]
Confirm Password: [Re-enter password]
```

**Contact Person**:
```
Name: John Smith
Designation: Principal
Email: john.smith@abcschool.edu
Phone: +919876543210
```

**Address**:
```
Street Address: 123 Education Lane
City: Mumbai
State/Province: Maharashtra
Postal Code: 400001
Country: India ▼
```

**Currency Preference**:
```
⃝ INR (₹) - Indian Rupee (Razorpay payment gateway)
⃝ USD ($) - US Dollar (Stripe payment gateway)
```

5. Accept Terms & Conditions

6. Click "Register"

### Step 2: Email Verification

1. Check your email inbox for verification link

2. Click verification link in email

3. Email verified message appears

4. Account status: **Verified, Pending Admin Approval**

### Step 3: Admin Approval

1. GEMA admin reviews your school details

2. Admin approves your account

3. You receive approval notification (TODO: email integration)

4. Account status: **Active**

5. You can now login and register for events

**Approval Timeline**: Usually within 24-48 hours

---

## First Login

### Login Process

1. Navigate to `/school/login`

2. Enter credentials:
   ```
   Email: admin@abcschool.edu
   Password: [Your password]
   ```

3. Click "Login"

4. Redirected to Dashboard (`/school/dashboard`)

### Dashboard Overview

**Quick Stats Cards**:
- Total Batches Uploaded
- Total Students Registered
- Total Amount Paid
- Pending Payments

**Recent Activity**:
- Last 5 batches uploaded
- Recent payments
- Event registrations

**Quick Actions**:
- Browse Events
- Upload New Batch
- View Payment History
- Download Invoices

---

## Browsing Events

**Location**: `/school/events`

### Viewing Available Events

**Event Grid Display**:
- Event banner image
- Title and category
- Date range
- Price per student
- Discount badges (Early Bird, Bulk Discount)
- "View Details" button

### Filtering Events

**Available Filters**:

- **Category**:
  - All Categories
  - Academic Competition
  - Sports Event
  - Cultural Program
  - Workshop/Training
  - Conference
  - Other

- **Date Range**:
  - Upcoming
  - This Month
  - Next 3 Months
  - Custom Date Range

- **Price Range**:
  - Free
  - ₹0 - ₹500
  - ₹500 - ₹1000
  - ₹1000+

- **Search**: Enter keywords to search event titles/descriptions

### Viewing Event Details

**Click "View Details"** to see full event information:

**Event Page Shows** (`/school/events/:slug`):

1. **Event Banner** (large image at top)

2. **Event Overview**:
   ```
   Title: Annual Science Fair 2024
   Category: Academic Competition
   Dates: March 15-17, 2024
   Venue: Mumbai Convention Center
   Registration Deadline: February 28, 2024
   ```

3. **Description**: Full event details, schedule, rules

4. **Pricing**:
   ```
   Base Price: ₹500 per student

   Active Discounts:
   - Early Bird (until Jan 31): 15% off
   - Bulk Discount (50+ students): 10% off
   - Bulk Discount (100+ students): 15% off
   ```

5. **Registration Form Preview**: Shows all fields you'll need to fill in Excel

6. **Terms & Conditions**: Event-specific terms

7. **"Register Now" Button**: Proceeds to batch upload

---

## Bulk Student Registration

### Overview

Register multiple students at once by:
1. Downloading event-specific Excel template
2. Filling student data offline
3. Uploading completed Excel file
4. Making payment

### Step 1: Start Registration

1. From event details page, click **"Register Now"**

2. Redirected to Upload Page (`/school/batches/upload/:slug`)

### Step 2: Download Excel Template

1. Click **"Download Excel Template"** button

2. Excel file downloads automatically

3. Filename: `event-slug-template.xlsx`

**Template Structure**:

**Row 1** (Headers): Column names
```
Student Name | Date of Birth | Gender | Grade | T-Shirt Size | Parent Email | ...
```

**Row 2** (Hints): Data type and validation info
```
(Text, Req) | (Date, YYYY-MM-DD) | (M/F/O) | (Number) | (XS/S/M/L/XL) | (Email) | ...
```

**Row 3** (Example): Sample data
```
John Doe | 2010-05-15 | Male | 8 | M | parent@email.com | ...
```

### Step 3: Fill Student Data

**Important Rules**:

1. **Do Not Modify**:
   - Column headers (Row 1)
   - Column order
   - Sheet name

2. **Start from Row 4**: Enter actual student data starting from 4th row

3. **Required Fields**: Marked with * in column header, cannot be empty

4. **Date Format**: Use `YYYY-MM-DD` (e.g., 2010-05-15)

5. **Phone Format**: Include country code (e.g., +919876543210)

6. **Email Format**: Valid email addresses only

7. **Select Fields**: Use exact options from hint row (case-sensitive)

8. **No Duplicates**: Each student should appear only once in the batch

**Example Data Entry**:
```
Row 4: John Doe    | 2010-05-15 | Male   | 8  | M  | john.parent@email.com
Row 5: Jane Smith  | 2011-03-20 | Female | 7  | S  | jane.parent@email.com
Row 6: Mike Johnson| 2010-11-10 | Male   | 8  | L  | mike.parent@email.com
...
```

**Tips**:
- Fill data in Excel/Google Sheets
- Use data validation to prevent errors
- Double-check phone numbers and emails
- Save file before uploading

### Step 4: Upload Excel File

1. Return to upload page (`/school/batches/upload/:slug`)

2. Click **"Choose File"** or drag file to upload area

3. Select your filled Excel file

4. File size limit: **10 MB**

5. Click **"Upload and Validate"**

### Step 5: Validation Results

**Validation Process**:
- System reads Excel file
- Checks column headers
- Validates each row of data
- Checks for duplicates
- Verifies all required fields

**Success**: If all data is valid

```
✓ Validation Successful!

Batch Details:
- Batch Reference: BAT-2024-001234
- Total Students: 75
- Event: Annual Science Fair 2024
- Amount: ₹33,750 (after discounts)

Proceed to payment
```

Click **"Proceed to Payment"** to continue.

**Errors**: If validation fails

```
✗ Validation Failed

Errors found:
Row 12: Invalid email format for 'parent_email'
Row 18: Missing required field 'tshirt_size'
Row 25: Date of birth must be before today
Row 33: Invalid phone number format
```

**Fix Errors**:
1. Note down all error row numbers
2. Open Excel file
3. Correct errors in those rows
4. Save file
5. Re-upload

**Common Errors & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| Column mismatch | Modified headers | Re-download template |
| Invalid email | Wrong format | Use format: user@domain.com |
| Invalid phone | Wrong format | Use +[country][number] |
| Invalid date | Wrong format | Use YYYY-MM-DD |
| Missing required field | Empty cell | Fill all cells with * |
| Duplicate student | Same name/DOB twice | Remove duplicate row |
| File too large | Excel > 10MB | Remove embedded images |

---

## Making Payments

After successful batch upload, you're redirected to payment page.

**Location**: `/school/payments/make-payment?batch=BAT-2024-001234`

### Payment Summary

**Batch Details**:
```
Event: Annual Science Fair 2024
Batch Reference: BAT-2024-001234
Total Students: 75
```

**Price Breakdown**:
```
Base Price:              ₹500 × 75 = ₹37,500
Early Bird Discount (15%):        - ₹5,625
Bulk Discount (50+ students):     - ₹3,188
─────────────────────────────────────────
Final Amount:                     ₹28,687
```

### Payment Method Selection

Two options available:

#### Option A: Online Payment (Recommended)

**Advantages**:
- Instant verification
- Automatic invoice generation
- Immediate registration confirmation

**Steps**:

1. Click **"Pay Online"** button

2. Payment gateway modal opens (Razorpay or Stripe based on your currency)

3. **Razorpay** (INR):
   - Enter card details, UPI ID, or net banking
   - Complete payment

4. **Stripe** (USD):
   - Enter card details
   - Complete payment

5. Payment processing...

6. **Success**: Redirected to success page (`/school/payments/success`)
   ```
   ✓ Payment Successful!

   Transaction ID: pay_ABC123XYZ
   Amount: ₹28,687
   Batch: BAT-2024-001234

   Your invoice has been generated automatically.

   [Download Invoice] [View Batch Details]
   ```

7. Batch status updated to **PAID**

8. Invoice available in Invoices section

**Failure**: If payment fails
- Redirected to failure page (`/school/payments/failure`)
- Batch remains in `PENDING_PAYMENT` status
- Can retry payment from Batches page

#### Option B: Offline Payment (Bank Transfer)

**Use When**:
- Prefer bank transfer over online payment
- Payment limit restrictions on cards
- Institutional payment policies

**Steps**:

1. Click **"Offline Payment"** button

2. **Bank Account Details** shown:
   ```
   Bank Name: State Bank of India
   Account Holder: GEMA Events
   Account Number: 1234567890
   IFSC Code: SBIN0001234
   Branch: Mumbai Central

   Amount to Transfer: ₹28,687
   Reference: BAT-2024-001234 (include in remarks)
   ```

3. Make bank transfer using:
   - Online banking
   - NEFT/RTGS
   - Check deposit

4. **Upload Payment Receipt**:
   - Click "Upload Receipt"
   - Select receipt file (PDF, JPEG, PNG up to 10MB)
   - Upload completes

5. **Enter Transaction Details**:
   ```
   Transaction Reference Number: TXN123456789
   Transaction Date: 2024-03-15
   Amount Paid: ₹28,687
   Additional Notes: (optional)
   ```

6. Click **"Submit for Verification"**

7. Confirmation message:
   ```
   ✓ Payment submitted for verification

   Your payment receipt has been submitted to GEMA admin.
   Verification typically takes 24-48 hours.

   You'll be notified once payment is verified.

   Batch Status: PENDING_VERIFICATION
   ```

8. Admin reviews and approves payment

9. Upon approval:
   - Batch status updated to **PAID**
   - Invoice generated
   - You receive notification (TODO: email)

**Rejection**: If payment is rejected
- You receive notification with reason
- Batch status reverted to **PENDING_PAYMENT**
- You can re-upload correct receipt or choose online payment

---

## Managing Batches

**Location**: `/school/batches`

### Viewing All Batches

**List Shows**:
- Batch Reference (e.g., BAT-2024-001234)
- Event Name
- Student Count
- Amount
- Status
- Upload Date
- Actions

**Status Badges**:

| Status | Meaning | Color |
|--------|---------|-------|
| `PENDING_PAYMENT` | Batch uploaded, payment pending | Yellow |
| `PENDING_VERIFICATION` | Offline payment submitted | Orange |
| `PAID` | Payment verified, registration complete | Green |
| `FAILED` | Payment failed | Red |

### Viewing Batch Details

**Click batch reference** to view details (`/school/batches/:batchReference`)

**Batch Information**:
```
Batch Reference: BAT-2024-001234
Event: Annual Science Fair 2024
Status: PAID
Upload Date: 2024-03-10 14:30
```

**Students List**:
- Table showing all student data
- All fields you uploaded in Excel
- Student count summary

**Payment Information**:
- Payment method
- Transaction ID
- Amount paid
- Payment date
- Invoice download link

**Actions**:
- Download Invoice (if paid)
- Make Payment (if pending)
- View Receipt (if offline payment)
- Download Student List (Excel)

### Batch Status Tracking

**Pending Payment**:
```
Status: PENDING_PAYMENT

Your batch is uploaded successfully.

Action Required: Complete payment to finalize registration.

[Make Payment]
```

**Pending Verification**:
```
Status: PENDING_VERIFICATION

Your offline payment receipt has been submitted.

Admin is reviewing your payment.
Expected verification time: 24-48 hours

[View Receipt]
```

**Paid**:
```
Status: PAID

Registration Complete! ✓

All students are successfully registered for the event.

[Download Invoice]
```

### Downloading Student List

From batch details page:

1. Click **"Download Student List"**

2. Excel file downloads with all student data

3. Use for:
   - Record keeping
   - Printing rosters
   - Sharing with event coordinators

---

## Payment History & Invoices

### Viewing Payment History

**Location**: `/school/payments`

**List Shows**:
- Payment ID
- Event Name
- Batch Reference
- Amount
- Method (Online/Offline)
- Status
- Date

**Filters**:
- Status: All / Verified / Pending / Failed
- Method: All / Online / Offline
- Date Range: Custom date picker

### Viewing Payment Details

**Click payment** to see details (`/school/payments/:paymentId`)

**Information Displayed**:
- Payment ID and status
- Batch and event details
- Amount breakdown
- Transaction details
- Receipt (if offline)
- Invoice download link (if verified)

### Downloading Invoices

**Location**: `/school/invoices`

**Invoice List Shows**:
- Invoice Number
- Event Name
- Batch Reference
- Student Count
- Amount
- Issue Date
- Download button

**Click "Download"** to get PDF invoice

**Invoice Contains**:
```
GEMA EVENTS - TAX INVOICE

Invoice No: INV-2024-001234
Date: 15-03-2024

Bill To:
ABC International School
123 Education Lane
Mumbai, Maharashtra 400001
Phone: +919876543210

Event Details:
Annual Science Fair 2024
Venue: Mumbai Convention Center
Dates: March 15-17, 2024

Batch Reference: BAT-2024-001234
Number of Students: 75

Price Breakdown:
Base Price (₹500 × 75)         ₹37,500.00
Early Bird Discount (15%)       -₹5,625.00
Bulk Discount (10%)             -₹3,188.00
────────────────────────────────────────
Total Amount                    ₹28,687.00

Payment Details:
Method: Online (Razorpay)
Transaction ID: pay_ABC123XYZ
Date: 15-03-2024

Status: PAID
```

**Uses for Invoice**:
- Accounting records
- Reimbursement claims
- Institutional documentation
- Tax purposes

---

## Profile Management

### Viewing Profile

**Location**: `/school/profile`

**Information Displayed**:
- School Code (unique identifier)
- School Name
- Email (login email)
- Contact Person Details
- Address
- Currency Preference
- Account Status
- Registration Date

**Actions**:
- Edit Profile
- Change Password

### Editing Profile

**Location**: `/school/profile/edit`

**Editable Fields**:

**School Information**:
- School Name

**Contact Person**:
- Name
- Designation
- Email
- Phone

**Address**:
- Street Address
- City
- State/Province
- Postal Code
- Country

**Cannot Edit**:
- School Email (login email)
- School Code
- Currency (set during registration)

**Steps**:
1. Update desired fields
2. Click "Save Changes"
3. Confirmation message appears
4. Profile updated

### Changing Password

**Location**: `/school/profile/change-password`

**Form**:
```
Current Password: [Enter current password]
New Password: [Enter new password]
Confirm New Password: [Re-enter new password]
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Steps**:
1. Enter current password
2. Enter new password (must meet requirements)
3. Confirm new password
4. Click "Change Password"
5. Success message appears
6. Use new password for next login

---

## Frequently Asked Questions

### Registration & Account

**Q: How long does admin approval take?**
A: Usually 24-48 hours. Ensure all details are accurate to avoid delays.

**Q: Can I change my currency preference later?**
A: No, currency is set during registration and cannot be changed. Create a new account if needed.

**Q: I didn't receive verification email. What should I do?**
A: Check spam folder. Wait 10 minutes and try "Resend Verification Email" button on login page.

### Events & Registration

**Q: Can I register students from multiple events in one Excel file?**
A: No. Each event requires a separate Excel template and upload.

**Q: What's the maximum number of students I can upload at once?**
A: 500 students per batch. For more, create multiple batches.

**Q: Can I register students after the registration deadline?**
A: No. Registrations are blocked after deadline. Contact admin for exceptions.

**Q: Can I edit student data after uploading?**
A: Not directly. You must upload a new batch with corrected data and request admin to delete the old batch.

### Payments

**Q: Which payment method is faster?**
A: Online payment (Razorpay/Stripe) is instant. Offline payment takes 24-48 hours for verification.

**Q: My online payment failed but amount was deducted. What should I do?**
A: Payment gateways auto-refund failed transactions within 5-7 business days. Contact support if not received.

**Q: Can I pay for multiple batches together?**
A: No. Each batch requires separate payment.

**Q: Do you provide refunds if we cancel registration?**
A: Refund policy is event-specific. Contact admin for cancellation requests.

### Invoices

**Q: When will I receive the invoice?**
A: Invoices are auto-generated immediately after payment verification (instant for online, within 48 hours for offline).

**Q: I lost my invoice. Can I download it again?**
A: Yes. Go to Invoices section and download anytime.

**Q: Can I get invoice in a different format?**
A: Currently only PDF is available.

### Discounts

**Q: Can I apply multiple discount codes?**
A: System automatically applies the best available discount (early bird, bulk, or promo code).

**Q: I uploaded 60 students but bulk discount didn't apply. Why?**
A: Bulk discount applies per batch. Ensure all 60 students are in one batch, not split across multiple uploads.

**Q: My promo code isn't working. What should I do?**
A: Check if code is valid, not expired, and hasn't exceeded max uses. Contact admin if issue persists.

---

## Troubleshooting

### Cannot Login

**Symptoms**: "Invalid credentials" error

**Solutions**:
- Verify email and password are correct
- Check if account is approved by admin (check email for approval notification)
- Try "Forgot Password" to reset
- Contact admin if account is suspended

### Excel Upload Errors

**Error**: "Column mismatch"
- **Cause**: Modified template headers
- **Solution**: Re-download template, don't change headers

**Error**: "Invalid date format"
- **Cause**: Date not in YYYY-MM-DD format
- **Solution**: Format dates as 2010-05-15, not 05/15/2010

**Error**: "File too large"
- **Cause**: Excel file > 10MB
- **Solution**: Remove embedded images, split into smaller batches

**Error**: "Duplicate students detected"
- **Cause**: Same student appears twice
- **Solution**: Remove duplicate rows

### Payment Issues

**Online payment not processing**:
- Check internet connection
- Disable browser ad-blockers
- Try different browser
- Ensure card has sufficient balance
- Contact bank if issue persists

**Offline payment verification delayed**:
- Verify you uploaded clear receipt image
- Ensure transaction reference number is correct
- Check if admin has responded (check notifications)
- Contact admin if delayed beyond 48 hours

### Cannot Download Invoice

**Solutions**:
- Check if payment is verified (status should be PAID)
- Try different browser
- Disable pop-up blockers
- Contact admin if issue persists

---

## Contact Support

**For technical support**:
- Email: support@gemaedu.org
- Phone: +91-XXXX-XXXXXX (Business hours: 9 AM - 6 PM IST)

**For event-specific queries**:
- Check event details page for contact email
- Or contact your event coordinator directly

---

## Tips for Best Experience

1. **Register Early**: Take advantage of early bird discounts

2. **Prepare Data in Advance**: Collect all student information before starting upload

3. **Use Online Payment**: Faster verification and instant invoice

4. **Keep Transaction Records**: Save all payment receipts and invoices

5. **Double-Check Data**: Verify all student information before uploading to avoid errors

6. **Use Descriptive Email**: Use institutional email for credibility during approval

7. **Monitor Batch Status**: Regularly check batch status for updates

8. **Download Invoices**: Download and backup all invoices immediately

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Event Lifecycle](./EVENT_LIFECYCLE.md)
- [Admin User Guide](./USER_GUIDE_ADMIN.md)
- [Features Status](./FEATURES_STATUS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
