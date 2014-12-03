var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Story = require('../models/Story');
var secrets = require('../config/secrets');

var featureSchema = new mongoose.Schema({
  week: Number,
  stories: [{type : ObjectId, ref: 'Story'}]

})

featureSchema.statics.getFeatures = function(cb){

  this
    .findOne({week : secrets.configuration.week})
    .populate('stories')
    .exec(function(err,features){
      if(err) return(err);
      cb(null, features);
    });

}

module.exports = mongoose.model('Feature', featureSchema);
