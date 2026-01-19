# AI Chatbot Integration Setup Guide

## Overview

The AI-powered chatbot has been successfully integrated into the bulk registration system. It uses HuggingFace models for intent classification and provides intelligent responses about events, certificates, payments, and more.

## Features

- **AI-Powered Intent Detection**: Automatically understands user queries
- **Event Information**: Answer questions about event dates, registration, pricing
- **Certificate Generation**: Generate certificates with India/International support
- **Payment & Registration Help**: Guide users through payment and registration
- **Multi-User Support**: Works for anonymous users, schools, and admins
- **Admin Analytics**: Track chatbot usage, intents, and certificate requests

## Backend Setup

### 1. Dependencies

Already installed:
```bash
cd server
npm install  # @huggingface/inference is included
```

### 2. Environment Configuration

Update your `.env` file:

```bash
# HuggingFace AI Chatbot Configuration
HF_TOKEN=your-huggingface-token-here
INTENT_CLASSIFICATION_MODEL=Falconsai/intent_classification
QA_MODEL=deepset/roberta-base-squad2
CONVERSATIONAL_MODEL=microsoft/DialoGPT-medium
CHAT_SESSION_TIMEOUT=7200000
```

### 3. Get HuggingFace Token

1. Visit https://huggingface.co/settings/tokens
2. Create a new token (Read access is sufficient)
3. Copy token to `.env` file

### 4. Database Schema

The Chat model is automatically registered. No migration needed - MongoDB will create the collection on first use.

**Chat Schema:**
- `session_id` - Unique session identifier
- `user_id` - Linked to School or Admin (optional)
- `user_type` - 'School', 'Admin', or 'anonymous'
- `messages` - Array of messages with sender, text, data
- `event_context` - Current event being discussed
- `is_active` - Session active status
- `last_activity` - Timestamp of last message

### 5. Start Server

```bash
cd server
npm run dev
```

## Frontend Setup

### 1. Dependencies

No new dependencies needed - uses existing packages (Zustand, axios, lucide-react, date-fns).

### 2. Environment Configuration

Update `client/.env`:

```bash
VITE_API_URL=http://localhost:5000
```

### 3. Start Client

```bash
cd client
npm run dev
```

## API Endpoints

### Public Endpoints (Optional Auth)

**POST `/api/v1/chatbot/message`**
Send a chat message and get AI response.

Request:
```json
{
  "message": "When is the Scratch Olympiad?",
  "sessionId": "session_123456"
}
```

Response:
```json
{
  "message": "The Scratch Olympiad is on...",
  "data": {
    "type": "event_date",
    "event": { ... }
  },
  "suggestions": [
    "How to register?",
    "What is the fee?"
  ]
}
```

**POST `/api/v1/chatbot/detect-intent`** (Testing only)
Test intent detection without saving.

### Authenticated Endpoints

**GET `/api/v1/chatbot/history/:sessionId`**
Retrieve chat history for a session.

### Admin Endpoints

**GET `/api/v1/chatbot/stats`**
Get chatbot analytics.

Response:
```json
{
  "total_chats": 150,
  "active_chats": 45,
  "total_messages": 823,
  "total_certificates": 67,
  "intent_distribution": [
    { "intent": "certificate", "count": 120 },
    { "intent": "exam_date", "count": 95 }
  ]
}
```

## Supported Intents

### 1. Greeting
**Examples:**
- "Hello"
- "Hi there"
- "Help"

**Response:** Welcome message with suggestions

### 2. Certificate
**Examples:**
- "Generate my certificate"
- "Download certificate for my.email@school.com"
- "Certificate for Scratch Olympiad"

**Behavior:**
- Extracts email from message
- Asks for event if not specified
- Uses School.country to determine India vs International certificate
- Calls Event.certificate_config_india or certificate_config_international

### 3. Exam Date / Event Info
**Examples:**
- "When is the exam?"
- "Exam date for Painting Olympics"
- "Tell me about Scratch Olympiad"

**Response:** Event dates, description, grade levels

### 4. Payment / Registration
**Examples:**
- "How to register?"
- "What is the fee?"
- "Payment for Math Olympiad"

**Response:** Fee info, registration deadline, payment instructions

### 5. General
**Examples:**
- "What events do you have?"
- Random questions

**Response:** Conversational AI response with suggestions

## Usage

### For Schools

1. Login to school portal
2. Click floating chat button (bottom-right)
3. Ask questions about events, certificates, payments
4. Click suggestions for quick queries
5. Download certificates directly from chat

### For Admins

1. Login to admin portal
2. Access chatbot analytics: `/admin/chatbot/analytics`
3. View stats: total chats, messages, certificates
4. Monitor intent distribution
5. Use chat for quick event lookups

### For Public Users

1. Visit public event pages
2. Chat button appears automatically
3. Limited features (no certificate generation without email)
4. Can ask about events, dates, general info

## Customization

### Adding New Intents

1. **Update HuggingFace Service:**
```javascript
// server/src/services/chatbot/huggingface.service.js

// Add rule-based detection
if (lowerMessage.includes('new_intent_keyword')) {
  intent = 'new_intent';
}
```

2. **Handle in Controller:**
```javascript
// server/src/controllers/chatbot/chat.controller.js

case 'new_intent':
  // Your logic here
  response.message = 'Response for new intent';
  response.suggestions = ['Suggestion 1', 'Suggestion 2'];
  break;
```

### Changing AI Models

Update `.env`:
```bash
# Use different models
INTENT_CLASSIFICATION_MODEL=your-custom-model
CONVERSATIONAL_MODEL=facebook/blenderbot-400M-distill
```

See HuggingFace model hub: https://huggingface.co/models

### Customizing UI

Edit components:
- `client/src/components/chatbot/ChatWidget.jsx` - Main UI
- `client/src/components/chatbot/ChatMessage.jsx` - Message styling
- `client/src/components/chatbot/ChatButton.jsx` - Button appearance

## Troubleshooting

### "HuggingFace API error"

**Cause:** Invalid or missing HF_TOKEN

**Solution:**
1. Check `.env` has valid HF_TOKEN
2. Verify token at https://huggingface.co/settings/tokens
3. Restart server after updating .env

### "Certificate generation failed"

**Cause:** Event certificate config not properly set

**Solution:**
1. Check Event has `certificate_config_india` or `certificate_config_international`
2. Ensure `enabled: true` and `api_key` is set
3. Verify `certificate_issuance_url` is accessible

### "Chat widget not appearing"

**Cause:** Components not imported in layout

**Solution:**
1. Check SchoolLayout.jsx and AdminLayout.jsx have imports
2. Verify ChatButton and ChatWidget are rendered
3. Check browser console for errors

### "Session not persisting"

**Cause:** localStorage blocked or cleared

**Solution:**
1. Check browser allows localStorage
2. Don't use incognito/private mode
3. Clear browser cache and retry

## Performance Optimization

### Rate Limiting

Already configured in `server/src/app.js`:
- General API: 100 requests / 15 min
- Auth routes: 5 requests / 15 min

Consider adding chatbot-specific limits:
```javascript
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20 // 20 messages per minute
});

app.use('/api/v1/chatbot/message', chatbotLimiter);
```

### Caching

Add Redis caching for common queries:
```javascript
// Cache event info responses
const cacheKey = `chat:event:${eventId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... generate response
await redis.setex(cacheKey, 3600, JSON.stringify(response));
```

### Database Indexing

Already indexed in Chat model:
- `session_id` (unique)
- `last_activity`
- `is_active`
- `user_id + user_type`

## Security Considerations

1. **Rate Limiting**: Prevents abuse of AI API
2. **Optional Auth**: Works for public but better with login
3. **Input Sanitization**: Handled by express-mongo-sanitize
4. **Token Validation**: JWT verified for authenticated users
5. **Data Privacy**: No IP addresses or sensitive data stored

## Monitoring

### Check Logs

```bash
# Server logs
cd server
npm run dev

# Watch for:
# - "HuggingFace intent classification error"
# - "Certificate generation error"
# - "Chat error"
```

### Admin Analytics

Visit `/admin/chatbot/analytics` to monitor:
- Total conversations
- Active sessions
- Messages sent
- Certificates generated
- Most common intents

## Migration Notes

### From Old AI Chatbot

The old `AI Chatbot/` directory has been fully migrated. Key changes:

1. **Website → Event**: Website model replaced with Event model
2. **Auth**: Now uses School/Admin models instead of separate User model
3. **Certificate Config**: Uses Event.certificate_config_india/international
4. **Routes**: Moved from `/api/*` to `/api/v1/chatbot/*`
5. **UI**: Converted from MUI to TailwindCSS
6. **State**: Changed from Context API to Zustand

### Data Migration

If you have existing chatbot data, no automatic migration needed since:
- User selected "No existing data" option
- Fresh start with new Event-based system

To manually migrate old data (if needed):
1. Export old Chat records from MongoDB
2. Map old Website IDs to new Event IDs
3. Update user references to School/Admin IDs
4. Import into new Chat collection

## Next Steps

1. ✅ Dependencies installed
2. ✅ Code integrated
3. ⏳ Add HF_TOKEN to .env
4. ⏳ Start server and test
5. ⏳ Configure Event certificate settings
6. ⏳ Test certificate generation
7. ⏳ Monitor analytics
8. ⏳ (Optional) Delete `AI Chatbot/` directory

## Support

For issues or questions:
1. Check logs in server console
2. Review this documentation
3. Check HuggingFace model status
4. Verify environment variables
5. Test API endpoints with Postman/curl

---

**Chatbot Integration Complete!** 🎉
