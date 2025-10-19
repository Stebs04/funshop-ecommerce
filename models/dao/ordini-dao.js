'use strict';

// Importiamo la connessione al database
const { db } = require('../../managedb');

class OrdiniDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Recupera lo storico degli ordini per un utente specifico.
   * @param {number} userId - L'ID dell'utente.
   * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di oggetti ordine.
   */
  async getOrdersByUserId(userId) {
    // La query unisce storico_ordini e prodotti per ottenere anche il nome e l'immagine del prodotto.
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
      ORDER BY so.data_ordine DESC`; // Ordina dal più recente al più vecchio.
      
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
   * Crea un nuovo record di ordine nel database.
   * @param {Object} orderData - Dati dell'ordine: { totale, user_id, prodotto_id }.
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
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Recupera un singolo ordine tramite il suo ID.
   * @param {number} id - L'ID dell'ordine.
   * @returns {Promise<Object>} L'oggetto ordine.
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

  /**
   * Calcola il guadagno totale di tutti gli ordini registrati nel sistema.
   * Utile per la dashboard dell'amministratore.
   * @returns {Promise<number>} Il totale dei guadagni.
   */
  async getTotalSales() {
    // SUM(totale) calcola la somma di tutti i valori nella colonna 'totale'.
    const sql = `SELECT SUM(totale) as total FROM storico_ordini`;
    return new Promise((resolve, reject) => {
        this.db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                // Se non ci sono ordini, row.total sarà NULL. In quel caso, restituiamo 0.
                resolve(row.total || 0);
            }
        });
    });
  }

  /**
   * Calcola le statistiche di vendita per un singolo venditore (utente).
   * @param {number} sellerId - L'ID dell'utente venditore.
   * @returns {Promise<Object>} Un oggetto con 'totalRevenue' (guadagno totale) e 'productsSoldCount' (prodotti venduti).
   */
  async getSalesStatsBySellerId(sellerId) {
    const sql = `
        SELECT
            SUM(so.totale) as totalRevenue,
            COUNT(so.id) as productsSoldCount
        FROM storico_ordini so
        JOIN prodotti p ON so.prodotto_id = p.id
        WHERE p.user_id = ?`; // Filtra gli ordini solo per i prodotti venduti da questo specifico utente.

    return new Promise((resolve, reject) => {
        this.db.get(sql, [sellerId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                // Restituiamo un oggetto con i totali, assicurandoci che siano 0 se non ci sono risultati.
                resolve({
                    totalRevenue: row.totalRevenue || 0,
                    productsSoldCount: row.productsSoldCount || 0
                });
            }
        });
    });
  }
}

module.exports = new OrdiniDAO(db);