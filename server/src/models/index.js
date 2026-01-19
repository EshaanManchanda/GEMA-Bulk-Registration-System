/**
 * Central export for all database models
 */

const School = require('./School');
const Event = require('./Event');
const Batch = require('./Batch');
const Registration = require('./Registration');
const Payment = require('./Payment');
const Admin = require('./Admin');
const CountryCurrency = require('./CountryCurrency');

module.exports = {
  School,
  Event,
  Batch,
  Registration,
  Payment,
  Admin,
  CountryCurrency
};
