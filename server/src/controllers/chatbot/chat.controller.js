const Chat = require('../../models/Chat');
const Event = require('../../models/Event');
const School = require('../../models/School');
const FAQ = require('../../models/FAQ');
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

    // Get user's country (for India vs International)
    let userCountry = 'International';
    let userLocation = req.body.location || 'international'; // Default to international, or use provided location

    // If API Key based auth was used, enforce location from config
    if (req.chatbotLocation) {
      userLocation = req.chatbotLocation;
      userCountry = userLocation === 'india' ? 'India' : 'International';
    } else if (userId && userType === 'School') {
      const school = await School.findById(userId).select('country');
      userCountry = school?.country || 'International';
      userLocation = userCountry === 'India' ? 'india' : 'international';
    } else if (req.body.location) {
      // If provided in body (e.g. from plugin), map it to userCountry format just in case it's needed elsewhere
      if (req.body.location.toLowerCase() === 'india') {
        userCountry = 'India';
      }
    }

    // Scoped Event ID from middleware
    const scopedEventId = req.event ? req.event._id : null;

    // Try to find FAQ match first (before intent handling)
    const faqMatch = await searchFAQ(trimmedMessage, userLocation, scopedEventId);

    if (faqMatch) {
      response.message = faqMatch.response;
      response.data = {
        type: 'faq',
        faq_id: faqMatch._id,
        category: faqMatch.category
      };
      response.suggestions = [
        "Tell me more",
        "Show upcoming events",
        "How to register?"
      ];

      // Save FAQ response and return
      await Chat.addMessage(sessionId, {
        text: trimmedMessage,
        sender: 'user',
        data: { intent: 'faq_query' }
      }, userId, userType);

      const responseTime = Date.now() - startTime;

      await Chat.addMessage(sessionId, {
        text: response.message,
        sender: 'bot',
        data: response.data,
        response_time: responseTime
      }, userId, userType);

      return res.json(response);
    }

    // Handle intents if no FAQ match
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
          // List all events with certificates (scoped if API key used)
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery)
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
          // Find matching event (scoped)
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery);
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
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery)
            .select('title event_start_date event_end_date schedule status')
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
              const regDeadline = e.schedule?.registration_deadline;
              if (regDeadline) {
                response.message += `   ⏰ Registration Deadline: ${new Date(regDeadline).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
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
                registration_deadline: e.schedule?.registration_deadline
              }))
            };

            response.suggestions = events.slice(0, 3).map(e => `Tell me about ${e.title}`);
          }
        } else {
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery);
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
            const regDeadline = matchedEvent.schedule?.registration_deadline;
            if (regDeadline) {
              response.message += `\n\nRegistration Deadline: ${regDeadline.toLocaleDateString()}`;
            }

            response.data = {
              type: 'event_date',
              event: {
                id: matchedEvent._id,
                title: matchedEvent.title,
                start_date: matchedEvent.event_start_date,
                end_date: matchedEvent.event_end_date,
                registration_deadline: matchedEvent.schedule?.registration_deadline
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
          const eventQuery = { status: 'active' }; // Should ideally filter by published
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery)
            .select('title event_slug base_fee_inr base_fee_usd discounted_fee_inr discounted_fee_usd status')
            .limit(10);

          if (events.length === 0) {
            response.message = 'Currently, there are no events available for registration. Please check back later or contact us for more information.';
            response.suggestions = ['Contact support', 'Show upcoming events'];
          } else {
            response.message = '💳 **Available Events for Registration:**\n\n';
            events.forEach((e, i) => {
              const fee = userCountry === 'India' ? `₹${e.base_fee_inr}` : `$${e.base_fee_usd}`;
              const discountedFee = userCountry === 'India' ? e.discounted_fee_inr : e.discounted_fee_usd;
              response.message += `**${i + 1}. ${e.title}**\n`;
              response.message += `   💰 Fee: ${fee}`;
              if (discountedFee) {
                const discountedFeeFormatted = userCountry === 'India' ? `₹${discountedFee}` : `$${discountedFee}`;
                response.message += ` (Discounted: ${discountedFeeFormatted})`;
              }
              response.message += '\n\n';
            });

            response.message += '\nPlease tell me which event you\'d like to register for, or visit our registration portal.';

            response.suggestions = events.slice(0, 3).map(e => `Register for ${e.title}`);
          }
        } else {
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery);
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
            const discountedFee = userCountry === 'India' ? matchedEvent.discounted_fee_inr : matchedEvent.discounted_fee_usd;

            response.message = `**${matchedEvent.title}**\n\n`;
            response.message += `Registration Fee: ${fee}`;
            if (discountedFee) {
              const discountedFeeFormatted = userCountry === 'India' ? `₹${discountedFee}` : `$${discountedFee}`;
              response.message += ` | Discounted Fee: ${discountedFeeFormatted}`;
            }
            response.message += '\n';
            const regDeadline = matchedEvent.schedule?.registration_deadline;
            if (regDeadline) {
              response.message += `Registration Deadline: ${regDeadline.toLocaleDateString()}\n\n`;
            }
            response.message += `To register, please visit our registration portal.\n\n`;
            response.message += `🔗 [Click here to view event details](/events/${matchedEvent.event_slug})`;

            response.data = {
              type: 'registration_info',
              event: {
                id: matchedEvent._id,
                title: matchedEvent.title,
                slug: matchedEvent.event_slug,
                fee: fee,
                deadline: matchedEvent.schedule?.registration_deadline
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
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery)
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
          const eventQuery = { status: 'active' };
          if (scopedEventId) eventQuery._id = scopedEventId;

          const events = await Event.find(eventQuery);
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
 * Get dashboard stats (Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Chat.getStats();
    const totalFaqs = await FAQ.countDocuments({ isActive: true });

    const recentChats = await Chat.find()
      .sort({ last_activity: -1 })
      .limit(5)
      .select(
        'session_id user_type total_messages last_activity '
        + 'certificates_requested messages'
      )
      .lean();

    const recentConversations = recentChats.map((chat) => {
      const lastMsg = chat.messages?.[chat.messages.length - 1];
      return {
        session_id: chat.session_id,
        user_type: chat.user_type,
        total_messages: chat.total_messages,
        last_activity: chat.last_activity,
        certificates_requested: chat.certificates_requested,
        preview: lastMsg
          ? lastMsg.text.substring(0, 100)
          : '',
      };
    });

    res.json({
      stats: {
        total_chats: stats.total_chats,
        total_faqs: totalFaqs,
        total_messages: stats.total_messages,
        certificates_issued: stats.total_certificates,
      },
      recent_conversations: recentConversations,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve dashboard stats',
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

/**
 * Helper: Build a clean schedule object with only populated fields
 * and formatted dates for the chatbot event-data endpoint.
 */
function buildCleanSchedule(event) {
  const s = event.schedule;
  if (!s) return {};

  const formatDate = (date) => {
    if (!date) return undefined;
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return undefined;
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const clean = {};

  // Common fields
  if (s.registration_start) {
    clean.registration_start = formatDate(s.registration_start);
    clean.registration_start_raw = s.registration_start;
  }
  if (s.registration_deadline) {
    clean.registration_deadline = formatDate(s.registration_deadline);
    clean.registration_deadline_raw = s.registration_deadline;
  }
  if (s.result_date) {
    clean.result_date = formatDate(s.result_date);
    clean.result_date_raw = s.result_date;
  }

  // Event start/end (top-level model fields)
  clean.event_start = formatDate(event.event_start_date);
  clean.event_end = formatDate(event.event_end_date);
  clean.event_start_raw = event.event_start_date;
  clean.event_end_raw = event.event_end_date;

  // Type-specific
  if (event.schedule_type === 'single_date' && s.event_date) {
    clean.event_date = formatDate(s.event_date);
    clean.event_date_raw = s.event_date;
  }
  if (event.schedule_type === 'date_range' && s.date_range?.start) {
    clean.date_range = {
      start: formatDate(s.date_range.start),
      end: formatDate(s.date_range.end),
      start_raw: s.date_range.start,
      end_raw: s.date_range.end
    };
  }
  if (event.schedule_type === 'multiple_dates'
    && s.event_dates?.length > 0) {
    clean.event_dates = s.event_dates.map(d => ({
      label: d.label || undefined,
      date: formatDate(d.date),
      date_raw: d.date,
      registration_deadline: d.registration_deadline
        ? formatDate(d.registration_deadline) : undefined,
      registration_deadline_raw: d.registration_deadline || undefined
    }));
  }

  // Mock dates
  if (s.mock_date_1) {
    clean.mock_date_1 = formatDateTime(s.mock_date_1);
    clean.mock_date_1_raw = s.mock_date_1;
  }
  if (s.mock_date_2) {
    clean.mock_date_2 = formatDateTime(s.mock_date_2);
    clean.mock_date_2_raw = s.mock_date_2;
  }

  return clean;
}

/**
 * Helper: Search FAQ database
 */
async function searchFAQ(query, location, eventId = null) {
  try {
    if (!query) return null;

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    const regexQuery = new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const baseQuery = {
      isActive: true,
    };

    if (eventId) {
      // Strict scoping: Only FAQs for this event OR global FAQs (if we want to allow generic fallback)
      // User requested strict scoping: "website can access only the their website data only"
      // So we strictly filter by eventId OR (eventId is null AND location matches)
      // But wait, if I ask "what is physics?", that might be a global FAQ.
      // Usually event-specific FAQs have eventId set. Global ones don't.
      // Let's prioritize Event Specific, then Global/Location specific.

      // Actually, let's look for: (eventId == matchedId) OR (eventId == null AND location == matchedLocation)
      baseQuery.$or = [
        { eventId: eventId },
        { eventId: null, location: location }, // Fallback to generic location specific
        { eventId: null, location: 'global' }  // Fallback to global
      ];
    } else {
      baseQuery.$or = [
        { location: location },
        { location: 'global' }
      ];
    }

    // 1. Exact match
    const exactMatch = await FAQ.findOne({
      ...baseQuery,
      query: { $regex: regexQuery }
    }).sort({ eventId: -1 }); // Prioritize event specific (if eventId exists it will be higher than null?? No, ObjectId is just an ID. But we can sort by eventId existence... )

    // Better sorting strategy:
    // If we find multiple matches, we want the one with eventId matching first.
    // Mongoose sort might not handle "exists" easily.
    // Let's use the query itself to prioritize.

    if (eventId) {
      // Try strict event match first
      const eventMatch = await FAQ.findOne({
        query: { $regex: regexQuery },
        isActive: true,
        eventId: eventId
      });
      if (eventMatch) return eventMatch;
    }

    // Then try normal flow (location specific or global)
    // Note: if strict event scoping is required for ALL questions, we shouldn't fall back. 
    // But usually "How do I register?" is generic. "When is the exam?" is specific.
    // The user said: "not able to access other event data". 
    // So accessing global data (how to register) is probably fine. Accessing OTHER event data is bad.
    // My query above (baseQuery.$or) ensures we don't access OTHER event IDs.

    const match = await FAQ.findOne({
      ...baseQuery,
      query: { $regex: regexQuery }
    }); // This matches any in the OR list.

    if (match) return match;

    // 2. Keyword match (Text Search)
    const keywordAuth = await FAQ.find({
      ...baseQuery,
      $text: { $search: query }
    }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(1);

    if (keywordAuth && keywordAuth.length > 0) {
      return keywordAuth[0];
    }

    return null;
  } catch (error) {
    console.error('FAQ Search Error:', error);
    return null;
  }
}

/**
 * Get structured event data for plugin display
 */
exports.getEventData = async (req, res) => {
  try {
    // req.event is attached by verifyChatbotApiKey middleware
    const event = req.event;

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or API key invalid'
      });
    }

    // Determine currency based on location (attached by middleware)
    const location = req.chatbotLocation || 'international';
    const isIndia = location === 'india';

    const data = {
      // Basic Info
      _id: event._id,
      title: event.title,
      slug: event.event_slug,
      description: event.description,
      short_description: event.short_description,
      status: event.status,
      category: event.category,
      event_type: event.event_type,
      grade_levels: event.grade_levels,
      is_featured: event.is_featured,

      // Schedule — clean copy, only populated fields
      schedule_type: event.schedule_type,
      schedule: buildCleanSchedule(event),

      // Fees
      fees: {
        amount: isIndia ? event.base_fee_inr : event.base_fee_usd,
        currency: isIndia ? 'INR' : 'USD',
        symbol: isIndia ? '₹' : '$',
        base_fee_inr: event.base_fee_inr,
        base_fee_usd: event.base_fee_usd,
        bulk_discount_rules: event.bulk_discount_rules
      },

      // Capacity
      max_participants: event.max_participants,

      // Resources
      banner_image: event.banner_image_url,
      posters: event.posters,
      brochures: event.brochures,
      rules_document: event.rules_document_url,
      notice_url: event.notice_url,

      // Contact
      contact: {
        email: event.contact_email || 'support@scratcholympiads.com',
        phone: event.contact_phone || '',
        whatsapp: event.whatsapp_number || ''
      },

      // Discounted fees (location-specific)
      discounted_fee: isIndia ? (event.discounted_fee_inr || null) : (event.discounted_fee_usd || null),
      discounted_fee_inr: event.discounted_fee_inr || null,
      discounted_fee_usd: event.discounted_fee_usd || null,

      // Links
      registration_link: (isIndia ? event.certificate_config_india?.website_url : event.certificate_config_international?.website_url)
        || `${process.env.CLIENT_URL || 'https://scratcholympiads.com'}/events/${event.event_slug}`
    };

    // Fetch FAQs for this event
    const faqs = await FAQ.find({
      eventId: event._id,
      isActive: true
    }).select('query response keyword category intent location lang');

    // Format FAQs to include eventTitle and other requested fields
    const formattedFaqs = faqs.map(faq => ({
      _id: faq._id,
      query: faq.query,
      response: faq.response,
      keyword: faq.keyword,
      category: faq.category,
      intent: faq.intent,
      eventTitle: event.title,
      location: faq.location,
      lang: faq.lang
    }));

    res.json({
      success: true,
      data: {
        ...data,
        faqs: formattedFaqs
      }
    });

  } catch (error) {
    console.error('Get event data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event data'
    });
  }
};
