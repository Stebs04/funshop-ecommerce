// File: models/dao/observed-dao.js
'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class ObservedDAO {
    /**
     * Aggiunge un prodotto alla lista degli osservati di un utente,
     * registrando il prezzo attuale al momento dell'aggiunta.
     * Utilizza "ON CONFLICT... DO NOTHING" per replicare "INSERT OR IGNORE" di SQLite.
     */
    async addObserved(userId, productId, currentPrice) {
        const sql = `
            INSERT INTO observed_products (user_id, product_id, prezzo_osservato) 
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id) DO NOTHING
        `;
        try {
            // rowCount sarà 1 se l'inserimento è avvenuto, 0 se il conflitto ha bloccato l'inserimento
            const { rowCount } = await db.query(sql, [userId, productId, currentPrice]);
            return rowCount; 
        } catch (err) {
            console.error("Errore in addObserved:", err);
            throw err;
        }
    }

    /**
     * Rimuove un prodotto dalla lista degli osservati di un utente.
     */
    async removeObserved(userId, productId) {
        const sql = 'DELETE FROM observed_products WHERE user_id = $1 AND product_id = $2';
        try {
            const { rowCount } = await db.query(sql, [userId, productId]);
            return rowCount; // Restituisce il numero di righe eliminate
        } catch (err) {
            console.error("Errore in removeObserved:", err);
            throw err;
        }
    }

    /**
     * Controlla se un utente sta già osservando un determinato prodotto.
     */
    async isObserved(userId, productId) {
        const sql = 'SELECT 1 FROM observed_products WHERE user_id = $1 AND product_id = $2';
        try {
            const { rows } = await db.query(sql, [userId, productId]);
            return !!rows[0]; // Restituisce true se la riga esiste, false altrimenti
        } catch (err) {
            console.error("Errore in isObserved:", err);
            throw err;
        }
    }

    /**
     * Recupera tutti i prodotti osservati da un utente, unendo i dati del prodotto
     * e del venditore per avere informazioni complete.
     */
    async getObservedByUserId(userId) {
        const sql = `
            SELECT p.*, u.username as nome_venditore,
                   o.prezzo_osservato, o.notifica_letta
            FROM prodotti p
            JOIN observed_products o ON p.id = o.product_id
            JOIN users u ON p.user_id = u.id
            WHERE o.user_id = $1`;
        try {
            const { rows } = await db.query(sql, [userId]);
            return rows;
        } catch (err) {
            console.error("Errore in getObservedByUserId:", err);
            throw err;
        }
    }

    /**
     * "Flagga" (segna) un prodotto come se avesse una notifica non letta (imposta a 0).
     */
    async flagPriceChange(productId) {
        const sql = 'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = $1';
        try {
            const { rowCount } = await db.query(sql, [productId]);
            return rowCount;
        } catch (err) {
            console.error("Errore in flagPriceChange:", err);
            throw err;
        }
    }

    /**
     * Segna le notifiche come lette per un utente.
     * Questa funzione viene eseguita quando un utente visita la pagina dei prodotti osservati.
     * Aggiorna anche il prezzo_osservato al prezzo corrente.
     */
    async markNotificationsAsRead(userId) {
        // Questa query è un po' più complessa in PostgreSQL
        const sql = `
            UPDATE observed_products o
            SET
                notifica_letta = 1,
                prezzo_osservato = (
                    SELECT COALESCE(p.prezzo_scontato, p.prezzo)
                    FROM prodotti p
                    WHERE p.id = o.product_id
                )
            WHERE o.user_id = $1 AND o.notifica_letta = 0
        `;
        try {
            const { rowCount } = await db.query(sql, [userId]);
            return rowCount;
        } catch (err) {
            console.error("Errore in markNotificationsAsRead:", err);
            throw err;
        }
    }
}

module.exports = new ObservedDAO();