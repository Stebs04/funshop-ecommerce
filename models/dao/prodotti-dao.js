// File: models/dao/prodotti-dao.js

'use strict';

const db = require('../../managedb');

class ProdottiDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera i prodotti in base a un filtro.
   * @param {string} filterType - Tipo di filtro ('all', 'new', 'offers', 'category').
   * @param {string} [value] - Valore per il filtro (es. nome della categoria).
   * @returns {Promise<Array<object>>} Una lista di prodotti.
   */
  async getProducts(filterType = 'all', value = null) {
    let sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
    `;

    const params = [];

    switch (filterType) {
        case 'new':
            // Prodotti inseriti oggi
            sql += ' WHERE DATE(p.data_inserimento) = DATE(\'now\')';
            break;
        case 'offers':
            // Prodotti con un prezzo scontato valido
            sql += ' WHERE p.prezzo_scontato IS NOT NULL AND p.prezzo_scontato > 0';
            break;
        case 'category':
            // Prodotti di una specifica categoria
            sql += ' WHERE p.parola_chiave = ?';
            params.push(value);
            break;
    }

    sql += ' ORDER BY p.data_inserimento DESC';

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // ... (le altre funzioni come getProductById, getProductsByUserId rimangono invariate) ...

  async getProductById(id) {
    const sql = `
      SELECT p.*, u.username as nome_venditore, ai.immagine_profilo
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      LEFT JOIN accountinfos ai ON u.id = ai.user_id
      WHERE p.id = ?`;

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

  async getProductsByUserId(userId) {
    const sql = 'SELECT * FROM prodotti WHERE user_id = ? ORDER BY data_inserimento DESC';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  async createProduct(product) {
    const { nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, user_id } = product;
    
    // Includiamo prezzo_scontato, che sarà null di default
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
      const sql = 'DELETE FROM prodotti WHERE id = ? AND user_id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [productId, userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }
  
  /**
   * Recupera tutte le categorie (parole_chiave) uniche dal database.
   * @returns {Promise<Array<string>>} Una lista di stringhe di categorie.
   */
  async getAllCategories() {
    const sql = 'SELECT DISTINCT parola_chiave FROM prodotti ORDER BY parola_chiave';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Estrai solo i nomi delle categorie dall'oggetto
          resolve(rows.map(row => row.parola_chiave));
        }
      });
    });
  }

  async updateProduct(id, productData, userId) {
    // Aggiungi 'prezzo_scontato' ai campi potenzialmente aggiornabili
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorso_immagine', 'prezzo_scontato'];
    
    const fieldsToUpdate = Object.keys(productData)
        .filter(key => allowedFields.includes(key));
        
    if (fieldsToUpdate.length === 0) {
        return Promise.resolve(0); // Nessun campo valido da aggiornare
    }

    const fieldPlaceholders = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => {
        // Se il prezzo scontato è una stringa vuota, salvalo come NULL
        if (field === 'prezzo_scontato' && productData[field] === '') {
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
}

module.exports = new ProdottiDAO(db);