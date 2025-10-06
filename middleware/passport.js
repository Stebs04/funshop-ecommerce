'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const utentiDao = require('../models/dao/utenti-dao'); // Importa il tuo DAO

/**
 * Configurazione della strategia di autenticazione locale (login).
 * Questa funzione viene eseguita quando un utente tenta di accedere.
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',    // Il campo del form per l'username è 'email'
      passwordField: 'password', // Il campo del form per la password è 'password'
    },
    async (email, password, done) => {
      try {
        // 1. Cerca l'utente nel database tramite email usando il DAO
        const user = await utentiDao.getUser(email);

        // 2. Se l'utente non viene trovato, l'autenticazione fallisce
        if (!user) {
          return done(null, false, { message: 'Nessun utente trovato con questa email.' });
        }

        // 3. Se l'utente esiste, confronta la password inviata con quella salvata (hash)
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
          // Se le password corrispondono, l'autenticazione ha successo
          return done(null, user);
        } else {
          // Se le password non corrispondono, l'autenticazione fallisce
          return done(null, false, { message: 'Password errata.' });
        }
      } catch (err) {
        // In caso di errore del server (es. database non raggiungibile)
        return done(err);
      }
    }
  )
);

/**
 * Serializzazione: decide cosa salvare nella sessione dell'utente.
 * Salviamo solo l'ID per mantenere la sessione leggera e sicura.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserializzazione: recupera i dati dell'utente dal database ad ogni richiesta.
 * Usa l'ID salvato nella sessione per trovare l'utente completo.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await utentiDao.getUserById(id);
    done(null, user); // L'oggetto 'user' sarà disponibile in req.user
  } catch (err) {
    done(err, null);
  }
});

// Esporta l'istanza di Passport completamente configurata
module.exports = passport;