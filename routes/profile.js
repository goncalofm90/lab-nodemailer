const dotenv = require('dotenv');
dotenv.config();
const { Router } = require('express');
const router = new Router();
const User = require('./../models/user');


router.get('/', (req, res, next) => {
  res.render('profile');
});




module.exports = router;
