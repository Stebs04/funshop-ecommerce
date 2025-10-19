// File: route/observedRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const observedDao = require('../models/dao/observed-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Proteggi tutte le rotte in questo file
router.use(isLoggedIn);

// Rotta per la pagina dei prodotti osservati
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const observedProducts = await observedDao.getObservedByUserId(userId);
        
        res.render('pages/observed-products', {
            title: 'I Miei Prodotti Osservati',
            prodotti: observedProducts
        });

        // Dopo aver mostrato la pagina, marca le notifiche come lette
        await observedDao.markNotificationsAsRead(userId);

    } catch (error) {
        console.error("Errore nel recuperare i prodotti osservati:", error);
        req.flash('error', 'Impossibile caricare i prodotti osservati.');
        res.redirect('/');
    }
});

// Rotta per aggiungere un prodotto agli osservati (CON IL BUG CORRETTO)
router.post('/add/:productId', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user.id;
    const redirectUrl = `/products/${productId}`;

    try {
        // --- INIZIO CORREZIONE ---
        // 1. Controlla se l'utente sta già osservando il prodotto
        const isAlreadyObserved = await observedDao.isObserved(userId, productId);
        if (isAlreadyObserved) {
            req.flash('error', 'Questo prodotto è già nella tua lista di osservati.');
            return res.redirect(redirectUrl);
        }
        // --- FINE CORREZIONE ---

        // 2. Se non è osservato, recupera il prodotto per ottenere il prezzo
        const product = await prodottiDao.getProductById(productId);
        if (!product) {
            req.flash('error', 'Prodotto non trovato.');
            return res.redirect('/');
        }
        const currentPrice = product.prezzo_scontato || product.prezzo;

        // 3. Aggiungi il prodotto alla lista degli osservati
        await observedDao.addObserved(userId, productId, currentPrice);
        req.flash('success', 'Prodotto aggiunto alla tua lista di osservati!');

    } catch (error) {
        // Questo catch ora gestirà solo errori imprevisti (es. database offline)
        console.error("Errore durante l'aggiunta agli osservati:", error);
        req.flash('error', 'Si è verificato un errore imprevisto.');
    }
    
    res.redirect(redirectUrl);
});

// Rotta per rimuovere un prodotto dagli osservati
router.post('/remove/:productId', async (req, res) => {
    try {
        await observedDao.removeObserved(req.user.id, req.params.productId);
        req.flash('success', 'Prodotto rimosso dalla tua lista di osservati.');
    } catch (error) {
        req.flash('error', 'Si è verificato un errore.');
    }
    const redirectUrl = req.body.redirectUrl || `/products/${req.params.productId}`;
    res.redirect(redirectUrl);
});

module.exports = router;