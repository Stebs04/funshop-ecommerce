'use strict';

// Importiamo la connessione al database.
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
    getIndirizziByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM indirizzi WHERE user_id = ?';
            // db.all esegue la query e restituisce tutte le righe trovate come un array.
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    // Se c'è un errore, rifiutiamo la promessa.
                    reject(err);
                } else {
                    // Altrimenti, risolviamo la promessa con le righe trovate.
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Recupera un singolo indirizzo basandosi sul suo ID univoco.
     * @param {number} indirizzoId - L'ID dell'indirizzo da cercare.
     * @returns {Promise<Object>} Una promessa che restituisce l'oggetto indirizzo, se trovato.
     */
    getIndirizzoById(indirizzoId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM indirizzi WHERE id = ?';
            // db.get esegue la query e restituisce solo la prima riga trovata.
            db.get(sql, [indirizzoId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Crea un nuovo record di indirizzo nel database per un utente.
     * @param {Object} indirizzoData - Un oggetto contenente i dati dell'indirizzo: { user_id, indirizzo, citta, cap }.
     * @returns {Promise<number>} L'ID del nuovo indirizzo appena inserito.
     */
    createIndirizzo(indirizzoData) {
        return new Promise((resolve, reject) => {
            // Estraiamo i dati dall'oggetto per chiarezza.
            const { user_id, indirizzo, citta, cap } = indirizzoData;
            const sql = 'INSERT INTO indirizzi (user_id, indirizzo, citta, cap) VALUES (?, ?, ?, ?)';
            // db.run esegue una query che non restituisce righe (come INSERT, UPDATE, DELETE).
            db.run(sql, [user_id, indirizzo, citta, cap], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // 'this.lastID' contiene l'ID dell'ultima riga inserita.
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Aggiorna i dati di un indirizzo esistente.
     * @param {number} indirizzoId - L'ID dell'indirizzo da modificare.
     * @param {Object} indirizzoData - I nuovi dati: { indirizzo, citta, cap }.
     * @returns {Promise<number>} Il numero di righe modificate (dovrebbe essere 1).
     */
    updateIndirizzo(indirizzoId, indirizzoData) {
        return new Promise((resolve, reject) => {
            const { indirizzo, citta, cap } = indirizzoData;
            const sql = 'UPDATE indirizzi SET indirizzo = ?, citta = ?, cap = ? WHERE id = ?';
            db.run(sql, [indirizzo, citta, cap, indirizzoId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // 'this.changes' contiene il numero di righe che sono state modificate dalla query.
                    resolve(this.changes);
                }
            });
        });
    }

    /**
     * Elimina un indirizzo dal database.
     * @param {number} indirizzoId - L'ID dell'indirizzo da eliminare.
     * @param {number} userId - L'ID dell'utente proprietario, per un controllo di sicurezza.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    deleteIndirizzo(indirizzoId, userId) {
        return new Promise((resolve, reject) => {
            // La clausola 'AND user_id = ?' assicura che un utente possa eliminare solo i propri indirizzi.
            const sql = 'DELETE FROM indirizzi WHERE id = ? AND user_id = ?';
            db.run(sql, [indirizzoId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
}

// Esportiamo una nuova istanza della classe, così da poterla usare come un singleton
// in altre parti dell'applicazione (es. nelle routes).
module.exports = new IndirizziDAO();