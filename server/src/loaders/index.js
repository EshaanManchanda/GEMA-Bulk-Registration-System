const expressLoader = require('./express');

module.exports = {
    init: async ({ expressApp }) => {
        await expressLoader({ app: expressApp });
        console.log('✅ Express Initialized');
    }
};
