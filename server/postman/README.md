# GEMA Bulk Registration System - Postman API Collection

Complete API testing collection for the GEMA Events Bulk Registration System with 80+ endpoints organized across 12 modules.

## 📦 Contents

This directory contains:
- `GEMA-BulkRegistration.postman_collection.json` - Main collection with all API endpoints
- `GEMA-Local.postman_environment.json` - Local development environment
- `GEMA-Production.postman_environment.json` - Production environment

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Import `GEMA-BulkRegistration.postman_collection.json`
5. Import both environment files

### 2. Set Up Environment

1. Click the environment dropdown (top right)
2. Select **GEMA Local Environment** for local testing
3. For production, select **GEMA Production Environment**

### 3. Configure Environment Variables

Before testing, update the following variables in your selected environment:

**For Local Environment:**
- `base_url`: http://localhost:5000/api/v1 (default)
- `school_email`: Your test school email
- `school_password`: Your test school password
- `admin_email`: admin@gema.com (or your admin email)
- `admin_password`: Your admin password

**For Production Environment:**
- `base_url`: Your production API URL
- Update all credentials with production values

## 🔑 Authentication Workflow

### School Authentication

1. **Register** (optional): Run `Authentication > School Auth > Register School`
   - Creates new school account
   - Auto-saves `test_school_id` to environment
2. **Login**: Run `Authentication > School Auth > Login School`
   - Auto-saves `school_token` to environment
   - Token used automatically in subsequent requests
3. **Test**: Run `Authentication > School Auth > Get School Profile`
   - Verifies token works

### Admin Authentication

1. **Login**: Run `Authentication > Admin Auth > Login Admin`
   - Auto-saves `admin_token` to environment
   - Token used automatically in admin requests
2. **Test**: Run `Authentication > Admin Auth > Get Admin Profile`
   - Verifies admin token works

## 📋 Testing Order

Follow this sequence for comprehensive testing:

### Phase 1: Setup & Authentication
1. Login as School (save token)
2. Login as Admin (save token)

### Phase 2: Admin Creates Event
1. `Admin - Event Management > Create Event`
   - Auto-saves `test_event_id` and `test_event_slug`

### Phase 3: School Registration Flow
1. `Public Events > Get Event by Slug` - Browse available events
2. `Batch Registration > Download Template` - Get Excel template
3. `Batch Registration > Upload Batch` - Upload students
   - Auto-saves `test_batch_reference`
4. `Batch Registration > Get My Batches` - Verify upload

### Phase 4: Payment Flow
1. `Payments > Initiate Payment` - Start payment
   - Auto-saves `test_payment_id`
2. For online: `Payments > Verify Razorpay Payment` or `Verify Stripe Payment`
3. For offline: `Payments > Submit Offline Payment`
4. `Payments > Get My Payments` - Check payment history

### Phase 5: Invoice Generation
1. `Invoices > Generate Invoice` - Create invoice
2. `Invoices > Get Invoice URL` - Get download link
3. `Invoices > Download Invoice` - Download PDF

### Phase 6: Admin Management
1. `Admin - School Management > List All Schools`
2. `Admin - School Management > Approve School`
3. `Admin - Event Management > Get Event Registrations`
4. `Admin - Payment Management > Get Pending Offline Payments`
5. `Admin - Payment Management > Verify Offline Payment`

## 🔄 Environment Variables

The collection uses the following variables (auto-populated):

| Variable | Purpose | Set By |
|----------|---------|--------|
| `base_url` | API base URL | Manual |
| `school_token` | School JWT token | Login School |
| `admin_token` | Admin JWT token | Login Admin |
| `school_email` | School login email | Manual |
| `school_password` | School password | Manual |
| `admin_email` | Admin login email | Manual |
| `admin_password` | Admin password | Manual |
| `test_event_id` | Event ID for testing | Create Event |
| `test_event_slug` | Event slug for testing | Create Event |
| `test_batch_reference` | Batch reference | Upload Batch |
| `test_payment_id` | Payment ID | Initiate Payment |
| `test_school_id` | School ID | Register/Login |

## 📁 Collection Structure

```
GEMA Bulk Registration System/
├── Authentication (17 endpoints)
│   ├── School Auth (9 endpoints)
│   └── Admin Auth (8 endpoints)
├── Batch Registration (7 endpoints)
├── Payments (6 endpoints)
├── Invoices (6 endpoints)
├── Form Builder (5 endpoints)
├── Public Events (3 endpoints)
├── Admin - Dashboard (3 endpoints)
├── Admin - School Management (9 endpoints)
├── Admin - Event Management (9 endpoints)
├── Admin - Payment Management (5 endpoints)
├── Webhooks (2 endpoints)
└── Utility (1 endpoint)
```

## ✅ Test Scripts

Each request includes automated tests:

### Status Code Tests
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

### Data Validation Tests
```javascript
pm.test("Response has expected data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.exist;
});
```

### Environment Variable Updates
```javascript
pm.test("Token saved", function () {
    var jsonData = pm.response.json();
    pm.environment.set("school_token", jsonData.data.tokens.access_token);
});
```

## 🔧 File Upload Endpoints

Some endpoints require file uploads:

### Batch Registration
- **Validate Excel**: Upload Excel file with students
- **Upload Batch**: Upload validated Excel file

### Offline Payments
- **Submit Offline Payment**: Upload payment receipt

**Note**: For file upload requests:
1. Select the request
2. Go to **Body** tab
3. Click on **Select File** for the file field
4. Choose your file from disk

## 🎯 Common Scenarios

### Scenario 1: School Registers Students

1. Login as School
2. Browse Events (Public Events > List All Events)
3. Download Template for event
4. Upload filled template
5. Initiate payment
6. View registrations

### Scenario 2: Admin Approves School

1. Login as Admin
2. List All Schools
3. Get School Details
4. Approve School

### Scenario 3: Admin Verifies Offline Payment

1. Login as Admin
2. Get Pending Offline Payments
3. Get Payment Details
4. Verify Offline Payment

### Scenario 4: Admin Creates Event

1. Login as Admin
2. Create Event
3. Update Event Schema (Form Builder)
4. Toggle Event Status to active

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error (401)

**Cause**: Token expired or missing

**Solution**:
1. Re-run the login request (School or Admin)
2. Verify token is saved in environment variables
3. Check token is being sent in Authorization header

### Issue: "Not Found" Error (404)

**Cause**: Invalid ID in URL

**Solution**:
1. Verify environment variables are set correctly
2. Run prerequisite requests first (e.g., Create Event before using `test_event_id`)
3. Check the ID exists in your database

### Issue: "Validation Error" (400)

**Cause**: Invalid request body

**Solution**:
1. Check request body matches expected schema
2. Verify required fields are present
3. Check data types (string vs number, etc.)

### Issue: File Upload Fails

**Cause**: Wrong content type or file format

**Solution**:
1. Ensure using `form-data` (not raw JSON)
2. Check file format matches expected (.xlsx for batches, image/pdf for receipts)
3. Verify file field name matches API expectation

### Issue: Environment Variables Not Updating

**Cause**: Tests not running or JavaScript errors

**Solution**:
1. Check **Tests** tab has no JavaScript errors
2. Enable test execution in Postman settings
3. Verify environment is selected (not "No Environment")

## 📝 Notes

### Token Refresh
- Tokens expire after a set period (check backend configuration)
- Use `Refresh Token` endpoints to get new tokens without re-login
- Tests automatically update environment with new tokens

### Webhook Testing
- Webhook endpoints are designed for payment gateway callbacks
- Include proper signature headers when testing
- Signature generation scripts may be needed for real testing

### Pagination
- List endpoints support `page` and `limit` query parameters
- Default: page=1, limit=20
- Adjust in query params as needed

### Filters
- Many endpoints support filters (search, status, date ranges)
- Filters are optional - disabled by default in requests
- Enable/modify in Query Params tab

## 🔐 Security Notes

1. **Never commit credentials** to version control
2. Use **environment variables** for sensitive data
3. **Production environment** should use HTTPS
4. **Rotate tokens** regularly in production
5. **Webhook signatures** must be validated

## 📊 Collection Runner

To run entire collection:

1. Click **Runner** button (top left)
2. Select **GEMA Bulk Registration System**
3. Select environment
4. Optionally set delay between requests (500ms recommended)
5. Optionally save responses
6. Click **Run GEMA Bulk Registration System**

**Note**: Some requests depend on previous requests (e.g., need event ID before creating batch). Runner executes in order, so dependencies are handled automatically.

## 🆘 Support

For issues with:
- **API endpoints**: Check backend server logs
- **Postman collection**: Verify collection version and environment setup
- **Authentication**: Ensure credentials are correct and account exists
- **File uploads**: Check file format and size limits

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/docs/getting-started/introduction/)
- [API Authentication Guide](https://learning.postman.com/docs/sending-requests/authorization/)
- [Environment Variables](https://learning.postman.com/docs/sending-requests/variables/)
- [Test Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)

## 📄 License

Part of the GEMA Bulk Registration System project.

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Total Endpoints**: 80+
