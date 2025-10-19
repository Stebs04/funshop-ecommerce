// File: route/auth.js
'use strict';

const express = require('express');
const router = express.Router();
const passport = require('../middleware/passport-config');
const { check, validationResult } = require('express-validator');
const utentiDao = require('../models/dao/utenti-dao');
const cartDao = require('../models/dao/cart-dao');

router.get('/login', (req, res) => {
    res.render('pages/login', { 
        title: 'Login', 
        error: req.flash('error'), 
        success: req.flash('success') 
    });
});

router.get('/registrazione', (req, res) => {
    res.render('pages/registrazione', { 
        title: 'Registrazione', 
        error: req.flash('error') 
    });
});

router.post('/login',
  [
    check('email').isEmail().withMessage('Deve essere un\'email valida.'),
    check('password').notEmpty().withMessage('La password non può essere vuota.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', 'Email o password non valide.');
      return res.redirect('/auth/login');
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('error', 'Credenziali non valide. Riprova.');
        return res.redirect('/auth/login');
      }
      req.logIn(user, async (err) => {
        if (err) { return next(err); }
        
        const sessionCart = req.session.cart;
        if (sessionCart && sessionCart.totalQty > 0) {
            await cartDao.mergeSessionCart(user.id, sessionCart);
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
        }
        
        return res.redirect('/');
      });
    })(req, res, next);
  }
);

router.post('/registrazione',
  [
    check('username').isLength({ min: 3 }).withMessage('L\'username deve avere almeno 3 caratteri.'),
    check('nome').notEmpty().withMessage('Il nome è obbligatorio.'),
    check('cognome').notEmpty().withMessage('Il cognome è obbligatorio.'),
    check('email').isEmail().withMessage('Inserisci un\'email valida.'),
    check('password').isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri.')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg));
      return res.status(400).redirect('/auth/registrazione');
    }

    try {
      const newUserId = await utentiDao.createUser(req.body);
      const newUser = await utentiDao.getUserById(newUserId);

      req.logIn(newUser, (err) => {
        if (err) {
          return next(err);
        }
        req.flash('success', 'Registrazione e login effettuati con successo!');
        return res.redirect('/');
      });

    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      req.flash('error', 'Si è verificato un errore. L\'email potrebbe essere già in uso.');
      return res.status(500).redirect('/auth/registrazione');
    }
  }
);

router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'Logout effettuato con successo.');
        res.redirect('/');
    });
});

module.exports = router;