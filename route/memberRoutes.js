'use strict';

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
        // Cerca l'informazione che contiene l'immagine del profilo
        const allAccountInfos = await informazioniDao.getAccountInfosByUserId(memberId);
        const accountInfo = allAccountInfos.find(info => info.immagine_profilo) || allAccountInfos[0] || {};


        res.render('pages/member', {
            title: `Profilo di ${member.username}`,
            user: req.user, // Utente loggato (se c'è)
            member: member,
            accountInfo: accountInfo,
            prodotti: prodottiUtente
        });
    } catch (error) {
        console.error(`Errore nel caricare la pagina membro:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento della pagina.');
        res.redirect('/');
    }
});

module.exports = router;
