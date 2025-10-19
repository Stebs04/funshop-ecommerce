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
        req.session.cart = await cartDao.getCartByUserId(req.user.id);
    } else if (!req.session.cart) {
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
            const changes = await cartDao.addToCart(req.user.id, productId);
            if (changes === 0) {
                req.flash('error', 'Questo articolo è già presente nel carrello.');
            } else {
                req.flash('success', `"${product.nome}" è stato aggiunto al carrello!`);
            }
        } else {
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
            await cartDao.removeFromCart(req.user.id, productId);
        } else {
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

// --- VERSIONE CORRETTA DELLA ROTTA DI CHECKOUT ---
router.post('/checkout', async (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.totalQty === 0) {
        return res.redirect('/carrello');
    }

    const { addressSelection, paymentMethod, ...formData } = req.body;
    let transactionStarted = false;

    try {
        if (req.isAuthenticated()) {
            // --- LOGICA PER UTENTE AUTENTICATO ---
            const userId = req.user.id;
            const buyerEmail = req.user.email;
            let finalAddress, finalPaymentMethod;

            if (!addressSelection) { throw new Error('Per favore, seleziona o inserisci un indirizzo di spedizione.'); }
            if (addressSelection === 'new' && (!formData.indirizzo || !formData.citta || !formData.cap)) { throw new Error('Per favore, compila tutti i campi per il nuovo indirizzo.'); }
            if (!paymentMethod) { throw new Error('Per favore, seleziona o inserisci un metodo di pagamento.'); }
            if (paymentMethod === 'new' && (!formData.nome_titolare || !formData.numero_carta || !formData.data_scadenza || !formData.cvv)) { throw new Error('Per favore, compila tutti i campi per la nuova carta di pagamento.'); }

            if (addressSelection === 'new') {
                finalAddress = { nome: req.user.nome, cognome: req.user.cognome, indirizzo: formData.indirizzo, citta: formData.citta, cap: formData.cap };
                await indirizziDao.createIndirizzo({ ...finalAddress, user_id: userId });
            } else {
                const savedAddress = await indirizziDao.getIndirizzoById(addressSelection);
                if (!savedAddress || savedAddress.user_id !== userId) throw new Error('Indirizzo selezionato non valido.');
                finalAddress = { ...savedAddress, nome: req.user.nome, cognome: req.user.cognome };
            }

            if (paymentMethod === 'new') {
                finalPaymentMethod = { nome_titolare: formData.nome_titolare, last4: formData.numero_carta.slice(-4), data_scadenza: formData.data_scadenza };
                await metodiPagamentoDao.createMetodoPagamento({ ...formData, user_id: userId });
            } else {
                const savedPayments = await metodiPagamentoDao.getMetodiPagamentoByUserId(userId);
                finalPaymentMethod = savedPayments.find(p => p.id == paymentMethod);
                if (!finalPaymentMethod) throw new Error('Metodo di pagamento selezionato non valido.');
            }

            await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve()));
            transactionStarted = true;

            const purchasedItems = [];
            for (const id in cart.items) {
                const product = cart.items[id].item;
                await ordiniDao.createOrder({ totale: cart.items[id].price, user_id: userId, prodotto_id: product.id });
                await prodottiDao.updateProductStatus(product.id, 'venduto');
                purchasedItems.push(product);
            }
            await cartDao.clearCart(userId);

            await new Promise((resolve, reject) => db.run('COMMIT', err => err ? reject(err) : resolve()));
            transactionStarted = false;

            const reviewLink = `${req.protocol}://${req.get('host')}/recensioni/venditore/${purchasedItems[0].id}`;
            req.session.latestOrder = {
                buyer: { email: buyerEmail, nome: req.user.nome },
                items: purchasedItems, total: cart.totalPrice, address: finalAddress, payment: finalPaymentMethod, date: new Date(), reviewLink,
                isGuest: false
            };
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
            sendOrderConfirmationEmail(buyerEmail, req.session.latestOrder).catch(console.error);
            res.redirect('/ordine/riepilogo');

        } else {
            // --- LOGICA PER UTENTE OSPITE ---
            if (!formData.nome || !formData.cognome || !formData.email || !formData.indirizzo || !formData.citta || !formData.cap) { throw new Error('Per favore, compila tutti i campi anagrafici e di indirizzo.'); }
            if (!formData.nome_titolare || !formData.numero_carta || !formData.data_scadenza || !formData.cvv) { throw new Error('Per favore, compila tutti i campi di pagamento.'); }
            
            const buyerEmail = formData.email;
            const finalAddress = { nome: formData.nome, cognome: formData.cognome, indirizzo: formData.indirizzo, citta: formData.citta, cap: formData.cap };
            const finalPaymentMethod = { nome_titolare: formData.nome_titolare, last4: formData.numero_carta.slice(-4), data_scadenza: formData.data_scadenza };
            
            await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve()));
            transactionStarted = true;

            const purchasedItems = [];
            for (const id in cart.items) {
                const product = cart.items[id].item;
                await ordiniDao.createOrder({ totale: cart.items[id].price, user_id: null, prodotto_id: product.id });
                await prodottiDao.updateProductStatus(product.id, 'venduto');
                purchasedItems.push(product);
            }

            await new Promise((resolve, reject) => db.run('COMMIT', err => err ? reject(err) : resolve()));
            transactionStarted = false;

            const reviewLink = `${req.protocol}://${req.get('host')}/`;
            req.session.latestOrder = {
                buyer: { email: buyerEmail, nome: formData.nome },
                items: purchasedItems, total: cart.totalPrice, address: finalAddress, payment: finalPaymentMethod, date: new Date(), reviewLink,
                isGuest: true
            };
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
            sendOrderConfirmationEmail(buyerEmail, req.session.latestOrder).catch(console.error);
            res.redirect('/ordine/riepilogo');
        }

    } catch (error) {
        if (transactionStarted) {
            await new Promise((resolve) => db.run('ROLLBACK', () => resolve()));
        }
        console.error("Errore durante il checkout:", error);
        req.flash('error', error.message || 'Si è verificato un errore durante la finalizzazione dell\'ordine.');
        res.redirect('/carrello/checkout');
    }
});


router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;