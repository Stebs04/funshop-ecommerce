// File: route/sellerRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import del DAO per i venditori e del middleware di autenticazione
const sellerDao = require('../models/dao/seller-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Applica il middleware `isLoggedIn` a tutte le rotte in questo file.
// Solo gli utenti loggati possono accedere alla sezione per diventare venditori.
router.use(isLoggedIn);

/**
 * ROTTA: GET /venditore
 * * Mostra la pagina "Diventa un Venditore".
 * * Logica:
 * 1. Renderizza semplicemente la pagina `venditore.ejs`.
 * 2. Il template `venditore.ejs` contiene una logica interna: se l'utente
 * è già un venditore (`user.tipo_account === 'venditore'`), mostrerà un messaggio
 * di conferma invece del form di registrazione. Altrimenti, mostrerà il form.
 */
router.get('/', (req, res) => {
    res.render('pages/venditore', {
        title: 'Diventa un Venditore',
    });
});

/**
 * ROTTA: POST /venditore
 * * Gestisce la richiesta di un utente per diventare venditore.
 * * Logica:
 * 1. Validazione dei campi del form: Controlla che tutti i campi obbligatori
 * (nome negozio, P.IVA, email, IBAN, descrizione) siano stati compilati
 * correttamente.
 * 2. Se ci sono errori di validazione, li mostra e ricarica la pagina del form.
 * 3. Controllo di sicurezza: Verifica di nuovo che l'utente non sia già un venditore,
 * per evitare richieste multiple.
 * 4. Se tutti i controlli passano, chiama `sellerDao.createSeller()`, passando
 * l'ID dell'utente corrente e i dati del form.
 * 5. Il DAO `createSeller` esegue una transazione sul database per:
 * - Inserire i dati del venditore nella tabella `venditori`.
 * - Aggiornare il `tipo_account` dell'utente da 'cliente' a 'venditore' nella tabella `users`.
 * 6. Se l'operazione ha successo, mostra un messaggio di congratulazioni e
 * reindirizza l'utente alla sua dashboard, direttamente nella sezione "I miei Prodotti".
 * 7. In caso di errore (es. P.IVA già esistente), mostra un messaggio appropriato.
 */
router.post('/', [
    check('nome_negozio').notEmpty().withMessage('Il nome del negozio è obbligatorio.'),
    check('partita_iva').notEmpty().withMessage('La Partita IVA è obbligatoria.'),
    check('email_contatto').isEmail().withMessage('Inserisci un\'email di contatto valida.'),
    check('iban').notEmpty().withMessage('L\'IBAN è obbligatorio.'),
    check('descrizione').notEmpty().withMessage('La descrizione è obbligatoria.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/venditore');
    }

    // Impedisce a un utente già venditore di inviare nuovamente il modulo
    if (req.user.tipo_account === 'venditore') {
        req.flash('error', 'Sei già un venditore.');
        return res.redirect('/');
    }

    try {
        // Chiama il DAO per creare il record del venditore e aggiornare il ruolo utente
        await sellerDao.createSeller(req.user.id, req.body);
        req.flash('success', 'Congratulazioni! Sei diventato un venditore.');
        res.redirect('/utente?section=prodotti');
    } catch (error) {
        console.error("Errore durante la creazione del venditore:", error);
        req.flash('error', 'Si è verificato un errore. La Partita IVA potrebbe essere già in uso.');
        res.redirect('/venditore');
    }
});

module.exports = router;