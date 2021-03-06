var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var cloudinary = require('cloudinary');

/**
 * GET /login
 * Login page.
 */



exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/mom');
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 * Also consolidated signup into the same logic
 * as form was calling an API handler
 */

exports.postLogin = function(req, res, next) {

  if(req.body.Login != undefined){
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/login');
    }

    passport.authenticate('local', function(err, user, info) {
      if (err) return next(err);
      if (!user) {
        req.flash('errors', { msg: info.message });
        return res.redirect('/login');
      }
      req.logIn(user, function(err) {
        if (err) return next(err);
        req.flash('success', { msg: 'Success! You are logged in.' });
        res.redirect('/profile/' + req.user.username);
      });
    })(req, res, next);

  }
    else if(req.body.Signup != undefined) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('name','Name must not be empty').notEmpty();
  req.assert('name','Name must contain only alphanumeric characters (1-9,A-Z)').isAlphanumeric();
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  var user = new User({
    username: req.body.name,
    email: req.body.email,
    password: req.body.password,
    numberoffollowing: 0,
    numberoffollowers: 0,
    appreciations: 0,
  });

  User.findOne({ $or : [ {email: req.body.email} , {username: req.body.name} ]  }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email/username address already exists.' });
      return res.redirect('/login');
    }
    user.save(function(err) {
      if (err) return next(err);
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/profile');
      });
    });
  });


    };

};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/mom');
};

/**
 * GET /account
 * Profile page.
 */

exports.getAccount = function(req, res) {
  if(req.user.picture == undefined){req.flash('errors',{msg: 'Click here to change default Profile Picture'}); console.log('test');}
  res.render('account/profile', {
    title: 'Account Management'
  });
};

exports.getProfile = function(req, res) {
  var profilename = req.params.username;
  User
    .findOne({ username: req.params.username })
    .populate('stories followers following')
    .exec(function(err,profile){
      if (err) return handleError(err);
      if(profile){
        if(profile.username == req.user.username){ var userprofile = null }
          else { var userprofile = profile };

          res.render('account/userprofile', {
            title: 'Your Submissions',
            stories: profile.stories,
            userprofile: userprofile

            });
        }
        else {

          return res.redirect('/profile/' + req.user.username);
        };
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST updated profile photo
 */

exports.postUpdateProfilePhoto = function(req, res, next){
  if(req.files.image != undefined){
    cloudinary.uploader.upload(req.files.image.path,function(result){
      User.findById(req.user.id, function(err, user){
        if (err) return next(err);
        user.displayphoto = result;
        user.save(function(err){
          req.flash('success', { msg: 'Profile information updated.' });
          res.redirect('/account');
        })
      });

    })

  }
  else{
    req.flash('errors', { msg: 'No file selected' });
    return res.redirect('/account');
  }
};
/**
 * POST /account/password
 * Update current password.
 * @param password
 */

exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */

exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/mom');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 * @param provider
 */

exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */

exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/mom');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 * @param token
 */

exports.postReset = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Your Hackathon Starter password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/mom');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */

exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/mom');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */

exports.postForgot = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Reset your password on Hackathon Starter',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};

/**
 * API handlers for
 * Follow/Unfollower Author
 * Add/Remove Follower
 */

exports.postFollowAuthor = function(req,res,next){
  User.findByIdAndUpdate(
    req.user._id,
    {$addToSet: {"following": req.body._id}},
    function(err,callback){
      if (err) return next(err);
      console.log('A');
      res.send(true);
    });
};

exports.postUnfollowAuthor = function(req,res,next){
  User.findByIdAndUpdate(
    req.user._id,
    {$pull: {"following": req.body._id}},
    function(err,callback){
      if (err) return next(err);
      console.log('A');
      res.send(true);
    });
};

exports.postAddFollower = function(req,res,next){
  User.findByIdAndUpdate(
    req.body.userid,
    {$addToSet: {"followers": req.body._id}},
    function(err,callback){
      if (err) return next(err);
      console.log('A');
      res.send(true);
    });
};

exports.postRemoveFollower = function(req,res,next){
  User.findByIdAndUpdate(
    req.user._id,
    {$pull: {"followers": req.body._id}},
    function(err,callback){
      if (err) return next(err);
      console.log('A');
      res.send(true);
    });
};
