# Email Notification System

**Status**: ✅ COMPLETE - All notifications integrated

**Last Updated**: December 29, 2025

---

## Overview

GEMA Events uses Nodemailer for sending transactional emails to schools and admins. The email system is fully integrated across all critical user flows with professional HTML templates.

---

## Email Service Configuration

### Environment Variables

**Required in `.env` file**:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=GEMA Events
SMTP_FROM_EMAIL=noreply@gema-events.com

# Frontend URL (for links in emails)
FRONTEND_URL=http://localhost:5173
```

### Gmail Setup

For Gmail SMTP:
1. Enable 2-Factor Authentication
2. Generate App Password: Google Account → Security → App Passwords
3. Use app password in `SMTP_PASSWORD`

### Production Setup

Recommended providers:
- **SendGrid**: 100 emails/day free, excellent deliverability
- **Mailgun**: 5,000 emails/month free
- **Amazon SES**: 62,000 emails/month free (with EC2)
- **Gmail SMTP**: Free but limited (500/day)

---

## Email Types

### School Notifications (5 types)

#### 1. Welcome Email
**Trigger**: New school registration
**Template**: `sendWelcomeEmail()`
**Sent to**: School contact email
**Controller**: `server/src/controllers/auth/schoolAuth.controller.js:74-76`

**Includes**:
- School details (name, code, country, currency)
- Contact person information
- Email verification link (24-hour expiry)
- Account status badges
- Next steps checklist

**Example**:
```javascript
await emailService.sendWelcomeEmail(school, verificationToken);
```

#### 2. Password Reset
**Trigger**: Forgot password request
**Template**: `sendPasswordResetEmail()`
**Sent to**: School contact email
**Controller**: `server/src/controllers/auth/schoolAuth.controller.js:289-293`

**Includes**:
- Reset password link (10-minute expiry)
- Security warning
- Instructions

**Example**:
```javascript
await emailService.sendPasswordResetEmail(email, name, resetToken);
```

#### 3. Payment Confirmation
**Trigger**: Online payment verified (Razorpay/Stripe)
**Template**: `sendPaymentConfirmation()`
**Sent to**: School contact email
**Controllers**:
- `server/src/controllers/payment/payment.controller.js:228-234` (Razorpay)
- `server/src/controllers/payment/payment.controller.js:347-353` (Stripe)

**Includes**:
- Event details
- Batch reference
- Student count
- Amount paid and currency
- Payment method and transaction ID
- Payment date
- Link to dashboard

**Example**:
```javascript
await emailService.sendPaymentConfirmation({
  payment: fullPayment,
  batch: fullBatch,
  school: fullPayment.school_id,
  event: fullPayment.event_id
});
```

#### 4. Offline Payment Submitted
**Trigger**: School uploads bank transfer receipt
**Template**: `sendOfflinePaymentSubmitted()`
**Sent to**: School contact email
**Controller**: `server/src/controllers/payment/payment.controller.js:460-466`

**Includes**:
- Batch reference
- Amount and currency
- Student count
- Verification timeline (24-48 hours)
- Reassurance message

**Example**:
```javascript
await emailService.sendOfflinePaymentSubmitted({
  payment: fullPayment,
  batch: fullPayment.batch_id,
  school: fullPayment.school_id,
  event: fullPayment.event_id
});
```

#### 5a. Offline Payment Verified
**Trigger**: Admin approves offline payment
**Template**: `sendOfflinePaymentVerified()`
**Sent to**: School contact email
**Controller**: `server/src/controllers/payment/payment.controller.js:631-637`

**Includes**:
- Confirmation message
- Batch reference
- Link to dashboard
- Invoice availability notice

**Example**:
```javascript
await emailService.sendOfflinePaymentVerified({
  payment: fullPayment,
  batch: fullBatch,
  school: fullPayment.school_id,
  event: fullPayment.event_id
});
```

#### 5b. Offline Payment Rejected
**Trigger**: Admin rejects offline payment
**Template**: `sendOfflinePaymentRejected()`
**Sent to**: School contact email
**Controller**: `server/src/controllers/payment/payment.controller.js:702-708`

**Includes**:
- Batch reference
- Event name
- Rejection reason
- Resubmission instructions
- Link to resubmit payment

**Example**:
```javascript
await emailService.sendOfflinePaymentRejected({
  payment: fullPayment,
  batch: fullPayment.batch_id,
  school: fullPayment.school_id,
  event: fullPayment.event_id,
  reason: rejection_reason
});
```

---

### Admin Notifications (2 types)

#### 1. New School Registration Alert
**Trigger**: New school signs up
**Template**: `sendNewSchoolRegistrationAlert()`
**Sent to**: All active admins
**Controller**: `server/src/controllers/auth/schoolAuth.controller.js:84-88`

**Includes**:
- School code, name, country, currency
- Contact person details
- Registration timestamp
- Link to review school in admin panel

**Example**:
```javascript
const Admin = require('../../models/Admin');
const activeAdmins = await Admin.find({ is_active: true }).select('email');
const adminEmails = activeAdmins.map(admin => admin.email);

await emailService.sendNewSchoolRegistrationAlert({
  school,
  adminEmails
});
```

#### 2. Offline Payment Pending Alert
**Trigger**: School submits offline payment
**Template**: `sendNewOfflinePaymentAlert()`
**Sent to**: All active admins
**Controller**: `server/src/controllers/payment/payment.controller.js:474-481`

**Includes**:
- School name and code
- Event title
- Batch reference
- Student count
- Amount and currency
- Transaction reference
- Submission timestamp
- Link to verify payment

**Example**:
```javascript
const Admin = require('../../models/Admin');
const activeAdmins = await Admin.find({ is_active: true }).select('email');
const adminEmails = activeAdmins.map(admin => admin.email);

await emailService.sendNewOfflinePaymentAlert({
  payment: fullPayment,
  batch: fullPayment.batch_id,
  school: fullPayment.school_id,
  event: fullPayment.event_id,
  adminEmails
});
```

---

## Email Templates

All email templates follow a consistent design:

### Design System
- **Primary Color**: #0070C0 (GEMA Blue)
- **Success Color**: #28a745 (Green)
- **Warning Color**: #FF9800 (Orange)
- **Error Color**: #dc3545 (Red)
- **Font**: Arial, sans-serif
- **Max Width**: 600px
- **Responsive**: Mobile-friendly

### Template Structure
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline CSS for email compatibility */
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #0070C0; color: white; padding: 20px; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #0070C0; color: white; padding: 12px 30px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Subject</h1>
    </div>
    <div class="content">
      <!-- Email content -->
    </div>
    <div class="footer">
      <p>&copy; 2025 GEMA Events. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

---

## Email Sending Logic

### Non-Blocking Execution

All emails are sent using `setImmediate()` to prevent blocking API responses:

```javascript
setImmediate(async () => {
  try {
    await emailService.sendWelcomeEmail(school, token);
    logger.info('Email sent successfully');
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Email failure does not break main flow
  }
});
```

### Error Handling

Email failures are logged but **do not fail the main operation**. This ensures:
- User registration succeeds even if email fails
- Payment processing continues if notification fails
- System remains functional without SMTP

### Logging

All email events are logged:
```javascript
logger.info(`Welcome email sent to: ${school.contact_person.email}`);
logger.error('Failed to send welcome email:', error);
```

---

## Testing Email System

### Development Testing

1. **Use Ethereal Email** (fake SMTP):
```javascript
// In email.service.js initializeTransporter()
const testAccount = await nodemailer.createTestAccount();
this.transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass
  }
});
```

2. **View Test Emails**:
- Check console logs for preview URL
- Opens in browser to view email

### Production Testing

**Test Checklist**:
- [ ] Welcome email on school registration
- [ ] Password reset email
- [ ] Email verification link works
- [ ] Payment confirmation (Razorpay)
- [ ] Payment confirmation (Stripe)
- [ ] Offline payment submission confirmation
- [ ] Offline payment verification email
- [ ] Offline payment rejection email
- [ ] Admin alert: new school registration
- [ ] Admin alert: offline payment pending

**Test Script**: `scripts/test-email-system.js`
```javascript
const emailService = require('../server/src/services/email.service');

async function testEmails() {
  // Test welcome email
  await emailService.sendWelcomeEmail(mockSchool, mockToken);
  console.log('✓ Welcome email sent');

  // Test payment confirmation
  await emailService.sendPaymentConfirmation(mockPaymentData);
  console.log('✓ Payment confirmation sent');

  // ... test all email types
}

testEmails();
```

---

## Email Deliverability Best Practices

### SPF Records
Add to DNS:
```
v=spf1 include:_spf.google.com ~all
```

### DKIM Signing
Configure in SMTP provider dashboard (SendGrid, Mailgun, etc.)

### DMARC Policy
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### Avoid Spam Filters
- Use professional "From" name: `GEMA Events <noreply@gema-events.com>`
- Include unsubscribe link (future enhancement)
- Avoid spam trigger words
- Use plain text alternative (future enhancement)
- Warm up IP gradually (50 → 100 → 500 → unlimited)

---

## Email Queue (Future Enhancement)

For high-volume production, implement email queue:

**Recommended**: Bull Queue with Redis

```javascript
const Queue = require('bull');
const emailQueue = new Queue('email', 'redis://127.0.0.1:6379');

// Producer
emailQueue.add({
  to: 'school@example.com',
  template: 'welcome',
  data: { school, token }
});

// Consumer
emailQueue.process(async (job) => {
  await emailService.sendEmail(job.data);
});
```

**Benefits**:
- Retry failed emails
- Rate limiting
- Better performance
- Monitoring dashboard

---

## Email Metrics (Future Enhancement)

Track email engagement:
- **Open Rate**: Track pixel in email
- **Click Rate**: Track link clicks
- **Bounce Rate**: Monitor SMTP responses
- **Unsubscribe Rate**: Add unsubscribe link

**Implementation**: Use SendGrid/Mailgun webhooks

---

## Troubleshooting

### Issue: Emails not sending

**Check**:
1. SMTP credentials in `.env` file
2. Transporter initialization logs
3. Email service logs for errors
4. SMTP host/port correct
5. Firewall blocking port 587

**Solution**:
```bash
# Test SMTP connection
node -e "require('./server/src/services/email.service')"
# Should log: "SMTP server ready to send emails"
```

### Issue: Emails go to spam

**Fix**:
- Add SPF/DKIM/DMARC records
- Use reputable SMTP provider
- Warm up IP address
- Avoid spam trigger words
- Include physical address in footer

### Issue: Gmail rate limit exceeded

**Limit**: 500 emails/day for free Gmail

**Solution**:
- Use professional SMTP (SendGrid, Mailgun)
- Implement email queue with rate limiting
- Batch emails for admins

---

## Future Enhancements

### Phase 1 (Weeks 1-2)
- [x] Integrate all 7 email notifications
- [x] Fix email parameter bug
- [x] Add admin notifications
- [ ] Test all email flows in production

### Phase 2 (Weeks 3-4)
- [ ] Email queue with Bull + Redis
- [ ] HTML + Plain text alternatives
- [ ] Email templates in database (editable by admin)
- [ ] Email preview in admin panel
- [ ] Unsubscribe functionality

### Phase 3 (Weeks 5-8)
- [ ] Email metrics tracking
- [ ] A/B testing for email templates
- [ ] Scheduled emails (event reminders)
- [ ] Batch email sending (newsletters)
- [ ] SMS notifications integration (Twilio)

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Current Status](./CURRENT_STATUS.md)
- [Payment System](./PAYMENT_SYSTEM.md)
- [Future Roadmap](./FUTURE_ROADMAP.md)

---

**Status**: Production-Ready ✅
**Email Count**: 7 types (5 school, 2 admin)
**Integration**: 100% complete
**Next Step**: Production testing with real SMTP provider
