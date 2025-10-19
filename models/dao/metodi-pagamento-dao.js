// File: models/dao/metodi-pagamento-dao.js
'use strict';

const { db } = require('../../managedb');

class MetodiPagamentoDAO {
    /**
     * Recupera i metodi di pagamento di un utente specifico.
     * Per sicurezza, non restituisce mai il numero completo della carta o il CVV.
     * `substr(numero_carta, -4)` è una funzione SQL che estrae solo le ultime 4 cifre.
     * @param {number} userId L'ID dell'utente.
     * @returns {Promise<Array<Object>>} Una lista di metodi di pagamento (dati parziali).
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
     * Aggiunge un nuovo metodo di pagamento completo per un utente nel database.
     * @param {Object} datiCarta Dati completi: { user_id, nome_titolare, numero_carta, data_scadenza, cvv }.
     * @returns {Promise<number>} L'ID del nuovo metodo di pagamento inserito.
     */
    createMetodoPagamento(datiCarta) {
        return new Promise((resolve, reject) => {
            // Estrae tutti i campi necessari, incluso il CVV, dall'oggetto in input.
            const { user_id, nome_titolare, numero_carta, data_scadenza, cvv } = datiCarta;
            
            // La query SQL include tutti i campi necessari per un inserimento completo.
            const sql = 'INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza, cvv) VALUES (?, ?, ?, ?, ?)';
            
            db.run(sql, [user_id, nome_titolare, numero_carta, data_scadenza, cvv], function(err) {
                if (err) reject(err);
                else resolve(this.lastID); // Restituisce l'ID del record appena creato.
            });
        });
    }

    /**
     * Elimina un metodo di pagamento.
     * Include un controllo sull' `userId` per garantire che un utente possa eliminare solo le proprie carte.
     * @param {number} metodoId L'ID del metodo di pagamento da eliminare.
     * @param {number} userId L'ID dell'utente che effettua la richiesta.
     * @returns {Promise<number>} Il numero di righe eliminate (dovrebbe essere 1 o 0).
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