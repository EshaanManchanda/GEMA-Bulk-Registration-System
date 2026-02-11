const Event = require('../models/Event');
const asyncHandler = require('./async.middleware');

/**
 * Verify Chatbot API Key
 * Checks specifically for X-API-Key header from the WP plugin
 * Attaches the linked event to req.event if found
 */
exports.verifyChatbotApiKey = asyncHandler(async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    // If no key provided, proceed as public/generic request
    // The controller will handle generic vs specific logic
    if (!apiKey) {
        return next();
    }

    // Search for event with this API key
    // We check both India and International configs
    const event = await Event.findOne({
        $or: [
            { 'chatbot_config_india.api_key': apiKey },
            { 'chatbot_config_international.api_key': apiKey }
        ],
        status: 'active' // Only allow active/published events
    });

    if (!event) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API Key'
        });
    }

    // Determine which config matched
    let config = null;
    let location = 'global';

    if (event.chatbot_config_india?.api_key === apiKey) {
        config = event.chatbot_config_india;
        location = 'india';
    } else if (event.chatbot_config_international?.api_key === apiKey) {
        config = event.chatbot_config_international;
        location = 'international';
    }

    // Attach to request
    req.event = event;
    req.chatbotConfig = config;
    req.chatbotLocation = location;

    // Log for debugging
    console.log(`[Chatbot Auth] Authorized request for event: ${event.title} (${location})`);

    next();
});
