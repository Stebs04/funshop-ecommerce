// File: route/observedRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

// Import dei DAO e del middleware di autenticazione
const observedDao = require('../models/dao/observed-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Applica il middleware `isLoggedIn` a tutte le rotte di questo file.
// Solo gli utenti autenticati possono gestire e visualizzare i prodotti osservati.
router.use(isLoggedIn);

/**
 * ROTTA: GET /observed/
 * * Mostra la pagina con l'elenco dei prodotti che l'utente sta osservando.
 * * Logica:
 * 1. Recupera l'ID dell'utente dalla sessione (`req.user.id`).
 * 2. Chiama `observedDao.getObservedByUserId()` per ottenere la lista completa
 * dei prodotti osservati, arricchiti con i loro dettagli.
 * 3. Renderizza la pagina `observed-products.ejs`, passando l'elenco dei prodotti.
 * 4. **Logica di Notifica**: Subito dopo aver renderizzato la pagina, chiama
 * `observedDao.markNotificationsAsRead()`. Questo metodo "resetta" lo stato
 * delle notifiche di cambio prezzo, in modo che l'utente non veda lo stesso
 * avviso più volte.
 */
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

/**
 * ROTTA: POST /observed/add/:productId
 * * Aggiunge un prodotto alla lista degli osservati dell'utente.
 * * Logica:
 * 1. Controlla se l'utente sta già osservando il prodotto per evitare duplicati.
 * 2. Se non lo sta osservando, recupera i dettagli del prodotto per ottenere il prezzo attuale.
 * 3. Chiama `observedDao.addObserved()`, salvando nel database l'associazione
 * utente-prodotto e il prezzo al momento dell'aggiunta. Questo prezzo "osservato"
 * verrà usato in futuro per confrontarlo con il prezzo corrente e determinare
 * se c'è stata una variazione.
 * 4. Invia un messaggio di successo.
 */
router.post('/add/:productId', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user.id;
    const redirectUrl = `/products/${productId}`;

    try {
        // 1. Controlla se l'utente sta già osservando il prodotto
        const isAlreadyObserved = await observedDao.isObserved(userId, productId);
        if (isAlreadyObserved) {
            req.flash('error', 'Questo prodotto è già nella tua lista di osservati.');
            return res.redirect(redirectUrl);
        }

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
        console.error("Errore durante l'aggiunta agli osservati:", error);
        req.flash('error', 'Si è verificato un errore imprevisto.');
    }
    
    res.redirect(redirectUrl);
});

/**
 * ROTTA: POST /observed/remove/:productId
 * * Rimuove un prodotto dalla lista degli osservati dell'utente.
 * * Logica:
 * 1. Chiama `observedDao.removeObserved()` per eliminare il record corrispondente
 * dalla tabella `observed_products`.
 * 2. Invia un messaggio di successo e reindirizza l'utente alla pagina precedente.
 */
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