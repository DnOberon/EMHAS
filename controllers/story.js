var Story = require('../models/Story');
var User = require('../models/User');
var Feature = require('../models/Feature');
var cloudinary = require('cloudinary')
 , fs = require('fs');
var path = require('path');
var multer = require('multer');

/**
 * GET /feed
 * Get story feed
 */

exports.getFeed = function(req,res){
  var pagenumber = req.params.pagenumber
  if(pagenumber == undefined){pagenumber = 0;};
  Story
    .find()
    .skip(pagenumber * 15)
    .limit(15)
    .exec(function(err,stories){
      var endfeed = false;
      if(stories.length < 15 ){endfeed = true;};
      res.render('feed',{
        stories: stories,
        endfeed: endfeed,
      });
    });
};

/**
 * GET and POST /submit
 * Submit stories
 */


exports.getSubmit = function(req, res) {

  res.render('submit', {
    title: 'Story Submission'
  });
};

exports.postSubmit = function(req,res,next) {


    var id = req.user._id;

    if(req.files.image != undefined){
    cloudinary.uploader.upload(req.files.image.path,function(result){
      var story = new Story({
        title: req.body.title,
        owner: req.user._id,
        author: req.user.username,
        url: req.body.url,
        blurb: req.body.blurb,
        picture: result.url,
        bodytext: req.body.bodytext
      });


      story.save(function(err){
        if (err) return next(err);
        User.findByIdAndUpdate(
          story.owner,
          {$push: {"stories": story._id}},
          function(err,callback){
            if (err) return next(err);
            console.log('Nothere');
            res.redirect('/profile');
          });
      });

    });
  }
    else {
      var story = new Story({
        title: req.body.title,
        owner: req.user._id,
        author: req.user.username,
        url: req.body.url,
        blurb: req.body.blurb,
        bodytext: req.body.bodytext
      });


    story.save(function(err){
      if (err) return next(err);
      User.findByIdAndUpdate(
        story.owner,
        {$push: {"stories": story._id}},
        function(err,callback){
          if (err) return next(err);
          console.log('Nothere');
          res.redirect('/profile');
        });
    });
  };





};

/**
 * GET /account/:storyid
 * Find seperate stories
 */

exports.getViewStory = function(req,res){

  Story
    .findOne({author : req.params.username , slug : req.params.storyid})
    .exec(function(err,story){
      res.render('viewone', {
        title: 'Story Submission',
        story: story
      });
    });

};

/**
 * POST API Handlers
 * Favorite and Unfavorite stories
 * Delete, Edit (GET)
 */

exports.postFavoriteStory = function(req,res,next){
  User.findByIdAndUpdate(
    req.user._id,
    {$push: {"favorites": req.body._id}},
    function(err,callback){
      if (err) return next(err);
      console.log('A');
      res.send(true);
    });
};

exports.postUnfavoriteStory = function(req,res,next){
    User.findByIdAndUpdate(
      req.user._id,
      {$pull: {"favorites": req.body._id}},
      function(err,callback){
        if (err) return next(err);
        console.log('A');
        res.send(true);

      });

};

exports.postDeleteStory = function(req,res,next){
  console.log(req.body);
  Story.remove({_id:req.body.storyid}, function(err){});
  res.send(true);
};

exports.getEditStory = function(req,res,next){
  Story
    .findOne({author : req.user.username , slug : req.params.storyid})
    .exec(function(err,story){
      res.render('editstory', {
        title: 'Edit Story',
        story: story
      });
    });
};

exports.postEditStory = function(req,res,next){

  if(req.files.image != undefined){
    cloudinary.uploader.upload(req.files.image.path,function(result){
      Story
          .findOne({author : req.user.username , slug : req.params.storyid})
          .exec(function(err,story){
            if(story.title == req.body.title){
              story.title = req.body.title;
              story.url = req.body.url;
              story.blurb = req.body.blurb;
              story.feature = result;
              story.bodytext = req.body.bodytext;
              story.save(function(err,story){
                res.redirect('/profile');
              });
            }
            else {
              story.remove(function(err){
                var story = new Story({
                  id_: req.body._id,
                  title: req.body.title,
                  owner: req.user._id,
                  author: req.user.username,
                  url: req.body.url,
                  blurb: req.body.blurb,
                  bodytext: req.body.bodytext
                });
                story.save(function(err){
                  User.findByIdAndUpdate(
                    story.owner,
                    {$push: {"stories": story._id}},
                    function(err,callback){
                      if (err) return next(err);
                      console.log('Nothere');
                      res.redirect('/profile');
                    });

                });

              })
            }


      });
    });

  }
  else{
    Story
        .findOne({author : req.user.username , slug : req.params.storyid})
        .exec(function(err,story){
          if(story.title == req.body.title){
            story.title = req.body.title;
            story.url = req.body.url;
            story.blurb = req.body.blurb;
            story.bodytext = req.body.bodytext;
            story.save(function(err,story){
              res.redirect('/profile');
            });
          }
          else {
            story.remove(function(err){
              var story = new Story({
                id_: req.body._id,
                title: req.body.title,
                owner: req.user._id,
                author: req.user.username,
                url: req.body.url,
                blurb: req.body.blurb,
                bodytext: req.body.bodytext
              });
              story.save(function(err){
                User.findByIdAndUpdate(
                  story.owner,
                  {$push: {"stories": story._id}},
                  function(err,callback){
                    if (err) return next(err);
                    console.log('Nothere');
                    res.redirect('/profile');
                  });

              });

            })
          }


    });
  };



};
