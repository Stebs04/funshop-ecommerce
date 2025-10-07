'use strict';

const db = require('../../managedb'); // Assicurati che il percorso al tuo database sia corretto

/**
 * ProdottiDAO (Data Access Object)
 * Questa classe gestisce tutte le operazioni di interazione
 * con la tabella 'prodotti' nel database.
 */
class ProdottiDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera tutti i prodotti dal database, includendo il nome del venditore.
   * @returns {Promise<Array<object>>} Una lista di tutti i prodotti.
   */
  async getAllProducts() {
    // Usiamo una JOIN per ottenere anche l'username del venditore dalla tabella 'users'
    const sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.data_inserimento DESC`;
      
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Trova un prodotto specifico tramite il suo ID.
   * @param {number} id - L'ID del prodotto da cercare.
   * @returns {Promise<object|undefined>} Il prodotto trovato o undefined.
   */
  async getProductById(id) {
    const sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id 
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

   /**
   * NUOVA FUNZIONE: Recupera tutti i prodotti di un utente specifico.
   * @param {number} userId - L'ID dell'utente di cui cercare i prodotti.
   * @returns {Promise<Array<object>>} Una lista dei prodotti dell'utente.
   */
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


  /**
   * Crea un nuovo prodotto nel database.
   * @param {object} product - Dati del prodotto da creare.
   * @returns {Promise<number>} L'ID del nuovo prodotto.
   */
  async createProduct(product) {
    const { nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, user_id } = product;
    
    const sql = `
      INSERT INTO prodotti (nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
    const params = [nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo || null, prezzo_asta || null, user_id];

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
   * Elimina un prodotto, verificando che l'utente sia il proprietario.
   * @param {number} productId - L'ID del prodotto da eliminare.
   * @param {number} userId - L'ID dell'utente che richiede l'eliminazione.
   * @returns {Promise<number>} Il numero di righe eliminate (1 se ha successo, 0 altrimenti).
   */
  async deleteProduct(productId, userId) {
      const sql = 'DELETE FROM prodotti WHERE id = ? AND user_id = ?';
      return new Promise((resolve, reject) => {
          this.db.run(sql, [productId, userId], function(err) {
              if (err) {
                  reject(err);
              } else {
                  resolve(this.changes);
              }
          });
      });
  }

  /**
   * Recupera tutte le categorie dal database.
   * @returns {Promise<Array<object>>} Una lista di tutte le categorie.
   */
  async getAllCategories() {
    const sql = 'SELECT * FROM categorie ORDER BY nome';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Aggiorna un prodotto esistente nel database.
   * @param {number} id - L'ID del prodotto da aggiornare.
   * @param {object} productData - I dati del prodotto da aggiornare.
   * @param {number} userId - L'ID dell'utente che richiede l'aggiornamento.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateProduct(id, productData, userId) {
    const fields = Object.keys(productData);
    const values = Object.values(productData);
    const fieldPlaceholders = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE prodotti SET ${fieldPlaceholders} WHERE id = ? AND user_id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [...values, id, userId], function (err) {
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
module.exports = new ProdottiDAO(db);