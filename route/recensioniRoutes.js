// File: route/recensioniRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const recensioniDao = require('../models/dao/recensioni-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// NUOVA ROTTA: Mostra la pagina per recensire un venditore in base a un prodotto
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

// Rotta per aggiungere una nuova recensione
router.post('/', isLoggedIn, [
    check('contenuto').notEmpty().withMessage('Il testo della recensione non può essere vuoto.'),
    check('valutazione').isInt({ min: 1, max: 5 }).withMessage('La valutazione deve essere un numero tra 1 e 5.'),
    check('prodotto_id').isInt().withMessage('ID prodotto non valido.')
], async (req, res) => {
    const errors = validationResult(req);
    const prodottoId = req.body.prodotto_id;
    const redirectUrl = req.body.redirectUrl || `/products/${prodottoId}`;

    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect(redirectUrl);
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
    res.redirect(redirectUrl);
});

module.exports = router;