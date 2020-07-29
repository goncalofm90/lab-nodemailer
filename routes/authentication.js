const dotenv = require('dotenv');
dotenv.config();
const { Router } = require('express');
const router = new Router();
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
})

const User = require('./../models/user');
const bcryptjs = require('bcryptjs');
const generateRandomToken = length => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  return token;
};  

router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { name, email, password } = req.body;
  const token = generateRandomToken(10);
  bcryptjs
    .hash(password, 10)
    .then(hash => {
      return User.create({
        name,
        email,
        passwordHash: hash,
        confirmationToken: token,
      });
    })
    .then(user => {
      req.session.user = user._id;
      const confirmationUrl = `http://localhost:3000/authentication/confirm-email?token=${token}`;
      transport.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: process.env.NODEMAILER_EMAIL,
        subject: 'An email from Gonçalo',
        // text: 'Hello World',
        html: `
        <html>
          <head>
           </head>
             <body>
             <h1>Welcome</h1>
                <img src="https://images.unsplash.com/photo-1550291652-6ea9114a47b1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=934&q=80" width="300px" height="300px" alt="">
                <p><a href="${confirmationUrl}">Confirmation Link</a></p>
             </body>
           </html>
              `,
      })
      .then(result => {
      req.session.user = user._id;
      console.log('Email was sent');
      console.log(result);
      res.redirect('/');
      })
      .catch(error => {
        console.log('Error sending email');
        console.log(error);
      })
    })
    .catch(error => {
      next(error);
    });
});

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then(result => {
      if (result) {
        req.session.user = userId;
        res.redirect('/');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch(error => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

const routeGuard = require('./../middleware/route-guard');

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

router.get('/authentication/confirm-email', (req, res, next) => {
  const emailToken = req.query.token;
  User.findOneAndUpdate(
    { confirmationToken: emailToken}, 
    {status: 'active'},
    {new: true}
  )
  .then(user => {
    req.session.user = user._id;
    req.session.user = user.token;
    console.log(user.token);
    res.render('confirmation');
    console.log("email was confirmed succesfully");
    })
    .catch(error => {
     next(error);
    });
  });

module.exports = router;
