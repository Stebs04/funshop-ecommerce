// File: route/orderRoutes.js
'use strict';

const express = require('express');
const router = express.Router();


router.get('/riepilogo', (req, res) => {
    // Se non ci sono dati di un ordine recente nella sessione, non c'è nulla da mostrare.
    if (!req.session.latestOrder) {
        req.flash('error', 'Nessun riepilogo ordine da visualizzare.');
        return res.redirect('/');
    }
    const orderDetails = req.session.latestOrder;
    // Pulisce la sessione dopo l'uso per evitare che la pagina sia ricaricata o accessibile di nuovo.
    delete req.session.latestOrder; 
    
    res.render('pages/ordine-riepilogo', {
        title: 'Ordine Completato!',
        order: orderDetails
    });
});

module.exports = router;