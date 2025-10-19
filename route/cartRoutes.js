// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const { db } = require('../managedb');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const cartDao = require('../models/dao/cart-dao');

// Middleware per caricare/inizializzare il carrello
router.use(async (req, res, next) => {
    if (req.isAuthenticated()) {
        // Utente loggato: carica il carrello dal DB
        req.session.cart = await cartDao.getCartByUserId(req.user.id);
    } else if (!req.session.cart) {
        // Utente ospite: inizializza un carrello vuoto nella sessione
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
    next();
});

router.post('/add/:id', async (req, res) => {
    const productId = req.params.id;
    const redirectUrl = req.body.redirectUrl || '/';

    try {
        const product = await prodottiDao.getProductById(productId);
        if (!product || product.stato !== 'disponibile') {
            req.flash('error', 'Prodotto non trovato o non più disponibile!');
            return res.redirect(redirectUrl);
        }

        if (req.isAuthenticated()) {
            // Utente loggato: aggiungi al DB
            const changes = await cartDao.addToCart(req.user.id, productId);
            if (changes === 0) {
                req.flash('error', 'Questo articolo è già presente nel carrello.');
            } else {
                req.flash('success', `"${product.nome}" è stato aggiunto al carrello!`);
            }
        } else {
            // Utente ospite: aggiungi alla sessione
            const cart = req.session.cart;
            if (cart.items[productId]) {
                req.flash('error', 'Questo articolo è già presente nel carrello.');
            } else {
                const itemPrice = product.prezzo_scontato || product.prezzo;
                cart.items[productId] = { item: product, qty: 1, price: itemPrice };
                cart.totalQty++;
                cart.totalPrice += itemPrice;
                req.flash('success', `"${product.nome}" è stato aggiunto al carrello!`);
            }
        }
        res.redirect(redirectUrl);

    } catch (error) {
        console.error("Errore nell'aggiungere prodotto al carrello:", error);
        req.flash('error', 'Impossibile aggiungere il prodotto al carrello.');
        res.redirect(redirectUrl);
    }
});

router.post('/remove/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        if (req.isAuthenticated()) {
            // Utente loggato: rimuovi dal DB
            await cartDao.removeFromCart(req.user.id, productId);
        } else {
            // Utente ospite: rimuovi dalla sessione
            const cart = req.session.cart;
            if (cart.items[productId]) {
                const itemToRemove = cart.items[productId];
                cart.totalQty -= itemToRemove.qty;
                cart.totalPrice -= itemToRemove.price;
                delete cart.items[productId];
            }
        }
        req.flash('success', 'Prodotto rimosso dal carrello.');
    } catch (error) {
        console.error("Errore durante la rimozione dal carrello:", error);
        req.flash('error', 'Si è verificato un errore durante la rimozione del prodotto.');
    }
    res.redirect('/carrello');
});

router.get('/', (req, res) => {
    const cart = req.session.cart;
    res.render('pages/carrello', {
        title: 'Il Tuo Carrello',
        cart: cart
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

        // Svuota il carrello persistente
        await cartDao.clearCart(userId);

        await new Promise((resolve, reject) => db.run('COMMIT', err => err ? reject(err) : resolve()));

        const reviewLink = `${req.protocol}://${req.get('host')}/recensioni/venditore/${purchasedItems[0].id}`;
        
        req.session.latestOrder = {
            buyer: req.user,
            items: purchasedItems,
            total: cart.totalPrice,
            address: formData,
            payment: formData,
            date: new Date(),
            reviewLink: reviewLink
        };
        
        // Svuota il carrello della sessione
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
        
        sendOrderConfirmationEmail(buyerEmail, req.session.latestOrder).catch(console.error);

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