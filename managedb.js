// File: managedb.js

'use strict';

const sqlite = require('sqlite3');
const fs = require('fs');
const bcrypt = require('bcrypt');
const DB_NAME = process.env.DB_NAME;

const db = new sqlite.Database('./' + DB_NAME);

/**
 * Inizializza il database, assicurandosi che le tabelle esistano.
 */
const initializeDb = () => {
  return new Promise((resolve, reject) => {
    // Leggiamo lo schema SQL che contiene i comandi "CREATE TABLE IF NOT EXISTS"
    const schema = fs.readFileSync('./schema.sql', 'utf8');

    db.serialize(() => {
      // Attiva i vincoli di chiave esterna
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) return reject(err);
      });

      // Eseguiamo lo schema OGNI VOLTA. 
      // "IF NOT EXISTS" previene errori se le tabelle esistono già.
      db.exec(schema, (err) => {
        if (err) {
          console.error("Errore nell'esecuzione dello schema SQL:", err);
          return reject(err);
        }
        
        console.log('Schema del database verificato/creato con successo.');

        // Controlliamo se l'utente admin esiste già per evitare di crearlo di nuovo
        const checkAdminSql = `SELECT id FROM users WHERE username = 'admin'`;
        db.get(checkAdminSql, async (err, row) => {
          if (err) return reject(err);

          // Se 'row' è undefined, l'admin non esiste e lo creiamo
          if (!row) {
            console.log("Utente 'admin' non trovato, lo creo...");
            try {
              const adminPassword = await bcrypt.hash('admin1234', 10);
              // --- INIZIO MODIFICA ---
              // Assegnamo il tipo_account 'admin' invece di 'venditore'
              const insertAdminSQL = `
                INSERT INTO users (username, nome, cognome, data_nascita, email, password_hash, tipo_account) 
                VALUES ('admin', 'admin', 'funshop', '2004-11-25', 'admin@mail.com', ?, 'admin')
              `;
              // --- FINE MODIFICA ---
              db.run(insertAdminSQL, [adminPassword], (err) => {
                if (err) return reject(err);
                console.log('Utente admin creato con successo!');
                resolve(db); // Database pronto
              });
            } catch (error) {
              reject(error);
            }
          } else {
            // Se l'admin esiste già, il database è pronto
            console.log("Utente 'admin' già presente.");
            resolve(db);
          }
        });
      });
    });
  });
};

module.exports = { db, initializeDb };