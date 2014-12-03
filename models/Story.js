var mongoose = require('mongoose');
var User = require('../models/User');
var ObjectId = mongoose.Schema.Types.ObjectId;
var slug = require('mongoose-slug');


var storySchema = new mongoose.Schema({
  title: String,
  owner: { type: ObjectId, ref: 'User'},
  author: String,
  url: String,
  blurb: String,
  bodytext: String,
  feature: Boolean,
  upvotes: Number,
  pullquote: String,
  picture: String,
  featurepicture: String,
  featureCaption: String,
  upvoters: [{type : ObjectId, ref: 'User'}],
  numberOfComments: Number,
  comments:[{
              owner: { type: ObjectId, ref: 'User'},
              date: Number,
              body: String,
            }],
  displayoptions: String,

});

storySchema.methods.submit = function (callback){
  this.save(function(err){
    if (err) return next(err);
    User.findByIdAndUpdate(
      this.owner,
      {$push: {"submissions": this._id}},
      function(err,callback){
        if (err) return next(err);
        console.log('Nothere');
      });
  });

  console.log('Out of first loop');
  console.log(this.owner);


};

storySchema.plugin(slug('title'));

storySchema.methods.convertfeature = function (){};

module.exports = mongoose.model('Story', storySchema);
