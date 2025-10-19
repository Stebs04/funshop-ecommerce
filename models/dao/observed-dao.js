// File: models/dao/observed-dao.js
'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

class ObservedDAO {
    /**
     * Aggiunge un prodotto alla lista degli osservati di un utente,
     * registrando il prezzo attuale al momento dell'aggiunta.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da osservare.
     * @param {number} currentPrice - Il prezzo del prodotto al momento in cui viene messo tra gli osservati.
     * @returns {Promise<number>} L'ID del nuovo record inserito.
     */
    addObserved(userId, productId, currentPrice) {
        const sql = 'INSERT INTO observed_products (user_id, product_id, prezzo_osservato) VALUES (?, ?, ?)';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId, currentPrice], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Rimuove un prodotto dalla lista degli osservati di un utente.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da rimuovere.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    removeObserved(userId, productId) {
        const sql = 'DELETE FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    /**
     * Controlla se un utente sta già osservando un determinato prodotto.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto.
     * @returns {Promise<boolean>} 'true' se il prodotto è osservato, altrimenti 'false'.
     */
    isObserved(userId, productId) {
        const sql = 'SELECT 1 FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.get(sql, [userId, productId], (err, row) => {
                if (err) reject(err);
                // La doppia negazione (!!) converte il risultato in un booleano:
                // - Se 'row' è un oggetto (quindi trovato), !!row diventa true.
                // - Se 'row' è 'undefined' (non trovato), !!row diventa false.
                else resolve(!!row);
            });
        });
    }

    /**
     * Recupera tutti i prodotti osservati da un utente, unendo i dati del prodotto
     * e del venditore per avere informazioni complete.
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<Array<Object>>} Un array di oggetti prodotto completi.
     */
    getObservedByUserId(userId) {
        const sql = `
            SELECT p.*, u.username as nome_venditore,
                   o.prezzo_osservato, o.notifica_letta
            FROM prodotti p
            JOIN observed_products o ON p.id = o.product_id
            JOIN users u ON p.user_id = u.id
            WHERE o.user_id = ?`;
        return new Promise((resolve, reject) => {
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * "Flagga" (segna) un prodotto come se avesse una notifica non letta.
     * Questo viene chiamato quando il prezzo di un prodotto cambia o quando viene venduto/eliminato.
     * @param {number} productId - L'ID del prodotto modificato.
     * @returns {Promise<number>} Il numero di righe modificate.
     */
    flagPriceChange(productId) {
        // Impostiamo 'notifica_letta' a 0 (che per noi significa 'non letta').
        const sql = 'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [productId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    /**
     * Segna le notifiche come lette per un utente e pulisce le osservazioni obsolete.
     * Questa funzione viene eseguita quando un utente visita la pagina dei prodotti osservati.
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<boolean>} 'true' se l'operazione ha successo.
     */
    markNotificationsAsRead(userId) {
        return new Promise((resolve, reject) => {
            // Usiamo una transazione per assicurarci che entrambe le operazioni (DELETE e UPDATE)
            // vengano eseguite con successo o nessuna delle due.
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);
                });

                // 1. Eliminiamo le osservazioni per prodotti che sono stati venduti o eliminati.
                // Lo facciamo solo per le notifiche che l'utente sta per "leggere" (notifica_letta = 0),
                // in modo che l'utente veda la notifica "venduto/eliminato" una volta prima che scompaia.
                const deleteSql = `
                    DELETE FROM observed_products
                    WHERE user_id = ? AND notifica_letta = 0 AND product_id IN (
                        SELECT id FROM prodotti WHERE stato = 'eliminato' OR stato = 'venduto'
                    )
                `;
                db.run(deleteSql, [userId], function(err) {
                    if (err) return db.run('ROLLBACK', () => reject(err));
                });

                // 2. Per tutte le altre notifiche non lette (cambi di prezzo), le segniamo come lette (1)
                // e aggiorniamo il 'prezzo_osservato' al prezzo attuale del prodotto.
                // In questo modo, il prossimo confronto di prezzo partirà da questo nuovo valore.
                const updateSql = `
                    UPDATE observed_products
                    SET
                        notifica_letta = 1,
                        prezzo_osservato = (
                            SELECT COALESCE(p.prezzo_scontato, p.prezzo)
                            FROM prodotti p
                            WHERE p.id = observed_products.product_id
                        )
                    WHERE user_id = ? AND notifica_letta = 0
                `;
                db.run(updateSql, [userId], function(err) {
                    if (err) return db.run('ROLLBACK', () => reject(err));
                });

                // 3. Se tutto è andato bene, confermiamo la transazione.
                db.run('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        });
    }
}

module.exports = new ObservedDAO();