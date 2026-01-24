const authRoutes = require('../routes/auth.routes');
const batchRoutes = require('../routes/batch.routes');
const paymentRoutes = require('../routes/payment.routes');
const invoiceRoutes = require('../routes/invoice.routes');
const adminRoutes = require('../routes/admin.routes');
const formBuilderRoutes = require('../routes/formBuilder.routes');
const eventRoutes = require('../routes/event.routes');
const mediaRoutes = require('../routes/media.routes');
const chatbotRoutes = require('../routes/chatbot.routes');
const registrationRoutes = require('../routes/registration.routes');
const brandRoutes = require('../routes/brand.routes');
const cors = require('cors');

module.exports = (app) => {
    // Mount routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/batches', batchRoutes);
    app.use('/api/v1/payments', paymentRoutes);
    app.use('/api/v1/invoices', invoiceRoutes);
    app.use('/api/v1/admin', adminRoutes);
    app.use('/api/v1/form-builder', formBuilderRoutes);
    app.use('/api/v1/events', eventRoutes);
    app.use('/api/v1/chatbot', chatbotRoutes);
    app.use('/api/v1/registrations', registrationRoutes);
    app.use('/api/v1/brand', brandRoutes);

    // Public media routes with open CORS (allows access from any origin)
    app.use('/api/v1/media', cors({
        origin: '*',
        credentials: false,
        methods: ['GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type']
    }), mediaRoutes);
};
