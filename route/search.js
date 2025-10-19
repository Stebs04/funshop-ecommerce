// File: route/search.js
'use strict';

const express = require('express');
const router = express.Router();
const searchDao = require('../models/dao/search-dao');

/**
 * ROTTA: GET /search
 * * Gestisce le richieste di ricerca provenienti dalla barra di ricerca nella navbar.
 * Cerca contemporaneamente sia prodotti che utenti.
 * * Logica:
 * 1. Estrae il termine di ricerca dal parametro di query `q` (es. `/search?q=termine`).
 * 2. Se la query è vuota, reindirizza semplicemente alla homepage.
 * 3. Utilizza `Promise.all` per eseguire in parallelo le due ricerche nel database:
 * - `searchDao.searchProducts(query)`: Cerca prodotti il cui nome contiene il termine.
 * - `searchDao.searchUsers(query)`: Cerca utenti il cui username contiene il termine.
 * 4. Renderizza la pagina dei risultati `search-results.ejs`, passando:
 * - La query originale (`query`) per mostrarla nel titolo.
 * - Le liste di `prodotti` e `utenti` trovati.
 * - Le informazioni standard sull'utente e l'autenticazione.
 * 5. In caso di errore durante la ricerca nel database, mostra un messaggio di errore
 * e reindirizza alla homepage.
 */
router.get('/', async (req, res) => {
    const query = req.query.q; // Prendiamo il termine di ricerca dal parametro 'q'

    // Se non c'è una query, non ha senso mostrare una pagina di risultati vuota.
    if (!query) {
        return res.redirect('/');
    }

    try {
        // Eseguiamo entrambe le ricerche in parallelo per ottimizzare i tempi
        const [prodotti, utenti] = await Promise.all([
            searchDao.searchProducts(query),
            searchDao.searchUsers(query)
        ]);

        // Renderizza la pagina dei risultati passando i dati trovati
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