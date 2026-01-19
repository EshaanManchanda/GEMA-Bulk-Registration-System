# GEMA AI Chatbot

An intelligent chatbot system for GEMA's competition websites that helps users with certificate generation, exam dates, payment links, and general competition information.

## 🚀 Features

- **🎓 Certificate Generation**: Automatically generate and download certificates from competition websites
- **📅 Exam Date Information**: Get exam schedules and important dates
- **💳 Payment & Registration**: Access payment links and registration forms
- **🌐 Website Management**: Admin dashboard to manage competition websites
- **📊 Analytics Dashboard**: Track chat statistics and website performance
- **🔐 Secure Authentication**: Admin login system with JWT tokens
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (React + Vite)
- **Chat Interface**: Interactive chatbot with natural language processing
- **Dashboard**: Admin panel for website and data management
- **Authentication**: Secure login system

### Backend (Node.js + Express)
- **RESTful API**: Handles chat, certificates, and website management
- **MongoDB Database**: Stores websites, chats, and user data
- **AI Integration**: Intent detection and response generation
- **File Upload**: CSV import functionality

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Chatbot
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/gema-chatbot

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Default Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# API Keys (Add your actual API keys)
SCRATCH_API_KEY=your_scratch_api_key
PAINTING_API_KEY=your_painting_api_key
NATIONAL_API_KEY=your_national_api_key
ABACUS_API_KEY=your_abacus_api_key
SPEAKER_API_KEY=your_speaker_api_key

# Optional: AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Optional: Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Database Setup

**Start MongoDB** (if running locally):
```bash
mongod
```

**Seed the database** with initial data:
```bash
cd server
node scripts/seedData.js
```

## 🚀 Running the Application

### Development Mode

**Start the backend server:**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

**Start the frontend client:**
```bash
cd client
npm run dev
```
Client will run on `http://localhost:3000`

### Production Mode

**Build the frontend:**
```bash
cd client
npm run build
```

**Start the production server:**
```bash
cd server
npm start
```

## 📖 Usage

### For Users (Chat Interface)

1. **Access the chatbot** at `http://localhost:3000`
2. **Ask questions** like:
   - "I want my certificate from scratcholympiads.com"
   - "When is the exam for National School Olympiad?"
   - "Show me payment links for Abacus Olympiad"
   - "What competitions are available?"

### For Administrators (Dashboard)

1. **Login** at `http://localhost:3000/login`
   - Username: `admin`
   - Password: `admin123`

2. **Manage websites**:
   - Add new competition websites
   - Edit existing website information
   - Import websites from CSV files
   - Configure API keys for certificate generation

3. **View analytics**:
   - Chat statistics and trends
   - Website performance metrics
   - Certificate generation reports

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Chat
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `GET /api/chat/stats` - Get chat statistics

### Websites
- `GET /api/websites` - Get all websites
- `POST /api/websites` - Create new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website
- `POST /api/websites/import` - Import from CSV

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/websites` - Get certificate-enabled websites
- `POST /api/certificates/validate-email` - Validate email format

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/analytics/chats` - Get chat analytics
- `GET /api/dashboard/health` - System health check

## 📊 Database Schema

### Website Model
```javascript
{
  name: String,           // Competition name
  link: String,           // Website URL
  domain: String,         // Extracted domain
  paymentLink: String,    // Payment/registration URL
  examDate: String,       // Exam date
  apiKey: String,         // API key for certificate generation
  certificateEndpoint: String, // Certificate API endpoint
  description: String,    // Website description
  isActive: Boolean       // Active status
}
```

### Chat Model
```javascript
{
  sessionId: String,      // Unique session identifier
  messages: [{
    text: String,         // Message content
    sender: String,       // 'user' or 'bot'
    timestamp: Date,      // Message timestamp
    data: Object          // Additional data (certificates, links, etc.)
  }],
  userInfo: Object,       // User information
  isActive: Boolean,      // Session status
  messageCount: Number,   // Total messages
  certificateRequestCount: Number // Certificate requests
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Sanitized user inputs
- **Helmet.js**: Security headers

## 🧪 Testing

**Run backend tests:**
```bash
cd server
npm test
```

**Run frontend tests:**
```bash
cd client
npm test
```

## 📝 CSV Import Format

When importing websites via CSV, use this format:

```csv
Website Name,Links,Payment Links,Exam Date,API Key,Description
International Scratch Olympiad,https://scratcholympiads.com,https://scratcholympiads.com/payment,15 October 2025,your_api_key,Programming competition
Painting Olympics,https://paintingolympics.in,https://paintingolympics.in/payment,30 September 2025,your_api_key,Art competition
```

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd server
pm2 start ecosystem.config.js

# Monitor the application
pm2 monit
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Advanced AI Integration**: OpenAI GPT or Hugging Face models
- **Multi-language Support**: Internationalization
- **Voice Chat**: Speech-to-text and text-to-speech
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Detailed reporting and insights
- **Email Notifications**: Automated email alerts
- **Webhook Integration**: Real-time updates
- **API Rate Limiting**: Advanced throttling
- **Caching**: Redis for improved performance

---

**Built with ❤️ for GEMA Competition Websites**