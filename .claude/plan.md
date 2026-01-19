# Implementation Plan: Populate Data in School & Admin Pages

## Certificate API Integration Status ✅

### Overview
Certificate generation functionality is **LIVE** on both websites. The API can fetch/generate certificates for students using their registered email addresses.

### API Endpoints & Configuration

#### India Region (scratcholympiads.in)
- **Certificate Issuance**: `https://scratcholympiads.in/wp-json/certificate-generator/v1/issue-certificate`
- **Health Check**: `https://scratcholympiads.in/wp-json/certificate-generator/v1/health`
- **Key Validation**: `https://scratcholympiads.in/wp-json/certificate-generator/v1/validate-key`
- **API Key**: `61dd736411ce62c661ff8d46e9662b113b1b1258b0334aaca45e0138e25a1ee9`

#### International Region (scratcholympiads.com)
- **Certificate Issuance**: `https://scratcholympiads.com/wp-json/certificate-generator/v1/issue-certificate`
- **Health Check**: `https://scratcholympiads.com/wp-json/certificate-generator/v1/health`
- **Key Validation**: `https://scratcholympiads.com/wp-json/certificate-generator/v1/validate-key`
- **API Key**: `6dd423c7a11e4983280d511a3f59004035fc52292655cb1bfd7695e8ea867907`

### API Authentication & Usage

**Authentication**: Bearer Token (use API key from configuration)

**Request Example**:
```http
POST /wp-json/certificate-generator/v1/issue-certificate
Authorization: Bearer 61dd736411ce62c661ff8d46e9662b113b1b1258b0334aaca45e0138e25a1ee9
Content-Type: application/json

{
  "student_email": "shemihanshemi@gmail.com"
}
```

**Response Example**:
```json
{
  "status": "success",
  "message": "Certificate generated successfully.",
  "download_url": "http://scratcholympiads.in/wp-content/uploads/2026/01/certificate_3663.pdf"
}
```

### Event Model Integration

The Event model (`server/src/models/Event.js`) already includes certificate configuration fields:
- `certificate_config_india` - Configuration for Indian students
- `certificate_config_international` - Configuration for international students

Each configuration includes:
- `enabled` (Boolean) - Enable/disable certificate generation
- `website_url` - Base website URL
- `certificate_issuance_url` - Certificate generation endpoint
- `health_check_url` - Health check endpoint
- `key_validation_url` - API key validation endpoint
- `api_key` - Bearer token for authentication
- `template_id` - Certificate template identifier
- `auto_generate` - Auto-generate certificates on result upload

### Integration Points

1. **Results Upload Flow** (`ResultUpload.jsx`):
   - When results are uploaded, certificates can be auto-generated
   - Uses student email from registration data
   - Calls appropriate certificate API based on student country

2. **Certificate Service** (`server/src/services/certificate.service.js`):
   - Already implemented to handle certificate generation
   - Selects correct region configuration (India/International)
   - Manages API calls with proper authentication

3. **Admin UI** (`EditEvent.jsx`):
   - Certificate configuration included in event form default values
   - Admins can update API keys and endpoints per event

### Next Steps for Certificate Feature

1. **UI Enhancement**: Add certificate configuration section to `CreateEvent.jsx` form
2. **Testing**: Verify certificate generation with live API endpoints
3. **Error Handling**: Implement retry logic for failed certificate generation
4. **Bulk Generation**: Add batch certificate generation for all students with results

---

## Analysis Summary

### Current State
- **Frontend pages exist and are well-structured:**
  - School: Dashboard (client/src/pages/school/dashboard/Dashboard.jsx)
  - School: MyBatches (client/src/pages/school/batches/MyBatches.jsx)
  - Admin: Dashboard (client/src/pages/admin/dashboard/Dashboard.jsx)
  - Admin: SchoolsList (client/src/pages/admin/schools/SchoolsList.jsx)
  - Admin: EventsList (client/src/pages/admin/events/EventsList.jsx)

- **Data fetching layer is complete:**
  - React Query hooks configured (useMyBatches, useSchoolStatistics, useDashboardStats, useSchools, useAdminEvents)
  - API endpoints defined in endpoints.js
  - Backend routes exist for all entities

- **JSON data files provided:**
  - gema.batches.json (5 batches, all draft status, pending payment)
  - gema.events.json (1 event: "International Scratch Olympiad")
  - gema.registrations.json (3 registrations linked to batches)

### The Problem
Data exists in JSON files but not loaded into MongoDB. Pages show empty states because database is empty or not connected properly.

## Implementation Steps

### 1. Verify Database Connection & Configuration
**Goal:** Ensure MongoDB is running and server can connect

**Actions:**
- Check server/.env for correct MongoDB connection string
- Verify MONGODB_URI points to correct database
- Test connection by starting server (npm start in server/)
- Check server logs for connection success/errors

**Files to check:**
- server/.env
- server/src/config/database.js (or similar)
- server/src/index.js or server.js

---

### 2. Import JSON Data into MongoDB
**Goal:** Load the 3 JSON files into MongoDB collections

**Options:**
a) **MongoDB Import Tool (mongoimport):**
   ```bash
   mongoimport --uri="mongodb://..." --collection=batches --file=gema.batches.json --jsonArray
   mongoimport --uri="mongodb://..." --collection=events --file=gema.events.json --jsonArray
   mongoimport --uri="mongodb://..." --collection=registrations --file=gema.registrations.json --jsonArray
   ```

b) **Migration Script (create server/scripts/seedData.js):**
   - Read JSON files
   - Connect to MongoDB
   - Insert into respective collections (Batch, Event, Registration models)
   - Handle ObjectId conversions ($oid format)

**Recommended:** Option B (migration script) for proper ObjectId handling and validation

**Files to create/modify:**
- server/scripts/seedData.js (new)
- package.json (add seed script command)

---

### 3. Verify Data Relationships
**Goal:** Ensure foreign key references are valid

**Actions:**
- Verify school_id (693a65dddec098685935605d) exists in schools collection
- Verify event_id (693a833e62b93a0f954df883) matches event in events collection
- Verify batch_id references in registrations match actual batches
- Check registration_ids arrays in batches match actual registration docs

**Potential issues:**
- School with ID 693a65dddec098685935605d may not exist → create or use existing school
- ObjectId format conversion from JSON ($oid wrapper)

---

### 4. Test Backend API Endpoints
**Goal:** Verify APIs return data correctly

**Actions:**
- Test GET /api/v1/batches/school/my-batches (requires auth token)
- Test GET /api/v1/batches/school/statistics
- Test GET /api/v1/admin/dashboard/stats
- Test GET /api/v1/admin/schools
- Test GET /api/v1/admin/events
- Test GET /api/v1/events (public)

**Auth requirement:**
- School endpoints need valid school JWT token
- Admin endpoints need valid admin JWT token
- May need to create test accounts or use existing credentials

**Files to check:**
- server/src/routes/*.js (verify routes match frontend expectations)
- server/src/controllers/*.js (verify response format)

---

### 5. Verify Frontend Data Rendering
**Goal:** Ensure pages display data without errors

**Actions:**
- Login as school user → check Dashboard shows stats
- Navigate to /school/batches → verify batch list renders
- Check batch references are clickable links
- Login as admin → check Dashboard shows stats
- Navigate to /admin/schools → verify schools list
- Navigate to /admin/events → verify events list with banner images

**Expected data transformations:**
- Event: event.name ← event.title, event.slug ← event.event_slug
- Batch: num_students ← student_count or total_students
- Dates formatted via formatDate() helper
- Currency formatted via formatCurrency() helper

**Files to verify:**
- client/src/hooks/useEvents.js (event transform function)
- client/src/utils/helpers.js (formatDate, formatCurrency)

---

### 6. Handle Edge Cases & Data Issues
**Goal:** Fix any data inconsistencies

**Potential issues:**
- **Empty registration_ids arrays:** Batches 1-3 have empty arrays but show total_students=1
- **Missing event population:** Batches reference event but may not populate event.name
- **Status badge rendering:** Draft status needs proper BADGE_CLASSES mapping
- **Banner images:** Event has localhost URL (http://localhost:5000/api/v1/media/serve/...)
  - May need to update or handle missing images

**Actions:**
- Update batches with missing registration_ids linkage
- Verify populate('event') works in backend queries
- Add fallback for missing banner images (already exists in EventsList.jsx)
- Verify BADGE_CLASSES in client/src/utils/constants.js includes all status values

---

### 7. Create Test School & Admin Accounts (if needed)
**Goal:** Ensure login credentials for testing

**Actions:**
- Check if school with ID 693a65dddec098685935605d exists
- If not, create school account via API or direct DB insert
- Verify admin account exists for testing admin pages
- Document credentials for testing

**Files to check:**
- server/src/models/School.js
- server/src/models/Admin.js

---

## Technical Details

### Data Schema Mapping
```javascript
// Batch Collection
{
  batch_reference: String (unique)
  school_id: ObjectId → schools collection
  event_id: ObjectId → events collection
  registration_ids: [ObjectId] → registrations collection
  total_students: Number
  status: 'draft' | 'processing' | 'completed' | 'failed'
  payment_status: 'pending' | 'completed' | 'failed' | 'pending_verification'
  total_amount: Number
  currency: 'INR' | 'USD'
}

// Event Collection
{
  title: String → transformed to 'name' in frontend
  event_slug: String → transformed to 'slug' in frontend
  event_start_date: Date → transformed to 'event_date' in frontend
  status: 'active' | 'draft' | 'closed' | 'archived'
  base_fee_inr: Number
  base_fee_usd: Number
}

// Registration Collection
{
  registration_id: String (unique)
  batch_id: ObjectId → batches collection
  event_id: ObjectId → events collection
  school_id: ObjectId → schools collection
  student_name: String
  grade: String
  section: String
  status: 'registered' | 'verified' | 'disqualified'
}
```

### API Endpoints to Test
**School (requires school JWT):**
- GET /api/v1/batches/school/my-batches?page=1&limit=10
- GET /api/v1/batches/school/statistics
- GET /api/v1/batches/:batchReference

**Admin (requires admin JWT):**
- GET /api/v1/admin/dashboard/stats
- GET /api/v1/admin/dashboard/activities?limit=10
- GET /api/v1/admin/schools?page=1&limit=10
- GET /api/v1/admin/events?page=1&limit=12

**Public:**
- GET /api/v1/events
- GET /api/v1/events/slug/:eventSlug

---

## Unresolved Questions

1. **Does school with ID `693a65dddec098685935605d` exist in database?**
   - If not, should we create it or use a different school ID?
   - Need school email and credentials for testing

2. **Should empty `registration_ids` arrays be populated?**
   - Batches 1-3 have `registration_ids: []` but `total_students: 1`
   - Batch 4 has 1 registration, Batch 5 has 2 registrations
   - Need to link existing registrations to correct batches?

3. **Banner image URL uses localhost - is media server running?**
   - Event has `banner_image_url: "http://localhost:5000/api/v1/media/serve/6950fbdedbff4305205d3ce8"`
   - Is this media file in database/storage?
   - Should we update to production URL or add placeholder?

4. **Should we update batch statuses beyond 'draft'?**
   - All batches currently 'draft' with 'pending' payment_status
   - Should some be marked 'completed' with 'completed' payment_status for testing?

5. **Are there existing test credentials or should we create new ones?**
   - School login for testing school pages
   - Admin login for testing admin pages
