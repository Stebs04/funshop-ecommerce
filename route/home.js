'use strict';

const express = require('express');
const router = express.Router();
const prodottiDao = require('./prodotti-dao'); // Importa il DAO dei prodotti

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

module.exports = router;