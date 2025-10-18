// File: models/dao/observed-dao.js
'use strict';

const { db } = require('../../managedb');

class ObservedDAO {
    /**
     * Aggiunge un prodotto alla lista degli osservati di un utente.
     */
    addObserved(userId, productId) {
        const sql = 'INSERT INTO observed_products (user_id, product_id) VALUES (?, ?)';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
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
     * Controlla se un utente sta già osservando un prodotto.
     */
    isObserved(userId, productId) {
        const sql = 'SELECT * FROM observed_products WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.get(sql, [userId, productId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row); // Restituisce true se la riga esiste, altrimenti false
            });
        });
    }

    /**
     * Recupera tutti i prodotti osservati da un utente.
     */
    getObservedByUserId(userId) {
        const sql = `
            SELECT p.*, u.username as nome_venditore
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
}

module.exports = new ObservedDAO();