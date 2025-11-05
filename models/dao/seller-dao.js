'use strict';

// --- MODIFICA ---
// Importiamo 'pool' invece di 'db' perché questo file usa solo transazioni.
const { pool } = require('../../managedb');

class SellerDAO {
    /**
     * Esegue due operazioni in una transazione per registrare un nuovo venditore:
     * 1. Inserisce i dati specifici del venditore nella tabella 'venditori'.
     * 2. Aggiorna il 'tipo_account' dell'utente da 'cliente' a 'venditore' nella tabella 'users'.
     * @param {number} userId - L'ID dell'utente che sta diventando venditore.
     * @param {object} sellerData - I dati dal form di registrazione del venditore.
     * @returns {Promise<boolean>} Risolve in 'true' se l'intera operazione ha successo.
     */
    async createSeller(userId, sellerData) {
        const { nome_negozio, partita_iva, email_contatto, iban, descrizione } = sellerData;

        // --- MODIFICA ---
        // Acquisiamo un client dal 'pool' (che ha il metodo .connect())
        // invece che da 'db' (che non ce l'ha).
        const client = await pool.connect();

        try {
            // Iniziamo la transazione
            await client.query('BEGIN');

            // 1. Inserisce i dati nella tabella 'venditori'
            const sellerSql = `
                INSERT INTO venditori (user_id, nome_negozio, partita_iva, email_contatto, iban, descrizione)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;
            await client.query(sellerSql, [userId, nome_negozio, partita_iva, email_contatto, iban, descrizione]);

            // 2. Aggiorna il tipo di account nella tabella 'users'
            const userSql = `UPDATE users SET tipo_account = 'venditore' WHERE id = $1;`;
            await client.query(userSql, [userId]);

            // Se entrambe le operazioni sono andate a buon fine, confermiamo la transazione
            await client.query('COMMIT');
            return true;

        } catch (error) {
            // Se c'è un errore, annulliamo la transazione
            await client.query('ROLLBACK');
            console.error("Errore nella transazione createSeller:", error);
            throw error; // Rilanciamo l'errore per gestirlo nella rotta
        } finally {
            // Rilasciamo il client al pool, sia in caso di successo che di errore
            client.release();
        }
    }
}

module.exports = new SellerDAO();