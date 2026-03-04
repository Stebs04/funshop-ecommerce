// File: route/memberRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

// Import dei DAO necessari
const recensioniDao = require('../models/dao/recensioni-dao');
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const informazioniDao = require('../models/dao/informazioni-dao');

/**
 * ROTTA: GET /member/:id
 * * Mostra la pagina del profilo pubblico di un utente specifico.
 * * Logica:
 * 1. Recupera l'ID del membro dai parametri dell'URL (`req.params.id`).
 * 2. Controlla se l'utente che sta visualizzando la pagina è il proprietario del profilo
 * (`isOwner`). Questa variabile booleana verrà usata nel template per mostrare/nascondere
 * il pulsante "Modifica Profilo".
 * 3. Recupera i dati dell'utente dal database. Se l'utente non esiste, mostra un errore.
 * 4. Esegue query in parallelo (`Promise.all`) per recuperare:
 * - I prodotti messi in vendita da quell'utente.
 * - Le recensioni ricevute da quell'utente.
 * - Le informazioni aggiuntive del suo profilo (immagine, descrizione).
 * 5. Calcola la valutazione media delle recensioni:
 * - Somma tutte le valutazioni (`.reduce`).
 * - Divide la somma per il numero totale di recensioni.
 * 6. Renderizza la pagina `member.ejs`, passando tutti i dati raccolti:
 * - Dettagli del membro (`member`).
 * - Informazioni del profilo (`accountInfo`).
 * - Elenco dei suoi prodotti e delle recensioni ricevute.
 * - Valutazione media e conteggio delle recensioni.
 * - Il flag `isOwner`.
 */
router.get('/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        
        // Controlla se l'utente che visualizza è il proprietario del profilo
        const isOwner = req.isAuthenticated() && memberId == req.user.id;

        // Recupera i dati base del membro
        const member = await utentiDao.getUserById(memberId);
        if (!member) {
            req.flash('error', 'Utente non trovato.');
            return res.redirect('/');
        }

        // Recupera in parallelo prodotti, recensioni e informazioni extra
        const prodottiUtente = await prodottiDao.getProductsByUserId(memberId);
        const recensioniRicevute = await recensioniDao.getReviewsForUser(memberId);
        const accountInfoResult = await informazioniDao.getAccountInfoByUserId(memberId);
        const accountInfo = accountInfoResult || {}; // Assicura che sia un oggetto anche se è null

        // Calcola la media delle recensioni
        let averageRating = 0;
        if (recensioniRicevute.length > 0) {
            const totalRating = recensioniRicevute.reduce((sum, review) => sum + review.valutazione, 0);
            averageRating = totalRating / recensioniRicevute.length;
        }

        // Renderizza la pagina del profilo pubblico
        res.render('pages/member', {
            title: `Profilo di ${member.username}`,
            user: req.user,
            member: member,
            accountInfo: accountInfo,
            prodotti: prodottiUtente,
            recensioni: recensioniRicevute,
            averageRating: averageRating,
            reviewCount: recensioniRicevute.length,
            isOwner: isOwner // Passa il flag alla vista
        });
    } catch (error) {
        console.error(`Errore nel caricare la pagina membro:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento della pagina.');
        res.redirect('/');
    }
});

module.exports = router;