var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var secrets = require('../config/secrets');

var messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,

})

module.exports = mongoose.model('Message', messageSchema);
