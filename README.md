# GEMA Events - Bulk Registration System

A comprehensive MERN stack platform for managing bulk student registrations for educational events, competitions, and olympiads. Features multi-currency support, dynamic form builder, dual payment gateways, and automated invoice generation.

**System Status**: ~85% Complete | 38 Pages Implemented | Production-Ready Core Features

**Latest Updates (Dec 29, 2025)**: ✅ All critical bugs fixed | Email system fully integrated | Public event pages added | Comprehensive documentation complete

---

## 📚 Documentation

**New to GEMA?** Start with the [System Overview](./docs/SYSTEM_OVERVIEW.md)

### User Guides
- **[Admin User Guide](./docs/USER_GUIDE_ADMIN.md)** - Complete guide for administrators
- **[School User Guide](./docs/USER_GUIDE_SCHOOL.md)** - Step-by-step guide for schools

### Technical Documentation
- **[Current Status](./docs/CURRENT_STATUS.md)** - System completion status and working features
- **[Current Plan](./docs/CURRENT_PLAN.md)** - Active development plan and sprint status
- **[Event Lifecycle](./docs/EVENT_LIFECYCLE.md)** - Complete event flow from creation to completion
- **[Registration System](./docs/REGISTRATION_SYSTEM.md)** - Single and bulk registration workflows
- **[Bulk Registration & CSV](./docs/BULK_REGISTRATION_CSV.md)** - Excel upload system and validation
- **[Payment System](./docs/PAYMENT_SYSTEM.md)** - Multi-currency payments (Razorpay/Stripe)
- **[Email System](./docs/EMAIL_SYSTEM.md)** - Email notification system and templates (NEW)
- **[Future Roadmap](./docs/FUTURE_ROADMAP.md)** - Upcoming features and long-term vision
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Data models and relationships
- **[Features Status](./docs/FEATURES_STATUS.md)** - Working features, missing features, and roadmap

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd gema-bulk-registration

# Setup backend
cd server
npm install
cp .env.example .env    # Configure your .env
npm run dev             # http://localhost:5000

# Setup frontend (new terminal)
cd client
npm install
cp .env.example .env    # Configure your .env
npm run dev             # http://localhost:5173
```

**Next Steps**:
1. Start MongoDB: `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux)
2. Seed admin user: `node scripts/seed-admin.js`
3. Login at http://localhost:5173/admin/login

📖 See [Getting Started](#getting-started) section below for detailed setup instructions.

---

## ✨ Key Features

### For Schools
- 📊 **Bulk Excel Upload** - Register hundreds of students at once
- 💳 **Flexible Payments** - Online (Razorpay/Stripe) or offline (bank transfer)
- 📄 **Instant Invoices** - Auto-generated PDF invoices after payment
- 🎫 **Real-time Tracking** - Monitor all batches and payment status
- 📧 **Email Notifications** - Automated confirmations for registration and payments

### For Admins
- 🎨 **Dynamic Form Builder** - Create custom registration forms with 8 field types
- 💰 **Multi-Currency** - Support for INR (Razorpay) and USD (Stripe)
- 🎁 **Discount Engine** - Early bird, bulk, and promo code discounts
- 📈 **Analytics Dashboard** - Revenue, registrations, and performance metrics
- 🖼️ **Media Library** - Centralized image management with Cloudinary

### Technical Highlights
- 🔐 **Secure Authentication** - JWT with role-based access control
- 🚀 **Production Ready** - 38 pages, 60+ API endpoints
- 📱 **Responsive Design** - Mobile-friendly Tailwind CSS interface
- ⚡ **Performance** - Optimized queries, pagination, caching
- 📧 **Email System** - Comprehensive notification system with 7 email types

## Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Database**: MongoDB 7.0
- **Authentication**: JWT (jsonwebtoken, bcryptjs)
- **File Processing**: ExcelJS, PDFKit, Multer
- **File Storage**: Cloudinary
- **Payment**: Razorpay, Stripe
- **Email**: Nodemailer
- **Security**: Helmet, CORS, express-rate-limit

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand / Context API
- **Forms**: react-hook-form + Yup
- **HTTP Client**: Axios
- **Drag & Drop**: react-dnd
- **Notifications**: react-hot-toast
- **Charts**: Recharts

### Deployment
- **VPS**: Hostinger KVM1
- **Web Server**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)

## Project Structure

```
gema-bulk-registration/
├── server/           # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── models/        # MongoDB schemas
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── validators/    # Input validation
│   ├── .env              # Environment variables
│   ├── server.js         # Entry point
│   └── package.json
│
├── client/           # Frontend application
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── shared/           # Shared code between frontend and backend
├── scripts/          # Utility scripts (seeding, backups)
└── docs/            # Documentation

```

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- MongoDB 7.0 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gema-bulk-registration
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # On Windows
   net start MongoDB

   # On Linux/Mac
   sudo systemctl start mongod
   ```

5. **Seed Initial Data**
   ```bash
   cd ../scripts
   node seed-admin.js
   node seed-countries.js
   ```

### Development

1. **Start Backend (from server directory)**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:5000

2. **Start Frontend (from client directory)**
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gema
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=your-razorpay-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

## 🔌 API Overview

**Base URL**: `http://localhost:5000/api/v1`

### Quick Reference

**Authentication**
- `POST /auth/school/register` - School registration
- `POST /auth/school/login` - School login
- `POST /admin/auth/login` - Admin login

**Core Endpoints**
- `GET /events` - List active events
- `POST /school/batches/upload` - Bulk upload students
- `POST /school/payments/create-order` - Initiate payment
- `POST /admin/payments/:id/verify` - Verify offline payment
- `GET /media/serve/:id` - Serve media files

📖 **[View Complete API Documentation](./docs/API_DOCUMENTATION.md)** - 60+ endpoints with request/response examples

## Deployment

### Hostinger VPS Deployment

1. **SSH into VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Dependencies**
   ```bash
   apt update && apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs nginx mongodb-org
   npm install -g pm2
   ```

3. **Clone and Setup**
   ```bash
   cd /home/deploy
   git clone <repository-url>
   cd gema-bulk-registration
   cd server && npm install --production
   cd ../client && npm install && npm run build
   ```

4. **Configure Nginx**
   ```bash
   cp nginx.conf /etc/nginx/sites-available/gema-events
   ln -s /etc/nginx/sites-available/gema-events /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

5. **Start Application**
   ```bash
   cd server
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

6. **Setup SSL**
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Testing

Run tests:
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## 💬 Support & Help

### Documentation Resources
- 📖 **[User Guides](./docs/)** - Comprehensive guides for admins and schools
- 🔧 **Troubleshooting** - Common issues and solutions (see user guides)
- 🐛 **Bug Reports** - Create an issue in the repository
- 💡 **Feature Requests** - Open an issue with the `enhancement` label

### Contact
- **Email**: support@gema-events.com
- **Issues**: [GitHub Issues](repository-url/issues)

### Frequently Asked Questions
See the **[School User Guide](./docs/USER_GUIDE_SCHOOL.md#frequently-asked-questions)** for common questions about registration, payments, and invoices.

## Acknowledgments

- GEMA Team
- Phoenix Private School (Reference implementation)
- All participating schools and students

---

Built with ❤️ by GEMA Development Team
