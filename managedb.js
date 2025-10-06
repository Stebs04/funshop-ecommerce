'use strict';

const sqlite = require('sqlite3');
const fs = require('fs');
const bcrypt = require('bcrypt');
const DB_NAME = process.env.DB_NAME;

// Verifica se il database esiste
const dbExists = fs.existsSync('./' + DB_NAME);

const db = new sqlite.Database('./' + DB_NAME, (err) => {
  if (err) {
    console.log('Errore nella connessione: ', err.message);
  } else {
    console.log('Connessione al database avvenuta con successo...');
 // Attiva i vincoli di chiave esterna
    db.run('PRAGMA foreign_keys = ON');

    // Se il database non esisteva, crea le tabelle
    if (!dbExists) {
      const schema = fs.readFileSync('./schema.sql', 'utf8');
      db.exec(schema, async (err) => {
        if (err) {
          console.log('Errore nella creazione delle tabelle:', err.message);
        } else {
          console.log('Tabelle create con successo!');

          // Crea utente admin di default
          try {
            const adminPassword = await bcrypt.hash('admin1234', 10);
            const insertAdminSQL = `
              INSERT INTO utenti (nome, cognome, data_di_nascita, email, password, ruolo) 
              VALUES ('admin', 'funshop', '2004-11-25', 'admin@mail.com', ?, 'venditore')
            `;

            db.run(insertAdminSQL, [adminPassword], (err) => {
              if (err) {
                console.log('Errore nella creazione dell\'utente admin:', err.message);
              } else {
                console.log('Utente admin creato con successo!');
                console.log('Email: admin@gmail.com');
                console.log('Password: admin1234');
              }
            });
          } catch (error) {
            console.log('Errore nella generazione password admin:', error.message);
          }
        }
      });
    }
  }
});

module.exports = db;