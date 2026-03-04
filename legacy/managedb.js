'use strict';

// Importiamo il 'Pool' dal pacchetto 'pg' invece di 'sqlite3'
const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Creiamo un'istanza del Pool di connessioni usando le variabili d'ambiente.
// Il Pool gestisce più connessioni contemporaneamente, è molto efficiente.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Esportiamo un oggetto 'db' che ha un metodo 'query'.
// Questo ci permette di mantenere i nostri file DAO (Data Access Objects) puliti.
// La sintassi è: db.query(stringaSql, [arrayDiParametri])
const db = {
  query: (text, params) => pool.query(text, params),
};

/**
 * Inizializza il database.
 * Ora legge il file schema.sql e lo esegue su PostgreSQL.
 * Gestisce anche la creazione dell'utente admin.
 */
const initializeDb = async () => {
  console.log('Avvio inizializzazione database PostgreSQL...');

  // Acquisiamo una connessione "client" dal pool per eseguire le query di setup
  const client = await pool.connect();
  console.log('Connesso al database PostgreSQL.');

  try {
    // Leggiamo lo schema SQL (dovremo tradurlo per Postgres, te lo fornirò al prossimo passo!)
    const schema = fs.readFileSync('./schema.sql', 'utf8');

    // Eseguiamo la query per creare le tabelle
    await client.query(schema);
    console.log('Schema del database verificato/creato con successo.');

    // Verifica se l'utente 'admin' esiste già
    const checkAdminSql = `SELECT id FROM users WHERE username = 'admin'`;
    // 'pg' restituisce un oggetto risultato, le righe sono nella proprietà 'rows'
    const { rows } = await client.query(checkAdminSql);

    if (rows.length === 0) {
      // Se l'admin non esiste, lo creiamo
      console.log("Utente 'admin' non trovato, lo creo...");
      const adminPassword = await bcrypt.hash('admin1234', 10);
      
      // Nota: i placeholder ora sono $1, $2, ecc. (specifici di pg)
      const insertAdminSQL = `
        INSERT INTO users (username, nome, cognome, data_nascita, email, password_hash, tipo_account) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const adminParams = ['admin', 'admin', 'funshop', '2004-11-25', 'admin@mail.com', adminPassword, 'admin'];
      
      await client.query(insertAdminSQL, adminParams);
      console.log('Utente admin creato con successo!');
    } else {
      console.log("Utente 'admin' già presente.");
    }

    console.log('Inizializzazione del database completata.');

  } catch (error) {
    console.error('❌ Impossibile inizializzare il database:', error);
    // Se c'è un errore, terminiamo il processo per evitare problemi
    process.exit(1);
  } finally {
    // Rilasciamo il client al pool, sia in caso di successo che di errore
    client.release();
    console.log('Connessione di inizializzazione rilasciata.');
  }
};

// Esportiamo sia 'db' (per le query semplici) sia 'pool' (per le transazioni).
module.exports = { db, pool, initializeDb };