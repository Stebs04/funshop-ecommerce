// File: models/dao/search-dao.js
'use strict';

const { db } = require('../../managedb');

class SearchDAO {

    /**
     * Cerca prodotti il cui nome contiene il termine di ricerca.
     * @param {string} query - Il termine da cercare.
     * @returns {Promise<Array<Object>>} Una lista di prodotti corrispondenti.
     */
    searchProducts(query) {
        return new Promise((resolve, reject) => {
            // Usiamo LIKE con '%' per cercare sottostringhe.
            // La query viene eseguita in modo case-insensitive grazie a LIKE.
            const sql = `
                SELECT p.*, u.username as nome_venditore
                FROM prodotti p
                JOIN users u ON p.user_id = u.id
                WHERE p.nome LIKE ? AND p.stato = 'disponibile'
            `;
            const searchTerm = `%${query}%`;

            db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    console.error("Errore nella ricerca prodotti:", err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Cerca utenti il cui username contiene il termine di ricerca.
     * @param {string} query - Il termine da cercare.
     * @returns {Promise<Array<Object>>} Una lista di utenti corrispondenti.
     */
    searchUsers(query) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.username, ai.immagine_profilo
                FROM users u
                LEFT JOIN accountinfos ai ON u.id = ai.user_id
                WHERE u.username LIKE ?
            `;
            const searchTerm = `%${query}%`;

            db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    console.error("Errore nella ricerca utenti:", err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = new SearchDAO();