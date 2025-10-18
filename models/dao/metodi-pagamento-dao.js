// File: models/dao/metodi-pagamento-dao.js
'use strict';

const { db } = require('../../managedb');

class MetodiPagamentoDAO {
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
     * @param {Object} datiCarta - Dati: { user_id, nome_titolare, numero_carta, data_scadenza, cvv }.
     * @returns {Promise<number>} L'ID del nuovo metodo di pagamento.
     */
    createMetodoPagamento(datiCarta) {
        return new Promise((resolve, reject) => {
            // MODIFICA: Aggiunto 'cvv'
            const { user_id, nome_titolare, numero_carta, data_scadenza, cvv } = datiCarta;
            // MODIFICA: Aggiornata la query SQL
            const sql = 'INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza, cvv) VALUES (?, ?, ?, ?, ?)';
            db.run(sql, [user_id, nome_titolare, numero_carta, data_scadenza, cvv], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

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