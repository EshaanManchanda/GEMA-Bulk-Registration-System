const mongoose = require('mongoose');
const Event = require('../server/src/models/Event');
const { EVENT_STATUS } = require('../server/src/utils/constants'); // Adjust path if needed
require('dotenv').config({ path: './server/.env' });

async function verifyModel() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 10);
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - 5);

        // 1. Create Event with Multiple Dates
        console.log('Creating Test Event...');
        const eventData = {
            title: 'Test Multidate Event',
            event_slug: 'test-multidate-' + Date.now(),
            status: 'active',
            schedule_type: 'multiple_dates',
            schedule: {
                registration_start: pastDate,
                registration_deadline: futureDate, // General deadline
                event_dates: [
                    {
                        date: futureDate,
                        registration_deadline: new Date(today.getTime() + 86400000) // Tomorrow
                    },
                    {
                        date: new Date(futureDate.getTime() + 86400000),
                        registration_deadline: new Date(today.getTime() - 86400000) // Yesterday (Closed)
                    }
                ]
            },
            // Legacy fields to ensure they are NOT blocking or interfering (though they should be ignored by schema)
            registration_start_date: pastDate,
            registration_deadline: futureDate
        };

        const event = await Event.create(eventData);
        console.log('Event created:', event._id);

        // 2. Verify Schema Structure
        const eventObj = event.toObject();

        // Check if root fields exist in the object (Mongoose might include them if they were in the payload and schema is not strict, OR strict is true and they are gone)
        // Actually, if I removed them from schema, they should NOT be in the document if strict is true (default).
        console.log('Root registration_start_date exists:', !!eventObj.registration_start_date);
        console.log('Root registration_deadline exists:', !!eventObj.registration_deadline);

        if (eventObj.registration_start_date || eventObj.registration_deadline) {
            console.warn('WARNING: Root registration fields still exist on the document!');
        } else {
            console.log('SUCCESS: Root registration fields are gone.');
        }

        console.log('Schedule registration_start:', event.schedule.registration_start);
        console.log('Schedule registration_deadline:', event.schedule.registration_deadline);

        // 3. Verify Virtuals
        console.log('Testing is_registration_open...');
        // Registration started 5 days ago.
        // General deadline is in 10 days.
        // Date 1 deadline is tomorrow (Open).
        // Date 2 deadline was yesterday (Closed).

        // The virtual is_registration_open checks if event is active AND reg started AND (now <= deadline).
        // But how does it handle multiple dates?
        // My implementation:
        /*
          eventSchema.virtual('is_registration_open').get(function () {
            // ...
            // If multiple dates, check if AT LEAST ONE date is still open? 
            // Or does it rely on the GENERAL schedule.registration_deadline?
            // Let's see what I wrote in previous turn.
          });
        */

        console.log('is_registration_open:', event.is_registration_open);

        console.log('Testing days_until_registration_closes...');
        console.log('days_until_registration_closes:', event.days_until_registration_closes);

        // 4. Cleanup
        await Event.deleteOne({ _id: event._id });
        console.log('Test Event deleted.');

    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        await mongoose.connection.close();
    }
}

verifyModel();
