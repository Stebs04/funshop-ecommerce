'use strict';

const recensioniDao = require('../models/dao/recensioni-dao');
const express = require('express');
const router = express.Router();
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const informazioniDao = require('../models/dao/informazioni-dao');

/**
 * ROTTA PER LA PAGINA DI UN MEMBRO SPECIFICO
 */
router.get('/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        // Evita che l'utente visualizzi il proprio profilo tramite questa rotta
        if (req.isAuthenticated() && memberId == req.user.id) {
            return res.redirect('/utente');
        }

        const member = await utentiDao.getUserById(memberId);
        if (!member) {
            req.flash('error', 'Utente non trovato.');
            return res.redirect('/');
        }

        const prodottiUtente = await prodottiDao.getProductsByUserId(memberId);
        const recensioniRicevute = await recensioniDao.getReviewsForUser(memberId);
        const accountInfoResult = await informazioniDao.getAccountInfoByUserId(memberId);
        const accountInfo = accountInfoResult || {};

        // Calcola la media delle recensioni
        let averageRating = 0;
        if (recensioniRicevute.length > 0) {
            const totalRating = recensioniRicevute.reduce((sum, review) => sum + review.valutazione, 0);
            averageRating = totalRating / recensioniRicevute.length;
        }

        res.render('pages/member', {
            title: `Profilo di ${member.username}`,
            user: req.user,
            member: member,
            accountInfo: accountInfo,
            prodotti: prodottiUtente,
            recensioni: recensioniRicevute,
            averageRating: averageRating, // Passa la media
            reviewCount: recensioniRicevute.length // Passa il numero di recensioni
        });
    } catch (error) {
        console.error(`Errore nel caricare la pagina membro:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento della pagina.');
        res.redirect('/');
    }
});

module.exports = router;
