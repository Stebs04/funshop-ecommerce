// File: app.js
'use strict';

const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');

// --- CORREZIONE: Assicurati che tutti i percorsi partano da './' ---
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

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.session = req.session; 
    res.locals.originalUrl = req.originalUrl;
    next();
});

// Utilizzo dei router
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

app.use((req, res) => {
  req.flash('error', 'La pagina richiesta non è stata trovata.');
  res.status(404).render('pages/error', { title: 'Pagina non Trovata' });
});

module.exports = app;