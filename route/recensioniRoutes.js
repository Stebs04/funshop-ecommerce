'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const recensioniDao = require('../models/dao/recensioni-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Rotta per aggiungere una nuova recensione
router.post('/', isLoggedIn, [
    check('contenuto').notEmpty().withMessage('Il testo della recensione non può essere vuoto.'),
    check('valutazione').isInt({ min: 1, max: 5 }).withMessage('La valutazione deve essere un numero tra 1 e 5.'),
    check('prodotto_id').isInt().withMessage('ID prodotto non valido.')
], async (req, res) => {
    const errors = validationResult(req);
    const prodottoId = req.body.prodotto_id;

    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect(`/products/${prodottoId}`);
    }

    try {
        await recensioniDao.createReview({
            ...req.body,
            user_id: req.user.id
        });
        req.flash('success', 'Recensione aggiunta con successo!');
    } catch (error) {
        console.error('Errore durante l\'aggiunta della recensione:', error);
        req.flash('error', 'Si è verificato un errore.');
    }
    res.redirect(`/products/${prodottoId}`);
});

module.exports = router;