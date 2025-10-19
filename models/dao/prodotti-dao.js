// File: models/dao/prodotti-dao.js
'use strict';

// Importiamo la connessione al database.
const { db } = require('../../managedb');

class ProdottiDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera una lista di prodotti dal database in base a una serie di filtri.
   * @param {object} filters - Un oggetto che può contenere: { view, category, condition, sortBy }.
   * @returns {Promise<Array<Object>>} Una lista di prodotti che corrispondono ai filtri.
   */
  async getProducts(filters = {}) {
    // Estraiamo i filtri dall'oggetto per un uso più semplice.
    const { view, category, condition, sortBy } = filters;
    // Query di base che seleziona i prodotti disponibili e unisce la tabella utenti per ottenere il nome del venditore.
    let sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      WHERE p.stato = 'disponibile'
    `;
    const params = []; // Array per i valori da passare alla query SQL per prevenire SQL injection.
    const whereClauses = []; // Array per costruire dinamicamente la clausola WHERE.

    // Aggiungiamo condizioni in base ai filtri ricevuti.
    if (view === 'novita') {
      // Filtra per i prodotti inseriti negli ultimi 2 giorni.
      whereClauses.push("p.data_inserimento >= date('now', '-2 days')");
    } else if (view === 'offerte') {
      // Solo prodotti in offerta.
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
    // Se abbiamo aggiunto delle clausole, le uniamo con 'AND' e le aggiungiamo alla query.
    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }
    // Gestiamo l'ordinamento.
    if (sortBy === 'price_asc') {
      // COALESCE restituisce il primo valore non nullo: ordina per prezzo scontato se esiste, altrimenti per prezzo normale.
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) DESC';
    } else {
      // Ordinamento di default: dal più recente al più vecchio.
      sql += ' ORDER BY p.data_inserimento DESC';
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  /**
   * Recupera un singolo prodotto tramite il suo ID, includendo informazioni sul venditore.
   * @param {number} id - L'ID del prodotto.
   * @returns {Promise<Object>} L'oggetto prodotto.
   */
  async getProductById(id) {
    // La query unisce prodotti, utenti e accountinfos per ottenere tutti i dettagli necessari.
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

  /**
   * Recupera più prodotti in una sola query dato un array di ID.
   * @param {Array<number>} ids - Un array di ID di prodotti.
   * @returns {Promise<Array<Object>>} Una lista di oggetti prodotto.
   */
  async getProductsByIds(ids) {
    if (!ids || ids.length === 0) {
        return [];
    }
    // Crea una serie di placeholder '?' per la clausola IN.
    const placeholders = ids.map(() => '?').join(',');
    const sql = `
        SELECT p.*, u.username as nome_venditore 
        FROM prodotti p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id IN (${placeholders})
    `;
    return new Promise((resolve, reject) => {
        this.db.all(sql, ids, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
  }


  /**
   * Recupera tutti i prodotti 'disponibili' di un utente specifico.
   * @param {number} userId - L'ID dell'utente (venditore).
   * @returns {Promise<Array<Object>>} Una lista dei suoi prodotti.
   */
  async getProductsByUserId(userId) {
    const sql = "SELECT * FROM prodotti WHERE user_id = ? AND stato = 'disponibile' ORDER BY data_inserimento DESC";
    return new Promise((resolve, reject) => {
      this.db.all(sql, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  /**
   * Crea un nuovo prodotto nel database.
   * @param {Object} product - I dati del prodotto da inserire.
   * @returns {Promise<number>} L'ID del nuovo prodotto.
   */
  async createProduct(product) {
    const { nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, user_id } = product;
    const sql = `
      INSERT INTO prodotti (nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_scontato, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`;
    // Usiamo '|| null' per assicurarci che se prezzo non è definito, venga inserito NULL nel DB.
    const params = [nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo || null, user_id];
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * "Elimina" un prodotto cambiando il suo stato in 'eliminato' (soft delete).
   * @param {number} productId - L'ID del prodotto.
   * @param {number} userId - L'ID dell'utente, per verificare che possa eliminare solo i propri prodotti.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async deleteProduct(productId, userId) {
      const sql = "UPDATE prodotti SET stato = 'eliminato' WHERE id = ? AND user_id = ?";
      return new Promise((resolve, reject) => {
          this.db.run(sql, [productId, userId], function(err) {
              if (err) reject(err);
              else resolve(this.changes);
          });
      });
  }

  /**
   * Aggiorna i dati di un prodotto.
   * @param {number} id - L'ID del prodotto da aggiornare.
   * @param {Object} productData - I dati da modificare.
   * @param {number} userId - L'ID del proprietario del prodotto.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateProduct(id, productData, userId) {
    // Lista dei campi che l'utente è autorizzato a modificare.
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorso_immagine', 'prezzo_scontato', 'condizione'];
    // Filtriamo i dati in ingresso per usare solo i campi permessi.
    const fieldsToUpdate = Object.keys(productData).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) {
        return Promise.resolve(0); // Nessun campo valido da aggiornare.
    }
    // Costruiamo dinamicamente la parte SET della query SQL.
    const fieldPlaceholders = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => {
        // Se il prezzo scontato viene inviato come stringa vuota o zero, lo impostiamo a NULL.
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

  /**
   * Aggiorna lo stato di un prodotto (es. da 'disponibile' a 'venduto').
   * @param {number} productId - L'ID del prodotto.
   * @param {string} status - Il nuovo stato.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  updateProductStatus(productId, status) {
    const sql = 'UPDATE prodotti SET stato = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        this.db.run(sql, [status, productId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }

  // --- FUNZIONI RISERVATE AGLI AMMINISTRATORI ---

  /**
   * Recupera TUTTI i prodotti, indipendentemente dal loro stato.
   * @returns {Promise<Array<Object>>} Una lista di tutti i prodotti.
   */
  getAllProductsAdmin() {
    const sql = `
      SELECT p.*, u.username as nome_venditore 
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      ORDER BY p.data_inserimento DESC
    `;
    return new Promise((resolve, reject) => {
        this.db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
  }

  /**
   * Elimina fisicamente un prodotto dal database (hard delete).
   * @param {number} productId - L'ID del prodotto da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate.
   */
  deleteProductAdmin(productId) {
    const sql = "DELETE FROM prodotti WHERE id = ?";
    return new Promise((resolve, reject) => {
        this.db.run(sql, [productId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }

  /**
   * Aggiorna un prodotto senza controllare l'ID dell'utente (potere da admin).
   * @param {number} id - L'ID del prodotto.
   * @param {Object} productData - I dati da aggiornare.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  updateProductAdmin(id, productData) {
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorso_immagine', 'prezzo_scontato', 'condizione'];
    const fieldsToUpdate = Object.keys(productData).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) return Promise.resolve(0);
    
    const fieldPlaceholders = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => (productData[field] === '' ? null : productData[field]));
    
    // Notare l'assenza del controllo 'AND user_id = ?'.
    const sql = `UPDATE prodotti SET ${fieldPlaceholders} WHERE id = ?`;
    return new Promise((resolve, reject) => {
        this.db.run(sql, [...values, id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
  }
}

module.exports = new ProdottiDAO(db);