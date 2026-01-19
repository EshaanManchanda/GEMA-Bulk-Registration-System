const Chat = require('../../models/Chat');
const asyncHandler = require('../../middleware/async.middleware');

/**
 * Submit feedback for a bot message
 * @route   POST /api/v1/chatbot/feedback
 * @access  Private (requires auth)
 */
exports.submitFeedback = asyncHandler(async (req, res, next) => {
    const { sessionId, messageIndex, rating, comment } = req.body;

    if (!sessionId || messageIndex === undefined || !rating) {
        return res.status(400).json({
            message: 'Session ID, message index, and rating are required'
        });
    }

    if (!['helpful', 'not_helpful'].includes(rating)) {
        return res.status(400).json({
            message: 'Rating must be either "helpful" or "not_helpful"'
        });
    }

    const chat = await Chat.findOne({ session_id: sessionId });

    if (!chat) {
        return res.status(404).json({
            message: 'Chat session not found'
        });
    }

    await chat.submitFeedback(messageIndex, rating, comment);

    res.json({
        status: 'success',
        message: 'Feedback submitted successfully'
    });
});

/**
 * Get conversation trends (Admin only)
 * @route   GET /api/v1/chatbot/analytics/trends
 * @access  Private (Admin)
 */
exports.getConversationTrends = asyncHandler(async (req, res, next) => {
    const { period = '30d', groupBy = 'day' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Determine date format for grouping
    let dateFormat;
    switch (groupBy) {
        case 'day':
            dateFormat = '%Y-%m-%d';
            break;
        case 'week':
            dateFormat = '%Y-W%V';
            break;
        case 'month':
            dateFormat = '%Y-%m';
            break;
        default:
            dateFormat = '%Y-%m-%d';
    }

    const trends = await Chat.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                count: { $sum: 1 },
                total_messages: { $sum: '$total_messages' },
                avg_response_time: { $avg: '$average_response_time' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    res.json({
        status: 'success',
        data: {
            period,
            groupBy,
            trends
        }
    });
});

/**
 * Get performance metrics (Admin only)
 * @route   GET /api/v1/chatbot/analytics/performance
 * @access  Private (Admin)
 */
exports.getPerformanceMetrics = asyncHandler(async (req, res, next) => {
    const stats = await Chat.getStats();

    // Get response time distribution
    const responseTimeDistribution = await Chat.aggregate([
        { $match: { average_response_time: { $gt: 0 } } },
        {
            $bucket: {
                groupBy: '$average_response_time',
                boundaries: [0, 500, 1000, 2000, 5000, 10000],
                default: '10000+',
                output: {
                    count: { $sum: 1 }
                }
            }
        }
    ]);

    // Get top intents
    const topIntents = stats.intent_distribution.slice(0, 10);

    res.json({
        status: 'success',
        data: {
            overview: {
                total_chats: stats.total_chats,
                active_chats: stats.active_chats,
                resolved_chats: stats.resolved_chats,
                total_messages: stats.total_messages,
                average_response_time: stats.average_response_time,
                satisfaction_rate: stats.satisfaction_rate
            },
            feedback: {
                helpful: stats.helpful_responses,
                not_helpful: stats.not_helpful_responses,
                total: stats.helpful_responses + stats.not_helpful_responses
            },
            response_time_distribution: responseTimeDistribution,
            top_intents: topIntents
        }
    });
});

/**
 * Export chat conversation
 * @route   GET /api/v1/chatbot/export/:sessionId
 * @access  Private
 */
exports.exportConversation = asyncHandler(async (req, res, next) => {
    const { sessionId } = req.params;

    const chat = await Chat.findOne({ session_id: sessionId })
        .populate('user_id', 'name email school_code');

    if (!chat) {
        return res.status(404).json({
            message: 'Chat session not found'
        });
    }

    // Format for export
    const exportData = {
        session_id: chat.session_id,
        user: chat.user_id || 'Anonymous',
        user_type: chat.user_type,
        created_at: chat.createdAt,
        total_messages: chat.total_messages,
        average_response_time: chat.average_response_time,
        resolved: chat.resolved,
        messages: chat.messages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp,
            intent: msg.data?.intent,
            feedback: msg.feedback?.rating
        }))
    };

    res.json({
        status: 'success',
        data: exportData
    });
});
