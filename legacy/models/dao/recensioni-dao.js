'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class RecensioniDAO {
    /**
     * Crea una nuova recensione nel database.
     * @param {object} reviewData - Dati della recensione: { contenuto, valutazione, prodotto_id, user_id }.
     * @returns {Promise<number>} Una promessa che risolve nell'ID della nuova recensione creata.
     */
    async createReview(reviewData) {
        const { contenuto, valutazione, prodotto_id, user_id } = reviewData;
        // Sostituiamo ? con $1, $2, ecc. e aggiungiamo RETURNING id
        const sql = `
            INSERT INTO recensioni (contenuto, valutazione, prodotto_id, user_id) 
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        try {
            const { rows } = await db.query(sql, [contenuto, valutazione, prodotto_id, user_id]);
            return rows[0].id; // Restituisce l'ID della recensione appena inserita
        } catch (err) {
            console.error("Errore in createReview:", err);
            throw err;
        }
    }

    /**
     * Recupera tutte le recensioni per un prodotto specifico.
     * Include anche l'username dell'utente che ha scritto la recensione.
     * @param {number} productId - L'ID del prodotto.
     * @returns {Promise<Array<object>>} Una lista di oggetti recensione.
     */
    async getReviewsByProductId(productId) {
        // Sostituiamo ? con $1
        const sql = `
            SELECT r.*, u.username 
            FROM recensioni r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.prodotto_id = $1 
            ORDER BY r.data_creazione DESC
        `;
        try {
            const { rows } = await db.query(sql, [productId]);
            return rows;
        } catch (err) {
            console.error("Errore in getReviewsByProductId:", err);
            throw err;
        }
    }

    /**
     * Recupera tutte le recensioni ricevute da un utente (in qualità di venditore).
     * @param {number} userId - L'ID del venditore.
     * @returns {Promise<Array<object>>} Una lista di oggetti recensione.
     */
    async getReviewsForUser(userId) {
        // Sostituiamo ? con $1
        const sql = `
            SELECT r.*, u.username as autore_recensione, p.nome as nome_prodotto
            FROM recensioni r
            JOIN prodotti p ON r.prodotto_id = p.id
            JOIN users u ON r.user_id = u.id
            WHERE p.user_id = $1
            ORDER BY r.data_creazione DESC;
        `;
        try {
            const { rows } = await db.query(sql, [userId]);
            return rows;
        } catch (err) {
            console.error("Errore in getReviewsForUser:", err);
            throw err;
        }
    }
}

module.exports = new RecensioniDAO();