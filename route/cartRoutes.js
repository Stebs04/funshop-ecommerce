// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');

// Middleware per inizializzare il carrello nella sessione se non esiste
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
    next();
});

/**
 * POST /carrello/add/:id
 * Aggiunge un prodotto al carrello.
 */
router.post('/add/:id', async (req, res) => {
    const productId = req.params.id;
    const cart = req.session.cart;

    try {
        const product = await prodottiDao.getProductById(productId);
        if (!product) {
            req.flash('error', 'Prodotto non trovato!');
            return res.redirect('back');
        }

        let storedItem = cart.items[productId];
        if (!storedItem) {
            storedItem = cart.items[productId] = { item: product, qty: 0, price: 0 };
        }
        storedItem.qty++;
        const itemPrice = product.prezzo_scontato || product.prezzo;
        storedItem.price = itemPrice * storedItem.qty;
        cart.totalQty++;
        cart.totalPrice += itemPrice;

        req.flash('success', `"${product.nome}" è stato aggiunto al carrello!`);
        res.redirect('back'); // Torna alla pagina precedente

    } catch (error) {
        console.error("Errore nell'aggiungere prodotto al carrello:", error);
        req.flash('error', 'Impossibile aggiungere il prodotto al carrello.');
        res.redirect('back');
    }
});

/**
 * GET /carrello
 * Mostra la pagina del carrello con i prodotti aggiunti.
 */
router.get('/', (req, res) => {
    const cart = req.session.cart;
    res.render('pages/carrello', {
        title: 'Il Tuo Carrello',
        cart: cart
    });
});

/**
 * GET /carrello/checkout
 * Mostra la pagina di checkout (con vista condizionale).
 */
router.get('/checkout', (req, res) => {
    const cart = req.session.cart;
    if (cart.totalQty === 0) {
        req.flash('error', 'Il tuo carrello è vuoto.');
        return res.redirect('/carrello');
    }
    res.render('pages/checkout', {
        title: 'Checkout',
        cart: cart
    });
});

/**
 * GET /carrello/api/data
 * API per fornire i dati del carrello al frontend.
 */
router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;