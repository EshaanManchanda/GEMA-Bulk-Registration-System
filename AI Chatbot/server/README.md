# GEMA AI Chatbot - Server API Documentation

## 🔧 API Endpoints

### Authentication

#### `POST /api/auth/login`
Authenticate user and get JWT token

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d0d55b54764421b6b7331",
    "username": "admin",
    "role": "admin"
  }
}
```

---

### Chat

#### `POST /api/chat/message`
Send chat message and get response

**Request:**
```json
{
  "message": "How can I get my certificate?",
  "sessionId": "abc123",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "message": "To generate your certificate, I need your email address...",
  "suggestions": ["My email is example@email.com"]
}
```

---

### Websites

#### `GET /api/websites`
Get all websites with pagination

**Request:**
```
/api/websites?page=1&limit=10&search=olympiad
```

**Response:**
```json
{
  "websites": [
    {
      "id": "5f8d0d55b54764421b6b7331",
      "name": "Scratch Olympiad",
      "link": "https://scratcholympiads.com"
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 25
}
```

---

### Certificates

#### `POST /api/certificate/generate`
Generate certificate for user

**Request:**
```json
{
  "websiteId": "5f8d0d55b54764421b6b7331",
  "studentEmail": "student@example.com"
}
```

**Response:**
```json
{
  "message": "Certificate generated successfully",
  "downloadUrl": "https://scratcholympiads.com/certificates/abc123.pdf"
}
```

---

### Dashboard

#### `GET /api/dashboard/stats`
Get dashboard statistics

**Response:**
```json
{
  "overview": {
    "totalWebsites": 25,
    "activeWebsites": 20,
    "totalChats": 1500,
    "certificatesGenerated": 1200
  },
  "activity": {
    "recentChats": [
      {
        "sessionId": "abc123",
        "messageCount": 5
      }
    ]
  }
}
```

## 🔐 Authentication
All endpoints except `/api/auth/login` require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## ⚙️ Environment Variables
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gema-chatbot
JWT_SECRET=your-secret-key
```