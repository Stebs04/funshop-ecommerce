// File: route/home.js

'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao');

/**
 * ROTTA DINAMICA PER LA HOMEPAGE E LE SEZIONI
 * Mostra i prodotti in base ai filtri passati come query parameters.
 */
router.get('/', async (req, res) => {
    try {
        const { view, category } = req.query;
        let prodotti;
        let title = 'Prodotti in Evidenza'; // Titolo di default

        // Recupera dinamicamente le categorie per la navbar
        const categorie = await prodottiDao.getAllCategories();

        if (view === 'novita') {
            title = 'Novità del Giorno';
            prodotti = await prodottiDao.getProducts('new');
        } else if (view === 'offerte') {
            title = 'Prodotti in Offerta';
            prodotti = await prodottiDao.getProducts('offers');
        } else if (category) {
            title = `Categoria: ${category}`;
            prodotti = await prodottiDao.getProducts('category', category);
        } else {
            // Se nessun filtro è specificato, mostra tutti i prodotti
            prodotti = await prodottiDao.getProducts('all');
        }

        // Renderizza la pagina 'home.ejs' passando i dati filtrati
        res.render('pages/home', {
            pageTitle: title, // Titolo dinamico per la pagina
            prodotti: prodotti,
            categorie: categorie, // Passa le categorie alla vista
            user: req.user || null,
            isAuthenticated: req.isAuthenticated(),
        });

    } catch (error) {
        console.error('Errore durante il recupero dei prodotti per la homepage:', error);
        res.status(500).send("Si è verificato un errore nel caricamento dei prodotti.");
    }
});


// L'API route non è più necessaria per la homepage, ma la lasciamo se serve altrove
router.get('/api/products', async (req, res) => {
  try {
    const prodotti = await prodottiDao.getProducts('all');
    res.json(prodotti);
  } catch (error) {
    console.error('Errore API durante il recupero dei prodotti:', error);
    res.status(500).json({ error: 'Impossibile recuperare i prodotti' });
  }
});

module.exports = router;