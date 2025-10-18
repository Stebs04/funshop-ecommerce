// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const { db } = require('../managedb');

router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
    next();
});

router.post('/add/:id', async (req, res) => {
    const productId = req.params.id;
    const cart = req.session.cart;
    const redirectUrl = req.body.redirectUrl || '/';

    if (cart.items[productId]) {
        req.flash('error', 'Questo articolo è già presente nel carrello.');
        return res.redirect(redirectUrl);
    }

    try {
        const product = await prodottiDao.getProductById(productId);
        if (!product || product.stato !== 'disponibile') { // Controlla anche lo stato
            req.flash('error', 'Prodotto non trovato o non più disponibile!');
            return res.redirect(redirectUrl);
        }

        const itemPrice = product.prezzo_scontato || product.prezzo;
        cart.items[productId] = { item: product, qty: 1, price: itemPrice };
        cart.totalQty++;
        cart.totalPrice += itemPrice;

        req.flash('success', `"${product.nome}" è stato aggiunto al carrello!`);
        res.redirect(redirectUrl);

    } catch (error) {
        console.error("Errore nell'aggiungere prodotto al carrello:", error);
        req.flash('error', 'Impossibile aggiungere il prodotto al carrello.');
        res.redirect(redirectUrl);
    }
});

router.post('/remove/:id', (req, res) => {
    const productId = req.params.id;
    const cart = req.session.cart;

    if (cart.items[productId]) {
        const itemToRemove = cart.items[productId];
        cart.totalQty -= itemToRemove.qty;
        cart.totalPrice -= itemToRemove.price;
        delete cart.items[productId];
        req.flash('success', 'Prodotto rimosso dal carrello.');
    }
    res.redirect('/carrello');
});

router.get('/', (req, res) => {
    res.render('pages/carrello', {
        title: 'Il Tuo Carrello',
        cart: req.session.cart
    });
});

router.get('/checkout', async (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.totalQty === 0) {
        req.flash('error', 'Il tuo carrello è vuoto.');
        return res.redirect('/carrello');
    }
    let indirizzi = [];
    let metodiPagamento = [];
    if (req.isAuthenticated()) {
        try {
            [indirizzi, metodiPagamento] = await Promise.all([
                indirizziDao.getIndirizziByUserId(req.user.id),
                metodiPagamentoDao.getMetodiPagamentoByUserId(req.user.id)
            ]);
        } catch (error) {
            console.error("Errore nel recuperare i dati per il checkout:", error);
            req.flash('error', 'Impossibile caricare i tuoi dati.');
            return res.redirect('/carrello');
        }
    }
    res.render('pages/checkout', {
        title: 'Checkout',
        cart: cart,
        indirizzi: indirizzi,
        metodiPagamento: metodiPagamento
    });
});

router.post('/checkout', async (req, res) => {
    const cart = req.session.cart;

    if (!req.isAuthenticated()) {
        req.flash('error', 'Devi effettuare il login per completare l\'ordine.');
        return res.redirect('/auth/login');
    }

    if (!cart || cart.totalQty === 0) {
        return res.redirect('/carrello');
    }

    const { addressSelection, paymentSelection, ...formData } = req.body;
    const userId = req.user.id;
    const buyerEmail = req.user.email;

    try {
        await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve()));

        const purchasedItems = [];
        for (const id in cart.items) {
            const product = cart.items[id].item;
            await ordiniDao.createOrder({
                totale: cart.items[id].price,
                user_id: userId,
                prodotto_id: product.id
            });
            await prodottiDao.updateProductStatus(product.id, 'venduto');
            purchasedItems.push(product);
        }

        await new Promise((resolve, reject) => db.run('COMMIT', err => err ? reject(err) : resolve()));

        req.session.latestOrder = {
            buyer: req.user,
            items: purchasedItems,
            total: cart.totalPrice,
            address: formData,
            payment: formData,
            date: new Date()
        };
        
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
        
        const reviewLink = `${req.protocol}://${req.get('host')}/recensioni/venditore/${purchasedItems[0].id}`;
        req.session.latestOrder.reviewLink = reviewLink; // Lo salviamo in sessione per mostrarlo

        res.redirect('/ordine/riepilogo');

    } catch (error) {
        await new Promise((resolve, reject) => db.run('ROLLBACK', err => err ? reject(err) : resolve()));
        console.error("Errore durante il checkout:", error);
        req.flash('error', 'Si è verificato un errore durante la finalizzazione dell\'ordine.');
        res.redirect('/carrello');
    }
});

router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;