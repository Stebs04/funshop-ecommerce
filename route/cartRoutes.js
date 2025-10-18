// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');

// Middleware per inizializzare il carrello nella sessione
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
    next();
});

// Rotta POST /add/:id - Aggiunge un prodotto al carrello
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
        res.redirect('back'); // <-- Questa riga ti fa rimanere sulla pagina di provenienza
    } catch (error) {
        console.error("Errore nell'aggiungere prodotto al carrello:", error);
        req.flash('error', 'Impossibile aggiungere il prodotto al carrello.');
        res.redirect('back');
    }
});

/**
 * NUOVA ROTTA
 * POST /remove/:id
 * Rimuove un articolo dal carrello.
 */
router.post('/remove/:id', (req, res) => {
    const productId = req.params.id;
    const cart = req.session.cart;

    // Controlla se il prodotto esiste nel carrello
    if (cart.items[productId]) {
        const itemToRemove = cart.items[productId];
        
        // Aggiorna la quantità totale e il prezzo totale
        cart.totalQty -= itemToRemove.qty;
        cart.totalPrice -= itemToRemove.price;

        // Rimuovi l'articolo dall'oggetto items
        delete cart.items[productId];

        req.flash('success', 'Prodotto rimosso dal carrello.');
    } else {
        req.flash('error', 'Si è verificato un errore durante la rimozione del prodotto.');
    }

    // Reindirizza l'utente alla pagina del carrello
    res.redirect('/carrello');
});


// Rotta GET / - Mostra la pagina del carrello
router.get('/', (req, res) => {
    const cart = req.session.cart;
    res.render('pages/carrello', {
        title: 'Il Tuo Carrello',
        cart: cart
    });
});


/**
 * GET /carrello/checkout
 * Mostra la pagina di checkout, caricando i dati dell'utente se loggato.
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

// Rotta GET /api/data - Fornisce i dati del carrello in formato JSON
router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;