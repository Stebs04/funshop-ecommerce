'use strict';

const express = require('express');
const router = express.Router();
const passport = require('./passport');
const { check, validationResult } = require('express-validator');
const utentiDao = require('./utenti-dao');

// --- NUOVO: ROTTE PER VISUALIZZARE LE PAGINE EJS ---

// Mostra la pagina di login e passa eventuali messaggi di errore/successo
router.get('/login', (req, res) => {
    res.render('pages/login', { 
        title: 'Login', 
        error: req.flash('error'), 
        success: req.flash('success') 
    });
});

// Mostra la pagina di registrazione e passa eventuali messaggi di errore
router.get('/registrazione', (req, res) => {
    res.render('pages/registrazione', { 
        title: 'Registrazione', 
        error: req.flash('error') 
    });
});


// --- ROTTE POST AGGIORNATE ---

/**
 * ROTTA PER IL LOGIN
 * Gestisce l'autenticazione e i reindirizzamenti con messaggi flash.
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
      return res.redirect('/login');
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('error', 'Credenziali non valide. Riprova.');
        return res.redirect('/login');
      }
      req.logIn(user, (err) => {
        if (err) { return next(err); }
        
        // La guida reindirizza a dashboard diverse, noi reindirizziamo alla home per utenti loggati.
        // Se in futuro avrai dashboard diverse per 'cliente' e 'venditore', la logica andrà qui.
        return res.redirect('/'); // Reindirizza alla home page dopo il login
      });
    })(req, res, next);
  }
);

/**
 * ROTTA PER LA REGISTRAZIONE
 * Gestisce la creazione di un nuovo utente con validazione e messaggi flash.
 */
router.post('/registrazione',
  [
    check('username').isLength({ min: 3 }).withMessage('L\'username deve avere almeno 3 caratteri.'),
    check('nome').notEmpty().withMessage('Il nome è obbligatorio.'),
    check('cognome').notEmpty().withMessage('Il cognome è obbligatorio.'),
    check('email').isEmail().withMessage('Inserisci un\'email valida.'),
    check('password').isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Se ci sono errori, li inviamo alla pagina di registrazione
      req.flash('error', errors.array().map(e => e.msg)); // Invia un array di messaggi
      return res.status(400).redirect('/registrazione');
    }

    try {
      await utentiDao.createUser(req.body);
      req.flash('success', 'Registrazione completata! Ora puoi effettuare il login.');
      res.redirect('/login');
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      req.flash('error', 'Si è verificato un errore. L\'email potrebbe essere già in uso.');
      res.status(500).redirect('/registrazione');
    }
  }
);

/**
 * ROTTA PER IL LOGOUT
 */
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'Logout effettuato con successo.');
        res.redirect('/login');
    });
});

module.exports = router;