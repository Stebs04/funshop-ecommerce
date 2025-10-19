// File: models/dao/observed-dao.js
'use strict';

const { db } = require('../../managedb');

class ObservedDAO {
    addObserved(userId, productId, currentPrice) {
        const sql = 'INSERT INTO observed_products (user_id, product_id, prezzo_osservato) VALUES (?, ?, ?)';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId, currentPrice], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    removeObserved(userId, productId) {
        const sql = 'DELETE FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    isObserved(userId, productId) {
        const sql = 'SELECT * FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.get(sql, [userId, productId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    }

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

    flagPriceChange(productId) {
        const sql = 'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [productId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    markNotificationsAsRead(userId) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);
                });

                // Rimuovi le osservazioni per i prodotti che sono stati eliminati (dopo che la notifica è stata vista)
                const deleteSql = `
                    DELETE FROM observed_products
                    WHERE user_id = ? AND notifica_letta = 0 AND product_id IN (
                        SELECT id FROM prodotti WHERE stato = 'eliminato'
                    )
                `;
                db.run(deleteSql, [userId], function(err) {
                    if (err) {
                        return db.run('ROLLBACK', () => reject(err));
                    }
                });

                // Aggiorna le restanti notifiche di cambio prezzo
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
                    if (err) {
                        return db.run('ROLLBACK', () => reject(err));
                    }
                });

                db.run('COMMIT', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        });
    }
}

module.exports = new ObservedDAO();