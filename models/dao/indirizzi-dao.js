'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

/**
 * IndirizziDAO (Data Access Object)
 * Questa classe si occupa di tutte le operazioni relative alla tabella 'indirizzi' nel database.
 * Isola la logica del database dal resto dell'applicazione.
 */
class IndirizziDAO {

    /**
     * Recupera tutti gli indirizzi associati a un specifico ID utente.
     * @param {number} userId - L'ID dell'utente di cui vogliamo gli indirizzi.
     * @returns {Promise<Array<Object>>} Una promessa che, se risolta, restituisce un array di oggetti indirizzo.
     */
    async getIndirizziByUserId(userId) {
        // Sostituiamo ? con $1
        const sql = 'SELECT * FROM indirizzi WHERE user_id = $1';
        try {
            // Usiamo await e db.query, il risultato è in 'rows'
            const { rows } = await db.query(sql, [userId]);
            return rows;
        } catch (err) {
            console.error("Errore in getIndirizziByUserId:", err);
            throw err; // Rilanciamo l'errore per gestirlo nel chiamante
        }
    }

    /**
     * Recupera un singolo indirizzo basandosi sul suo ID univoco.
     * @param {number} indirizzoId - L'ID dell'indirizzo da cercare.
     * @returns {Promise<Object>} Una promessa che restituisce l'oggetto indirizzo, se trovato.
     */
    async getIndirizzoById(indirizzoId) {
        // Sostituiamo ? con $1
        const sql = 'SELECT * FROM indirizzi WHERE id = $1';
        try {
            // Usiamo db.query, il risultato è in 'rows[0]'
            const { rows } = await db.query(sql, [indirizzoId]);
            return rows[0]; // Restituisce la prima (e unica) riga trovata
        } catch (err) {
            console.error("Errore in getIndirizzoById:", err);
            throw err;
        }
    }

    /**
     * Crea un nuovo record di indirizzo nel database per un utente.
     * @param {Object} indirizzoData - Un oggetto contenente i dati dell'indirizzo: { user_id, indirizzo, citta, cap }.
     * @returns {Promise<number>} L'ID del nuovo indirizzo appena inserito.
     */
    async createIndirizzo(indirizzoData) {
        const { user_id, indirizzo, citta, cap } = indirizzoData;
        // Usiamo i placeholder $1, $2, ecc. e 'RETURNING id' per ottenere l'ID
        const sql = `
            INSERT INTO indirizzi (user_id, indirizzo, citta, cap) 
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        try {
            const { rows } = await db.query(sql, [user_id, indirizzo, citta, cap]);
            return rows[0].id; // Restituisce l'ID del record appena creato
        } catch (err) {
            console.error("Errore in createIndirizzo:", err);
            throw err;
        }
    }

    /**
     * Aggiorna i dati di un indirizzo esistente.
     * @param {number} indirizzoId - L'ID dell'indirizzo da modificare.
     * @param {Object} indirizzoData - I nuovi dati: { indirizzo, citta, cap }.
     * @returns {Promise<number>} Il numero di righe modificate (dovrebbe essere 1).
     */
    async updateIndirizzo(indirizzoId, indirizzoData) {
        const { indirizzo, citta, cap } = indirizzoData;
        // Placeholder $1, $2, $3, $4
        const sql = 'UPDATE indirizzi SET indirizzo = $1, citta = $2, cap = $3 WHERE id = $4';
        try {
            // 'rowCount' contiene il numero di righe modificate
            const { rowCount } = await db.query(sql, [indirizzo, citta, cap, indirizzoId]);
            return rowCount;
        } catch (err) {
            console.error("Errore in updateIndirizzo:", err);
            throw err;
        }
    }

    /**
     * Elimina un indirizzo dal database.
     * @param {number} indirizzoId - L'ID dell'indirizzo da eliminare.
     * @param {number} userId - L'ID dell'utente proprietario, per un controllo di sicurezza.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    async deleteIndirizzo(indirizzoId, userId) {
        // Placeholder $1 e $2
        const sql = 'DELETE FROM indirizzi WHERE id = $1 AND user_id = $2';
        try {
            const { rowCount } = await db.query(sql, [indirizzoId, userId]);
            return rowCount; // Restituisce il numero di righe eliminate
        } catch (err) {
            console.error("Errore in deleteIndirizzo:", err);
            throw err;
        }
    }
}

// Esportiamo una nuova istanza della classe
module.exports = new IndirizziDAO();