'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Importa i tuoi DAO (assicurati che i percorsi siano corretti)
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const informazioniDao = require('../models/dao/informazioni-dao');

/**
 * Middleware di protezione:
 * Assicura che solo gli utenti autenticati possano accedere a queste rotte.
 */
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    res.redirect('/auth/login');
};

// Applica il middleware a TUTTE le rotte definite in questo file
router.use(ensureAuthenticated);

/**
 * ROTTA DINAMICA PER LA DASHBOARD UTENTE
 * Gestisce la visualizzazione di tutte le sezioni: /utente, /utente/ordini, /utente/prodotti, etc.
 */
router.get('/', async (req, res) => {
    // Se non viene specificata una sezione, reindirizza a 'dati'
    const section = req.query.section || 'dati';
    const validSections = ['dati', 'ordini', 'indirizzi', 'prodotti', 'statistiche'];

    if (!validSections.includes(section)) {
        // Se la sezione non è valida, vai alla dashboard di default
        return res.redirect('/utente');
    }

    // Se un utente normale prova ad accedere alle statistiche, reindirizza
    if (section === 'statistiche' && req.user.tipo_account !== 'venditore') {
        return res.redirect('/utente');
    }

    try {
        // Carica TUTTI i dati necessari per la dashboard, indipendentemente dalla sezione
        const prodottiUtente = await prodottiDao.getProductsByUserId(req.user.id);
        const storicoOrdini = await ordiniDao.getOrdersByUserId(req.user.id);
        const indirizziUtente = await informazioniDao.getAccountInfosByUserId(req.user.id);

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            user: req.user, // Passa l'intero oggetto utente al template
            currentSection: section,
            prodotti: prodottiUtente,
            ordini: storicoOrdini,
            indirizzi: indirizziUtente,
        });
    } catch (error) {
        console.error(`Errore nel caricare la dashboard utente:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento del tuo profilo.');
        res.redirect('/');
    }
});


/**
 * ROTTA PER AGGIORNARE I DATI ANAGRAFICI DELL'UTENTE
 * Corrisponde al form nella sezione 'I miei Dati'.
 */
router.post('/dati/aggiorna', [
    check('nome').notEmpty().withMessage('Il nome è obbligatorio'),
    check('cognome').notEmpty().withMessage('Il cognome è obbligatorio'),
    check('username').isLength({ min: 3 }).withMessage('L\'username è obbligatorio'),
    check('data_nascita').isDate().withMessage('La data di nascita non è valida')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente/dati'); // Torna alla sezione dati
    }

    try {
        await utentiDao.updateUserData(req.user.id, req.body);
        req.flash('success', 'Dati aggiornati con successo!');
        res.redirect('/utente');
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati:", error);
        req.flash('error', 'Si è verificato un errore.');
        res.redirect('/utente');
    }
});

// Aggiungi un nuovo indirizzo
router.post('/indirizzi/aggiungi', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isPostalCode('IT').withMessage('Il CAP non è valido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente/indirizzi');
    }
    try {
        await utentiDao.addIndirizzo(req.user.id, req.body);
        req.flash('success', 'Indirizzo aggiunto con successo!');
        res.redirect('/utente/indirizzi');
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'aggiunta dell'indirizzo.");
        res.redirect('/utente/indirizzi');
    }
});

// Prendi i dati di un indirizzo per la modifica (restituisce JSON)
router.get('/indirizzi/modifica/:id', async (req, res) => {
    try {
        const indirizzo = await informazioniDao.getAccountInfoById(req.params.id);
        if (indirizzo && indirizzo.user_id === req.user.id) {
            res.json(indirizzo);
        } else {
            res.status(404).send('Indirizzo non trovato.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Errore nel recupero dell'indirizzo.");
    }
});

// Aggiorna un indirizzo
router.post('/indirizzi/aggiorna/:id', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isPostalCode('IT').withMessage('Il CAP non è valido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente/indirizzi');
    }
    try {
        await utentiDao.updateIndirizzo(req.params.id, req.body);
        req.flash('success', 'Indirizzo aggiornato con successo!');
        res.redirect('/utente/indirizzi');
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'aggiornamento dell'indirizzo.");
        res.redirect('/utente/indirizzi');
    }
});

// Elimina un indirizzo
router.post('/indirizzi/elimina/:id', async (req, res) => {
    try {
        await utentiDao.deleteIndirizzo(req.params.id);
        req.flash('success', 'Indirizzo eliminato con successo!');
        res.redirect('/utente/indirizzi');
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'eliminazione dell'indirizzo.");
        res.redirect('/utente/indirizzi');
    }
});

// Rotta per l'eliminazione di un prodotto
router.post('/prodotti/:id/delete', async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;

        const result = await prodottiDao.deleteProduct(productId, userId);

        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto eliminato con successo.');
        }
        res.redirect('/utente?section=prodotti');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'eliminazione del prodotto.');
        res.redirect('/utente?section=prodotti');
    }
});

// Rotta per mostrare il form di modifica del prodotto
router.get('/prodotti/:id/edit', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await prodottiDao.getProductById(productId);

        if (!product || product.user_id !== req.user.id) {
            req.flash('error', 'Azione non permessa.');
            return res.redirect('/utente?section=prodotti');
        }

        res.render('pages/edit-prodotto', {
            title: 'Modifica Prodotto',
            prodotto: product,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore nel caricamento della pagina di modifica.');
        res.redirect('/utente?section=prodotti');
    }
});

// Rotta per aggiornare un prodotto
router.post('/prodotti/:id/edit', async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;

        const updatedData = {
            nome: req.body.nome,
            descrizione: req.body.descrizione,
            prezzo: parseFloat(req.body.prezzo),
            parola_chiave: req.body.parola_chiave
        };

        if (req.file) {
            updatedData.percorso_immagine = '/uploads/' + req.file.filename;
        }

        const result = await prodottiDao.updateProduct(productId, updatedData, userId);

        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto aggiornato con successo.');
        }
        res.redirect('/utente?section=prodotti');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'aggiornamento del prodotto.');
        res.redirect('/utente?section=prodotti');
    }
});

module.exports = router;