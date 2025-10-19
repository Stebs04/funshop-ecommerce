'use strict';

const { db } = require('../../managedb'); // Assicurati che il percorso al tuo database sia corretto

class OrdiniDAO {
  constructor(database) {
    this.db = database;
  }

  async getOrdersByUserId(userId) {
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

  // --- NUOVA FUNZIONE ---
  async getTotalSales() {
    const sql = `SELECT SUM(totale) as total FROM storico_ordini`;
    return new Promise((resolve, reject) => {
        this.db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.total || 0);
            }
        });
    });
  }

  // --- INIZIO MODIFICA: NUOVA FUNZIONE PER STATISTICHE VENDITORE ---
  /**
   * Calcola le statistiche di vendita per un singolo venditore.
   * @param {number} sellerId - L'ID dell'utente venditore.
   * @returns {Promise<Object>} Un oggetto con 'totalRevenue' e 'productsSoldCount'.
   */
  async getSalesStatsBySellerId(sellerId) {
    const sql = `
        SELECT
            SUM(so.totale) as totalRevenue,
            COUNT(so.id) as productsSoldCount
        FROM storico_ordini so
        JOIN prodotti p ON so.prodotto_id = p.id
        WHERE p.user_id = ?`;

    return new Promise((resolve, reject) => {
        this.db.get(sql, [sellerId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    totalRevenue: row.totalRevenue || 0,
                    productsSoldCount: row.productsSoldCount || 0
                });
            }
        });
    });
  }
  // --- FINE MODIFICA ---
}

module.exports = new OrdiniDAO(db);