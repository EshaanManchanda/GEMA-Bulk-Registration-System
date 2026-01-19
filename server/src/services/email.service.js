const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');
const { formatCurrency } = require('../utils/helpers');

/**
 * Email Service
 * Handles all email notifications using Nodemailer
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   * @private
   */
  initializeTransporter() {
    try {
      // Check if SMTP credentials are configured
      const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME;

      if (!process.env.SMTP_HOST || !smtpUser || !process.env.SMTP_PASSWORD) {
        logger.warn('SMTP credentials not configured. Email service disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: process.env.SMTP_PASSWORD
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection error:', error.message);
        } else {
          logger.info('SMTP server ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error.message);
    }
  }

  /**
   * Send email
   * @private
   */
  async sendEmail(mailOptions) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized');
        return { success: false, error: 'Email service not configured' };
      }

      const info = await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        ...mailOptions
      });

      logger.info(`Email sent: ${info.messageId} to ${mailOptions.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send school welcome email
   * @param {Object} school - School object
   * @param {string} verificationToken - Email verification token
   */
  async sendWelcomeEmail(school, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/school/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070C0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #0070C0; margin: 20px 0; }
          .section-title { color: #0070C0; font-size: 16px; font-weight: bold; margin: 25px 0 10px 0; border-bottom: 2px solid #0070C0; padding-bottom: 5px; }
          .detail-row { padding: 8px 0; display: flex; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; min-width: 150px; color: #555; }
          .detail-value { color: #333; flex: 1; }
          .highlight-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: bold; margin: 5px; }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-required { background: #d1ecf1; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to GEMA Events!</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>
            <p>Thank you for registering with GEMA Events. Your school account has been successfully created.</p>

            <!-- School Information -->
            <h3 class="section-title">School Information</h3>
            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">School Code:</span>
                <span class="detail-value"><strong style="font-size: 18px; color: #0070C0;">${school.school_code}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">School Name:</span>
                <span class="detail-value">${school.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${school.country}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency:</span>
                <span class="detail-value">${school.currency_pref}</span>
              </div>
            </div>

            <!-- Registered Address -->
            ${school.address && (school.address.street || school.address.city) ? `
            <h3 class="section-title">Registered Address</h3>
            <div class="info-box">
              <div class="detail-value">
                ${school.address.street ? school.address.street + '<br>' : ''}
                ${school.address.city ? school.address.city : ''}${school.address.state ? ', ' + school.address.state : ''}<br>
                ${school.address.postal_code ? school.address.postal_code + '<br>' : ''}
                ${school.address.country || school.country}
              </div>
            </div>
            ` : ''}

            <!-- Contact Person Details -->
            <h3 class="section-title">Contact Person Details</h3>
            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${school.contact_person.name}</span>
              </div>
              ${school.contact_person.designation ? `
              <div class="detail-row">
                <span class="detail-label">Designation:</span>
                <span class="detail-value">${school.contact_person.designation}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${school.contact_person.phone}</span>
              </div>
            </div>

            <!-- Login Email Highlight -->
            <div class="highlight-box">
              <strong>🔑 Your Login Email:</strong><br>
              <span style="font-size: 16px; color: #0070C0; font-weight: bold;">
                ${school.contact_person.email}
              </span><br>
              <span style="font-size: 13px; color: #666;">
                Use this email to log in to your school account
              </span>
            </div>

            <!-- Account Status & Next Steps -->
            <h3 class="section-title">Account Status & Next Steps</h3>
            <div class="info-box">
              <p><strong>Current Status:</strong></p>
              <p>
                <span class="status-badge status-required">⏳ Email Verification Required</span>
                <span class="status-badge status-pending">⏳ Admin Approval Pending</span>
              </p>
              <p style="margin-top: 15px;"><strong>Next Steps:</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Verify your email</strong> by clicking the button below</li>
                <li>Wait for <strong>admin approval</strong> (usually within 24-48 hours)</li>
                <li>Once approved, you'll receive a confirmation email</li>
                <li>Log in and start registering students for events!</li>
              </ol>
            </div>

            <!-- Verification Button -->
            <p style="margin-top: 30px;">To complete your registration, please verify your email address:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p style="font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              ${verificationUrl}
            </p>
            <p style="font-size: 12px; color: #dc3545; margin-top: 10px; font-weight: bold;">
              ⚠️ This verification link will expire in 24 hours
            </p>

            <!-- Platform Features -->
            <h3 class="section-title">What You Can Do Next</h3>
            <ul style="line-height: 1.8;">
              <li>Browse and register for upcoming events</li>
              <li>Upload bulk student registrations via Excel</li>
              <li>Make secure payments online or offline</li>
              <li>Download invoices and receipts</li>
              <li>Manage student registrations from your dashboard</li>
            </ul>

            <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
            <p>Global Educational Mathematics Association</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: 'Welcome to GEMA Events - Complete Your Registration',
      html
    });
  }

  /**
   * Send OTP verification email
   * @param {Object} school - School object
   * @param {string} otp - 6 digit OTP
   */
  async sendOtpEmail(school, otp) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070C0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; text-align: center; }
          .otp-box { background: #fff; border: 2px dashed #0070C0; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0070C0; display: inline-block; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification Code</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>
            <p>Please use the following OTP to verify your email address:</p>
            
            <div class="otp-box">${otp}</div>
            
            <p>This code is valid for 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: 'GEMA Events - Email Verification OTP',
      html
    });
  }

  /**
   * Send email verification reminder
   * @param {Object} school - School object
   * @param {string} verificationToken - Email verification token
   */
  async sendVerificationReminder(school, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/school/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification Required</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>
            <p>We noticed that you haven't verified your email address yet.</p>
            <p>Please verify your email to access all features of your GEMA Events account.</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Now</a>
            </div>

            <p style="font-size: 12px; color: #666;">
              Link: ${verificationUrl}
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: 'GEMA Events - Please Verify Your Email',
      html
    });
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/school/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070C0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password for your GEMA Events account.</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p style="font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link:<br>
              ${resetUrl}
            </p>

            <div class="warning">
              <strong>⚠️ Important:</strong><br>
              This link will expire in 10 minutes.<br>
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'GEMA Events - Password Reset Request',
      html
    });
  }

  /**
   * Send payment confirmation email
   * @param {Object} paymentData - Payment data with populated relations
   */
  async sendPaymentConfirmation(paymentData) {
    const { payment, batch, school, event } = paymentData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; text-align: center; }
          .info-table { width: 100%; background: white; padding: 20px; margin: 20px 0; }
          .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Successful!</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>

            <div class="success-box">
              <h3 style="margin: 0; color: #28a745;">Payment Confirmed</h3>
              <p style="margin: 10px 0 0 0;">Your payment has been successfully processed.</p>
            </div>

            <div class="info-table">
              <div class="info-row">
                <strong>Event:</strong> ${event.title}
              </div>
              <div class="info-row">
                <strong>Batch Reference:</strong> ${batch.batch_reference}
              </div>
              <div class="info-row">
                <strong>Number of Students:</strong> ${batch.student_count}
              </div>
              <div class="info-row">
                <strong>Amount Paid:</strong> ${formatCurrency(payment.amount, payment.currency)}
              </div>
              <div class="info-row">
                <strong>Payment Mode:</strong> ${payment.payment_mode.toUpperCase()}
              </div>
              ${payment.gateway_payment_id ? `
              <div class="info-row">
                <strong>Transaction ID:</strong> ${payment.gateway_payment_id}
              </div>
              ` : ''}
              <div class="info-row">
                <strong>Payment Date:</strong> ${new Date(payment.paid_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
              </div>
            </div>

            <p>Your invoice has been generated and will be available for download shortly.</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
            </div>

            <p>Thank you for registering with GEMA Events!</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: `Payment Confirmed - ${event.title}`,
      html
    });
  }

  /**
   * Send invoice email with attachment
   * @param {Object} invoiceData - Invoice data
   * @param {Buffer} pdfBuffer - PDF invoice buffer
   */
  async sendInvoiceEmail(invoiceData, pdfBuffer) {
    const { school, event, batch, invoiceNumber } = invoiceData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070C0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Invoice is Ready</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>
            <p>Thank you for your payment. Your invoice for ${event.title} is attached to this email.</p>

            <p><strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Batch Reference:</strong> ${batch.batch_reference}</p>

            <p>You can also download your invoice anytime from your dashboard.</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: `Invoice ${invoiceNumber} - ${event.title}`,
      html,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }

  /**
   * Send offline payment submission confirmation
   * @param {Object} data - Payment submission data
   */
  async sendOfflinePaymentSubmitted(data) {
    const { school, event, batch, payment } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt Received</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>
            <p>We have received your offline payment receipt for ${event.title}.</p>

            <div class="info-box">
              <strong>Batch Reference:</strong> ${batch.batch_reference}<br>
              <strong>Amount:</strong> ${formatCurrency(payment.amount, payment.currency)}<br>
              <strong>Students:</strong> ${batch.student_count}
            </div>

            <p>Our admin team will verify your payment within 24-48 hours. You will receive a confirmation email once verified.</p>

            <p>Thank you for your patience!</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: `Payment Receipt Received - ${event.title}`,
      html
    });
  }

  /**
   * Send offline payment verification email
   * @param {Object} data - Verification data
   */
  async sendOfflinePaymentVerified(data) {
    const { school, event, batch } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Verified!</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>

            <div class="success-box">
              <h3 style="margin: 0; color: #28a745;">Payment Confirmed</h3>
              <p style="margin: 10px 0 0 0;">Your offline payment has been verified by our admin team.</p>
            </div>

            <p>Your registration for ${event.title} is now complete!</p>
            <p><strong>Batch Reference:</strong> ${batch.batch_reference}</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
            </div>

            <p>Your invoice is now available for download.</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: `Payment Verified - ${event.title}`,
      html
    });
  }

  /**
   * Send admin notification: new school registered
   * @param {Object} data - School registration data
   */
  async sendNewSchoolRegistrationAlert(data) {
    const { school, adminEmails } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0070C0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #0070C0; margin: 20px 0; }
          .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; display: inline-block; width: 150px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏫 New School Registration</h1>
          </div>
          <div class="content">
            <h2>New School Awaiting Approval</h2>
            <p>A new school has registered and is awaiting admin verification.</p>

            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">School Code:</span>
                <strong style="color: #0070C0;">${school.school_code}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">School Name:</span>
                ${school.name}
              </div>
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                ${school.country}
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency:</span>
                ${school.currency_pref}
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Person:</span>
                ${school.contact_person.name}
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Email:</span>
                ${school.contact_person.email}
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Phone:</span>
                ${school.contact_person.phone}
              </div>
              <div class="detail-row">
                <span class="detail-label">Registered On:</span>
                ${new Date(school.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/admin/schools/${school._id}" class="button">Review School</a>
            </div>

            <p style="font-size: 13px; color: #666; margin-top: 20px;">
              Please review the school details and approve or reject the registration from the admin panel.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all admin emails
    const emailPromises = adminEmails.map(email =>
      this.sendEmail({
        to: email,
        subject: `New School Registration: ${school.name}`,
        html
      })
    );

    return await Promise.allSettled(emailPromises);
  }

  /**
   * Send admin notification: offline payment submitted
   * @param {Object} data - Payment submission data
   */
  async sendNewOfflinePaymentAlert(data) {
    const { school, event, batch, payment, adminEmails } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; }
          .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; display: inline-block; width: 150px; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Offline Payment Submitted</h1>
          </div>
          <div class="content">
            <h2>New Offline Payment Awaiting Verification</h2>
            <p>A school has submitted an offline payment that requires admin verification.</p>

            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">School:</span>
                ${school.name} (${school.school_code})
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                ${event.title}
              </div>
              <div class="detail-row">
                <span class="detail-label">Batch Reference:</span>
                <strong style="color: #FF9800;">${batch.batch_reference}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Students:</span>
                ${batch.student_count}
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <strong>${formatCurrency(payment.amount, payment.currency)}</strong>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction Ref:</span>
                ${payment.offline_payment_details?.transaction_reference || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Submitted On:</span>
                ${new Date(payment.offline_payment_details?.submitted_at || payment.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/admin/payments/${payment._id}" class="button">Verify Payment</a>
            </div>

            <p style="font-size: 13px; color: #666; margin-top: 20px;">
              Please review the payment receipt and verify or reject the payment from the admin panel.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all admin emails
    const emailPromises = adminEmails.map(email =>
      this.sendEmail({
        to: email,
        subject: `Offline Payment Pending: ${school.name} - ${formatCurrency(payment.amount, payment.currency)}`,
        html
      })
    );

    return await Promise.allSettled(emailPromises);
  }

  /**
   * Send offline payment rejection email
   * @param {Object} data - Rejection data
   */
  async sendOfflinePaymentRejected(data) {
    const { school, event, batch, reason } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .error-box { background: #f8d7da; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #0070C0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Could Not Be Verified</h1>
          </div>
          <div class="content">
            <h2>Hello ${school.name}!</h2>

            <div class="error-box">
              <h3 style="margin: 0; color: #dc3545;">Verification Failed</h3>
              <p style="margin: 10px 0 0 0;">We were unable to verify your offline payment.</p>
            </div>

            <p><strong>Batch Reference:</strong> ${batch.batch_reference}<br>
            <strong>Event:</strong> ${event.title}</p>

            <p><strong>Reason:</strong> ${reason}</p>

            <p>Please review the payment details and resubmit with correct information.</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Resubmit Payment</a>
            </div>

            <p>If you have questions, please contact our support team.</p>

            <p>Best regards,<br>The GEMA Events Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GEMA Events. All rights reserved.</p>
            <p>Email: support@gema-events.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: school.contact_person.email,
      subject: `Payment Verification Failed - ${event.title}`,
      html
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
