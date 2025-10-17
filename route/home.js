// File: route/home.js
'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');

// Definiamo le categorie in un unico posto
const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

const condizioni = ["Come nuovo", "Ottimo stato", "Tanto usato"];

router.get('/', async (req, res) => {
    try {
        const { view, category, condition, sortBy } = req.query;
        let title = 'Prodotti in Evidenza';

        // Costruisci l'oggetto dei filtri da passare al DAO
        const filters = { view, category, condition, sortBy };

        if (view === 'novita') title = 'Novità del Giorno';
        if (view === 'offerte') title = 'Prodotti in Offerta';
        if (category) title = `Categoria: ${category}`;

        const prodotti = await prodottiDao.getProducts(filters);
        
        res.render('pages/home', {
            pageTitle: title,
            prodotti: prodotti,
            categorie: categorie, // Categorie predefinite
            condizioni: condizioni, // Condizioni predefinite
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