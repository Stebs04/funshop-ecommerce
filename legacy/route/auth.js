// File: route/auth.js
'use strict';

const express = require('express');
const router = express.Router();
const passport = require('../middleware/passport-config'); // Gestore dell'autenticazione
const { check, validationResult } = require('express-validator'); // Per la validazione dei form
const utentiDao = require('../models/dao/utenti-dao');
const cartDao = require('../models/dao/cart-dao');
const crypto = require('crypto'); // Modulo nativo di Node.js per la crittografia
const { sendPasswordResetEmail } = require('../services/emailService'); // Servizio per l'invio di email

/**
 * ROTTA: GET /auth/login
 * * Mostra semplicemente la pagina con il form di login.
 */
router.get('/login', (req, res) => {
    res.render('pages/login', {
        title: 'Login'
    });
});

/**
 * ROTTA: GET /auth/registrazione
 * * Mostra semplicemente la pagina con il form di registrazione.
 */
router.get('/registrazione', (req, res) => {
    res.render('pages/registrazione', {
        title: 'Registrazione'
    });
});

/**
 * ROTTA: POST /auth/login
 * * Gestisce il tentativo di login di un utente.
 */
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
        req.flash('error', info.message);
        return res.redirect('/auth/login');
      }

      req.logIn(user, async (err) => {
        if (err) { return next(err); }

        const sessionCart = req.session.cart;
        if (sessionCart && sessionCart.totalQty > 0) {
            await cartDao.mergeSessionCart(user.id, sessionCart);
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
        }

        const returnTo = req.session.returnTo;
        delete req.session.returnTo;

        return res.redirect(returnTo || '/');
      });
    })(req, res, next);
  }
);

/**
 * ROTTA: POST /auth/registrazione
 * * Gestisce la creazione di un nuovo account utente.
 */
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
      req.flash('error', 'Si è verificato un errore. L\'email o l\'username potrebbero essere già in uso.');
      return res.status(500).redirect('/auth/registrazione');
    }
  }
);

/**
 * ROTTA: GET /auth/logout
 * * Gestisce il logout dell'utente.
 */
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        // Pulisce il carrello dalla sessione per evitare che un utente guest veda il carrello precedente.
        req.session.cart = null;
        req.flash('success', 'Logout effettuato con successo.');
        res.redirect('/');
    });
});

/**
 * ROTTA: GET /auth/reset
 * * Mostra la pagina dove l'utente può inserire la propria email per richiedere il reset della password.
 */
router.get('/reset', (req, res) => {
    res.render('pages/reset-password-request', {
        title: 'Resetta Password'
    });
});

/**
 * ROTTA: POST /auth/reset
 * * Gestisce la richiesta di reset della password.
 */
router.post('/reset', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await utentiDao.getUser(email);

        if (!user) {
            req.flash('success', 'Se un account con questa email esiste, abbiamo inviato un link per il reset della password.');
            return res.redirect('/auth/reset');
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 ora da adesso

        await utentiDao.setUserResetToken(user.id, token, expires);

        const resetLink = `${req.protocol}://${req.get('host')}/auth/reset/${token}`;

        await sendPasswordResetEmail(user.email, resetLink);

        req.flash('success', 'Controlla la tua email per il link di reset della password.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error("Errore durante la richiesta di reset password:", error);
        req.flash('error', 'Si è verificato un errore.');
        res.redirect('/auth/reset');
    }
});

/**
 * ROTTA: GET /auth/reset/:token
 * * Mostra il form dove l'utente può inserire la sua nuova password.
 */
router.get('/reset/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await utentiDao.getUserByResetToken(token);

        if (!user) {
            req.flash('error', 'Il link per il reset della password non è valido o è scaduto.');
            return res.redirect('/auth/reset');
        }

        res.render('pages/reset-password-form', {
            title: 'Imposta Nuova Password',
            token: token
        });

    } catch (error) {
        console.error("Errore nella pagina di reset:", error);
        req.flash('error', 'Si è verificato un errore.');
        res.redirect('/auth/reset');
    }
});

/**
 * ROTTA: POST /auth/reset/:token
 * * Gestisce l'aggiornamento effettivo della password.
 */
router.post('/reset/:token', [
    check('password').isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri.'),
    check('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Le password non coincidono.');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect(`/auth/reset/${req.params.token}`);
    }

    try {
        const { token } = req.params;
        const user = await utentiDao.getUserByResetToken(token);

        if (!user) {
            req.flash('error', 'Il link per il reset della password non è valido o è scaduto.');
            return res.redirect('/auth/reset');
        }

        await utentiDao.updateUserPassword(user.id, req.body.password);
        await utentiDao.clearUserResetToken(user.id);

        req.flash('success', 'La tua password è stata aggiornata con successo! Ora puoi effettuare il login.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error("Errore durante l'aggiornamento della password:", error);
        req.flash('error', 'Si è verificato un errore.');
        res.redirect('/auth/reset');
    }
});

module.exports = router;