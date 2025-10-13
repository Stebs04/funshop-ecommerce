'use strict';

const db = require('../../managedb');

class RecensioniDAO {
    /**
     * Crea una nuova recensione nel database.
     * @param {object} reviewData - Dati della recensione: { contenuto, valutazione, prodotto_id, user_id }
     * @returns {Promise<number>} L'ID della nuova recensione.
     */
    createReview(reviewData) {
        const { contenuto, valutazione, prodotto_id, user_id } = reviewData;
        const sql = 'INSERT INTO recensioni (contenuto, valutazione, prodotto_id, user_id) VALUES (?, ?, ?, ?)';
        return new Promise((resolve, reject) => {
            db.run(sql, [contenuto, valutazione, prodotto_id, user_id], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Recupera tutte le recensioni per un prodotto specifico, includendo l'username di chi ha scritto la recensione.
     * @param {number} productId - L'ID del prodotto.
     * @returns {Promise<Array<object>>} Una lista di recensioni.
     */
    getReviewsByProductId(productId) {
        const sql = `
            SELECT r.*, u.username 
            FROM recensioni r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.prodotto_id = ? 
            ORDER BY r.data_creazione DESC
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [productId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Recupera tutte le recensioni ricevute da un utente (venditore).
     * @param {number} userId - L'ID del venditore.
     * @returns {Promise<Array<object>>} Una lista di recensioni.
     */
    getReviewsForUser(userId) {
        const sql = `
            SELECT r.*, u.username as autore_recensione, p.nome as nome_prodotto
            FROM recensioni r
            JOIN prodotti p ON r.prodotto_id = p.id
            JOIN users u ON r.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY r.data_creazione DESC;
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new RecensioniDAO();