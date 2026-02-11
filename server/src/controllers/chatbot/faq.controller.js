const FAQ = require('../../models/FAQ');
const Event = require('../../models/Event');
const asyncHandler = require('../../middleware/async.middleware');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

/**
 * Get all FAQs
 * @route   GET /api/v1/chatbot/faqs
 * @access  Public
 */
exports.getFAQs = asyncHandler(async (req, res, next) => {
    const { eventId, location, category, lang } = req.query;

    const filter = { isActive: true };

    if (eventId) filter.eventId = eventId;
    if (location) filter.location = location;
    if (category) filter.category = category;
    if (lang) filter.lang = lang;

    const faqs = await FAQ.find(filter)
        .populate('eventId', 'title event_slug')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: faqs.length,
        data: faqs
    });
});

/**
 * Get single FAQ
 * @route   GET /api/v1/chatbot/faqs/:id
 * @access  Public
 */
exports.getFAQ = asyncHandler(async (req, res, next) => {
    const faq = await FAQ.findById(req.params.id)
        .populate('eventId', 'title event_slug');

    if (!faq) {
        return res.status(404).json({
            success: false,
            message: 'FAQ not found'
        });
    }

    res.json({
        success: true,
        data: faq
    });
});

/**
 * Create FAQ
 * @route   POST /api/v1/chatbot/faqs
 * @access  Private (Admin)
 */
exports.createFAQ = asyncHandler(async (req, res, next) => {
    const faq = await FAQ.create(req.body);

    res.status(201).json({
        success: true,
        data: faq
    });
});

/**
 * Update FAQ
 * @route   PUT /api/v1/chatbot/faqs/:id
 * @access  Private (Admin)
 */
exports.updateFAQ = asyncHandler(async (req, res, next) => {
    let faq = await FAQ.findById(req.params.id);

    if (!faq) {
        return res.status(404).json({
            success: false,
            message: 'FAQ not found'
        });
    }

    faq = await FAQ.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.json({
        success: true,
        data: faq
    });
});

/**
 * Delete FAQ
 * @route   DELETE /api/v1/chatbot/faqs/:id
 * @access  Private (Admin)
 */
exports.deleteFAQ = asyncHandler(async (req, res, next) => {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
        return res.status(404).json({
            success: false,
            message: 'FAQ not found'
        });
    }

    await faq.deleteOne();

    res.json({
        success: true,
        data: {},
        message: 'FAQ deleted successfully'
    });
});

/**
 * Search FAQs by query
 * @route   GET /api/v1/chatbot/faqs/search
 * @access  Public
 */
exports.searchFAQs = asyncHandler(async (req, res, next) => {
    const { q, location, eventId } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }

    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const filter = {
        isActive: true,
        $or: [
            { query: searchRegex },
            { keyword: searchRegex },
            { response: searchRegex }
        ]
    };

    // Add location filter (prefer specific location, fallback to global)
    if (location && location !== 'global') {
        filter.$and = [
            {
                $or: [
                    { location: location },
                    { location: 'global' }
                ]
            }
        ];
    }

    if (eventId) {
        filter.eventId = eventId;
    }

    const faqs = await FAQ.find(filter)
        .populate('eventId', 'title event_slug')
        .limit(10)
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: faqs.length,
        data: faqs
    });
});

/**
 * Import FAQs from CSV
 * @route   POST /api/v1/chatbot/faqs/import-csv
 * @access  Private (Admin)
 */
exports.importCSV = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a CSV file'
        });
    }

    const { eventId, location, lang } = req.body;
    const faqs = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            // Flexible column mapping handles different CSV headers
            const query = row.query || row.Question || row.question || row['Question Text'];
            const response = row.response || row.Answer || row.answer || row['Answer Text'];

            if (query && response) {
                const faq = {
                    query: query.trim(),
                    response: response.trim(),
                    keyword: (row.keyword || row.Keywords || row.keywords || '').trim(),
                    category: (row.category || row.Category || '').trim(),
                    intent: (row.intent || row.Intent || '').trim(),
                    lang: row.lang || lang || 'en',
                    location: row.location || location || 'global',
                    eventId: row.eventId || eventId || null,
                    custom: row.custom || ''
                };
                faqs.push(faq);
            }
        })
        .on('end', async () => {
            try {
                if (faqs.length === 0) {
                    // Delete uploaded file
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                    return res.status(400).json({
                        success: false,
                        message: 'No valid FAQs found in CSV. Please check columns (Query, Response)'
                    });
                }

                const result = await FAQ.insertMany(faqs, { ordered: false });

                // Delete uploaded file
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                res.json({
                    success: true,
                    count: result.length,
                    data: result,
                    message: `Successfully imported ${result.length} FAQs`
                });
            } catch (error) {
                // Delete uploaded file on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                res.status(500).json({
                    success: false,
                    message: 'Error importing FAQs',
                    error: error.message
                });
            }
        })
        .on('error', (error) => {
            // Delete uploaded file on error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.status(500).json({
                success: false,
                message: 'Error parsing CSV file',
                error: error.message
            });
        });
});

/**
 * Export FAQs to CSV
 * @route   GET /api/v1/chatbot/faqs/export
 * @access  Private (Admin)
 */
exports.exportCSV = asyncHandler(async (req, res, next) => {
    const { eventId, location } = req.query;

    const filter = { isActive: true };
    if (eventId) filter.eventId = eventId;
    if (location) filter.location = location;

    const faqs = await FAQ.find(filter).populate('eventId', 'title');

    // Define fixed headers for consistent export
    const headers = ['query', 'response', 'keyword', 'category', 'intent', 'eventTitle', 'location', 'lang', 'custom'];

    // Create CSV rows with explicit quoting handles commas/newlines properly
    const csvRows = [
        headers.join(','),
        ...faqs.map(faq => {
            return headers.map(header => {
                let val = '';
                if (header === 'eventTitle') val = faq.eventId?.title || 'Global';
                else if (header === 'eventId') val = faq.eventId?._id || '';
                else val = faq[header] || '';

                // Escape double quotes by doubling them, and wrap value in quotes
                const escaped = String(val).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',');
        })
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=faqs_export.csv');
    res.send(csvRows.join('\n'));
});

/**
 * Generate embeddings for FAQs using Hugging Face
 * @route   POST /api/v1/chatbot/faqs/generate-embeddings
 * @access  Private (Admin)
 */
exports.generateEmbeddings = asyncHandler(async (req, res, next) => {
    const HF_TOKEN = process.env.HF_TOKEN;

    if (!HF_TOKEN) {
        return res.status(500).json({
            success: false,
            message: 'Hugging Face token not configured'
        });
    }

    // Get FAQs without embeddings
    const faqs = await FAQ.find({
        isActive: true,
        $or: [
            { embedding: { $exists: false } },
            { embedding: { $size: 0 } }
        ]
    });

    if (faqs.length === 0) {
        return res.json({
            success: true,
            count: 0,
            message: 'All FAQs already have embeddings'
        });
    }

    let successCount = 0;
    let errorCount = 0;

    // Process FAQs in batches to avoid API rate limits
    const batchSize = 10;
    for (let i = 0; i < faqs.length; i += batchSize) {
        const batch = faqs.slice(i, i + batchSize);

        await Promise.all(batch.map(async (faq) => {
            try {
                const response = await axios.post(
                    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
                    { inputs: faq.query },
                    {
                        headers: {
                            'Authorization': `Bearer ${HF_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                if (response.data && Array.isArray(response.data)) {
                    faq.embedding = response.data;
                    await faq.save();
                    successCount++;
                }
            } catch (error) {
                console.error(`Error generating embedding for FAQ ${faq._id}:`, error.message);
                errorCount++;
            }
        }));

        // Small delay between batches
        if (i + batchSize < faqs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    res.json({
        success: true,
        count: successCount,
        errors: errorCount,
        message: `Generated embeddings for ${successCount} FAQs${errorCount > 0 ? `, ${errorCount} errors` : ''}`
    });
});

/**
 * Find similar FAQs using embeddings
 * @route   POST /api/v1/chatbot/faqs/similar
 * @access  Public
 */
exports.findSimilar = asyncHandler(async (req, res, next) => {
    const { query, location, eventId, limit = 5 } = req.body;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Query is required'
        });
    }

    const HF_TOKEN = process.env.HF_TOKEN;

    if (!HF_TOKEN) {
        // Fallback to keyword search if no HF token
        return exports.searchFAQs(req, res, next);
    }

    try {
        // Generate embedding for query
        const response = await axios.post(
            'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
            { inputs: query },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const queryEmbedding = response.data;

        // Get FAQs with embeddings
        const filter = {
            isActive: true,
            embedding: { $exists: true, $ne: [] }
        };

        if (location && location !== 'global') {
            filter.$or = [
                { location: location },
                { location: 'global' }
            ];
        }

        if (eventId) {
            filter.eventId = eventId;
        }

        const faqs = await FAQ.find(filter).populate('eventId', 'title event_slug');

        // Calculate cosine similarity
        const faqsWithSimilarity = faqs.map(faq => {
            const similarity = cosineSimilarity(queryEmbedding, faq.embedding);
            return {
                ...faq.toObject(),
                similarity
            };
        });

        // Sort by similarity and return top results
        const sortedFAQs = faqsWithSimilarity
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            count: sortedFAQs.length,
            data: sortedFAQs
        });

    } catch (error) {
        console.error('Error finding similar FAQs:', error.message);
        // Fallback to keyword search
        req.query.q = query;
        req.query.location = location;
        req.query.eventId = eventId;
        return exports.searchFAQs(req, res, next);
    }
});

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        magnitude1 += vec1[i] * vec1[i];
        magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
}
