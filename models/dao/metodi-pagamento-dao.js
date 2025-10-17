// File: models/dao/metodi-pagamento-dao.js
'use strict';

const { db } = require('../../managedb');

class MetodiPagamentoDAO {
    /**
     * Recupera tutti i metodi di pagamento di un utente.
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<Array<Object>>} Una lista di metodi di pagamento.
     */
    getMetodiPagamentoByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, user_id, nome_titolare, substr(numero_carta, -4) as last4, data_scadenza FROM metodi_pagamento WHERE user_id = ?';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Aggiunge un nuovo metodo di pagamento per un utente.
     * @param {Object} datiCarta - Dati: { user_id, nome_titolare, numero_carta, data_scadenza }.
     * @returns {Promise<number>} L'ID del nuovo metodo di pagamento.
     */
    createMetodoPagamento(datiCarta) {
        return new Promise((resolve, reject) => {
            const { user_id, nome_titolare, numero_carta, data_scadenza } = datiCarta;
            const sql = 'INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza) VALUES (?, ?, ?, ?)';
            db.run(sql, [user_id, nome_titolare, numero_carta, data_scadenza], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Elimina un metodo di pagamento.
     * @param {number} metodoId - L'ID del metodo da eliminare.
     * @param {number} userId - L'ID dell'utente per sicurezza.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    deleteMetodoPagamento(metodoId, userId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM metodi_pagamento WHERE id = ? AND user_id = ?';
            db.run(sql, [metodoId, userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new MetodiPagamentoDAO();