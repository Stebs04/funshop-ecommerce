'use strict';

// Importazione dei moduli necessari
const sqlite = require('sqlite3');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Nome del database caricato dalle variabili d'ambiente
const DB_NAME = process.env.DB_NAME;

// Creazione di una nuova istanza del database SQLite
const db = new sqlite.Database('./' + DB_NAME);

/**
 * Inizializza il database.
 * Questa funzione assicura che lo schema SQL sia applicato e che
 * l'utente amministratore esista, creando le tabelle e l'utente se necessario.
 * @returns {Promise<sqlite.Database>} Una Promise che si risolve con l'oggetto database quando pronto.
 */
const initializeDb = () => {
  return new Promise((resolve, reject) => {
    // Legge il file schema.sql che contiene le query CREATE TABLE
    const schema = fs.readFileSync('./schema.sql', 'utf8');

    db.serialize(() => {
      // Abilita il supporto per le chiavi esterne, fondamentale per l'integrità relazionale
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) return reject(err);
      });

      // Esegue le query contenute nel file schema.sql.
      // L'uso di "IF NOT EXISTS" previene errori se le tabelle sono già state create.
      db.exec(schema, (err) => {
        if (err) {
          console.error("Errore nell'esecuzione dello schema SQL:", err);
          return reject(err);
        }
        
        console.log('Schema del database verificato/creato con successo.');

        // Verifica se l'utente 'admin' esiste già per evitare duplicati
        const checkAdminSql = `SELECT id FROM users WHERE username = 'admin'`;
        db.get(checkAdminSql, async (err, row) => {
          if (err) return reject(err);

          // Se 'row' è undefined, l'admin non esiste e viene creato
          if (!row) {
            console.log("Utente 'admin' non trovato, lo creo...");
            try {
              // Hash della password di default per l'admin
              const adminPassword = await bcrypt.hash('admin1234', 10);
              const insertAdminSQL = `
                INSERT INTO users (username, nome, cognome, data_nascita, email, password_hash, tipo_account) 
                VALUES ('admin', 'admin', 'funshop', '2004-11-25', 'admin@mail.com', ?, 'admin')
              `;
              db.run(insertAdminSQL, [adminPassword], (err) => {
                if (err) return reject(err);
                console.log('Utente admin creato con successo!');
                resolve(db); // Risolve la Promise, indicando che il DB è pronto
              });
            } catch (error) {
              reject(error);
            }
          } else {
            // Se l'admin esiste già, il DB è comunque pronto
            console.log("Utente 'admin' già presente.");
            resolve(db);
          }
        });
      });
    });
  });
};

// Esporta l'istanza del database e la funzione di inizializzazione
module.exports = { db, initializeDb };