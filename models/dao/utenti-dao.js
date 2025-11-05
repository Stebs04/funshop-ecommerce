'use strict';

// Importiamo la connessione al database (ora è il pool 'pg') e bcrypt
const { db } = require('../../managedb');
const bcrypt = require('bcrypt');

class UtentiDAO {

  /**
   * Recupera un utente dal database tramite la sua email.
   * @param {string} email - L'email dell'utente da cercare.
   * @returns {Promise<Object|undefined>} Una promessa che risolve con l'oggetto utente completo
   * (incluso l'hash della password) o 'undefined' se non trovato.
   */
  async getUser(email) {
    // Sostituiamo ? con $1
    const sql = 'SELECT * FROM users WHERE email = $1';
    try {
      // usiamo await e db.query, prendiamo 'rows' dal risultato
      const { rows } = await db.query(sql, [email]);
      // restituiamo la prima riga (o undefined se non trovato)
      return rows[0];
    } catch (err) {
      console.error("Errore in getUser:", err);
      throw err;
    }
  }

  /**
   * Recupera un utente dal database tramite il suo ID.
   * Per sicurezza, NON seleziona l'hash della password.
   * @param {number} id - L'ID dell'utente.
   * @returns {Promise<Object|undefined>} L'oggetto utente con i dati pubblici.
   */
  async getUserById(id) {
    const sql = 'SELECT id, username, nome, cognome, email, data_nascita, tipo_account FROM users WHERE id = $1';
    try {
      const { rows } = await db.query(sql, [id]);
      return rows[0];
    } catch (err) {
      console.error("Errore in getUserById:", err);
      throw err;
    }
  }

  /**
   * Crea un nuovo utente nel database.
   * @param {Object} user - I dati dell'utente dal form di registrazione.
   * @returns {Promise<number>} L'ID del nuovo utente creato.
   */
  async createUser(user) {
    const { username, nome, cognome, email, password, data_nascita } = user;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      // Usiamo i placeholder $1, $2, ecc. e aggiungiamo 'RETURNING id'
      const sql = `
        INSERT INTO users (username, nome, cognome, email, password_hash, data_nascita) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const params = [username, nome, cognome, email, hashedPassword, data_nascita || null];
      
      const { rows } = await db.query(sql, params);
      // Restituiamo l'ID del nuovo utente
      return rows[0].id;
    } catch (error) {
      console.error("Errore in createUser:", error);
      throw error;
    }
  }

  /**
   * Aggiorna i dati del profilo di un utente (tabelle 'users' e 'accountinfos') in una transazione.
   * @param {number} userId - L'ID dell'utente da aggiornare.
   * @param {Object} data - I nuovi dati dal form di modifica profilo.
   * @returns {Promise<boolean>} 'true' se l'operazione ha successo.
   */
  async updateUserProfile(userId, data) {
    const { nome, cognome, username, data_nascita, descrizione } = data;
    
    // Acquisiamo un client dedicato per la transazione
    const client = await db.connect();
    
    try {
      // 1. Iniziamo la transazione
      await client.query('BEGIN');

      // 2. Aggiorna i dati nella tabella 'users'.
      const userSql = 'UPDATE users SET nome = $1, cognome = $2, username = $3, data_nascita = $4 WHERE id = $5';
      await client.query(userSql, [nome, cognome, username, data_nascita || null, userId]);

      // 3. Aggiorna o inserisce la descrizione nella tabella 'accountinfos'.
      // Sintassi "UPSERT" di PostgreSQL
      const accountInfoSql = `
          INSERT INTO accountinfos (user_id, descrizione) 
          VALUES ($1, $2)
          ON CONFLICT (user_id) 
          DO UPDATE SET descrizione = EXCLUDED.descrizione;
      `;
      await client.query(accountInfoSql, [userId, descrizione || '']);

      // 4. Se tutto ok, conferma la transazione.
      await client.query('COMMIT');
      return true;
    } catch (err) {
      // 5. Se c'è un errore, annulla la transazione.
      await client.query('ROLLBACK');
      console.error("Errore nella transazione updateUserProfile:", err);
      throw err;
    } finally {
      // 6. Rilascia il client al pool
      client.release();
    }
  }

  /**
   * Elimina un utente dal database.
   * @param {number} userId - L'ID dell'utente da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate (dovrebbe essere 1).
   */
  async deleteUser(userId) {
    const sql = 'DELETE FROM users WHERE id = $1';
    try {
      // 'rowCount' ci dice quante righe sono state modificate
      const { rowCount } = await db.query(sql, [userId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in deleteUser:", err);
      throw err;
    }
  }
  
  /**
   * Recupera tutti gli utenti dal database (per la dashboard admin).
   * @returns {Promise<Array<Object>>} Una lista di tutti gli utenti.
   */
  async getAllUsers() {
    const sql = 'SELECT id, username, email, tipo_account FROM users ORDER BY id ASC';
    try {
      const { rows } = await db.query(sql);
      return rows;
    } catch (err) {
      console.error("Errore in getAllUsers:", err);
      throw err;
    }
  }

  // --- FUNZIONI PER IL RESET DELLA PASSWORD ---

  /**
   * Salva il token di reset e la sua data di scadenza per un utente.
   * @param {number} userId - L'ID dell'utente.
   * @param {string} token - Il token generato casualmente.
   * @param {number} expires - Il timestamp di scadenza del token.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  async setUserResetToken(userId, token, expires) {
    const sql = 'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3';
    try {
      const { rowCount } = await db.query(sql, [token, expires, userId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in setUserResetToken:", err);
      throw err;
    }
  }

  /**
   * Trova un utente in base a un token di reset valido e non scaduto.
   * @param {string} token - Il token da cercare.
   * @returns {Promise<Object|undefined>} L'oggetto utente se il token è valido.
   */
  async getUserByResetToken(token) {
    // La query controlla sia il token sia che la data di scadenza sia nel futuro.
    const sql = 'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > $2';
    try {
      const { rows } = await db.query(sql, [token, Date.now()]);
      return rows[0];
    } catch (err) {
      console.error("Errore in getUserByResetToken:", err);
      throw err;
    }
  }

  /**
   * Aggiorna la password di un utente.
   * @param {number} userId - L'ID dell'utente.
   * @param {string} newPassword - La nuova password in chiaro.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  async updateUserPassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sql = 'UPDATE users SET password_hash = $1 WHERE id = $2';
      const { rowCount } = await db.query(sql, [hashedPassword, userId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in updateUserPassword:", err);
      throw err;
    }
  }

  /**
   * Pulisce (imposta a NULL) i campi del token di reset dopo che è stato usato.
   * @param {number} userId - L'ID dell'utente.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  async clearUserResetToken(userId) {
    const sql = 'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1';
    try {
      const { rowCount } = await db.query(sql, [userId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in clearUserResetToken:", err);
      throw err;
    }
  }
}

// Esportiamo una nuova istanza della classe
module.exports = new UtentiDAO();