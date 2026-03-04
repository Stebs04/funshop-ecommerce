// File: route/information.js
'use strict';

const express = require('express');
const router = express.Router();

/**
 * ROTTA: GET /information
 * * Questa rotta gestisce la visualizzazione di una pagina statica di informazioni
 * (es. "Chi Siamo", "Contatti", "Privacy Policy").
 * * Logica:
 * 1. Renderizza semplicemente il template `pages/information.ejs`.
 * 2. Passa le variabili standard (`title`, `user`, `isAuthenticated`) che sono
 * necessarie per il corretto funzionamento dei partials, come la navbar,
 * anche se la pagina non ha una logica complessa.
 */
router.get('/', (req, res) => {
    res.render('pages/information', {
        title: 'Informazioni su FunShop',
        // Passiamo le variabili standard che la navbar si aspetta
        user: req.user || null,
        isAuthenticated: req.isAuthenticated()
    });
});

module.exports = router;