# Bulk Registration & CSV System

**Upload hundreds of students via Excel files**

---

## Overview

Schools can register multiple students simultaneously by uploading Excel files. The system validates data against event-specific form schemas and creates individual registration records.

---

## Workflow

### 1. Download Template
**Endpoint**: `GET /api/v1/batches/template/:eventSlug`

**Template Generation**:
- Dynamic columns based on event's `form_schema`
- Default columns: S.No, Student Name*, Grade*, Section
- Custom columns from event form fields
- Sample row with example data
- Frozen headers for easy scrolling
- Data validation for dropdown fields

**Example Template**:
```
| S.No | Student Name* | Grade* | Section | Parent Email* | T-Shirt Size* | Food Preference |
|------|---------------|--------|---------|---------------|---------------|-----------------|
| Sample | John Doe    | 8      | A       | parent@ex.com | M             | Vegetarian      |
```

### 2. Fill Student Data
Schools fill the Excel offline with student information following column requirements.

### 3. Validate (Optional)
**Endpoint**: `POST /api/v1/batches/validate`

- Pre-upload validation
- Returns errors without creating batch
- Helps schools fix issues before submission

### 4. Upload Batch
**Endpoint**: `POST /api/v1/batches/upload`

**Process**:
1. Parse Excel file (PapaParse)
2. Skip sample row (row 2)
3. Validate each student row
4. Upload file to Cloudinary
5. Create Batch record
6. Create individual Registration records
7. Calculate pricing with discounts
8. Return batch reference

---

## Field Type Validation

### TEXT
- Min/max length
- Pattern matching (regex)
- Required validation

### NUMBER
- Numeric check
- Min/max value
- Integer/decimal support

### EMAIL
- Format validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Required check

### DATE
- Format: `DD/MM/YYYY`
- Date range validation

### SELECT
- Must match `field_options`
- Case-insensitive matching
- Dropdown validation in Excel

### CHECKBOX
- Accepts: `yes`, `no`, `true`, `false`, `1`, `0`
- Normalized to boolean

### TEXTAREA
- Length validation
- Multi-line support

### URL
- Valid URL format
- Protocol validation

---

## Error Reporting

**Validation Errors Include**:
- Row number
- Field name
- Error message
- Expected format

**Example Error Response**:
```json
{
  "row": 5,
  "field": "parent_email",
  "message": "Invalid email format",
  "value": "invalid-email"
}
```

**Error Grouping**:
- By row (all errors for a student)
- By field (common mistakes)
- First 50 errors returned (prevents overwhelming response)

---

## Batch States

| Status | Description | Can Edit | Can Delete |
|--------|-------------|----------|------------|
| `DRAFT` | Created but unpaid | Yes | Yes |
| `PENDING_PAYMENT` | Awaiting payment | No | Yes |
| `PENDING_VERIFICATION` | Offline payment submitted | No | No |
| `SUBMITTED` | Payment processing | No | No |
| `PAID` | Payment confirmed | No | No |
| `FAILED` | Payment failed | No | Yes |
| `CONFIRMED` | Fully confirmed | No | No |

---

## Pricing Calculation

**Formula**:
```
Base Price = base_fee_inr or base_fee_usd
Student Count = number of valid rows
Subtotal = Base Price × Student Count
Bulk Discount = highest applicable discount %
Final Amount = Subtotal - (Subtotal × Bulk Discount %)
```

**Discount Tiers** (example):
- 50+ students: 10% off
- 100+ students: 15% off
- 200+ students: 20% off

---

## CSV Parser Configuration

**Library**: PapaParse
**File Size Limit**: 10 MB
**Max Rows**: 10,000
**Encoding**: UTF-8

**Sample Row Handling**:
```javascript
// Row 2 is sample, skip it
if (rowIndex === 1 && row['S.No'] === 'Sample') {
  continue; // Skip sample row
}
```

---

## API Endpoints

### School Endpoints
```
GET  /api/v1/batches/template/:eventSlug
POST /api/v1/batches/validate
POST /api/v1/batches/upload
GET  /api/v1/batches/school/my-batches
GET  /api/v1/batches/school/statistics
GET  /api/v1/batches/:batchReference
DELETE /api/v1/batches/:batchReference
```

### Admin Endpoints
```
GET  /admin/batches
GET  /admin/batches/:batchId
```

---

## Common Issues & Solutions

### Issue: Column mismatch error
**Cause**: Modified template columns
**Solution**: Re-download template, copy data to new file

### Issue: "Invalid date format"
**Cause**: Wrong date format
**Solution**: Use DD/MM/YYYY (e.g., 15/08/2010)

### Issue: "Required field missing"
**Cause**: Empty cells for required fields
**Solution**: Fill all cells with asterisk (*) in header

### Issue: "File too large"
**Cause**: Excel > 10 MB
**Solution**: Remove images, split into multiple batches

### Issue: Duplicate student names
**Cause**: Same student in batch twice
**Solution**: Excel flags duplicates, remove one entry

---

## Best Practices

### For Schools
1. Download fresh template for each event
2. Don't modify column headers
3. Fill data row by row
4. Use sample row as reference
5. Validate before uploading (optional step)
6. Keep Excel file under 5 MB
7. Review error report carefully

### For Admins
1. Keep form schemas simple (max 10 custom fields)
2. Provide clear field labels
3. Use help text for complex fields
4. Test template before event publication
5. Provide field_options for all SELECT fields

---

## Technical Details

**Files**:
- Parser: `server/src/services/csvParser.service.js`
- Generator: `server/src/services/excelGenerator.service.js`
- Controller: `server/src/controllers/batch/bulkRegistration.controller.js`
- Model: `server/src/models/Batch.js`, `server/src/models/Registration.js`

**Storage**:
- Excel files: `gema/excel/{batchReference}/`
- Provider: Cloudinary or Local

---

**Last Updated**: December 29, 2025
