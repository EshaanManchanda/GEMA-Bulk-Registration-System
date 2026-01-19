# API Documentation

Complete API reference for GEMA Events platform.

**Base URL**: `http://localhost:5000/api/v1` (development)
**Version**: v1
**Authentication**: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [School Portal APIs](#school-portal-apis)
3. [Admin Portal APIs](#admin-portal-apis)
4. [Public APIs](#public-apis)
5. [Webhooks](#webhooks)
6. [Error Responses](#error-responses)

---

## Authentication

### Headers

All authenticated requests require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Token Format

JWT token structure:
```json
{
  "id": "user_id",
  "role": "SCHOOL | ADMIN | SUPER_ADMIN | MODERATOR",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## School Authentication

### Register School

**Endpoint**: `POST /auth/school/register`

**Access**: Public

**Request Body**:
```json
{
  "name": "ABC International School",
  "email": "admin@abcschool.edu",
  "password": "SecurePass123!",
  "contact_person": {
    "name": "John Smith",
    "designation": "Principal",
    "email": "john@abcschool.edu",
    "phone": "+919876543210"
  },
  "address": {
    "street": "123 Education Lane",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "IN"
  },
  "currency": "INR"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "School registered successfully. Please verify your email.",
  "data": {
    "school": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC International School",
      "school_code": "ABC123",
      "email": "admin@abcschool.edu",
      "is_verified": false,
      "is_active": false,
      "currency": "INR"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login School

**Endpoint**: `POST /auth/school/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "admin@abcschool.edu",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "school": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC International School",
      "school_code": "ABC123",
      "email": "admin@abcschool.edu",
      "is_verified": true,
      "is_active": true,
      "currency": "INR"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Verify Email

**Endpoint**: `GET /auth/school/verify-email/:token`

**Access**: Public

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Forgot Password

**Endpoint**: `POST /auth/school/forgot-password`

**Access**: Public

**Request Body**:
```json
{
  "email": "admin@abcschool.edu"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### Reset Password

**Endpoint**: `POST /auth/school/reset-password/:token`

**Access**: Public

**Request Body**:
```json
{
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## School Portal APIs

### Events

#### Get All Active Events

**Endpoint**: `GET /events`

**Access**: Public / School (optional auth)

**Query Parameters**:
```
?category=Academic Competition
&search=science
&page=1
&limit=10
&sort=-created_at
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Annual Science Fair 2024",
        "slug": "annual-science-fair-2024",
        "description": "A premier science competition...",
        "category": "Academic Competition",
        "status": "ACTIVE",
        "start_date": "2024-03-15",
        "end_date": "2024-03-17",
        "registration_deadline": "2024-02-28",
        "venue": "Mumbai Convention Center",
        "banner_image": "http://localhost:5000/api/v1/media/serve/...",
        "base_price": 500,
        "currency": "INR",
        "discount_rules": {
          "early_bird": [{...}],
          "bulk": [{...}],
          "promo_codes": [{...}]
        },
        "max_participants": 1000,
        "current_registrations": 450
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "pages": 3,
      "limit": 10
    }
  }
}
```

#### Get Event Details

**Endpoint**: `GET /events/:slug`

**Access**: Public / School

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Annual Science Fair 2024",
      "slug": "annual-science-fair-2024",
      "description": "Full description...",
      "form_schema": {
        "fields": [
          {
            "field_name": "student_name",
            "label": "Student Name",
            "type": "text",
            "is_required": true
          },
          {
            "field_name": "tshirt_size",
            "label": "T-Shirt Size",
            "type": "select",
            "options": ["XS", "S", "M", "L", "XL"],
            "is_required": true
          }
        ]
      },
      "pricing": {...},
      "discount_rules": {...},
      "terms_and_conditions": "..."
    }
  }
}
```

### Batches

#### Download Excel Template

**Endpoint**: `GET /school/batches/template/:slug`

**Access**: School (authenticated)

**Headers**:
```
Authorization: Bearer <TOKEN>
```

**Success Response** (200):
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with event-specific template

#### Upload Batch

**Endpoint**: `POST /school/batches/upload`

**Access**: School (authenticated)

**Content-Type**: `multipart/form-data`

**Form Data**:
```
event_id: 507f1f77bcf86cd799439012
file: [Excel file]
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Batch uploaded and validated successfully",
  "data": {
    "batch": {
      "_id": "507f1f77bcf86cd799439013",
      "batch_reference": "BAT-2024-001234",
      "event_id": "507f1f77bcf86cd799439012",
      "school_id": "507f1f77bcf86cd799439011",
      "students": [
        {
          "student_name": "John Doe",
          "dob": "2010-05-15",
          "gender": "Male",
          "grade": 8,
          "tshirt_size": "M"
        }
      ],
      "total_students": 75,
      "total_amount": 28687.50,
      "status": "PENDING_PAYMENT",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Validation Error Response** (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "row": 12,
      "field": "parent_email",
      "message": "Invalid email format"
    },
    {
      "row": 18,
      "field": "tshirt_size",
      "message": "Missing required field"
    }
  ]
}
```

#### Get My Batches

**Endpoint**: `GET /school/batches`

**Access**: School (authenticated)

**Query Parameters**:
```
?status=PAID
&event_id=507f1f77bcf86cd799439012
&page=1
&limit=10
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "batch_reference": "BAT-2024-001234",
        "event": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Annual Science Fair 2024"
        },
        "total_students": 75,
        "total_amount": 28687.50,
        "status": "PAID",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

#### Get Batch Details

**Endpoint**: `GET /school/batches/:batchReference`

**Access**: School (authenticated, own batches only)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "batch": {
      "_id": "507f1f77bcf86cd799439013",
      "batch_reference": "BAT-2024-001234",
      "event": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Annual Science Fair 2024",
        "slug": "annual-science-fair-2024"
      },
      "school": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "ABC International School"
      },
      "students": [...],
      "total_students": 75,
      "total_amount": 28687.50,
      "discount_applied": {
        "early_bird": 5625,
        "bulk": 3187.50
      },
      "status": "PAID",
      "payment_details": {
        "payment_id": "507f1f77bcf86cd799439014",
        "method": "ONLINE",
        "transaction_id": "pay_ABC123XYZ"
      },
      "invoice_url": "http://localhost:5000/uploads/invoices/...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Payments

#### Create Payment Order (Online)

**Endpoint**: `POST /school/payments/create-order`

**Access**: School (authenticated)

**Request Body**:
```json
{
  "batch_id": "507f1f77bcf86cd799439013",
  "payment_method": "ONLINE",
  "gateway": "RAZORPAY"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_ABC123XYZ",
      "amount": 2868750,
      "currency": "INR",
      "receipt": "BAT-2024-001234"
    },
    "key": "rzp_test_xxxxxx",
    "payment_id": "507f1f77bcf86cd799439014"
  }
}
```

#### Submit Offline Payment

**Endpoint**: `POST /school/payments/offline`

**Access**: School (authenticated)

**Content-Type**: `multipart/form-data`

**Form Data**:
```
batch_id: 507f1f77bcf86cd799439013
transaction_reference: TXN123456789
transaction_date: 2024-01-15
receipt: [PDF/Image file]
notes: (optional)
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Payment submitted for verification",
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439014",
      "batch_id": "507f1f77bcf86cd799439013",
      "amount": 28687.50,
      "method": "OFFLINE",
      "status": "PENDING_VERIFICATION",
      "transaction_reference": "TXN123456789",
      "receipt_url": "http://localhost:5000/uploads/receipts/...",
      "submitted_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

#### Get Payment History

**Endpoint**: `GET /school/payments`

**Access**: School (authenticated)

**Query Parameters**:
```
?status=VERIFIED
&method=ONLINE
&page=1
&limit=10
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "batch": {
          "batch_reference": "BAT-2024-001234",
          "total_students": 75
        },
        "event": {
          "title": "Annual Science Fair 2024"
        },
        "amount": 28687.50,
        "method": "ONLINE",
        "status": "VERIFIED",
        "transaction_id": "pay_ABC123XYZ",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

#### Get Payment Details

**Endpoint**: `GET /school/payments/:paymentId`

**Access**: School (authenticated, own payments only)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439014",
      "batch_id": "507f1f77bcf86cd799439013",
      "amount": 28687.50,
      "currency": "INR",
      "method": "ONLINE",
      "gateway": "RAZORPAY",
      "status": "VERIFIED",
      "transaction_id": "pay_ABC123XYZ",
      "gateway_order_id": "order_ABC123XYZ",
      "verified_at": "2024-01-15T11:05:00Z",
      "invoice_url": "http://localhost:5000/uploads/invoices/..."
    }
  }
}
```

### Invoices

#### Get All Invoices

**Endpoint**: `GET /school/invoices`

**Access**: School (authenticated)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "invoice_number": "INV-2024-001234",
        "batch_reference": "BAT-2024-001234",
        "event": {
          "title": "Annual Science Fair 2024"
        },
        "total_students": 75,
        "total_amount": 28687.50,
        "issue_date": "2024-01-15",
        "invoice_url": "http://localhost:5000/uploads/invoices/INV-2024-001234.pdf"
      }
    ]
  }
}
```

### Profile

#### Get Profile

**Endpoint**: `GET /school/profile`

**Access**: School (authenticated)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "school": {
      "_id": "507f1f77bcf86cd799439011",
      "school_code": "ABC123",
      "name": "ABC International School",
      "email": "admin@abcschool.edu",
      "contact_person": {...},
      "address": {...},
      "currency": "INR",
      "is_verified": true,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Update Profile

**Endpoint**: `PUT /school/profile`

**Access**: School (authenticated)

**Request Body**:
```json
{
  "name": "ABC International School (Updated)",
  "contact_person": {
    "name": "Jane Smith",
    "designation": "Vice Principal",
    "email": "jane@abcschool.edu",
    "phone": "+919876543211"
  },
  "address": {...}
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "school": {...}
  }
}
```

#### Change Password

**Endpoint**: `PUT /school/profile/change-password`

**Access**: School (authenticated)

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Admin Portal APIs

### Admin Authentication

#### Admin Login

**Endpoint**: `POST /admin/auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "admin@gemaedu.org",
  "password": "AdminPass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Super Admin",
      "email": "admin@gemaedu.org",
      "role": "SUPER_ADMIN",
      "permissions": {
        "can_manage_events": true,
        "can_verify_payments": true,
        "can_manage_schools": true,
        "can_view_analytics": true,
        "can_manage_admins": true,
        "can_manage_settings": true
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Events Management

#### Get All Events (Admin)

**Endpoint**: `GET /admin/events`

**Access**: Admin (authenticated)

**Query Parameters**:
```
?status=ACTIVE
&category=Academic Competition
&page=1
&limit=10
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": {...}
  }
}
```

#### Create Event

**Endpoint**: `POST /admin/events`

**Access**: Admin (requires `can_manage_events` permission)

**Request Body**:
```json
{
  "title": "Annual Science Fair 2024",
  "slug": "annual-science-fair-2024",
  "description": "Full event description...",
  "category": "Academic Competition",
  "status": "DRAFT",
  "start_date": "2024-03-15",
  "end_date": "2024-03-17",
  "registration_deadline": "2024-02-28",
  "venue": "Mumbai Convention Center",
  "max_participants": 1000,
  "banner_image": "media_id_here",
  "form_schema": {
    "fields": [...]
  },
  "base_price": 500,
  "currency": "INR",
  "discount_rules": {
    "early_bird": [...],
    "bulk": [...],
    "promo_codes": [...]
  },
  "terms_and_conditions": "...",
  "confirmation_message": "..."
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {...}
  }
}
```

#### Update Event

**Endpoint**: `PUT /admin/events/:eventId`

**Access**: Admin (requires `can_manage_events`)

**Request Body**: Same as create event

**Success Response** (200):
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {...}
  }
}
```

#### Delete Event

**Endpoint**: `DELETE /admin/events/:eventId`

**Access**: Admin (requires `can_manage_events`)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

#### Get Event Analytics

**Endpoint**: `GET /admin/events/:eventId/analytics`

**Access**: Admin (requires `can_view_analytics`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "analytics": {
      "total_registrations": 450,
      "total_students": 12500,
      "total_revenue": 5625000,
      "pending_payments": 15,
      "schools_participated": 75,
      "payment_breakdown": {
        "online": 10500000,
        "offline": 625000
      },
      "registration_timeline": [...]
    }
  }
}
```

### Schools Management

#### Get All Schools

**Endpoint**: `GET /admin/schools`

**Access**: Admin (requires `can_manage_schools`)

**Query Parameters**:
```
?status=ACTIVE
&currency=INR
&search=abc
&page=1
&limit=10
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "schools": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "school_code": "ABC123",
        "name": "ABC International School",
        "email": "admin@abcschool.edu",
        "contact_person": {...},
        "is_active": true,
        "is_verified": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

#### Get School Details

**Endpoint**: `GET /admin/schools/:schoolId`

**Access**: Admin (requires `can_manage_schools`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "school": {
      "_id": "507f1f77bcf86cd799439011",
      "school_code": "ABC123",
      "name": "ABC International School",
      "email": "admin@abcschool.edu",
      "contact_person": {...},
      "address": {...},
      "currency": "INR",
      "is_verified": true,
      "is_active": true,
      "total_batches": 12,
      "total_students_registered": 850,
      "total_amount_paid": 425000,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Update School

**Endpoint**: `PUT /admin/schools/:schoolId`

**Access**: Admin (requires `can_manage_schools`)

**Request Body**:
```json
{
  "name": "ABC International School (Updated)",
  "contact_person": {...},
  "address": {...},
  "admin_notes": "Internal notes here"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "School updated successfully",
  "data": {
    "school": {...}
  }
}
```

#### Approve School

**Endpoint**: `POST /admin/schools/:schoolId/approve`

**Access**: Admin (requires `can_manage_schools`)

**Success Response** (200):
```json
{
  "success": true,
  "message": "School approved successfully"
}
```

#### Suspend School

**Endpoint**: `POST /admin/schools/:schoolId/suspend`

**Access**: Admin (requires `can_manage_schools`)

**Success Response** (200):
```json
{
  "success": true,
  "message": "School suspended successfully"
}
```

#### Reactivate School

**Endpoint**: `POST /admin/schools/:schoolId/reactivate`

**Access**: Admin (requires `can_manage_schools`)

**Success Response** (200):
```json
{
  "success": true,
  "message": "School reactivated successfully"
}
```

### Payments Management

#### Get All Payments

**Endpoint**: `GET /admin/payments`

**Access**: Admin (requires `can_verify_payments`)

**Query Parameters**:
```
?status=VERIFIED
&method=OFFLINE
&event_id=507f1f77bcf86cd799439012
&school_id=507f1f77bcf86cd799439011
&page=1
&limit=10
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {...}
  }
}
```

#### Get Pending Verifications

**Endpoint**: `GET /admin/payments/pending`

**Access**: Admin (requires `can_verify_payments`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "school": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "ABC International School"
        },
        "event": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Annual Science Fair 2024"
        },
        "batch_reference": "BAT-2024-001234",
        "amount": 28687.50,
        "method": "OFFLINE",
        "status": "PENDING_VERIFICATION",
        "transaction_reference": "TXN123456789",
        "receipt_url": "http://localhost:5000/uploads/receipts/...",
        "submitted_at": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

#### Verify Payment (Approve)

**Endpoint**: `POST /admin/payments/:paymentId/verify`

**Access**: Admin (requires `can_verify_payments`)

**Request Body**:
```json
{
  "admin_notes": "Verified with bank statement. Transaction ID matches."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439014",
      "status": "VERIFIED",
      "verified_at": "2024-01-15T15:00:00Z",
      "verified_by": "507f1f77bcf86cd799439020",
      "admin_notes": "Verified with bank statement..."
    }
  }
}
```

#### Reject Payment

**Endpoint**: `POST /admin/payments/:paymentId/reject`

**Access**: Admin (requires `can_verify_payments`)

**Request Body**:
```json
{
  "rejection_reason": "Amount mismatch. Expected ₹28,687.50 but transaction shows ₹28,000.00",
  "admin_notes": "Internal notes..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Payment rejected",
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439014",
      "status": "REJECTED",
      "rejection_reason": "Amount mismatch...",
      "rejected_at": "2024-01-15T15:00:00Z",
      "rejected_by": "507f1f77bcf86cd799439020"
    }
  }
}
```

### Media Library

#### Upload Media

**Endpoint**: `POST /admin/media/upload`

**Access**: Admin (authenticated)

**Content-Type**: `multipart/form-data`

**Form Data**:
```
files: [Image files] (up to 10 files)
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "data": {
    "media": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "filename": "event-banner-1.jpg",
        "file_url": "http://localhost:5000/api/v1/media/serve/507f1f77bcf86cd799439030",
        "mime_type": "image/jpeg",
        "file_size": 245678,
        "storage_provider": "cloudinary",
        "uploaded_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

#### Get All Media

**Endpoint**: `GET /admin/media`

**Access**: Admin (authenticated)

**Query Parameters**:
```
?search=banner
&type=image/jpeg
&storage=cloudinary
&page=1
&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "media": [...],
    "pagination": {...}
  }
}
```

#### Delete Media

**Endpoint**: `DELETE /admin/media/:mediaId`

**Access**: Admin (authenticated)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

### Analytics

#### Get Global Analytics

**Endpoint**: `GET /admin/analytics`

**Access**: Admin (requires `can_view_analytics`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "analytics": {
      "total_events": 25,
      "total_schools": 150,
      "total_students": 45000,
      "total_revenue": 22500000,
      "revenue_by_event": [...],
      "revenue_by_month": [...],
      "payment_method_breakdown": {...},
      "top_schools": [...],
      "top_events": [...]
    }
  }
}
```

---

## Public APIs

### Serve Media

**Endpoint**: `GET /media/serve/:id`

**Access**: Public (no authentication)

**Success Response** (200):
- Content-Type: `image/jpeg | image/png | image/gif | image/webp`
- Binary image data (streaming)

**Or** (for Cloudinary):
- 301 Redirect to Cloudinary URL

---

## Webhooks

### Razorpay Webhook

**Endpoint**: `POST /webhooks/razorpay`

**Access**: Razorpay servers only (signature verified)

**Headers**:
```
X-Razorpay-Signature: [Signature]
```

**Request Body**:
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_ABC123XYZ",
        "order_id": "order_ABC123XYZ",
        "amount": 2868750,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

### Stripe Webhook

**Endpoint**: `POST /webhooks/stripe`

**Access**: Stripe servers only (signature verified)

**Headers**:
```
Stripe-Signature: [Signature]
```

**Request Body**:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_ABC123XYZ",
      "payment_intent": "pi_ABC123XYZ",
      "amount_total": 28687,
      "currency": "usd",
      "payment_status": "paid"
    }
  }
}
```

**Success Response** (200):
```json
{
  "received": true
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information (dev mode only)",
  "stack": "Stack trace (dev mode only)"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email, slug, etc.) |
| 422 | Unprocessable Entity | Business logic error |
| 500 | Internal Server Error | Server-side error |

### Example Error Responses

**400 - Validation Error**:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**401 - Unauthorized**:
```json
{
  "success": false,
  "message": "Invalid token. Please login again."
}
```

**403 - Forbidden**:
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

**404 - Not Found**:
```json
{
  "success": false,
  "message": "Event not found"
}
```

**409 - Conflict**:
```json
{
  "success": false,
  "message": "School with this email already exists"
}
```

**500 - Internal Server Error**:
```json
{
  "success": false,
  "message": "Something went wrong. Please try again later.",
  "error": "Detailed error (dev mode only)"
}
```

---

## Rate Limiting

**Global Rate Limit**: 100 requests per 15 minutes per IP

**Response when rate limit exceeded** (429):
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Pagination

All list endpoints support pagination with these query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field with direction (e.g., `-created_at` for descending)

**Pagination Response Format**:
```json
{
  "pagination": {
    "total": 250,
    "page": 1,
    "pages": 25,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Event Lifecycle](./EVENT_LIFECYCLE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Features Status](./FEATURES_STATUS.md)
