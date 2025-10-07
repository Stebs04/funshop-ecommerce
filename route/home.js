'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('../models/dao/prodotti-dao'); // Importa il DAO dei prodotti

/**
 * ROTTA PER LA HOMEPAGE
 * Recupera tutti i prodotti e li visualizza.
 */
router.get('/', async (req, res) => {
    try {
        // 1. Usa il DAO per recuperare tutti i prodotti dal database.
        // La funzione getAllProducts() include già il nome del venditore.
        const prodotti = await prodottiDao.getAllProducts();

        // 2. Renderizza la pagina 'home.ejs', passando i dati necessari.
        res.render('pages/home', {
            title: 'FunShop - Home',
            prodotti: prodotti, // Passa la lista dei prodotti al template
            user: req.user || null, // Passa l'utente se è loggato, altrimenti null
            isAuthenticated: req.isAuthenticated(), // Passa lo stato di autenticazione
        });

    } catch (error) {
        // 3. In caso di errore, lo registra e mostra una pagina di errore.
        console.error('Errore durante il recupero dei prodotti per la homepage:', error);
        // In un'applicazione reale, reindirizzeresti a una pagina di errore dedicata.
        res.status(500).send("Si è verificato un errore nel caricamento dei prodotti.");
    }
});

// Aggiungi qui altre rotte principali se necessario (es. /about, /contatti, etc.)

/**
 * API ROUTE PER OTTENERE I PRODOTTI
 * Restituisce un JSON con tutti i prodotti per il caricamento dinamico.
 */
router.get('/api/products', async (req, res) => {
  try {
    const prodotti = await prodottiDao.getAllProducts();
    res.json(prodotti);
  } catch (error) {
    console.error('Errore API durante il recupero dei prodotti:', error);
    res.status(500).json({ error: 'Impossibile recuperare i prodotti' });
  }
});

module.exports = router;