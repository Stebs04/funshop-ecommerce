'use strict';

const db = require('../../managedb'); // Assicurati che il percorso sia corretto
const bcrypt = require('bcrypt');

/**
 * UtentiDAO (Data Access Object)
 * Classe che gestisce tutte le operazioni di interazione
 * con la tabella 'users' del database, rispettando lo schema.sql.
 */
class UtentiDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Trova un utente tramite il suo indirizzo email.
   * @param {string} email - L'email dell'utente da cercare.
   * @returns {Promise<object|undefined>} L'utente trovato o undefined.
   */
  async getUser(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Trova un utente tramite il suo ID.
   * @param {number} id - L'ID dell'utente da cercare.
   * @returns {Promise<object|undefined>} L'utente trovato o undefined.
   */
  async getUserById(id) {
    // Seleziona solo i dati non sensibili, come da buone pratiche
    const sql = 'SELECT id, username, nome, cognome, email, data_nascita, tipo_account FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Crea un nuovo utente nel database.
   * La funzione si occupa internamente di cifrare la password.
   * @param {object} user - Dati dell'utente: { username, nome, cognome, email, password, data_nascita }
   * @returns {Promise<number>} L'ID del nuovo utente creato.
   */
  async createUser(user) {
    const { username, nome, cognome, email, password, data_nascita } = user;
    // La colonna 'tipo_account' ha 'cliente' come DEFAULT, quindi non è necessaria qui.
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, nome, cognome, email, password_hash, data_nascita) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [username, nome, cognome, email, hashedPassword, data_nascita];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Aggiorna i dati anagrafici di un utente.
   * @param {number} userId - L'ID dell'utente da aggiornare.
   * @param {object} userData - Dati da modificare: { nome, cognome, username, data_nascita }
   * @returns {Promise<number>} Il numero di righe modificate (dovrebbe essere 1).
   */
  async updateUserData(userId, userData) {
    const { nome, cognome, username, data_nascita } = userData;
    const sql = 'UPDATE users SET nome = ?, cognome = ?, username = ?, data_nascita = ? WHERE id = ?';
    const params = [nome, cognome, username, data_nascita, userId];

    return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
  }

  /**
   * Elimina un account utente.
   * Grazie a ON DELETE CASCADE, verranno eliminati anche i dati collegati.
   * @param {number} userId - L'ID dell'utente da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate.
   */
  async deleteUser(userId) {
      const sql = 'DELETE FROM users WHERE id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [userId], function(err) {
              if (err) {
                  reject(err);
              } else {
                  resolve(this.changes);
              }
          });
      });
  }

  /**
   * Aggiunge un nuovo indirizzo per un utente.
   * @param {number} userId - L'ID dell'utente.
   * @param {object} indirizzoData - Dati dell'indirizzo: { indirizzo, citta, cap }
   * @returns {Promise<number>} L'ID del nuovo indirizzo.
   */
  async addIndirizzo(userId, indirizzoData) {
    const { indirizzo, citta, cap } = indirizzoData;
    const sql = 'INSERT INTO accountinfos (user_id, indirizzo, citta, cap) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [userId, indirizzo, citta, cap], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Aggiorna un indirizzo esistente.
   * @param {number} indirizzoId - L'ID dell'indirizzo da aggiornare.
   * @param {object} indirizzoData - Dati da modificare: { indirizzo, citta, cap }
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateIndirizzo(indirizzoId, indirizzoData) {
    const { indirizzo, citta, cap } = indirizzoData;
    const sql = 'UPDATE accountinfos SET indirizzo = ?, citta = ?, cap = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [indirizzo, citta, cap, indirizzoId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Elimina un indirizzo.
   * @param {number} indirizzoId - L'ID dell'indirizzo da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate.
   */
  async deleteIndirizzo(indirizzoId) {
    const sql = 'DELETE FROM accountinfos WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [indirizzoId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

}

// Esporta una singola istanza della classe, passando la connessione al database.
module.exports = new UtentiDAO(db);