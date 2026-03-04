'use strict';

// Importazione dei moduli necessari
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');

// Importazione delle configurazioni e delle rotte
const passportConfig = require('./middleware/passport-config');
const authRoutes = require('./route/auth');
const mainRoutes = require('./route/home');
const userRoutes = require('./route/userRoutes');
const productRoutes = require('./route/productRoutes');
const memberRoutes = require('./route/memberRoutes');
const sellerRoutes = require('./route/sellerRoutes');
const recensioniRoutes = require('./route/recensioniRoutes');
const informationRoutes = require('./route/information');
const cartRoutes = require('./route/cartRoutes');
const observedRoutes = require('./route/observedRoutes');
const orderRoutes = require('./route/orderRoutes');
const searchRoutes = require('./route/search');
const adminRoutes = require('./route/adminRoutes');

// Inizializzazione dell'applicazione Express
const app = express();

// Impostazione del motore di template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per il logging delle richieste HTTP in fase di sviluppo
app.use(morgan('dev'));
// Middleware per servire file statici (CSS, JS, immagini) dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Middleware per il parsing dei dati inviati da form HTML
app.use(express.urlencoded({ extended: true }));
// Middleware per il parsing di JSON
app.use(express.json());

// Configurazione della gestione delle sessioni
app.use(
  session({
    secret: process.env.SECRET_SESSION, // Chiave segreta per firmare il cookie di sessione
    resave: false,                      // Non salva la sessione se non modificata
    saveUninitialized: false,           // Non crea sessioni per utenti non autenticati
    cookie: {
      httpOnly: true,                   // Il cookie non è accessibile da JavaScript lato client
      secure: false,                    // Impostare a true in produzione con HTTPS
      maxAge: 24 * 60 * 60 * 1000,      // Durata della sessione: 24 ore
    },
  }),
);

// Inizializzazione e utilizzo di connect-flash per i messaggi temporanei
app.use(flash());
// Inizializzazione di Passport per l'autenticazione
app.use(passport.initialize());
app.use(passport.session());

// Middleware globale per rendere disponibili alcune variabili a tutte le viste (template EJS)
app.use((req, res, next) => {
    res.locals.user = req.user || null;                 // Dati dell'utente autenticato
    res.locals.isAuthenticated = req.isAuthenticated(); // Flag booleano per verificare l'autenticazione
    res.locals.success = req.flash('success');          // Messaggi di successo
    res.locals.error = req.flash('error');              // Messaggi di errore
    res.locals.session = req.session;                   // Oggetto sessione, utile per il carrello
    res.locals.originalUrl = req.originalUrl;           // URL corrente, utile per reindirizzamenti
    res.locals.query = req.query;                       // Rende disponibili i parametri query a tutte le viste
    next();
});

// Registrazione dei router per le diverse sezioni dell'applicazione
app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/utente', userRoutes);
app.use('/products', productRoutes);
app.use('/member', memberRoutes);
app.use('/venditore', sellerRoutes);
app.use('/recensioni', recensioniRoutes);
app.use('/information', informationRoutes);
app.use('/carrello', cartRoutes);
app.use('/observed', observedRoutes);
app.use('/ordine', orderRoutes);
app.use('/search', searchRoutes);
app.use('/admin', adminRoutes);

// Endpoint API per verificare lo stato di autenticazione dell'utente (usato da script.js)
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        tipo_account: req.user.tipo_account
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Middleware per la gestione delle pagine non trovate (404)
app.use((req, res) => {
  req.flash('error', 'La pagina richiesta non è stata trovata.');
  res.status(404).render('pages/error', { title: 'Pagina non Trovata' });
});

// Esportazione dell'applicazione configurata
module.exports = app;