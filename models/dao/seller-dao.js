// File: models/dao/search-dao.js
'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class SearchDAO {

    /**
     * Cerca nel database i prodotti in base a un termine testuale E filtri opzionali.
     * Questa funzione ora costruisce una query dinamica per includere tutti i filtri.
     * @param {object} filters - Un oggetto che può contenere: { q, category, condition, sortBy }.
     * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di prodotti corrispondenti.
     */
    async searchProducts(filters = {}) {
        // Estraiamo tutti i possibili filtri dall'oggetto
        const { q, category, condition, sortBy } = filters;
        
        // Query SQL di base
        let sql = `
            SELECT p.*, u.username as nome_venditore,
            p.percorsi_immagine[1] as percorso_immagine_cover
            FROM prodotti p
            JOIN users u ON p.user_id = u.id
        `;
        
        // Array per i parametri ($1, $2, ...) e per le clausole WHERE
        const params = [];
        const whereClauses = [];
        // Indice per i placeholder di PostgreSQL
        let paramIndex = 1;

        // 1. Aggiungiamo il filtro testuale principale (il termine 'q')
        // Usiamo ILIKE per una ricerca case-insensitive (non sensibile a maiuscole/minuscole)
        if (q) {
            whereClauses.push(`p.nome ILIKE $${paramIndex++}`);
            params.push(`%${q}%`);
        }

        // 2. Aggiungiamo il filtro statico per mostrare solo prodotti 'disponibili'
        whereClauses.push("p.stato = 'disponibile'");

        // 3. Aggiungiamo i filtri opzionali se sono stati forniti
        if (category) {
            whereClauses.push(`p.parola_chiave = $${paramIndex++}`);
            params.push(category);
        }
        if (condition) {
            whereClauses.push(`p.condizione = $${paramIndex++}`);
            params.push(condition);
        }
        
        // Combiniamo tutte le clausole WHERE con 'AND'
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        // 4. Gestiamo l'ordinamento (sortBy)
        // Usiamo COALESCE per ordinare correttamente in base al prezzo scontato se esiste,
        // altrimenti in base al prezzo normale.
        if (sortBy === 'price_asc') {
            sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) ASC';
        } else if (sortBy === 'price_desc') {
            sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) DESC';
        } else {
            // Se nessun ordinamento è specificato, ordiniamo per data (più recenti prima)
            sql += ' ORDER BY p.data_inserimento DESC';
        }

        try {
            // Eseguiamo la query dinamica costruita, passando l'array di parametri
            const { rows } = await db.query(sql, params);
            return rows;
        } catch (err) {
            console.error("Errore nella ricerca prodotti (searchProducts):", err.message);
            throw err;
        }
    }

    /**
     * Cerca nel database gli utenti il cui username contiene il termine di ricerca.
     * (Questa funzione rimane invariata, la ricerca utenti non usa i filtri dei prodotti)
     * @param {string} query - Il termine da cercare (es. "mario").
     * @returns {Promise<Array<Object>>} Una lista di utenti corrispondenti, con ID, username e immagine profilo.
     */
    async searchUsers(query) {
        // Usiamo ILIKE per la ricerca case-insensitive.
        const sql = `
            SELECT u.id, u.username, ai.immagine_profilo
            FROM users u
            LEFT JOIN accountinfos ai ON u.id = ai.user_id
            WHERE u.username ILIKE $1
        `;
        // Prepariamo il termine di ricerca per la query ILIKE.
        const searchTerm = `%${query}%`;

        try {
            const { rows } = await db.query(sql, [searchTerm]);
            return rows;
        } catch (err) {
            console.error("Errore nella ricerca utenti (searchUsers):", err.message);
            throw err;
        }
    }
}

// Esportiamo una nuova istanza della classe
module.exports = new SearchDAO();