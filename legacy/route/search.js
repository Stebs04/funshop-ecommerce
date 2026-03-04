// File: route/search.js
'use strict';

const express = require('express');
const router = express.Router();
const searchDao = require('../models/dao/search-dao');

// Definiamo le categorie e le condizioni anche qui, per passarle al template
// in modo che i filtri possano essere popolati correttamente.
const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

const condizioni = ["Come nuovo", "Ottimo stato", "Tanto usato"];

/**
 * ROTTA: GET /search
 * Gestisce le richieste di ricerca provenienti dalla barra di ricerca nella navbar.
 * Cerca contemporaneamente sia prodotti che utenti.
 * Ora include anche la logica per filtrare ulteriormente i risultati dei prodotti.
 * Logica:
 * 1. Estrae tutti i parametri di query:
 * - `q`: Il termine di ricerca testuale.
 * - `category`, `condition`, `sortBy`: I filtri aggiuntivi.
 * 2. Se non c'è un termine di ricerca 'q', reindirizza alla homepage.
 * 3. Crea un oggetto `filters` che raggruppa tutti i parametri.
 * 4. Utilizza `Promise.all` per eseguire in parallelo le due ricerche:
 * - `searchDao.searchProducts(filters)`: Cerca prodotti passando l'intero oggetto
 * dei filtri (il DAO ora gestirà 'q' insieme agli altri filtri).
 * - `searchDao.searchUsers(filters.q)`: Cerca utenti (usa solo il termine 'q').
 * 5. Renderizza la pagina dei risultati `search-results.ejs`, passando:
 * - La query originale (`filters.q`).
 * - Le liste di `prodotti` e `utenti` trovati.
 * - Gli array `categorie` e `condizioni` per popolare i menu dei filtri.
 * - `currentFilters`: L'oggetto `filters` per mantenere lo stato dei filtri nel form.
 */
router.get('/', async (req, res) => {
    // Estrae tutti i parametri di query
    const { q, category, condition, sortBy } = req.query;

    // Se non c'è un termine di ricerca testuale (q), reindirizza alla home.
    if (!q) {
        return res.redirect('/');
    }

    try {
        // Raggruppa tutti i filtri in un unico oggetto
        const filters = { q, category, condition, sortBy };

        // Eseguiamo entrambe le ricerche in parallelo
        const [prodotti, utenti] = await Promise.all([
            // Passiamo l'intero oggetto filtri al DAO dei prodotti
            searchDao.searchProducts(filters), 
            // La ricerca utenti continua a usare solo il termine 'q'
            searchDao.searchUsers(q) 
        ]);

        // Renderizza la pagina dei risultati passando i dati trovati e i filtri
        res.render('pages/search-results', {
            title: `Risultati per "${q}"`,
            query: q, // Manteniamo 'query' per il titolo
            prodotti: prodotti,
            utenti: utenti,
            // Passiamo gli array per popolare i menu a tendina dei filtri
            categorie: categorie,
            condizioni: condizioni,
            // Passiamo i filtri attuali per mantenere lo stato del form
            currentFilters: filters, 
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