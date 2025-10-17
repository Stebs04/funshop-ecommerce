// File: server.js

'use strict';

require('dotenv').config();
const app = require('./app');
const { initializeDb } = require('./managedb'); // Importiamo la nostra nuova funzione
const port = process.env.PORT;

/**
 * Funzione asincrona per avviare l'applicazione.
 * Prima inizializza il DB, e solo dopo avvia il server.
 */
const startServer = async () => {
  try {
    // 1. Aspetta che la Promise del database sia risolta
    await initializeDb();
    console.log('Inizializzazione del database completata.');

    // 2. Solo ora, avvia il server Express
    app.listen(port, () => {
      console.log(`🚀 Server FunShop in ascolto su http://localhost:${port}`);
    });

  } catch (error) {
    // Se c'è un errore durante l'inizializzazione del DB, blocca tutto.
    console.error('❌ Impossibile inizializzare il database:', error);
    process.exit(1); // Esce dall'applicazione con un codice di errore
  }
};

// Avvia tutta la procedura
startServer();