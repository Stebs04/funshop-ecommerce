// File: route/orderRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/passport-config');

// Proteggi tutte le rotte in questo file
router.use(isLoggedIn);

// Rotta per la pagina di riepilogo/successo dell'ordine
router.get('/riepilogo', (req, res) => {
    if (!req.session.latestOrder) {
        req.flash('error', 'Nessun riepilogo ordine da visualizzare.');
        return res.redirect('/');
    }
    const orderDetails = req.session.latestOrder;
    // Pulisce la sessione dopo l'uso per evitare che la pagina sia accessibile di nuovo
    delete req.session.latestOrder; 
    
    res.render('pages/ordine-riepilogo', {
        title: 'Ordine Completato!',
        order: orderDetails
    });
});

module.exports = router;