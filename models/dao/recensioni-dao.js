'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

class RecensioniDAO {
    /**
     * Crea una nuova recensione nel database.
     * @param {object} reviewData - Dati della recensione: { contenuto, valutazione, prodotto_id, user_id }.
     * @returns {Promise<number>} Una promessa che risolve nell'ID della nuova recensione creata.
     */
    createReview(reviewData) {
        // Estraiamo i dati dall'oggetto per usarli nella query.
        const { contenuto, valutazione, prodotto_id, user_id } = reviewData;
        const sql = 'INSERT INTO recensioni (contenuto, valutazione, prodotto_id, user_id) VALUES (?, ?, ?, ?)';
        return new Promise((resolve, reject) => {
            db.run(sql, [contenuto, valutazione, prodotto_id, user_id], function(err) {
                if (err) reject(err);
                else resolve(this.lastID); // Restituisce l'ID della recensione appena inserita.
            });
        });
    }

    /**
     * Recupera tutte le recensioni per un prodotto specifico.
     * Include anche l'username dell'utente che ha scritto la recensione.
     * @param {number} productId - L'ID del prodotto.
     * @returns {Promise<Array<object>>} Una lista di oggetti recensione.
     */
    getReviewsByProductId(productId) {
        // La query unisce le tabelle 'recensioni' e 'users' per ottenere l'username.
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
     * Recupera tutte le recensioni ricevute da un utente (in qualità di venditore).
     * La logica è: trova tutti i prodotti venduti da `userId`, e poi trova tutte le recensioni
     * associate a quei prodotti.
     * @param {number} userId - L'ID del venditore.
     * @returns {Promise<Array<object>>} Una lista di oggetti recensione.
     */
    getReviewsForUser(userId) {
        // Questa query è più complessa:
        // 1. Parte dalla tabella 'recensioni' (r).
        // 2. La unisce a 'prodotti' (p) usando l'ID del prodotto.
        // 3. La unisce a 'users' (u) usando l'ID dell'utente che ha scritto la recensione (r.user_id),
        //    per ottenere il nome dell'autore.
        // 4. Filtra i risultati mostrando solo le recensioni per prodotti il cui `user_id`
        //    (il venditore) corrisponde all'ID passato alla funzione.
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