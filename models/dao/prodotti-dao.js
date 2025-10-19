// File: models/dao/prodotti-dao.js
'use strict';

const { db } = require('../../managedb');

class ProdottiDAO {
  constructor(database) {
    this.db = database;
  }

  async getProducts(filters = {}) {
    const { view, category, condition, sortBy } = filters;
    let sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      WHERE p.stato = 'disponibile'
    `;
    const params = [];
    const whereClauses = [];

    if (view === 'new') {
      whereClauses.push("DATE(p.data_inserimento) = DATE('now')");
    } else if (view === 'offers') {
      whereClauses.push('p.prezzo_scontato IS NOT NULL AND p.prezzo_scontato > 0');
    }
    if (category) {
      whereClauses.push('p.parola_chiave = ?');
      params.push(category);
    }
    if (condition) {
      whereClauses.push('p.condizione = ?');
      params.push(condition);
    }
    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }
    if (sortBy === 'price_asc') {
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) DESC';
    } else {
      sql += ' ORDER BY p.data_inserimento DESC';
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  async getProductById(id) {
    const sql = `
      SELECT p.*, u.username as nome_venditore, u.email as email_venditore, ai.immagine_profilo
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      LEFT JOIN accountinfos ai ON u.id = ai.user_id
      WHERE p.id = ?`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getProductsByUserId(userId) {
    const sql = "SELECT * FROM prodotti WHERE user_id = ? AND stato != 'eliminato' ORDER BY data_inserimento DESC";
    return new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  async createProduct(product) {
    const { nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, user_id } = product;
    const sql = `
      INSERT INTO prodotti (nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, prezzo_scontato, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`;
    const params = [nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo || null, prezzo_asta || null, user_id];
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async deleteProduct(productId, userId) {
      const sql = "UPDATE prodotti SET stato = 'eliminato' WHERE id = ? AND user_id = ?";
      return new Promise((resolve, reject) => {
          this.db.run(sql, [productId, userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }

  async updateProduct(id, productData, userId) {
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorso_immagine', 'prezzo_scontato', 'condizione'];
    const fieldsToUpdate = Object.keys(productData).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) {
        return Promise.resolve(0);
    }
    const fieldPlaceholders = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => {
        if (field === 'prezzo_scontato' && (productData[field] === '' || parseFloat(productData[field]) === 0)) {
            return null;
        }
        return productData[field];
    });
    const sql = `UPDATE prodotti SET ${fieldPlaceholders} WHERE id = ? AND user_id = ?`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [...values, id, userId], function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  updateProductStatus(productId, status) {
    const sql = 'UPDATE prodotti SET stato = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        this.db.run(sql, [status, productId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }
}

module.exports = new ProdottiDAO(db);