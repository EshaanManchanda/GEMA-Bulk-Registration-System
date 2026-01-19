# Chatbot Integration Testing Checklist

## Pre-Testing Setup

- [ ] HuggingFace token added to `.env`
- [ ] Server dependencies installed (`npm install`)
- [ ] Server running (`npm run dev` in server/)
- [ ] Client running (`npm run dev` in client/)
- [ ] MongoDB connected
- [ ] At least one Event exists in database with:
  - [ ] `certificate_config_india.enabled = true`
  - [ ] `certificate_config_india.api_key` set
  - [ ] `certificate_config_india.certificate_issuance_url` set

## Backend API Testing

### 1. Intent Detection Test
```bash
curl -X POST http://localhost:5000/api/v1/chatbot/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"message": "When is the exam?"}'
```
Expected: `{"intent":"exam_date"}`

- [ ] Greeting intent: "Hello" → `greeting`
- [ ] Certificate intent: "Generate certificate" → `certificate`
- [ ] Exam date intent: "When is the exam?" → `exam_date`
- [ ] Payment intent: "How to pay?" → `payment`
- [ ] General intent: "Random text" → `general`

### 2. Send Message Test
```bash
curl -X POST http://localhost:5000/api/v1/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "sessionId": "test_session_123"
  }'
```
Expected: Welcome message with suggestions

- [ ] Creates new session in database
- [ ] Returns bot response
- [ ] Returns suggestions array
- [ ] Saves messages to database

### 3. Get History Test
```bash
# With auth token
curl -X GET http://localhost:5000/api/v1/chatbot/history/test_session_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] Returns message array
- [ ] Returns summary object
- [ ] Requires authentication

### 4. Get Stats Test (Admin Only)
```bash
curl -X GET http://localhost:5000/api/v1/chatbot/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

- [ ] Returns total_chats
- [ ] Returns total_messages
- [ ] Returns total_certificates
- [ ] Returns intent_distribution
- [ ] Requires admin authentication

## Frontend Testing

### School Portal

#### Chat Button
- [ ] Button visible on all school pages
- [ ] Button in bottom-right corner
- [ ] Button toggles chat widget on click
- [ ] Icon changes (MessageCircle ↔ X)

#### Chat Widget - Anonymous
1. Logout (test as anonymous user)
2. Visit public event page
- [ ] Chat widget opens/closes
- [ ] Can send messages
- [ ] Receives bot responses
- [ ] Suggestions clickable
- [ ] Session persists (localStorage)
- [ ] Chat history loads on reload

#### Chat Widget - Authenticated School
1. Login as school
2. Click chat button
- [ ] Chat widget opens
- [ ] Can send messages
- [ ] Receives personalized responses
- [ ] Certificate generation works with school email
- [ ] Country detection (India vs International)
- [ ] Payment info includes school context

#### Message Types
Test each message type:

**Greeting:**
- [ ] Send: "Hello"
- [ ] Receives: Welcome message + suggestions

**Event Info:**
- [ ] Send: "Show upcoming events"
- [ ] Receives: List of events
- [ ] Suggestions for specific events

**Exam Date:**
- [ ] Send: "When is [Event Name]?"
- [ ] Receives: Event dates, registration deadline
- [ ] Event date displayed correctly

**Certificate:**
- [ ] Send: "Generate certificate for test@school.com"
- [ ] Receives: List of events (if event not specified)
- [ ] Send: "Certificate for [Event Name] with test@school.com"
- [ ] Receives: Download button OR error message
- [ ] Download button works (if student exists)

**Payment:**
- [ ] Send: "How to pay for [Event Name]?"
- [ ] Receives: Fee info, payment instructions
- [ ] Fee correct (INR for India schools, USD for others)

**Registration:**
- [ ] Send: "How to register?"
- [ ] Receives: Registration info with event selection

#### UI/UX
- [ ] Messages scroll to bottom automatically
- [ ] Loading indicator shows while waiting
- [ ] Timestamp on each message
- [ ] User messages right-aligned (blue)
- [ ] Bot messages left-aligned (gray)
- [ ] Suggestion chips styled correctly
- [ ] Download buttons styled correctly
- [ ] External links open in new tab
- [ ] Clear history button works
- [ ] Confirmation prompt before clearing

#### Persistence
- [ ] Close chat and reopen → messages persist
- [ ] Reload page → messages persist
- [ ] Clear history → messages removed
- [ ] New session ID generated after clear

### Admin Portal

#### Navigation
- [ ] "Chatbot Analytics" link visible in sidebar
- [ ] Link at `/admin/chatbot/analytics`
- [ ] Icon displays (chat bubble icon)
- [ ] Active state highlights correctly

#### Analytics Page
- [ ] Page loads without errors
- [ ] 4 stat cards display:
  - [ ] Total Chats
  - [ ] Active Chats
  - [ ] Total Messages
  - [ ] Certificates Generated
- [ ] Numbers display correctly
- [ ] Icons display in stat cards
- [ ] Intent distribution chart shows (if data exists)
- [ ] Progress bars sized correctly
- [ ] Intent counts accurate
- [ ] Info card at bottom displays
- [ ] Responsive on mobile

#### Admin Chat Widget
- [ ] Chat button visible on admin pages
- [ ] Can send messages as admin
- [ ] Admin context recognized
- [ ] Can access all intents
- [ ] Analytics updates after using chat

## Error Handling

### Network Errors
- [ ] Disconnect server → Error message shown
- [ ] Slow response → Loading indicator
- [ ] Timeout → Error message + retry suggestion

### Invalid Inputs
- [ ] Empty message → Send button disabled
- [ ] No session ID → Auto-generates new one
- [ ] Invalid event name → "Couldn't find" message

### API Errors
- [ ] HuggingFace down → Fallback to rule-based intent
- [ ] Certificate API error → Clear error message
- [ ] Student not found → Helpful error with suggestions

### Authentication
- [ ] Expired token → Continues as anonymous
- [ ] Invalid token → Continues as anonymous
- [ ] No token (public) → Works with limitations

## Performance Testing

### Load Testing
- [ ] 10 rapid messages → All processed
- [ ] 50 messages in session → Scrolling works
- [ ] Multiple sessions → No interference
- [ ] Large message (500 chars) → Handled correctly

### Rate Limiting
- [ ] 100 requests in 15 min → Allowed
- [ ] 101st request → Rate limit error (check server config)

### Memory
- [ ] Chat widget doesn't leak memory (check DevTools)
- [ ] Long sessions don't slow down
- [ ] History loads quickly

## Mobile Testing

### Responsive Design
- [ ] Chat button positioned correctly
- [ ] Chat widget fits screen
- [ ] Messages wrap properly
- [ ] Input field accessible
- [ ] Keyboard doesn't hide input
- [ ] Suggestions wrap on small screens
- [ ] Stat cards stack on mobile

### Touch Interactions
- [ ] Chat button tappable
- [ ] Suggestion chips tappable
- [ ] Links tappable
- [ ] Scroll gestures work

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Database Verification

### MongoDB Collections

Check `Chat` collection:
```javascript
db.chats.findOne()
```

- [ ] session_id exists and unique
- [ ] messages array contains user + bot messages
- [ ] user_id linked correctly (for authenticated)
- [ ] user_type correct (School/Admin/anonymous)
- [ ] event_context set when discussing event
- [ ] is_active = true for new chats
- [ ] last_activity updates on each message
- [ ] total_messages count accurate
- [ ] certificates_requested count accurate
- [ ] Indexes created correctly

### Stats Query
```javascript
db.chats.aggregate([
  { $group: { _id: null, total: { $sum: '$total_messages' } } }
])
```

- [ ] Returns correct total
- [ ] Matches analytics page

## Security Testing

### Input Sanitization
- [ ] SQL injection attempts → Sanitized
- [ ] NoSQL injection attempts → Sanitized
- [ ] XSS attempts → Escaped
- [ ] Special characters handled correctly

### Authentication
- [ ] Cannot access admin stats without admin token
- [ ] Cannot access other user's history
- [ ] Token expiry handled gracefully

### Rate Limiting
- [ ] Too many requests → 429 error
- [ ] Rate limit per IP enforced

## Cleanup After Testing

- [ ] Delete test chat sessions
- [ ] Clear test localStorage
- [ ] Remove test event (if created)
- [ ] Check server logs for errors
- [ ] Verify no memory leaks

## Known Issues / Notes

Document any issues found:

1. **Issue:**
   **Severity:** Low/Medium/High
   **Steps to reproduce:**
   **Expected:**
   **Actual:**

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________
**Environment:** Dev / Staging / Production
**Overall Status:** ✅ Pass / ⚠️ Pass with issues / ❌ Fail

**Critical Issues:** _______________
**Non-Critical Issues:** _______________
**Notes:** _______________
