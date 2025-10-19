'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

class SellerDAO {
    /**
     * Esegue due operazioni in una transazione per registrare un nuovo venditore:
     * 1. Inserisce i dati specifici del venditore nella tabella 'venditori'.
     * 2. Aggiorna il 'tipo_account' dell'utente da 'cliente' a 'venditore' nella tabella 'users'.
     * L'uso di una transazione garantisce che entrambe le operazioni abbiano successo
     * o, in caso di errore in una qualsiasi delle due, nessuna delle due venga applicata (rollback).
     * Questo mantiene l'integrità dei dati.
     * @param {number} userId - L'ID dell'utente che sta diventando venditore.
     * @param {object} sellerData - I dati dal form di registrazione del venditore.
     * @returns {Promise<boolean>} Risolve in 'true' se l'intera operazione ha successo.
     */
    async createSeller(userId, sellerData) {
        // Estraiamo i dati dall'oggetto per maggiore leggibilità.
        const { nome_negozio, partita_iva, email_contatto, iban, descrizione } = sellerData;

        return new Promise((resolve, reject) => {
            // db.serialize() assicura che i comandi al suo interno vengano eseguiti in ordine.
            db.serialize(() => {
                // Iniziamo la transazione.
                db.run('BEGIN TRANSACTION;', (err) => {
                    if (err) return reject(err);
                });

                // 1. Inserisce i dati nella tabella 'venditori'.
                const sellerSql = `
                    INSERT INTO venditori (user_id, nome_negozio, partita_iva, email_contatto, iban, descrizione)
                    VALUES (?, ?, ?, ?, ?, ?);
                `;
                db.run(sellerSql, [userId, nome_negozio, partita_iva, email_contatto, iban, descrizione], function(err) {
                    // Se c'è un errore (es. partita_iva duplicata), annulliamo la transazione e rifiutiamo la promessa.
                    if (err) {
                        return db.run('ROLLBACK;', () => reject(err));
                    }
                });

                // 2. Aggiorna il tipo di account nella tabella 'users'.
                const userSql = `UPDATE users SET tipo_account = 'venditore' WHERE id = ?;`;
                db.run(userSql, [userId], function(err) {
                    // Se c'è un errore qui, annulliamo la transazione.
                    if (err) {
                        return db.run('ROLLBACK;', () => reject(err));
                    }
                });

                // Se entrambe le operazioni sono andate a buon fine, confermiamo la transazione.
                db.run('COMMIT;', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // La transazione è completata con successo.
                        resolve(true);
                    }
                });
            });
        });
    }
}

module.exports = new SellerDAO();