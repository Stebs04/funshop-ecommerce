// File: route/home.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');

// Definiamo le categorie e le condizioni in un unico posto per coerenza.
// Questi array verranno passati al template per popolare i menu a tendina dei filtri.
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
 * ROTTA: GET /
 * * Gestisce la visualizzazione della homepage e dei prodotti filtrati.
 * Questa è la rotta principale dell'applicazione.
 * * Logica:
 * 1. Estrae i parametri di query dall'URL (`req.query`), che possono includere:
 * - `view`: Per viste speciali come 'novita' o 'offerte'.
 * - `category`: Per filtrare per categoria.
 * - `condition`: Per filtrare per condizione del prodotto.
 * - `sortBy`: Per ordinare i risultati (es. per prezzo).
 * * 2. Imposta un titolo di pagina dinamico in base ai filtri applicati.
 * * 3. Chiama `prodottiDao.getProducts(filters)`, passando un oggetto che contiene tutti i
 * filtri attivi. Il DAO si occuperà di costruire la query SQL corretta in base
 * ai filtri forniti.
 * * 4. Renderizza la pagina `home.ejs`, passando:
 * - `pageTitle`: Il titolo dinamico della pagina.
 * - `prodotti`: La lista dei prodotti ottenuta dal DAO.
 * - `categorie`, `condizioni`: Gli array per popolare i filtri.
 * - `currentFilters`: Un oggetto con i filtri attuali, usato per mantenere lo stato
 * dei filtri nel form dell'offcanvas dopo il ricaricamento della pagina.
 * - Dati sull'utente e l'autenticazione.
 */
router.get('/', async (req, res) => {
    try {
        const { view, category, condition, sortBy } = req.query;
        let title = 'Prodotti in Evidenza';

        // Costruisci l'oggetto dei filtri da passare al DAO
        const filters = { view, category, condition, sortBy };

        // Aggiorna il titolo della pagina in base ai filtri
        if (view === 'novita') title = 'Novità degli ultimi 2 giorni';
        if (view === 'offerte') title = 'Prodotti in Offerta';
        if (category) title = `Categoria: ${category}`;

        // Recupera i prodotti dal DAO applicando i filtri
        const prodotti = await prodottiDao.getProducts(filters);
        
        // Renderizza la pagina home con i dati recuperati
        res.render('pages/home', {
            pageTitle: title,
            prodotti: prodotti,
            categorie: categorie, 
            condizioni: condizioni, 
            currentFilters: filters, // Passa i filtri attuali per popolare il form
            user: req.user || null,
            isAuthenticated: req.isAuthenticated(),
        });

    } catch (error) {
        console.error('Errore durante il recupero dei prodotti:', error);
        res.status(500).send("Si è verificato un errore nel caricamento dei prodotti.");
    }
});

module.exports = router;