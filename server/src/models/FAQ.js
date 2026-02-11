const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    keyword: {
        type: String,
        trim: true,
        index: true
    },
    response: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    intent: {
        type: String,
        trim: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    custom: {
        type: String,
        trim: true
    },
    lang: {
        type: String,
        default: 'en',
        trim: true
    },
    location: {
        type: String,
        enum: ['global', 'india', 'international'],
        default: 'global',
        trim: true
    },
    embedding: {
        type: [Number], // Array of floats for semantic search
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Text index for search
faqSchema.index({ query: 'text', keyword: 'text', response: 'text' });

// Compound index for efficient location queries
faqSchema.index({ location: 1, isActive: 1 });
faqSchema.index({ eventId: 1, location: 1, isActive: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
