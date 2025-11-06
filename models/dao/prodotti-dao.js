// File: models/dao/prodotti-dao.js
'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

class ProdottiDAO {

  /**
   * Recupera una lista di prodotti dal database in base a una serie di filtri.
   * Seleziona solo la prima immagine dall'array (indice [1] in-db) come 'percorso_immagine_cover'.
   * @param {object} filters - Un oggetto che può contenere: { view, category, condition, sortBy }.
   * @returns {Promise<Array<Object>>} Una lista di prodotti che corrispondono ai filtri.
   */
  async getProducts(filters = {}) {
    const { view, category, condition, sortBy } = filters;
    
    let sql = `
      SELECT p.*, u.username as nome_venditore,
      p.percorsi_immagine[1] as percorso_immagine_cover
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      WHERE p.stato = 'disponibile'
    `;
    const params = [];
    const whereClauses = [];

    // Gestione dinamica dei placeholder per 'pg' (usano $1, $2, ...)
    let paramIndex = 1;

    if (view === 'novita') {
      // Filtra per i prodotti inseriti negli ultimi 2 giorni.
      // CURRENT_DATE - INTERVAL '2 days' è la sintassi PostgreSQL
      whereClauses.push("p.data_inserimento >= (CURRENT_TIMESTAMP - INTERVAL '2 days')");
    } else if (view === 'offerte') {
      // Solo prodotti in offerta.
      whereClauses.push('p.prezzo_scontato IS NOT NULL AND p.prezzo_scontato > 0');
    }
    if (category) {
      whereClauses.push(`p.parola_chiave = $${paramIndex++}`);
      params.push(category);
    }
    if (condition) {
      whereClauses.push(`p.condizione = $${paramIndex++}`);
      params.push(condition);
    }
    
    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }

    // Gestiamo l'ordinamento.
    if (sortBy === 'price_asc') {
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.prezzo_scontato, p.prezzo) DESC';
    } else {
      sql += ' ORDER BY p.data_inserimento DESC';
    }

    try {
      const { rows } = await db.query(sql, params);
      return rows;
    } catch (err) {
      console.error("Errore in getProducts:", err);
      throw err;
    }
  }
  
  /**
   * Recupera un singolo prodotto tramite il suo ID, includendo informazioni sul venditore
   * e l'array completo di percorsi immagine.
   * @param {number} id - L'ID del prodotto.
   * @returns {Promise<Object>} L'oggetto prodotto.
   */
  async getProductById(id) {
    const sql = `
      SELECT p.*, u.username as nome_venditore, u.email as email_venditore, ai.immagine_profilo
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      LEFT JOIN accountinfos ai ON u.id = ai.user_id
      WHERE p.id = $1`;
    try {
      const { rows } = await db.query(sql, [id]);
      return rows[0];
    } catch (err) {
      console.error("Errore in getProductById:", err);
      throw err;
    }
  }

  /**
   * Recupera più prodotti in una sola query dato un array di ID.
   * Seleziona i dati completi del prodotto, incluso l'array 'percorsi_immagine'.
   * @param {Array<number>} ids - Un array di ID di prodotti.
   * @returns {Promise<Array<Object>>} Una lista di oggetti prodotto.
   */
  async getProductsByIds(ids) {
    if (!ids || ids.length === 0) {
        return [];
    }
    
    // Creazione dinamica dei placeholder per la clausola IN
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    const sql = `
        SELECT p.*, u.username as nome_venditore
        FROM prodotti p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id IN (${placeholders})
    `;
    try {
      // Passiamo l'array di ID come parametri
      const { rows } = await db.query(sql, ids);
      return rows;
    } catch (err) {
      console.error("Errore in getProductsByIds:", err);
      throw err;
    }
  }


  /**
   * Recupera tutti i prodotti 'disponibili' di un utente specifico.
   * Seleziona solo la prima immagine come 'percorso_immagine_cover'.
   * Usato per la pagina profilo pubblica del venditore.
   * @param {number} userId - L'ID dell'utente (venditore).
   * @returns {Promise<Array<Object>>} Una lista dei suoi prodotti.
   */
  async getProductsByUserId(userId) {
    const sql = `
      SELECT *, percorsi_immagine[1] as percorso_immagine_cover 
      FROM prodotti 
      WHERE user_id = $1 AND stato = 'disponibile' 
      ORDER BY data_inserimento DESC
    `;
    try {
      const { rows } = await db.query(sql, [userId]);
      return rows;
    } catch (err) {
      console.error("Errore in getProductsByUserId:", err);
      throw err;
    }
  }
  
  /**
   * Crea un nuovo prodotto nel database.
   * @param {Object} product - I dati del prodotto da inserire (include 'percorsi_immagine' come array).
   * @returns {Promise<number>} L'ID del nuovo prodotto.
   */
  async createProduct(product) {
    const { nome, descrizione, condizione, parola_chiave, percorsi_immagine, prezzo, user_id } = product;
    const sql = `
      INSERT INTO prodotti (nome, descrizione, condizione, parola_chiave, percorsi_immagine, prezzo, prezzo_scontato, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
      RETURNING id
    `;
    // 'percorsi_immagine' viene passato come array, il driver 'pg' lo gestisce.
    const params = [nome, descrizione, condizione, parola_chiave, percorsi_immagine, prezzo || null, user_id];
    try {
      const { rows } = await db.query(sql, params);
      return rows[0].id;
    } catch (err) {
      console.error("Errore in createProduct:", err);
      throw err;
    }
  }

  /**
   * "Elimina" un prodotto cambiando il suo stato in 'eliminato' (soft delete).
   * @param {number} productId - L'ID del prodotto.
   * @param {number} userId - L'ID dell'utente, per verificare che possa eliminare solo i propri prodotti.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async deleteProduct(productId, userId) {
      const sql = "UPDATE prodotti SET stato = 'eliminato' WHERE id = $1 AND user_id = $2";
      try {
        const { rowCount } = await db.query(sql, [productId, userId]);
        return rowCount;
      } catch (err) {
        console.error("Errore in deleteProduct:", err);
        throw err;
      }
  }

  /**
   * Aggiorna i dati di un prodotto.
   * @param {number} id - L'ID del prodotto da aggiornare.
   * @param {Object} productData - I dati da modificare (include 'percorsi_immagine' come array).
   * @param {number} userId - L'ID del proprietario del prodotto.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateProduct(id, productData, userId) {
    // Lista dei campi che l'utente è autorizzato a modificare.
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorsi_immagine', 'prezzo_scontato', 'condizione'];
    const fieldsToUpdate = Object.keys(productData).filter(key => allowedFields.includes(key));
    
    if (fieldsToUpdate.length === 0) {
        return 0; // Nessun campo valido da aggiornare.
    }

    // Creazione dinamica dei placeholder
    const fieldPlaceholders = fieldsToUpdate.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fieldsToUpdate.map(field => {
        // Gestisce il caso in cui un prezzo scontato venga rimosso (impostato a NULL).
        if (field === 'prezzo_scontato' && (productData[field] === '' || parseFloat(productData[field]) === 0)) {
            return null;
        }
        // Il driver 'pg' gestirà il campo 'percorsi_immagine' se è un array.
        return productData[field];
    });

    // Aggiungiamo id e userId alla fine dell'array dei valori per i controlli WHERE
    const sql = `UPDATE prodotti SET ${fieldPlaceholders} WHERE id = $${fieldsToUpdate.length + 1} AND user_id = $${fieldsToUpdate.length + 2}`;
    values.push(id, userId);

    try {
      const { rowCount } = await db.query(sql, values);
      return rowCount;
    } catch (err) {
      console.error("Errore in updateProduct:", err);
      throw err;
    }
  }

  /**
   * Aggiorna lo stato di un prodotto (es. da 'disponibile' a 'venduto').
   * @param {number} productId - L'ID del prodotto.
   * @param {string} status - Il nuovo stato.
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateProductStatus(productId, status) {
    const sql = 'UPDATE prodotti SET stato = $1 WHERE id = $2';
    try {
      const { rowCount } = await db.query(sql, [status, productId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in updateProductStatus:", err);
      throw err;
    }
  }

  // --- FUNZIONI RISERVATE AGLI AMMINISTRATORI ---

  /**
   * Recupera TUTTI i prodotti, indipendentemente dal loro stato.
   * Seleziona i dati completi, incluso l'array 'percorsi_immagine', per la tabella admin.
   * @returns {Promise<Array<Object>>} Una lista di tutti i prodotti.
   */
  async getAllProductsAdmin() {
    const sql = `
      SELECT p.*, u.username as nome_venditore
      FROM prodotti p 
      JOIN users u ON p.user_id = u.id
      ORDER BY p.data_inserimento DESC
    `;
    try {
      const { rows } = await db.query(sql);
      return rows;
    } catch (err) {
      console.error("Errore in getAllProductsAdmin:", err);
      throw err;
    }
  }

  /**
   * Elimina fisicamente un prodotto dal database (hard delete).
   * @param {number} productId - L'ID del prodotto da eliminare.
   * @returns {Promise<number>} Il numero di righe eliminate.
   */
  async deleteProductAdmin(productId) {
    const sql = "DELETE FROM prodotti WHERE id = $1";
    try {
      const { rowCount } = await db.query(sql, [productId]);
      return rowCount;
    } catch (err) {
      console.error("Errore in deleteProductAdmin:", err);
      throw err;
    }
  }

  /**
   * Aggiorna un prodotto senza controllare l'ID dell'utente (potere da admin).
   * @param {number} id - L'ID del prodotto.
   * @param {Object} productData - I dati da aggiornare (include 'percorsi_immagine').
   * @returns {Promise<number>} Il numero di righe modificate.
   */
  async updateProductAdmin(id, productData) {
    // Assicuriamo che 'percorsi_immagine' sia tra i campi permessi.
    const allowedFields = ['nome', 'descrizione', 'prezzo', 'parola_chiave', 'percorsi_immagine', 'prezzo_scontato', 'condizione'];
    const fieldsToUpdate = Object.keys(productData).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) return 0;
    
    const fieldPlaceholders = fieldsToUpdate.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fieldsToUpdate.map(field => {
      if (field === 'prezzo_scontato' && (productData[field] === '' || parseFloat(productData[field]) === 0)) {
            return null;
        }
      return productData[field];
    });
    
    // L'ID è l'ultimo parametro per il WHERE
    const sql = `UPDATE prodotti SET ${fieldPlaceholders} WHERE id = $${fieldsToUpdate.length + 1}`;
    values.push(id);

    try {
      const { rowCount } = await db.query(sql, values);
      return rowCount;
    } catch (err) {
      console.error("Errore in updateProductAdmin:", err);
      throw err;
    }
  }
}

module.exports = new ProdottiDAO();