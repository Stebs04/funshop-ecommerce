'use strict';

// Importiamo la connessione al database e la libreria bcrypt per l'hashing delle password.
const { db } = require('../../managedb');
const bcrypt = require('bcrypt');

class UtentiDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera un utente dal database tramite la sua email.
   * @param {string} email - L'email dell'utente da cercare.
   * @returns {Promise<Object|undefined>} Una promessa che risolve con l'oggetto utente completo
   * (incluso l'hash della password) o 'undefined' se non trovato.
   */
  getUser(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Recupera un utente dal database tramite il suo ID.
   * Per sicurezza, NON seleziona l'hash della password.
   * @param {number} id - L'ID dell'utente.
   * @returns {Promise<Object|undefined>} L'oggetto utente con i dati pubblici.
   */
  getUserById(id) {
    const sql = 'SELECT id, username, nome, cognome, email, data_nascita, tipo_account FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Crea un nuovo utente nel database.
   * @param {Object} user - I dati dell'utente dal form di registrazione.
   * @returns {Promise<number>} L'ID del nuovo utente creato.
   */
  createUser(user) {
    const { username, nome, cognome, email, password, data_nascita } = user;
    return new Promise(async (resolve, reject) => {
        try {
            // Prima di salvare la password, la crittografiamo con bcrypt.
            // Il '10' è il "costo" dell'hashing: un valore più alto è più sicuro ma più lento.
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = 'INSERT INTO users (username, nome, cognome, email, password_hash, data_nascita) VALUES (?, ?, ?, ?, ?, ?)';
            const params = [username, nome, cognome, email, hashedPassword, data_nascita];

            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        } catch (error) {
            reject(error);
        }
    });
  }

  /**
   * Aggiorna i dati del profilo di un utente (tabelle 'users' e 'accountinfos') in una transazione.
   * @param {number} userId - L'ID dell'utente da aggiornare.
   * @param {Object} data - I nuovi dati dal form di modifica profilo.
   * @returns {Promise<boolean>} 'true' se l'operazione ha successo.
   */
  async updateUserProfile(userId, data) {
    const { nome, cognome, username, data_nascita, descrizione } = data;

    return new Promise((resolve, reject) => {
        this.db.serialize(() => {
            this.db.run('BEGIN TRANSACTION', (err) => { if (err) return reject(err); });

            // 1. Aggiorna i dati nella tabella 'users'.
            const userSql = 'UPDATE users SET nome = ?, cognome = ?, username = ?, data_nascita = ? WHERE id = ?';
            this.db.run(userSql, [nome, cognome, username, data_nascita || null, userId], function(err) {
                if (err) return this.db.run('ROLLBACK', () => reject(err));
            });

            // 2. Aggiorna o inserisce la descrizione nella tabella 'accountinfos'.
            // "ON CONFLICT(user_id) DO UPDATE" è una sintassi SQLite (UPSERT) che
            // tenta un INSERT, ma se trova un conflitto sulla chiave (user_id),
            // esegue un UPDATE invece. È molto efficiente.
            const accountInfoSql = `
                INSERT INTO accountinfos (user_id, descrizione) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET descrizione = excluded.descrizione;
            `;
            this.db.run(accountInfoSql, [userId, descrizione || ''], function(err) {
                if (err) return this.db.run('ROLLBACK', () => reject(err));
            });

            // 3. Se tutto ok, conferma la transazione.
            this.db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });
  }

  /**
   * Elimina un utente dal database.
   * Grazie a 'ON DELETE CASCADE' nello schema del database, quando un utente viene eliminato,
   * verranno automaticamente rimossi anche tutti i record ad esso collegati nelle altre tabelle
   * (prodotti, indirizzi, recensioni, etc.), garantendo l'integrità dei dati.
   * @param {number} userId - L'ID dell'utente da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate (dovrebbe essere 1).
   */
  deleteUser(userId) {
      const sql = 'DELETE FROM users WHERE id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }
  
  /**
   * Recupera tutti gli utenti dal database (per la dashboard admin).
   * @returns {Promise<Array<Object>>} Una lista di tutti gli utenti.
   */
  getAllUsers() {
    const sql = 'SELECT id, username, email, tipo_account FROM users ORDER BY id ASC';
    return new Promise((resolve, reject) => {
        this.db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
  }

  // --- FUNZIONI PER IL RESET DELLA PASSWORD ---

  /**
   * Salva il token di reset e la sua data di scadenza per un utente.
   * @param {number} userId - L'ID dell'utente.
   * @param {string} token - Il token generato casualmente.
   * @param {number} expires - Il timestamp di scadenza del token.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  setUserResetToken(userId, token, expires) {
    const sql = 'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        this.db.run(sql, [token, expires, userId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }

  /**
   * Trova un utente in base a un token di reset valido e non scaduto.
   * @param {string} token - Il token da cercare.
   * @returns {Promise<Object|undefined>} L'oggetto utente se il token è valido.
   */
  getUserByResetToken(token) {
    // La query controlla sia il token sia che la data di scadenza sia nel futuro.
    const sql = 'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > ?';
    return new Promise((resolve, reject) => {
        this.db.get(sql, [token, Date.now()], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
  }

  /**
   * Aggiorna la password di un utente.
   * @param {number} userId - L'ID dell'utente.
   * @param {string} newPassword - La nuova password in chiaro.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  async updateUserPassword(userId, newPassword) {
    // Come per la creazione, facciamo l'hashing della nuova password.
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        this.db.run(sql, [hashedPassword, userId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }

  /**
   * Pulisce (imposta a NULL) i campi del token di reset dopo che è stato usato.
   * @param {number} userId - L'ID dell'utente.
   * @returns {Promise<number>} Il numero di righe aggiornate.
   */
  clearUserResetToken(userId) {
      const sql = 'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }
}

module.exports = new UtentiDAO(db);