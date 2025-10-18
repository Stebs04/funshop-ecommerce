// File: route/observedRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const observedDao = require('../models/dao/observed-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Proteggi tutte le rotte in questo file
router.use(isLoggedIn);

// Rotta per la pagina dei prodotti osservati
router.get('/', async (req, res) => {
    try {
        const observedProducts = await observedDao.getObservedByUserId(req.user.id);
        res.render('pages/observed-products', {
            title: 'I Miei Prodotti Osservati',
            prodotti: observedProducts
        });
    } catch (error) {
        console.error("Errore nel recuperare i prodotti osservati:", error);
        req.flash('error', 'Impossibile caricare i prodotti osservati.');
        res.redirect('/');
    }
});

// Rotta per aggiungere un prodotto agli osservati
router.post('/add/:productId', async (req, res) => {
    try {
        await observedDao.addObserved(req.user.id, req.params.productId);
        req.flash('success', 'Prodotto aggiunto alla tua lista di osservati!');
    } catch (error) {
        req.flash('error', 'Questo prodotto è già nella tua lista.');
    }
    res.redirect(`/products/${req.params.productId}`);
});

// Rotta per rimuovere un prodotto dagli osservati
router.post('/remove/:productId', async (req, res) => {
    try {
        await observedDao.removeObserved(req.user.id, req.params.productId);
        req.flash('success', 'Prodotto rimosso dalla tua lista di osservati.');
    } catch (error) {
        req.flash('error', 'Si è verificato un errore.');
    }
    // Reindirizza alla pagina da cui proviene la richiesta (o alla pagina del prodotto come fallback)
    const redirectUrl = req.body.redirectUrl || `/products/${req.params.productId}`;
    res.redirect(redirectUrl);
});

module.exports = router;