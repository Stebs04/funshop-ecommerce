'use strict';

const { db } = require('../../managedb');
const bcrypt = require('bcrypt');

class UtentiDAO {
  constructor(database) {
    this.db = database;
  }

  getUser(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getUserById(id) {
    const sql = 'SELECT id, username, nome, cognome, email, data_nascita, tipo_account FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  createUser(user) {
    const { username, nome, cognome, email, password, data_nascita } = user;
    return new Promise(async (resolve, reject) => {
        try {
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
   * NUOVA FUNZIONE UNIFICATA
   * Aggiorna il profilo utente usando una transazione per sicurezza.
   */
  async updateUserProfile(userId, data) {
    const { nome, cognome, username, data_nascita, descrizione } = data;

    return new Promise((resolve, reject) => {
        this.db.serialize(() => {
            this.db.run('BEGIN TRANSACTION', (err) => {
              if (err) return reject(err);
            });

            // 1. Aggiorna la tabella 'users'
            const userSql = 'UPDATE users SET nome = ?, cognome = ?, username = ?, data_nascita = ? WHERE id = ?';
            this.db.run(userSql, [nome, cognome, username, data_nascita || null, userId], function(err) {
                if (err) {
                    return this.db.run('ROLLBACK', () => reject(err));
                }
            });

            // 2. Esegui un "UPSERT" per la tabella 'accountinfos'
            const accountInfoSql = `
                INSERT INTO accountinfos (user_id, descrizione) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET descrizione = excluded.descrizione;
            `;
            this.db.run(accountInfoSql, [userId, descrizione || ''], function(err) {
                if (err) {
                    return this.db.run('ROLLBACK', () => reject(err));
                }
            });

            // 3. Conferma le modifiche
            this.db.run('COMMIT', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true); // Successo
                }
            });
        });
    });
  }

  deleteUser(userId) {
      const sql = 'DELETE FROM users WHERE id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }
}

module.exports = new UtentiDAO(db);