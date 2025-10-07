'use strict';

const db = require('../../managedb');

/**
 * Recupera tutte le informazioni account associate a un ID utente.
 * @param {number} userId - L'ID dell'utente.
 * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di oggetti informazione.
 */
exports.getAccountInfosByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accountinfos WHERE user_id = ?';
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                console.error("Errore nel recuperare le informazioni dell'account:", err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

/**
 * Aggiunge nuove informazioni account per un utente.
 * @param {Object} infoData - Dati da aggiungere (user_id, indirizzo, citta, cap).
 * @returns {Promise<number>} Una promessa che risolve con l'ID delle nuove informazioni inserite.
 */
exports.addAccountInfo = (infoData) => {
    return new Promise((resolve, reject) => {
        const { user_id, indirizzo, citta, cap } = infoData;
        const sql = `
            INSERT INTO accountinfos (user_id, indirizzo, citta, cap)
            VALUES (?, ?, ?, ?)
        `;
        db.run(sql, [user_id, indirizzo, citta, cap], function(err) {
            if (err) {
                console.error("Errore nell'aggiungere le informazioni:", err.message);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Aggiorna informazioni account esistenti.
 * @param {number} infoId - L'ID delle informazioni da aggiornare.
 * @param {Object} infoData - I nuovi dati (indirizzo, citta, cap).
 * @returns {Promise<number>} Una promessa che risolve con il numero di righe modificate.
 */
exports.updateAccountInfo = (infoId, infoData) => {
    return new Promise((resolve, reject) => {
        const { indirizzo, citta, cap } = infoData;
        const sql = `
            UPDATE accountinfos SET
            indirizzo = ?, citta = ?, cap = ?
            WHERE id = ?
        `;
        db.run(sql, [indirizzo, citta, cap, infoId], function(err) {
            if (err) {
                console.error("Errore nell'aggiornare le informazioni:", err.message);
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

/**
 * Elimina un set di informazioni account.
 * @param {number} infoId - L'ID delle informazioni da eliminare.
 * @returns {Promise<number>} Una promessa che risolve con il numero di righe eliminate.
 */
exports.deleteAccountInfo = (infoId) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM accountinfos WHERE id = ?';
        db.run(sql, [infoId], function(err) {
            if (err) {
                console.error("Errore nell'eliminare le informazioni:", err.message);
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

/**
 * Recupera un singolo indirizzo tramite il suo ID.
 * @param {number} infoId - L'ID dell'informazione da recuperare.
 * @returns {Promise<Object>} Una promessa che risolve con l'oggetto indirizzo.
 */
exports.getAccountInfoById = (infoId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accountinfos WHERE id = ?';
        db.get(sql, [infoId], (err, row) => {
            if (err) {
                console.error("Errore nel recuperare l'informazione dell'account:", err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};