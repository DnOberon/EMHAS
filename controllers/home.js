var mongoose = require('mongoose');
var Features = require('../models/Feature');
var Message = require('../models/Message');

exports.index = function(req, res) {
  var test = "test";
  Features.getFeatures(function(err,features){

    if(features.stories.length === 0){
      req.flash('errors', { msg: 'Weekly Features unable to load. If reloading the page does not solve this problem, please contact support.' });
    };
    res.render('home', {
      title: 'Home',
      features: features
    });
  });


};

exports.getAbout = function(req, res) {

    res.render('about', {
      title: 'Home',
    });



};
exports.getBook = function(req, res) {

    res.render('bookwriter/light', {
      title: 'Home',
    });



};

exports.postAuthorContact = function(req, res) {


  var message = new Message({
  name : req.body.name,
  message : req.body.message,
  email: req.body.email
});


  message.save(function(err){
    if (err) res.send(false);
    else res.send(true);

});

};
