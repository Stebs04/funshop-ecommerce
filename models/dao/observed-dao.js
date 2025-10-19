// File: models/dao/observed-dao.js
'use strict';

const { db } = require('../../managedb');

class ObservedDAO {
    /**
     * Aggiunge un prodotto alla lista degli osservati di un utente,
     * registrando il prezzo attuale al momento dell'aggiunta.
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
     */
    isObserved(userId, productId) {
        const sql = 'SELECT 1 FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.get(sql, [userId, productId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    }

    /**
     * Recupera tutti i prodotti osservati da un utente, unendo i dati del prodotto
     * e del venditore per avere informazioni complete.
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
     */
    flagPriceChange(productId) {
        const sql = 'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [productId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    /**
     * Segna le notifiche come lette per un utente.
     * Questa funzione viene eseguita quando un utente visita la pagina dei prodotti osservati.
     */
    markNotificationsAsRead(userId) {
        const sql = `
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
        return new Promise((resolve, reject) => {
            db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new ObservedDAO();