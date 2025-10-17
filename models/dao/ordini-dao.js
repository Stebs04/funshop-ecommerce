'use strict';

const { db } = require('../../managedb'); // Assicurati che il percorso al tuo database sia corretto

/**
 * OrdiniDAO (Data Access Object)
 * Questa classe gestisce tutte le operazioni di interazione
 * con la tabella 'storico_ordini' nel database.
 */
class OrdiniDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera tutti gli ordini effettuati da un utente specifico.
   * @param {number} userId - L'ID dell'utente di cui recuperare gli ordini.
   * @returns {Promise<Array<object>>} Una lista di tutti gli ordini dell'utente.
   */
  async getOrdersByUserId(userId) {
    // Usiamo una JOIN con la tabella 'prodotti' per ottenere anche il nome e l'immagine del prodotto acquistato.
    const sql = `
      SELECT 
        so.id, 
        so.data_ordine, 
        so.totale, 
        so.stato,
        p.nome as nome_prodotto,
        p.percorso_immagine as immagine_prodotto
      FROM storico_ordini so
      LEFT JOIN prodotti p ON so.prodotto_id = p.id
      WHERE so.user_id = ?
      ORDER BY so.data_ordine DESC`;
      
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
   * Crea un nuovo ordine nel database.
   * @param {object} orderData - Dati dell'ordine: { totale, user_id, prodotto_id }
   * @returns {Promise<number>} L'ID del nuovo ordine creato.
   */
  async createOrder(orderData) {
    const { totale, user_id, prodotto_id } = orderData;
    
    const sql = `
      INSERT INTO storico_ordini (totale, user_id, prodotto_id) 
      VALUES (?, ?, ?)`;
      
    const params = [totale, user_id, prodotto_id];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID); // Restituisce l'ID del nuovo ordine
        }
      });
    });
  }

  /**
   * Trova un ordine specifico tramite il suo ID.
   * @param {number} id - L'ID dell'ordine da cercare.
   * @returns {Promise<object|undefined>} L'ordine trovato o undefined.
   */
  async getOrderById(id) {
    const sql = `SELECT * FROM storico_ordini WHERE id = ?`;

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
}

// Esporta una singola istanza della classe, passando la connessione al database.
module.exports = new OrdiniDAO(db);