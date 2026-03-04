// File: models/dao/metodi-pagamento-dao.js
'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class MetodiPagamentoDAO {
    /**
     * Recupera i metodi di pagamento di un utente specifico.
     * Per sicurezza, non restituisce mai il numero completo della carta o il CVV.
     * Usiamo la funzione RIGHT() di PostgreSQL per estrarre le ultime 4 cifre.
     * @param {number} userId L'ID dell'utente.
     * @returns {Promise<Array<Object>>} Una lista di metodi di pagamento (dati parziali).
     */
    async getMetodiPagamentoByUserId(userId) {
        const sql = 'SELECT id, user_id, nome_titolare, RIGHT(numero_carta, 4) as last4, data_scadenza FROM metodi_pagamento WHERE user_id = $1';
        try {
            const { rows } = await db.query(sql, [userId]);
            return rows;
        } catch (err) {
            console.error("Errore in getMetodiPagamentoByUserId:", err);
            throw err;
        }
    }

    /**
     * Aggiunge un nuovo metodo di pagamento completo per un utente nel database.
     * @param {Object} datiCarta Dati completi: { user_id, nome_titolare, numero_carta, data_scadenza, cvv }.
     * @returns {Promise<number>} L'ID del nuovo metodo di pagamento inserito.
     */
    async createMetodoPagamento(datiCarta) {
        const { user_id, nome_titolare, numero_carta, data_scadenza, cvv } = datiCarta;
        
        // Query con placeholder $1, $2, ... e RETURNING id
        const sql = `
            INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza, cvv) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        
        try {
            const { rows } = await db.query(sql, [user_id, nome_titolare, numero_carta, data_scadenza, cvv]);
            return rows[0].id; // Restituisce l'ID del record appena creato.
        } catch (err) {
            console.error("Errore in createMetodoPagamento:", err);
            throw err;
        }
    }

    /**
     * Elimina un metodo di pagamento.
     * Include un controllo sull' `userId` per garantire che un utente possa eliminare solo le proprie carte.
     * @param {number} metodoId L'ID del metodo di pagamento da eliminare.
     * @param {number} userId L'ID dell'utente che effettua la richiesta.
     * @returns {Promise<number>} Il numero di righe eliminate (dovrebbe essere 1 o 0).
     */
    async deleteMetodoPagamento(metodoId, userId) {
        const sql = 'DELETE FROM metodi_pagamento WHERE id = $1 AND user_id = $2';
        try {
            const { rowCount } = await db.query(sql, [metodoId, userId]);
            return rowCount; // Restituisce il numero di righe eliminate
        } catch (err) {
            console.error("Errore in deleteMetodoPagamento:", err);
            throw err;
        }
    }
}

module.exports = new MetodiPagamentoDAO();