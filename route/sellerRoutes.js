'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const sellerDao = require('../models/dao/seller-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Proteggi tutte le rotte in questo file
router.use(isLoggedIn);

// GET /venditore - Mostra la pagina per diventare venditore
router.get('/', (req, res) => {
    res.render('pages/venditore', {
        title: 'Diventa un Venditore',
    });
});

// POST /venditore - Gestisce la richiesta per diventare venditore
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