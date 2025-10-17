// File: route/information.js
'use strict';

const express = require('express');
const router = express.Router();

/**
 * GET /information
 * Mostra la pagina statica con le informazioni (Chi Siamo, Contatti, ecc.)
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