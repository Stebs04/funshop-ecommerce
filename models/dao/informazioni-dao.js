'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

/**
 * Recupera le informazioni aggiuntive dell'account (come immagine profilo e descrizione)
 * associate a un ID utente dalla tabella 'accountinfos'.
 * @param {number} userId - L'ID dell'utente.
 * @returns {Promise<Object|undefined>} Una promessa che risolve in un oggetto contenente le informazioni
 * o 'undefined' se non viene trovato nessun record.
 */
const getAccountInfoByUserId = async (userId) => {
    const sql = 'SELECT * FROM accountinfos WHERE user_id = $1';
    try {
        // Usiamo db.query e ci aspettiamo al massimo una riga (dato che user_id è UNIQUE)
        const { rows } = await db.query(sql, [userId]);
        return rows[0];
    } catch (err) {
        console.error("Errore nel recuperare le informazioni dell'account:", err.message);
        throw err;
    }
};

/**
 * Aggiorna o imposta per la prima volta l'immagine del profilo di un utente.
 * Utilizza la sintassi "UPSERT" (INSERT ... ON CONFLICT) di PostgreSQL:
 * 1. Tenta di INSERIRE un nuovo record.
 * 2. Se trova un conflitto sulla colonna 'user_id' (che è UNIQUE),
 * esegue un UPDATE sulla riga esistente.
 * @param {number} userId - L'ID dell'utente.
 * @param {string} imagePath - Il percorso del file della nuova immagine.
 * @returns {Promise<number>} Una promessa che risolve nel numero di righe modificate.
 */
const updateProfileImage = async (userId, imagePath) => {
    const sql = `
        INSERT INTO accountinfos (user_id, immagine_profilo)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE 
        SET immagine_profilo = EXCLUDED.immagine_profilo;
    `;
    // EXCLUDED.immagine_profilo si riferisce al valore che stavamo cercando di inserire ($2)
    
    try {
        const { rowCount } = await db.query(sql, [userId, imagePath]);
        return rowCount; // Restituirà 1 sia in caso di INSERT che di UPDATE
    } catch (err) {
        console.error("Errore durante l'aggiornamento dell'immagine del profilo:", err.message);
        throw err;
    }
};

// Esportiamo le funzioni
module.exports = { getAccountInfoByUserId, updateProfileImage };