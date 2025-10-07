'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Importa i tuoi DAO (assicurati che i percorsi siano corretti)
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
// Nota: Per lo storico ordini, dovrai creare un 'ordini-dao.js'
// const ordiniDao = require('../ordini-dao');

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
router.get('/:section', async (req, res) => {
    const section = req.params.section;
    // ... (il resto della logica rimane IDENTICO a prima)
    const validSections = ['dati', 'ordini', 'indirizzi', 'prodotti', 'statistiche'];

    if (!validSections.includes(section)) {
        return res.redirect('/utente');
    }

    if (section === 'statistiche' && req.user.tipo_account !== 'venditore') {
        return res.redirect('/utente');
    }

    try {
        let prodottiUtente = [], storicoOrdini = [];

        if (section === 'prodotti') {
            prodottiUtente = await prodottiDao.getProductsByUserId(req.user.id);
        }
        if (section === 'ordini') {
            // storicoOrdini = await ordiniDao.getOrdersByUserId(req.user.id);
        }

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            currentSection: section,
            prodotti: prodottiUtente,
            ordini: storicoOrdini,
        });
    } catch (error) {
        console.error(`Errore nel caricare la sezione '${section}':`, error);
        req.flash('error', 'Si è verificato un errore.');
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


module.exports = router;