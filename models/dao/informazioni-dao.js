'use strict';

const { db } = require('../../managedb');

/**
 * Recupera le informazioni account (non indirizzo) associate a un ID utente.
 * @param {number} userId - L'ID dell'utente.
 * @returns {Promise<Object>} Una promessa che risolve in un oggetto informazione.
 */
exports.getAccountInfoByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accountinfos WHERE user_id = ?';
        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error("Errore nel recuperare le informazioni dell'account:", err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

/**
 * Aggiorna l'immagine del profilo di un utente.
 * Se non esiste un record in accountinfos, ne crea uno nuovo.
 * @param {number} userId - L'ID dell'utente.
 * @param {string} imagePath - Il percorso della nuova immagine.
 * @returns {Promise<number>} Il numero di righe modificate o l'ID del nuovo record.
 */
exports.updateProfileImage = (userId, imagePath) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE accountinfos SET immagine_profilo = ? WHERE user_id = ?';
        db.run(sql, [imagePath, userId], function (err) {
            if (err) {
                reject(err);
            } else {
                if (this.changes === 0) {
                    // Se non ci sono righe modificate, crea un nuovo record.
                    const insertSql = 'INSERT INTO accountinfos (user_id, immagine_profilo) VALUES (?, ?)';
                    db.run(insertSql, [userId, imagePath], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(this.lastID);
                        }
                    });
                } else {
                    resolve(this.changes);
                }
            }
        });
    });
};

/**
 * Aggiorna la descrizione del profilo e altre informazioni non di indirizzo.
 * @param {number} userId - L'ID dell'utente.
 * @param {Object} infoData - Dati da aggiornare (es. descrizione).
 * @returns {Promise<number>} Numero di righe modificate o ID del nuovo record.
 */
exports.updateProfileInfo = (userId, infoData) => {
    return new Promise((resolve, reject) => {
        const { descrizione } = infoData;
        const sql = 'UPDATE accountinfos SET descrizione = ? WHERE user_id = ?';
        db.run(sql, [descrizione, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                 if (this.changes === 0) {
                    const insertSql = 'INSERT INTO accountinfos (user_id, descrizione) VALUES (?, ?)';
                    db.run(insertSql, [userId, descrizione], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                 } else {
                    resolve(this.changes);
                 }
            }
        });
    });
};