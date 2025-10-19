// File: route/search.js
'use strict';

const express = require('express');
const router = express.Router();
const searchDao = require('../models/dao/search-dao');

/**
 * GET /search
 * Esegue una ricerca per prodotti e utenti in base a una query.
 */
router.get('/', async (req, res) => {
    const query = req.query.q; // Prendiamo il termine di ricerca dal parametro 'q'

    if (!query) {
        // Se non c'è una query, potremmo reindirizzare alla homepage o mostrare un messaggio
        return res.redirect('/');
    }

    try {
        // Eseguiamo entrambe le ricerche in parallelo per ottimizzare i tempi
        const [prodotti, utenti] = await Promise.all([
            searchDao.searchProducts(query),
            searchDao.searchUsers(query)
        ]);

        res.render('pages/search-results', {
            title: `Risultati per "${query}"`,
            query: query,
            prodotti: prodotti,
            utenti: utenti,
            user: req.user || null,
            isAuthenticated: req.isAuthenticated()
        });

    } catch (error) {
        console.error('Errore durante la ricerca:', error);
        req.flash('error', 'Si è verificato un errore durante la ricerca.');
        res.redirect('/');
    }
});

module.exports = router;