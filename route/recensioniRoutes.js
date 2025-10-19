// File: route/recensioniRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import dei DAO e del middleware di autenticazione
const recensioniDao = require('../models/dao/recensioni-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

/**
 * ROTTA: GET /recensioni/venditore/:productId
 * * Mostra la pagina dedicata a lasciare una recensione per un venditore,
 * basandosi su un acquisto specifico.
 * * Logica:
 * 1. `isLoggedIn`: Assicura che solo gli utenti loggati possano lasciare recensioni.
 * 2. Recupera l'ID del prodotto dall'URL, che serve come "contesto" per la recensione.
 * 3. Recupera i dettagli del prodotto dal database.
 * 4. Se il prodotto non esiste, reindirizza con un errore.
 * 5. Se il prodotto esiste, renderizza la pagina `recensione-venditore.ejs`,
 * passando i dati del prodotto (come il nome del prodotto e del venditore)
 * per essere visualizzati nella pagina.
 */
router.get('/venditore/:productId', isLoggedIn, async (req, res) => {
    try {
        const product = await prodottiDao.getProductById(req.params.productId);
        if (!product) {
            req.flash('error', 'Prodotto non trovato.');
            return res.redirect('/');
        }
        res.render('pages/recensione-venditore', {
            title: `Recensisci il venditore per ${product.nome}`,
            prodotto: product
        });
    } catch (error) {
        req.flash('error', 'Si è verificato un errore.');
        res.redirect('/');
    }
});

/**
 * ROTTA: POST /recensioni/
 * * Gestisce l'invio e il salvataggio di una nuova recensione.
 * * Logica:
 * 1. `isLoggedIn`: Protegge la rotta.
 * 2. Validazione dei Campi: Usa `express-validator` per controllare che
 * - Il contenuto della recensione non sia vuoto.
 * - La valutazione sia un numero intero tra 1 e 5.
 * - L'ID del prodotto sia un intero valido.
 * 3. Se ci sono errori di validazione, li mostra all'utente e lo reindirizza
 * alla pagina precedente.
 * 4. Se i dati sono validi, crea un oggetto con i dati della recensione,
 * aggiungendo l'ID dell'utente che la sta scrivendo (`req.user.id`).
 * 5. Chiama `recensioniDao.createReview()` per salvare la recensione nel database.
 * 6. Mostra un messaggio di successo e reindirizza l'utente alla pagina specificata
 * in `redirectUrl` (solitamente la pagina del profilo del venditore).
 */
router.post('/', isLoggedIn, [
    check('contenuto').notEmpty().withMessage('Il testo della recensione non può essere vuoto.'),
    check('valutazione').isInt({ min: 1, max: 5 }).withMessage('La valutazione deve essere un numero tra 1 e 5.'),
    check('prodotto_id').isInt().withMessage('ID prodotto non valido.')
], async (req, res) => {
    const errors = validationResult(req);
    const prodottoId = req.body.prodotto_id;
    // L'URL di reindirizzamento viene passato come campo nascosto nel form
    const redirectUrl = req.body.redirectUrl || `/products/${prodottoId}`;

    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect(redirectUrl);
    }
    try {
        await recensioniDao.createReview({
            ...req.body,
            user_id: req.user.id // Associa la recensione all'utente loggato
        });
        req.flash('success', 'Recensione aggiunta con successo!');
    } catch (error) {
        console.error('Errore durante l\'aggiunta della recensione:', error);
        req.flash('error', 'Si è verificato un errore.');
    }
    res.redirect(redirectUrl);
});

module.exports = router;