// File: models/dao/search-dao.js
'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

class SearchDAO {

    /**
     * Cerca nel database i prodotti il cui nome contiene il termine di ricerca.
     * @param {string} query - Il termine da cercare (es. "goku").
     * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di prodotti corrispondenti.
     */
    searchProducts(query) {
        return new Promise((resolve, reject) => {
            // La query usa l'operatore 'LIKE' con il carattere jolly '%'.
            // '%query%' significa "qualsiasi stringa che contenga la 'query'".
            // Es. Se la query è "goku", troverà "son goku", "goku ssj", ecc.
            // LIKE in SQLite è case-insensitive per default per i caratteri ASCII.
            const sql = `
                SELECT p.*, u.username as nome_venditore
                FROM prodotti p
                JOIN users u ON p.user_id = u.id
                WHERE p.nome LIKE ? AND p.stato = 'disponibile'
            `;
            // Prepariamo il termine di ricerca per la query LIKE.
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
     * Cerca nel database gli utenti il cui username contiene il termine di ricerca.
     * @param {string} query - Il termine da cercare.
     * @returns {Promise<Array<Object>>} Una lista di utenti corrispondenti, con ID, username e immagine profilo.
     */
    searchUsers(query) {
        return new Promise((resolve, reject) => {
            // La logica è la stessa della ricerca prodotti, ma applicata alla tabella 'users'.
            // Facciamo un LEFT JOIN con 'accountinfos' per recuperare l'immagine del profilo, se esiste.
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