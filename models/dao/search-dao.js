// File: models/dao/search-dao.js
'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class SearchDAO {

    /**
     * Cerca nel database i prodotti il cui nome contiene il termine di ricerca.
     * Seleziona solo la prima immagine come 'percorso_immagine_cover'.
     * @param {string} query - Il termine da cercare (es. "goku").
     * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di prodotti corrispondenti.
     */
    async searchProducts(query) {
        // Usiamo ILIKE per una ricerca case-insensitive (specifico di PostgreSQL)
        // e $1 come placeholder.
        const sql = `
            SELECT p.*, u.username as nome_venditore,
            p.percorsi_immagine[1] as percorso_immagine_cover
            FROM prodotti p
            JOIN users u ON p.user_id = u.id
            WHERE p.nome ILIKE $1 AND p.stato = 'disponibile'
        `;
        // Prepariamo il termine di ricerca per la query ILIKE.
        const searchTerm = `%${query}%`;

        try {
            const { rows } = await db.query(sql, [searchTerm]);
            return rows;
        } catch (err) {
            console.error("Errore nella ricerca prodotti:", err.message);
            throw err;
        }
    }

    /**
     * Cerca nel database gli utenti il cui username contiene il termine di ricerca.
     * @param {string} query - Il termine da cercare.
     * @returns {Promise<Array<Object>>} Una lista di utenti corrispondenti, con ID, username e immagine profilo.
     */
    async searchUsers(query) {
        // Anche qui usiamo ILIKE per la ricerca case-insensitive.
        const sql = `
            SELECT u.id, u.username, ai.immagine_profilo
            FROM users u
            LEFT JOIN accountinfos ai ON u.id = ai.user_id
            WHERE u.username ILIKE $1
        `;
        const searchTerm = `%${query}%`;

        try {
            const { rows } = await db.query(sql, [searchTerm]);
            return rows;
        } catch (err) {
            console.error("Errore nella ricerca utenti:", err.message);
            throw err;
        }
    }
}

module.exports = new SearchDAO();