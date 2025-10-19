'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

/**
 * Recupera le informazioni aggiuntive dell'account (come immagine profilo e descrizione)
 * associate a un ID utente dalla tabella 'accountinfos'.
 * @param {number} userId - L'ID dell'utente.
 * @returns {Promise<Object|undefined>} Una promessa che risolve in un oggetto contenente le informazioni
 * o 'undefined' se non viene trovato nessun record.
 */
exports.getAccountInfoByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accountinfos WHERE user_id = ?';
        // Usiamo db.get perché ci aspettiamo al massimo una riga per utente (dato che user_id è UNIQUE).
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
 * Aggiorna o imposta per la prima volta l'immagine del profilo di un utente.
 * Se non esiste già un record per l'utente nella tabella 'accountinfos', ne crea uno nuovo.
 * @param {number} userId - L'ID dell'utente.
 * @param {string} imagePath - Il percorso del file della nuova immagine.
 * @returns {Promise<number>} Una promessa che risolve nel numero di righe modificate (se l'update ha successo)
 * o nell'ID del nuovo record (se viene creato).
 */
exports.updateProfileImage = (userId, imagePath) => {
    return new Promise((resolve, reject) => {
        // 1. Tentiamo di aggiornare un record esistente.
        const sql = 'UPDATE accountinfos SET immagine_profilo = ? WHERE user_id = ?';
        db.run(sql, [imagePath, userId], function (err) {
            if (err) {
                reject(err);
            } else {
                // 2. Se 'this.changes' è 0, significa che non c'era nessun record da aggiornare.
                if (this.changes === 0) {
                    // 3. In questo caso, creiamo un nuovo record.
                    const insertSql = 'INSERT INTO accountinfos (user_id, immagine_profilo) VALUES (?, ?)';
                    db.run(insertSql, [userId, imagePath], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            // Risolviamo con l'ID della nuova riga creata.
                            resolve(this.lastID);
                        }
                    });
                } else {
                    // 4. Se l'aggiornamento è andato a buon fine, risolviamo con il numero di righe modificate.
                    resolve(this.changes);
                }
            }
        });
    });
};
