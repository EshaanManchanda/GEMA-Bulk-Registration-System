const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');
const { formatCurrency } = require('../utils/helpers');
const storageService = require('./storage.service');
const emailService = require('./email.service');

/**
 * Invoice Generator Service
 * Generates professional PDF invoices for completed payments
 */
class InvoiceService {
  /**
   * Generate invoice for a payment
   * @param {Object} paymentData - Payment data with populated relations
   * @returns {Promise<Object>} - { buffer, invoiceNumber, cloudinaryUrl }
   */
  async generateInvoice(paymentData) {
    try {
      const {
        payment,
        batch,
        school,
        event,
        registrations
      } = paymentData;

      // Generate invoice number
      const invoiceNumber = this._generateInvoiceNumber(payment);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      // Collect PDF data in buffer
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));

      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // Build invoice
      this._buildHeader(doc);
      this._buildInvoiceInfo(doc, invoiceNumber, payment, batch);
      this._buildSchoolInfo(doc, school);
      this._buildItemsTable(doc, event, batch, registrations);
      this._buildPricingSummary(doc, batch);
      this._buildPaymentInfo(doc, payment);
      this._buildFooter(doc);

      // Finalize PDF
      doc.end();

      const buffer = await pdfPromise;

      // Upload to storage (Cloudinary or local) with retry logic
      const uploadResult = await this._uploadWithRetry(
        buffer,
        invoiceNumber,
        batch.batch_reference
      );

      logger.info(`Invoice generated: ${invoiceNumber} for batch: ${batch.batch_reference} (${storageService.getProvider()})`);

      return {
        buffer,
        invoiceNumber,
        cloudinaryUrl: uploadResult.secure_url, // Keep name for backward compatibility
        publicId: uploadResult.public_id
      };

    } catch (error) {
      logger.error('Invoice generation error:', error);
      throw new AppError('Failed to generate invoice', 500);
    }
  }

  /**
   * Generate invoice number
   * @private
   */
  _generateInvoiceNumber(payment) {
    const date = new Date(payment.paid_at || payment.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const paymentIdShort = payment._id.toString().slice(-6).toUpperCase();

    return `INV-${year}${month}${day}-${paymentIdShort}`;
  }

  /**
   * Build invoice header with logo and company info
   * @private
   */
  _buildHeader(doc) {
    // Company name
    doc.fontSize(24)
       .fillColor('#0070C0')
       .text('GEMA EVENTS', 50, 50);

    // Tagline
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Global Educational Mathematics Association', 50, 80);

    // Invoice title
    doc.fontSize(28)
       .fillColor('#000000')
       .text('INVOICE', 400, 50, { align: 'right' });

    // Horizontal line
    doc.moveTo(50, 110)
       .lineTo(545, 110)
       .strokeColor('#0070C0')
       .lineWidth(2)
       .stroke();

    doc.moveDown(3);
  }

  /**
   * Build invoice info section
   * @private
   */
  _buildInvoiceInfo(doc, invoiceNumber, payment, batch) {
    const startY = 130;

    doc.fontSize(10)
       .fillColor('#000000');

    // Left column - Invoice details
    doc.font('Helvetica-Bold').text('Invoice Number:', 50, startY);
    doc.font('Helvetica').text(invoiceNumber, 150, startY);

    doc.font('Helvetica-Bold').text('Invoice Date:', 50, startY + 20);
    doc.font('Helvetica').text(
      new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      150,
      startY + 20
    );

    doc.font('Helvetica-Bold').text('Batch Reference:', 50, startY + 40);
    doc.font('Helvetica').text(batch.batch_reference, 150, startY + 40);

    // Right column - Payment details
    doc.font('Helvetica-Bold').text('Payment Status:', 350, startY);
    doc.font('Helvetica')
       .fillColor('#008000')
       .text('PAID', 450, startY);

    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .text('Payment Mode:', 350, startY + 20);
    doc.font('Helvetica').text(
      payment.payment_mode.toUpperCase(),
      450,
      startY + 20
    );

    if (payment.payment_gateway) {
      doc.font('Helvetica-Bold').text('Payment Gateway:', 350, startY + 40);
      doc.font('Helvetica').text(
        payment.payment_gateway.toUpperCase(),
        450,
        startY + 40
      );
    }

    doc.moveDown(2);
  }

  /**
   * Build school information section
   * @private
   */
  _buildSchoolInfo(doc, school) {
    const startY = 230;

    // Bill To section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#0070C0')
       .text('BILL TO:', 50, startY);

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(school.name, 50, startY + 25);

    doc.font('Helvetica')
       .text(`School Code: ${school.school_code}`, 50, startY + 45);

    if (school.contact_person) {
      doc.text(`Contact: ${school.contact_person.name}`, 50, startY + 60);
      doc.text(`Email: ${school.contact_person.email}`, 50, startY + 75);
      doc.text(`Phone: ${school.contact_person.phone}`, 50, startY + 90);
    }

    if (school.address) {
      const addressParts = [];
      if (school.address.street) addressParts.push(school.address.street);
      if (school.address.city) addressParts.push(school.address.city);
      if (school.address.state) addressParts.push(school.address.state);
      if (school.address.postal_code) addressParts.push(school.address.postal_code);
      if (school.address.country) addressParts.push(school.address.country);

      if (addressParts.length > 0) {
        doc.text(`Address: ${addressParts.join(', ')}`, 50, startY + 105, {
          width: 250
        });
      }
    }

    doc.moveDown(2);
  }

  /**
   * Build items table
   * @private
   */
  _buildItemsTable(doc, event, batch, registrations) {
    const tableTop = 400;
    const itemHeight = 20;

    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    // Header background
    doc.rect(50, tableTop, 495, 25)
       .fill('#0070C0');

    // Header text
    doc.fillColor('#FFFFFF')
       .text('Description', 60, tableTop + 7)
       .text('Quantity', 350, tableTop + 7, { width: 60, align: 'right' })
       .text('Rate', 420, tableTop + 7, { width: 60, align: 'right' })
       .text('Amount', 490, tableTop + 7, { width: 50, align: 'right' });

    // Table rows
    doc.font('Helvetica')
       .fillColor('#000000');

    let currentY = tableTop + 35;

    // Event registration item
    const description = `${event.title} - Student Registration`;
    const quantity = batch.student_count;
    const rate = batch.base_fee_per_student;
    const amount = batch.subtotal_amount;

    doc.text(description, 60, currentY, { width: 270 });
    doc.text(quantity.toString(), 350, currentY, { width: 60, align: 'right' });
    doc.text(
      formatCurrency(rate, batch.currency),
      420,
      currentY,
      { width: 60, align: 'right' }
    );
    doc.text(
      formatCurrency(amount, batch.currency),
      490,
      currentY,
      { width: 50, align: 'right' }
    );

    // Student list (if space available)
    if (registrations && registrations.length > 0 && registrations.length <= 15) {
      currentY += 30;
      doc.fontSize(8)
         .fillColor('#666666')
         .text('Students:', 60, currentY);

      currentY += 12;
      registrations.forEach((reg, index) => {
        if (currentY < 650) { // Check page limit
          doc.text(
            `${index + 1}. ${reg.student_name} - Grade ${reg.grade} ${reg.section || ''}`,
            60,
            currentY
          );
          currentY += 12;
        }
      });
    }

    doc.fontSize(10).fillColor('#000000');
  }

  /**
   * Build pricing summary
   * @private
   */
  _buildPricingSummary(doc, batch) {
    const summaryTop = 630;

    // Summary box
    doc.fontSize(10)
       .font('Helvetica');

    // Subtotal
    doc.text('Subtotal:', 370, summaryTop, { width: 100, align: 'right' });
    doc.text(
      formatCurrency(batch.subtotal_amount, batch.currency),
      480,
      summaryTop,
      { width: 60, align: 'right' }
    );

    // Discount
    if (batch.discount_percentage > 0) {
      doc.text(
        `Discount (${batch.discount_percentage}%):`,
        370,
        summaryTop + 20,
        { width: 100, align: 'right' }
      );
      doc.text(
        `- ${formatCurrency(batch.discount_amount, batch.currency)}`,
        480,
        summaryTop + 20,
        { width: 60, align: 'right' }
      );
    }

    // Total line
    doc.moveTo(370, summaryTop + (batch.discount_percentage > 0 ? 45 : 25))
       .lineTo(545, summaryTop + (batch.discount_percentage > 0 ? 45 : 25))
       .strokeColor('#000000')
       .lineWidth(1)
       .stroke();

    // Total amount
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(
         'Total Amount:',
         370,
         summaryTop + (batch.discount_percentage > 0 ? 55 : 35),
         { width: 100, align: 'right' }
       );
    doc.fontSize(14)
       .fillColor('#0070C0')
       .text(
         formatCurrency(batch.total_amount, batch.currency),
         480,
         summaryTop + (batch.discount_percentage > 0 ? 55 : 35),
         { width: 60, align: 'right' }
       );

    doc.fillColor('#000000').fontSize(10);
  }

  /**
   * Build payment information
   * @private
   */
  _buildPaymentInfo(doc, payment) {
    const paymentInfoTop = 710;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#0070C0')
       .text('PAYMENT INFORMATION:', 50, paymentInfoTop);

    doc.font('Helvetica')
       .fillColor('#000000')
       .fontSize(9);

    let infoY = paymentInfoTop + 20;

    if (payment.payment_mode === 'online' && payment.gateway_payment_id) {
      doc.text(`Transaction ID: ${payment.gateway_payment_id}`, 50, infoY);
      infoY += 15;
    }

    if (payment.paid_at) {
      doc.text(
        `Payment Date: ${new Date(payment.paid_at).toLocaleDateString('en-US')}`,
        50,
        infoY
      );
      infoY += 15;
    }

    if (payment.payment_mode === 'offline' && payment.offline_payment_details) {
      const offline = payment.offline_payment_details;
      if (offline.transaction_reference) {
        doc.text(`Transaction Reference: ${offline.transaction_reference}`, 50, infoY);
        infoY += 15;
      }
      if (offline.verified_at) {
        doc.text(
          `Verified On: ${new Date(offline.verified_at).toLocaleDateString('en-US')}`,
          50,
          infoY
        );
      }
    }
  }

  /**
   * Build footer
   * @private
   */
  _buildFooter(doc) {
    const footerTop = 780;

    // Footer line
    doc.moveTo(50, footerTop)
       .lineTo(545, footerTop)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    // Footer text
    doc.fontSize(8)
       .fillColor('#666666')
       .text(
         'Thank you for registering with GEMA Events!',
         50,
         footerTop + 10,
         { align: 'center', width: 495 }
       );

    doc.text(
      'For any queries, please contact us at support@gema-events.com',
      50,
      footerTop + 22,
      { align: 'center', width: 495 }
       );

    doc.fontSize(7)
       .text(
         'This is a computer-generated invoice and does not require a signature.',
         50,
         footerTop + 34,
         { align: 'center', width: 495 }
       );

    // Page numbers (if multiple pages)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           footerTop + 50,
           { align: 'right', width: 495 }
         );
    }
  }

  /**
   * Generate invoice and send via email
   * @param {Object} paymentData - Payment data
   * @param {string} recipientEmail - Email to send invoice to
   * @returns {Promise<Object>}
   */
  async generateAndEmail(paymentData, recipientEmail) {
    // Generate invoice
    const invoiceResult = await this.generateInvoice(paymentData);

    // Send invoice via email
    try {
      await emailService.sendInvoiceEmail(
        {
          school: paymentData.school,
          event: paymentData.event,
          batch: paymentData.batch,
          invoiceNumber: invoiceResult.invoiceNumber
        },
        invoiceResult.buffer
      );
      logger.info(`Invoice ${invoiceResult.invoiceNumber} emailed to: ${recipientEmail}`);
    } catch (emailError) {
      logger.error(`Failed to email invoice ${invoiceResult.invoiceNumber}:`, emailError);
      // Don't throw - invoice was generated, email is secondary
    }

    return invoiceResult;
  }

  /**
   * Upload invoice with retry logic (3 attempts with exponential backoff)
   * @private
   * @param {Buffer} buffer - PDF buffer
   * @param {string} invoiceNumber - Invoice number
   * @param {string} batchReference - Batch reference
   * @returns {Promise<Object>}
   */
  async _uploadWithRetry(buffer, invoiceNumber, batchReference, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Invoice upload attempt ${attempt}/${maxRetries} for ${invoiceNumber}`);

        const uploadResult = await storageService.uploadInvoice(
          buffer,
          invoiceNumber,
          batchReference
        );

        logger.info(`Invoice uploaded successfully on attempt ${attempt}: ${invoiceNumber}`);
        return uploadResult;

      } catch (error) {
        lastError = error;
        logger.warn(`Invoice upload attempt ${attempt} failed for ${invoiceNumber}:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          logger.info(`Retrying invoice upload after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    logger.error(`Invoice upload failed after ${maxRetries} attempts for ${invoiceNumber}:`, lastError);
    throw new AppError('Failed to upload invoice after multiple attempts', 500);
  }

  /**
   * Regenerate invoice (for corrections)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>}
   */
  async regenerateInvoice(paymentData) {
    logger.info(`Regenerating invoice for payment: ${paymentData.payment._id}`);
    return await this.generateInvoice(paymentData);
  }
}

// Export singleton instance
module.exports = new InvoiceService();
