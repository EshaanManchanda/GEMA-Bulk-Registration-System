const express = require('express');
const loaders = require('./loaders');

const app = express();

// Initialize loaders
loaders.init({ expressApp: app });

module.exports = app;

