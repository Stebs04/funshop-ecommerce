'use strict';

// Importazione dei moduli necessari per l'autenticazione
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const utentiDao = require('../models/dao/utenti-dao');

/**
 * Configurazione della "strategia locale" di Passport.js.
 * Questa logica viene eseguita quando un utente tenta di effettuare il login
 * tramite il form di email e password.
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',    // Specifica che il campo 'username' nel form è in realtà l'email
      passwordField: 'password', // Specifica il nome del campo password
    },
    async (email, password, done) => {
      try {
        // 1. Cerca l'utente nel database tramite l'email fornita.
        const user = await utentiDao.getUser(email);

        // 2. Se non viene trovato alcun utente, l'autenticazione fallisce.
        if (!user) {
          return done(null, false, { message: 'Email o password errate.' });
        }

        // 3. Se l'utente esiste, confronta la password fornita con l'hash salvato nel database.
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
          // Se le password corrispondono, l'autenticazione ha successo.
          return done(null, user);
        } else {
          // Se le password non corrispondono, l'autenticazione fallisce.
          return done(null, false, { message: 'Email o password errate.' });
        }
      } catch (err) {
        // Gestisce eventuali errori del server (es. database non raggiungibile).
        return done(err);
      }
    }
  )
);

/**
 * Serializzazione dell'utente.
 * Determina quali dati dell'utente salvare nella sessione.
 * Salviamo solo l'ID dell'utente per mantenere la sessione leggera e sicura.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserializzazione dell'utente.
 * Utilizza l'ID salvato nella sessione per recuperare i dati completi dell'utente
 * dal database ad ogni richiesta. L'oggetto 'user' risultante viene poi
 * allegato a `req.user`.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await utentiDao.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/**
 * Middleware per proteggere le rotte.
 * Verifica se un utente è autenticato prima di consentire l'accesso.
 * Se non lo è, salva l'URL originale e lo reindirizza alla pagina di login.
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Se l'utente è autenticato, prosegue con la richiesta.
    }
    // Salva l'URL a cui l'utente stava tentando di accedere per un reindirizzamento post-login.
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    res.redirect('/auth/login');
}

// Aggiunge la funzione `isLoggedIn` a passport per un accesso più comodo.
passport.isLoggedIn = isLoggedIn;

// Esporta l'oggetto passport configurato.
module.exports = passport;