// File: route/cartRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

// Import dei DAO per interagire con il database
const prodottiDao = require('../models/dao/prodotti-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const cartDao = require('../models/dao/cart-dao');
const observedDao = require('../models/dao/observed-dao'); // DAO per i prodotti osservati

// Import del servizio per l'invio di email
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { db } = require('../managedb'); // Import diretto del database per le transazioni

/**
 * Middleware: Inizializzazione del Carrello
 * * Questo middleware viene eseguito per ogni richiesta che arriva a `/carrello/*`.
 * La sua funzione è assicurarsi che ci sia sempre un carrello (`req.session.cart`) disponibile.
 * * Logica:
 * - Se l'utente è autenticato (`req.isAuthenticated()`):
 * - Carica il carrello dal database usando `cartDao.getCartByUserId()`.
 * - Questo garantisce che il carrello sia persistente tra diverse sessioni e dispositivi.
 * - Se l'utente non è autenticato (ospite):
 * - Controlla se `req.session.cart` esiste già.
 * - Se non esiste, ne crea uno nuovo, vuoto, nella sessione.
 * - Il carrello dell'ospite vive solo all'interno della sessione corrente.
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
 * * Aggiunge un prodotto al carrello.
 * * Logica:
 * 1. Recupera l'ID del prodotto dall'URL e l'URL di reindirizzamento dal corpo della richiesta.
 * 2. Recupera i dettagli del prodotto dal database per verificarne l'esistenza e la disponibilità.
 * 3. Se il prodotto non è disponibile, mostra un errore.
 * 4. Se l'utente è loggato:
 * - Chiama `cartDao.addToCart()` per aggiungere/aggiornare il prodotto nel carrello del database.
 * 5. Se l'utente è un ospite:
 * - Aggiunge/aggiorna il prodotto direttamente nell'oggetto `req.session.cart`.
 * 6. Mostra un messaggio di successo e reindirizza l'utente.
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

/**
 * ROTTA: POST /carrello/remove/:id
 * * Rimuove un prodotto dal carrello.
 * * Logica:
 * 1. Se l'utente è loggato, chiama `cartDao.removeFromCart()` per rimuoverlo dal database.
 * 2. Se l'utente è un ospite, lo rimuove dall'oggetto `req.session.cart` e aggiorna i totali.
 * 3. Mostra un messaggio di successo e reindirizza alla pagina del carrello.
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
 * * Mostra la pagina di riepilogo del carrello.
 * * Logica:
 * 1. Prende il carrello (già caricato dal middleware) dalla sessione.
 * 2. Renderizza la pagina `carrello.ejs`, passandole i dati del carrello.
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
 * * Mostra la pagina di checkout.
 * * Logica:
 * 1. Controlla se il carrello è vuoto; in caso affermativo, reindirizza indietro.
 * 2. Se l'utente è loggato, recupera i suoi indirizzi e metodi di pagamento salvati dal database.
 * 3. Renderizza la pagina `checkout.ejs`, passando i dati del carrello e, se disponibili,
 * gli indirizzi e i metodi di pagamento dell'utente.
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
 * * Gestisce la logica di finalizzazione dell'ordine. È una delle rotte più complesse.
 * * Logica Generale:
 * 1. Verifica che il carrello non sia vuoto.
 * 2. Utilizza una transazione del database (`BEGIN TRANSACTION`...`COMMIT`/`ROLLBACK`) per garantire
 * l'integrità dei dati: se una qualsiasi operazione fallisce, tutte le modifiche vengono annullate.
 * 3. Per ogni articolo nel carrello:
 * - Crea un record in `storico_ordini`.
 * - Aggiorna lo stato del prodotto in `prodotti` a 'venduto'.
 * - Aggiorna lo stato dei prodotti osservati per notificare gli altri utenti.
 * 4. Svuota il carrello dell'utente.
 * 5. Salva i dettagli dell'ordine nella sessione per mostrarli nella pagina di riepilogo.
 * 6. Invia un'email di conferma all'acquirente.
 * 7. Reindirizza alla pagina di riepilogo ordine.
 * * Logica Specifica (Utente Loggato vs Ospite):
 * - **Utente Loggato**:
 * - Valida i dati di indirizzo/pagamento selezionati o inseriti.
 * - Se vengono inseriti nuovi dati, li salva nel database per usi futuri.
 * - Usa i dati dell'utente (nome, email) per l'ordine.
 * - **Utente Ospite**:
 * - Valida tutti i dati inseriti manualmente (nome, email, indirizzo, pagamento).
 * - I dati non vengono salvati per usi futuri.
 */
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

            // Validazione dei dati
            if (!addressSelection) { throw new Error('Per favore, seleziona o inserisci un indirizzo di spedizione.'); }
            if (addressSelection === 'new' && (!formData.indirizzo || !formData.citta || !formData.cap)) { throw new Error('Per favore, compila tutti i campi per il nuovo indirizzo.'); }
            if (!paymentMethod) { throw new Error('Per favore, seleziona o inserisci un metodo di pagamento.'); }
            if (paymentMethod === 'new' && (!formData.nome_titolare || !formData.numero_carta || !formData.data_scadenza || !formData.cvv)) { throw new Error('Per favore, compila tutti i campi per la nuova carta di pagamento.'); }

            // Gestione Indirizzo
            if (addressSelection === 'new') {
                finalAddress = { nome: req.user.nome, cognome: req.user.cognome, indirizzo: formData.indirizzo, citta: formData.citta, cap: formData.cap };
                await indirizziDao.createIndirizzo({ ...finalAddress, user_id: userId });
            } else {
                const savedAddress = await indirizziDao.getIndirizzoById(addressSelection);
                if (!savedAddress || savedAddress.user_id !== userId) throw new Error('Indirizzo selezionato non valido.');
                finalAddress = { ...savedAddress, nome: req.user.nome, cognome: req.user.cognome };
            }

            // Gestione Pagamento
            if (paymentMethod === 'new') {
                finalPaymentMethod = { nome_titolare: formData.nome_titolare, last4: formData.numero_carta.slice(-4), data_scadenza: formData.data_scadenza };
                await metodiPagamentoDao.createMetodoPagamento({ ...formData, user_id: userId });
            } else {
                const savedPayments = await metodiPagamentoDao.getMetodiPagamentoByUserId(userId);
                finalPaymentMethod = savedPayments.find(p => p.id == paymentMethod);
                if (!finalPaymentMethod) throw new Error('Metodo di pagamento selezionato non valido.');
            }

            // Inizio Transazione
            await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve()));
            transactionStarted = true;

            const purchasedItems = [];
            for (const id in cart.items) {
                const product = cart.items[id].item;
                await ordiniDao.createOrder({ totale: cart.items[id].price, user_id: userId, prodotto_id: product.id });
                await prodottiDao.updateProductStatus(product.id, 'venduto');
                await observedDao.flagPriceChange(product.id); // Notifica chi osserva il prodotto
                purchasedItems.push(product);
            }
            await cartDao.clearCart(userId); // Svuota il carrello dal DB

            // Fine Transazione
            await new Promise((resolve, reject) => db.run('COMMIT', err => err ? reject(err) : resolve()));
            transactionStarted = false;

            // Preparazione per la pagina di riepilogo e email
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
                await observedDao.flagPriceChange(product.id);
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

/**
 * ROTTA: GET /carrello/api/data
 * * Un endpoint API che restituisce i dati del carrello in formato JSON.
 * Utilizzato dallo script `script.js` nel frontend per aggiornare dinamicamente
 * l'anteprima del carrello senza ricaricare la pagina.
 */
router.get('/api/data', (req, res) => {
    res.json(req.session.cart);
});

module.exports = router;