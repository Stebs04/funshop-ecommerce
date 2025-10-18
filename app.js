'use strict';

console.log('✅ FILE AUTH.JS CARICATO CORRETTAMENTE');

const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const passportConfig = require('./middleware/passport-config');
const flash = require('connect-flash');
const morgan = require('morgan'); // Per il logging delle richieste

// Importazione dei file di rotte
const authRoutes = require('./route/auth');
const mainRoutes = require('./route/home');
const userRoutes = require('./route/userRoutes');
const productRoutes = require('./route/productRoutes');
const memberRoutes = require('./route/memberRoutes');
const sellerRoutes = require('./route/sellerRoutes');
const recensioniRoutes = require('./route/recensioniRoutes');
const informationRoutes = require('./route/information');
const cartRoutes = require('./route/cartRoutes');

const app = express();

// Configurazione del motore di template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurazione dei middleware
app.use(morgan('dev')); // Mostra le richieste HTTP nel terminale (utile per il debug)
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statici (CSS, JS, immagini)
app.use(express.urlencoded({ extended: true })); // Legge i dati dei form
app.use(express.json()); // Legge i dati JSON (utile per API future)

// Configurazione delle sessioni (più sicura, come nella guida)
app.use(
  session({
    secret: process.env.SECRET_SESSION, // Mettila in un file .env in produzione!
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Imposta a 'true' se usi HTTPS
      maxAge: 24 * 60 * 60 * 1000, // Durata della sessione: 24 ore
    },
  }),
);

// Configurazione di Flash per i messaggi e di Passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.session = req.session; 
    
    // --- AGGIUNGI QUESTA RIGA ---
    res.locals.originalUrl = req.originalUrl; // Rende disponibile l'URL corrente

    next();
});

// Utilizzo dei router
app.use('/', mainRoutes); // Rotte principali (es. homepage)
app.use('/auth', authRoutes); // Rotte di autenticazione (es. /auth/login)
app.use('/utente', userRoutes);
app.use('/products', productRoutes);
app.use('/member', memberRoutes);
app.use('/venditore', sellerRoutes);
app.use('/recensioni', recensioniRoutes);
app.use('/information', informationRoutes);
app.use('/carrello', cartRoutes);

// --- NUOVA API PER LO STATO DELL'AUTENTICAZIONE ---
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    // Se l'utente è loggato, invia i suoi dati (ma non quelli sensibili)
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        tipo_account: req.user.tipo_account
      }
    });
  } else {
    // Se non è loggato, invia una risposta chiara
    res.json({ isAuthenticated: false });
  }
});

// Gestione degli errori 404 (Pagina non trovata)
app.use((req, res) => {
  req.flash('error', 'La pagina richiesta non è stata trovata.');
  res.status(404).render('pages/error', { title: 'Pagina non Trovata' }); // Assicurati di avere un file error.ejs
});

module.exports = app;