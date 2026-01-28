const Chat = require('../../models/Chat');
const Event = require('../../models/Event');
const School = require('../../models/School');
const { detectIntent, extractEventInfo, extractEmail, generateConversationalResponse } = require('../../services/chatbot/huggingface.service');
const { generateCertificate, isCertificateAvailable } = require('../../services/chatbot/certificate.service');

/**
 * Send chat message and get bot response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    const MAX_MESSAGE_LENGTH = 2000;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: 'Message is required'
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.`
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        message: 'Session ID is required'
      });
    }

    const trimmedMessage = message.trim();

    // Get user info
    const userId = req.user?.id || null;
    const rawUserType = req.user?.user_type || 'anonymous';

    // Capitalize user_type for database (JWT uses lowercase, DB uses capitalized)
    const userType = rawUserType === 'school' ? 'School' :
      rawUserType === 'admin' ? 'Admin' :
        'anonymous';

    // Track response time - start timing
    const startTime = Date.now();

    // Detect intent
    const intent = await detectIntent(trimmedMessage);
    const eventInfo = extractEventInfo(trimmedMessage);
    const extractedEmail = extractEmail(trimmedMessage);

    let response = {
      message: '',
      data: null,
      suggestions: []
    };

    // Get user's country (for India vs International certificates)
    let userCountry = 'International';
    if (userId && userType === 'School') {
      const school = await School.findById(userId).select('country');
      userCountry = school?.country || 'International';
    }

    // Handle intents
    switch (intent) {
      case 'greeting':
        response.message = "Hello! I'm here to help you with event information, certificates, and registrations. What can I assist you with?";
        response.suggestions = [
          "Show me upcoming events",
          "Generate my certificate",
          "Check exam dates",
          "Payment information"
        ];
        break;

      case 'certificate':
        if (!extractedEmail) {
          response.message = 'To generate your certificate, please provide your email address.';
          response.data = { type: 'email_request' };
          response.suggestions = ['My email is example@email.com'];
        } else if (eventInfo.length === 0) {
          // List all events with certificates
          const events = await Event.find({ status: 'published' })
            .select('title event_slug certificate_config_india certificate_config_international');

          const eventsWithCerts = events.filter(e =>
            isCertificateAvailable(e, userCountry)
          );

          if (eventsWithCerts.length === 0) {
            response.message = 'No events currently have certificates available.';
            response.suggestions = ['Show me upcoming events'];
          } else {
            response.message = 'I can help you generate certificates for:\n\n';
            eventsWithCerts.forEach((e, i) => {
              response.message += `${i + 1}. ${e.title}\n`;
            });
            response.message += '\nPlease specify which event you need a certificate for.';

            response.data = {
              type: 'certificate_options',
              events: eventsWithCerts.map(e => ({
                id: e._id,
                title: e.title,
                slug: e.event_slug
              })),
              email: extractedEmail
            };

            response.suggestions = eventsWithCerts.slice(0, 3).map(e => `Certificate for ${e.title}`);
          }
        } else {
          // Find matching event
          const events = await Event.find({ status: 'published' });
          let matchedEvent = null;

          for (const info of eventInfo) {
            matchedEvent = events.find(e =>
              e.title.toLowerCase().includes(info.toLowerCase()) ||
              e.event_slug.toLowerCase().includes(info.toLowerCase())
            );
            if (matchedEvent) break;
          }

          if (matchedEvent && isCertificateAvailable(matchedEvent, userCountry)) {
            const certResult = await generateCertificate(matchedEvent, extractedEmail, userCountry);

            if (certResult.success) {
              response.message = `Certificate for ${matchedEvent.title} generated successfully!`;
              response.data = {
                type: 'certificate',
                download_url: certResult.data.download_url,
                event_title: matchedEvent.title,
                website_url: certResult.data.website_url
              };
              response.suggestions = [
                `Tell me more about ${matchedEvent.title}`,
                'Show all events'
              ];
            } else {
              response.message = `Unable to generate certificate: ${certResult.error}`;
              response.suggestions = [
                'Try with different email',
                `When is ${matchedEvent.title}?`
              ];
            }
          } else if (matchedEvent) {
            response.message = `Certificate generation is not enabled for ${matchedEvent.title}.`;
            response.suggestions = ['Show me other events'];
          } else {
            response.message = `Couldn't find event "${eventInfo.join(' ')}". Please check the name.`;
            response.suggestions = ['Show all events'];
          }
        }
        break;

      case 'exam_date':
        if (eventInfo.length === 0) {
          const events = await Event.find()
            .select('title event_start_date event_end_date registration_deadline status')
            .sort({ event_start_date: 1 })
            .limit(10);

          if (events.length === 0) {
            response.message = 'Currently, there are no events scheduled. Please check back later or contact us for more information.';
            response.suggestions = ['Show me other information', 'How to register?'];
          } else {
            response.message = '📅 **Upcoming Event Dates:**\n\n';
            events.slice(0, 5).forEach((e, i) => {
              response.message += `**${i + 1}. ${e.title}**\n`;
              response.message += `   📍 Event Date: ${new Date(e.event_start_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
              if (e.registration_deadline) {
                response.message += `   ⏰ Registration Deadline: ${new Date(e.registration_deadline).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
              }
              response.message += '\n';
            });

            if (events.length > 5) {
              response.message += `\n_And ${events.length - 5} more events..._`;
            }

            response.data = {
              type: 'event_list',
              events: events.slice(0, 5).map(e => ({
                id: e._id,
                title: e.title,
                event_date: e.event_start_date,
                registration_deadline: e.registration_deadline
              }))
            };

            response.suggestions = events.slice(0, 3).map(e => `Tell me about ${e.title}`);
          }
        } else {
          const events = await Event.find({ status: 'published' });
          let matchedEvent = null;

          for (const info of eventInfo) {
            matchedEvent = events.find(e =>
              e.title.toLowerCase().includes(info.toLowerCase()) ||
              e.event_slug.toLowerCase().includes(info.toLowerCase())
            );
            if (matchedEvent) break;
          }

          if (matchedEvent) {
            response.message = `**${matchedEvent.title}**\n\n`;
            response.message += `Event Dates: ${matchedEvent.event_start_date.toLocaleDateString()}`;
            if (matchedEvent.event_end_date > matchedEvent.event_start_date) {
              response.message += ` to ${matchedEvent.event_end_date.toLocaleDateString()}`;
            }
            response.message += `\n\nRegistration Deadline: ${matchedEvent.registration_deadline.toLocaleDateString()}`;

            response.data = {
              type: 'event_date',
              event: {
                id: matchedEvent._id,
                title: matchedEvent.title,
                start_date: matchedEvent.event_start_date,
                end_date: matchedEvent.event_end_date,
                registration_deadline: matchedEvent.registration_deadline
              }
            };

            response.suggestions = [
              `How to register for ${matchedEvent.title}?`,
              `What is the fee for ${matchedEvent.title}?`
            ];
          } else {
            response.message = `Couldn't find event "${eventInfo.join(' ')}".`;
            response.suggestions = ['Show all events'];
          }
        }
        break;

      case 'payment':
      case 'registration':
        if (eventInfo.length === 0) {
          const events = await Event.find()
            .select('title event_slug base_fee_inr base_fee_usd status')
            .limit(10);

          if (events.length === 0) {
            response.message = 'Currently, there are no events available for registration. Please check back later or contact us for more information.';
            response.suggestions = ['Contact support', 'Show upcoming events'];
          } else {
            response.message = '💳 **Available Events for Registration:**\n\n';
            events.forEach((e, i) => {
              const fee = userCountry === 'India' ? `₹${e.base_fee_inr}` : `$${e.base_fee_usd}`;
              response.message += `**${i + 1}. ${e.title}**\n`;
              response.message += `   💰 Fee: ${fee}\n\n`;
            });

            response.message += '\nPlease tell me which event you\'d like to register for, or visit our registration portal.';

            response.suggestions = events.slice(0, 3).map(e => `Register for ${e.title}`);
          }
        } else {
          const events = await Event.find();
          let matchedEvent = null;

          for (const info of eventInfo) {
            matchedEvent = events.find(e =>
              e.title.toLowerCase().includes(info.toLowerCase()) ||
              e.event_slug.toLowerCase().includes(info.toLowerCase())
            );
            if (matchedEvent) break;
          }

          if (matchedEvent) {
            const fee = userCountry === 'India' ? `₹${matchedEvent.base_fee_inr}` : `$${matchedEvent.base_fee_usd}`;

            response.message = `**${matchedEvent.title}**\n\n`;
            response.message += `Registration Fee: ${fee}\n`;
            response.message += `Registration Deadline: ${matchedEvent.registration_deadline.toLocaleDateString()}\n\n`;
            response.message += `To register, please visit our registration portal.\n\n`;
            response.message += `🔗 [Click here to view event details](/events/${matchedEvent.event_slug})`;

            response.data = {
              type: 'registration_info',
              event: {
                id: matchedEvent._id,
                title: matchedEvent.title,
                slug: matchedEvent.event_slug,
                fee: fee,
                deadline: matchedEvent.registration_deadline
              }
            };

            response.suggestions = [
              `Tell me more about ${matchedEvent.title}`,
              'Show bulk discount options'
            ];
          } else {
            response.message = `Couldn't find event "${eventInfo.join(' ')}".`;
            response.suggestions = ['Show all events'];
          }
        }
        break;

      case 'event_info':
        if (eventInfo.length === 0) {
          const events = await Event.find()
            .select('title short_description category status')
            .limit(10);

          if (events.length === 0) {
            response.message = 'Currently, there are no events available. Please check back later for exciting upcoming events!';
            response.suggestions = ['Contact us', 'Get notifications'];
          } else {
            response.message = '🎯 **Our Available Events:**\n\n';
            events.forEach((e, i) => {
              response.message += `**${i + 1}. ${e.title}**`;
              if (e.category) {
                response.message += ` _(${e.category})_`;
              }
              response.message += '\n';
              if (e.short_description) {
                response.message += `   ${e.short_description}\n`;
              }
              response.message += '\n';
            });

            response.message += '\nWould you like to know more about any specific event?';

            response.suggestions = events.slice(0, 3).map(e => `Tell me about ${e.title}`);
          }
        } else {
          const events = await Event.find();
          let matchedEvent = null;

          for (const info of eventInfo) {
            matchedEvent = events.find(e =>
              e.title.toLowerCase().includes(info.toLowerCase()) ||
              e.event_slug.toLowerCase().includes(info.toLowerCase())
            );
            if (matchedEvent) break;
          }

          if (matchedEvent) {
            response.message = `**${matchedEvent.title}**\n\n`;
            if (matchedEvent.description) {
              response.message += `${matchedEvent.description}\n\n`;
            }
            if (matchedEvent.grade_levels && matchedEvent.grade_levels.length > 0) {
              response.message += `Grade Levels: ${matchedEvent.grade_levels.join(', ')}\n`;
            }

            response.data = {
              type: 'event_info',
              event: {
                id: matchedEvent._id,
                title: matchedEvent.title,
                slug: matchedEvent.event_slug,
                description: matchedEvent.description,
                grade_levels: matchedEvent.grade_levels
              }
            };

            response.suggestions = [
              `When is ${matchedEvent.title}?`,
              `How to register for ${matchedEvent.title}?`
            ];
          } else {
            response.message = `Couldn't find event "${eventInfo.join(' ')}".`;
            response.suggestions = ['Show all events'];
          }
        }
        break;

      case 'general':
      default:
        const conversationalResp = await generateConversationalResponse(message);
        response.message = conversationalResp;
        response.suggestions = [
          'Show upcoming events',
          'Generate my certificate',
          'Help with registration'
        ];
        break;
    }

    // Save chat message
    await Chat.addMessage(sessionId, {
      text: trimmedMessage,
      sender: 'user',
      data: { intent }
    }, userId, userType);

    const responseTime = Date.now() - startTime;

    await Chat.addMessage(sessionId, {
      text: response.message,
      sender: 'bot',
      data: response.data,
      response_time: responseTime
    }, userId, userType);

    res.json(response);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      message: 'Something went wrong. Please try again.',
      suggestions: ['Try rephrasing your question']
    });
  }
};

const DEFAULT_HISTORY_LIMIT = 50;

/**
 * Get chat history
 */
exports.getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = Math.min(
      parseInt(req.query.limit) || DEFAULT_HISTORY_LIMIT,
      200
    );
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const chat = await Chat.findOne({ session_id: sessionId });

    if (!chat) {
      return res.json({ messages: [], total: 0 });
    }

    const total = chat.messages.length;
    const paginatedMessages = chat.messages.slice(offset, offset + limit);

    res.json({
      messages: paginatedMessages,
      total,
      limit,
      offset,
      summary: chat.getSummary()
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      message: 'Failed to retrieve chat history'
    });
  }
};

/**
 * Get chat statistics (Admin only)
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await Chat.getStats();
    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve statistics'
    });
  }
};

/**
 * Detect intent (testing endpoint)
 */
exports.detectIntentTest = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const intent = await detectIntent(message);
    res.json({ intent });

  } catch (error) {
    console.error('Intent detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
