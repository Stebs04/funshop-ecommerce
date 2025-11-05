// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

// Import dei DAO (che ora usano pg)
const prodottiDao = require('../models/dao/prodotti-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const cartDao = require('../models/dao/cart-dao');
const observedDao = require('../models/dao/observed-dao');

// Import del servizio per l'invio di email
const { sendOrderConfirmationEmail } = require('../services/emailService');

// --- MODIFICA ---
// Importiamo il 'pool' (che ha .connect()) invece di 'db' per gestire le transazioni manualmente
const { pool } = require('../managedb');

/**
 * Middleware: Inizializzazione del Carrello
 * (Logica invariata, ma ora cartDao.getCartByUserId usa pg)
 */
router.use(async (req, res, next) => {
    if (req.isAuthenticated()) {
        req.session.cart = await cartDao.getCartByUserId(req.user.id);
    } else if (!req.session.cart) {
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
    next();
});

/**
 * ROTTA: POST /carrello/add/:id
 * (Logica invariata, ma ora prodottiDao e cartDao usano pg)
 */
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
                // Assicuriamo che il prezzo sia un numero
                const itemPrice = parseFloat(product.prezzo_scontato) || parseFloat(product.prezzo);
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

/**
 * ROTTA: POST /carrello/remove/:id
 * (Logica invariata, ma ora cartDao usa pg)
 */
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

/**
 * ROTTA: GET /carrello/
 * (Logica invariata)
 */
router.get('/', (req, res) => {
    const cart = req.session.cart;
    res.render('pages/carrello', {
        title: 'Il Tuo Carrello',
        cart: cart
    });
});

/**
 * ROTTA: GET /carrello/checkout
 * (Logica invariata, ma i DAO usano pg)
 */
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

/**
 * ROTTA: POST /carrello/checkout
 * Gestisce la logica di finalizzazione dell'ordine con transazione PostgreSQL.
 */
router.post('/checkout', async (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.totalQty === 0) {
        return res.redirect('/carrello');
    }

    const { addressSelection, paymentMethod, ...formData } = req.body;

    // --- MODIFICA ---
    // Acquisiamo un client dal 'pool' (che ha il metodo .connect())
    const client = await pool.connect();
    
    try {
        // Filtra il carrello per processare solo gli articoli ancora disponibili
        const availableItems = Object.values(cart.items).filter(item => item.item.stato === 'disponibile');
        if (availableItems.length === 0) {
            throw new Error('Nessun articolo disponibile nel carrello per il checkout.');
        }

        // Iniziamo la transazione
        await client.query('BEGIN');

        if (req.isAuthenticated()) {
            // --- LOGICA PER UTENTE AUTENTICATO ---
            const userId = req.user.id;
            const buyerEmail = req.user.email;
            let finalAddress, finalPaymentMethod;

            // Validazione dei dati
            if (!addressSelection) { throw new Error('Per favore, seleziona o inserisci un indirizzo di spedizione.'); }
            if (addressSelection === 'new' && (!formData.indirizzo || !formData.citta || !formData.cap)) { throw new Error('Per favore, compila tutti i campi per il nuovo indirizzo.'); }
            if (!paymentMethod) { throw new Error('Per favore, seleziona o inserisci un metodo di pagamento.'); }
            if (paymentMethod === 'new' && (!formData.nome_titolare || !formData.numero_carta || !formData.data_scadenza || !formData.cvv)) { throw new Error('Per favore, compila tutti i campi per la nuova carta di pagamento.'); }

            // Gestione Indirizzo
            if (addressSelection === 'new') {
                finalAddress = { nome: req.user.nome, cognome: req.user.cognome, indirizzo: formData.indirizzo, citta: formData.citta, cap: formData.cap };
                // Usiamo client.query perché siamo in una transazione
                await client.query(
                    'INSERT INTO indirizzi (user_id, indirizzo, citta, cap) VALUES ($1, $2, $3, $4)',
                    [userId, finalAddress.indirizzo, finalAddress.citta, finalAddress.cap]
                );
            } else {
                const savedAddress = await indirizziDao.getIndirizzoById(addressSelection);
                if (!savedAddress || savedAddress.user_id !== userId) throw new Error('Indirizzo selezionato non valido.');
                finalAddress = { ...savedAddress, nome: req.user.nome, cognome: req.user.cognome };
            }

            // Gestione Pagamento
            if (paymentMethod === 'new') {
                finalPaymentMethod = { nome_titolare: formData.nome_titolare, last4: formData.numero_carta.slice(-4), data_scadenza: formData.data_scadenza };
                // Usiamo client.query perché siamo in una transazione
                await client.query(
                    'INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza, cvv) VALUES ($1, $2, $3, $4, $5)',
                    [userId, formData.nome_titolare, formData.numero_carta, formData.data_scadenza, formData.cvv]
                );
            } else {
                const savedPayments = await metodiPagamentoDao.getMetodiPagamentoByUserId(userId);
                finalPaymentMethod = savedPayments.find(p => p.id == paymentMethod);
                if (!finalPaymentMethod) throw new Error('Metodo di pagamento selezionato non valido.');
            }

            const purchasedItems = [];
            for (const item of availableItems) {
                const product = item.item;
                // Usiamo client.query per tutte le operazioni della transazione
                await client.query(
                    'INSERT INTO storico_ordini (totale, user_id, prodotto_id) VALUES ($1, $2, $3)',
                    [item.price, userId, product.id]
                );
                await client.query(
                    'UPDATE prodotti SET stato = $1 WHERE id = $2',
                    ['venduto', product.id]
                );
                await client.query(
                    'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = $1',
                    [product.id]
                );
                purchasedItems.push(product);
            }
            // Svuota il carrello dal DB usando il client della transazione
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

            // Fine Transazione
            await client.query('COMMIT');
            
            // Calcola il totale corretto solo degli articoli acquistati
            const finalTotal = purchasedItems.reduce((sum, item) => sum + (parseFloat(item.prezzo_scontato) || parseFloat(item.prezzo)), 0);

            // Preparazione per la pagina di riepilogo e email
            const reviewLink = `${req.protocol}://${req.get('host')}/recensioni/venditore/${purchasedItems[0].id}`;
            req.session.latestOrder = {
                buyer: { email: buyerEmail, nome: req.user.nome },
                items: purchasedItems, total: finalTotal, address: finalAddress, payment: finalPaymentMethod, date: new Date(), reviewLink,
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
            
            const purchasedItems = [];
            for (const item of availableItems) {
                const product = item.item;
                // Usiamo client.query per tutte le operazioni della transazione
                await client.query(
                    'INSERT INTO storico_ordini (totale, user_id, prodotto_id) VALUES ($1, $2, $3)',
                    [item.price, null, product.id] // user_id è null per l'ospite
                );
                await client.query(
                    'UPDATE prodotti SET stato = $1 WHERE id = $2',
                    ['venduto', product.id]
                );
                await client.query(
                    'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = $1',
                    [product.id]
                );
                purchasedItems.push(product);
            }

            // Fine Transazione
            await client.query('COMMIT');

            const finalTotal = purchasedItems.reduce((sum, item) => sum + (parseFloat(item.prezzo_scontato) || parseFloat(item.prezzo)), 0);

            const reviewLink = `${req.protocol}://${req.get('host')}/`;
            req.session.latestOrder = {
                buyer: { email: buyerEmail, nome: formData.nome },
                items: purchasedItems, total: finalTotal, address: finalAddress, payment: finalPaymentMethod, date: new Date(), reviewLink,
                isGuest: true
            };
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
            sendOrderConfirmationEmail(buyerEmail, req.session.latestOrder).catch(console.error);
            res.redirect('/ordine/riepilogo');
        }

    } catch (error) {
        // Se si è verificato un errore, esegui il ROLLBACK
        await client.query('ROLLBACK');
        console.error("Errore durante il checkout:", error);
        req.flash('error', error.message || 'Si è verificato un errore durante la finalizzazione dell\'ordine.');
        res.redirect('/carrello/checkout');
    } finally {
        // Rilascia il client al pool in ogni caso
        client.release();
    }
});


/**
 * ROTTA: GET /carrello/api/data
 * (Logica invariata)
 */
router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;