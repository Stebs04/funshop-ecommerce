'use strict';

const { db } = require('../../managedb');

class SellerDAO {
    /**
     * Crea un nuovo record per il venditore e aggiorna l'account dell'utente.
     * Utilizza una transazione per garantire l'integrità dei dati.
     * @param {number} userId - L'ID dell'utente che sta diventando venditore.
     * @param {object} sellerData - I dati dal form di registrazione del venditore.
     * @returns {Promise<boolean>} Risolve in true se l'operazione ha successo.
     */
    async createSeller(userId, sellerData) {
        const { nome_negozio, partita_iva, email_contatto, iban, descrizione } = sellerData;

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION;', (err) => {
                    if (err) return reject(err);
                });

                // Inserisce i dati nella tabella 'venditori'
                const sellerSql = `
                    INSERT INTO venditori (user_id, nome_negozio, partita_iva, email_contatto, iban, descrizione)
                    VALUES (?, ?, ?, ?, ?, ?);
                `;
                db.run(sellerSql, [userId, nome_negozio, partita_iva, email_contatto, iban, descrizione], function(err) {
                    if (err) {
                        return db.run('ROLLBACK;', () => reject(err));
                    }
                });

                // Aggiorna il tipo di account nella tabella 'users'
                const userSql = `UPDATE users SET tipo_account = 'venditore' WHERE id = ?;`;
                db.run(userSql, [userId], function(err) {
                    if (err) {
                        return db.run('ROLLBACK;', () => reject(err));
                    }
                });

                // Conferma la transazione
                db.run('COMMIT;', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        });
    }
}

module.exports = new SellerDAO();