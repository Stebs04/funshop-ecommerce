'use strict';

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();
// Importa l'applicazione Express configurata in app.js
const app = require('./app');
// Importa la funzione per inizializzare il database
const { initializeDb } = require('./managedb');
// Legge la porta per il server dalle variabili d'ambiente
const port = process.env.PORT;

/**
 * Funzione asincrona per avviare l'applicazione.
 * Questo approccio garantisce che il server si avvii solo dopo
 * che la connessione e l'inizializzazione del database sono state completate con successo.
 */
const startServer = async () => {
  try {
    // 1. Attende il completamento della configurazione del database.
    await initializeDb();
    console.log('Inizializzazione del database completata.');

    // 2. Avvia il server Express sulla porta specificata.
    app.listen(port, () => {
      console.log(`🚀 Server FunShop in ascolto su http://localhost:${port}`);
    });

  } catch (error) {
    // In caso di errore durante l'inizializzazione del database,
    // il processo viene interrotto per prevenire un avvio inconsistente dell'applicazione.
    console.error('❌ Impossibile inizializzare il database:', error);
    process.exit(1); // Termina l'applicazione con un codice di errore.
  }
};

// Esegue la funzione per avviare il server.
startServer();