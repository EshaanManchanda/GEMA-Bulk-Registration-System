# 🚀 Chatbot Quick Start

## ⚡ 3-Minute Setup

### 1. Get HuggingFace Token
Visit: https://huggingface.co/settings/tokens
- Click "New token"
- Name: "GEMA Chatbot"
- Type: Read
- Copy token

### 2. Configure Environment
Add to `server/.env`:
```bash
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 4. Test It!
1. Open http://localhost:5173
2. Login as school or admin
3. Click chat button (bottom-right) 💬
4. Try: "Show upcoming events"

---

## 📍 Quick Links

- **Setup Guide:** `docs/CHATBOT_SETUP.md`
- **Testing:** `docs/CHATBOT_TESTING_CHECKLIST.md`
- **Summary:** `CHATBOT_INTEGRATION_SUMMARY.md`

---

## 🎯 Key URLs

| Feature | URL |
|---------|-----|
| Admin Analytics | http://localhost:5173/admin/chatbot/analytics |
| API Message | POST http://localhost:5000/api/v1/chatbot/message |
| API Stats | GET http://localhost:5000/api/v1/chatbot/stats |

---

## 💡 Try These Messages

```
"Hello"
"Show upcoming events"
"When is the Scratch Olympiad?"
"How to register?"
"Generate certificate for test@example.com"
"What is the fee?"
```

---

## 🔧 Common Issues

**Chat button not showing?**
→ Check browser console, verify imports in layouts

**API error?**
→ Add HF_TOKEN to .env, restart server

**Certificate fails?**
→ Configure Event.certificate_config_india in admin panel

---

## ✅ All Set!

Your AI chatbot is ready. Happy chatting! 🎉
