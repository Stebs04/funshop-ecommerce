'use strict';

const db = require('../../managedb');
const bcrypt = require('bcrypt');

class UtentiDAO {
  constructor(database) {
    this.db = database;
  }

  async getUser(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getUserById(id) {
    const sql = 'SELECT id, username, nome, cognome, email, data_nascita, tipo_account FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createUser(user) {
    const { username, nome, cognome, email, password, data_nascita } = user;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, nome, cognome, email, password_hash, data_nascita) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [username, nome, cognome, email, hashedPassword, data_nascita];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async updateUserData(userId, userData) {
    const { nome, cognome, username, data_nascita } = userData;
    const sql = 'UPDATE users SET nome = ?, cognome = ?, username = ?, data_nascita = ? WHERE id = ?';
    const params = [nome, cognome, username, data_nascita, userId];

    return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }

  async deleteUser(userId) {
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