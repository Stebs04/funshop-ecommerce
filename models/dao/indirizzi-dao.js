'use strict';

const db = require('../../managedb');

/**
 * IndirizziDAO (Data Access Object)
 * Gestisce tutte le operazioni per la tabella 'indirizzi'.
 */
class IndirizziDAO {

    /**
     * Recupera tutti gli indirizzi di un utente.
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<Array<Object>>} Una lista di indirizzi.
     */
    getIndirizziByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM indirizzi WHERE user_id = ?';
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Recupera un singolo indirizzo tramite il suo ID.
     * @param {number} indirizzoId - L'ID dell'indirizzo.
     * @returns {Promise<Object>} L'oggetto indirizzo.
     */
    getIndirizzoById(indirizzoId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM indirizzi WHERE id = ?';
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
     * Aggiunge un nuovo indirizzo per un utente.
     * @param {Object} indirizzoData - Dati: { user_id, indirizzo, citta, cap }.
     * @returns {Promise<number>} L'ID del nuovo indirizzo.
     */
    createIndirizzo(indirizzoData) {
        return new Promise((resolve, reject) => {
            const { user_id, indirizzo, citta, cap } = indirizzoData;
            const sql = 'INSERT INTO indirizzi (user_id, indirizzo, citta, cap) VALUES (?, ?, ?, ?)';
            db.run(sql, [user_id, indirizzo, citta, cap], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Aggiorna un indirizzo esistente.
     * @param {number} indirizzoId - L'ID dell'indirizzo da aggiornare.
     * @param {Object} indirizzoData - Dati: { indirizzo, citta, cap }.
     * @returns {Promise<number>} Il numero di righe modificate.
     */
    updateIndirizzo(indirizzoId, indirizzoData) {
        return new Promise((resolve, reject) => {
            const { indirizzo, citta, cap } = indirizzoData;
            const sql = 'UPDATE indirizzi SET indirizzo = ?, citta = ?, cap = ? WHERE id = ?';
            db.run(sql, [indirizzo, citta, cap, indirizzoId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    /**
     * Elimina un indirizzo.
     * @param {number} indirizzoId - L'ID dell'indirizzo da eliminare.
     * @param {number} userId - L'ID dell'utente per sicurezza.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    deleteIndirizzo(indirizzoId, userId) {
        return new Promise((resolve, reject) => {
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

module.exports = new IndirizziDAO();