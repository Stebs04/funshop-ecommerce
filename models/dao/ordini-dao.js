'use strict';

// Importiamo la connessione al database (pool 'pg')
const { db } = require('../../managedb');

/**
 * OrdiniDAO (Data Access Object)
 * Questa classe si occupa di tutte le operazioni relative alla tabella 'storico_ordini'.
 */
class OrdiniDAO {

  /**
   * Recupera lo storico degli ordini per un utente specifico.
   * Effettua una JOIN con la tabella 'prodotti' per ottenere anche il nome e l'immagine
   * del prodotto acquistato.
   * @param {number} userId - L'ID dell'utente.
   * @returns {Promise<Array<Object>>} Una promessa che risolve in un array di oggetti ordine.
   */
  async getOrdersByUserId(userId) {
    // Sostituiamo ? con $1 (sintassi di pg)
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
      WHERE so.user_id = $1
      ORDER BY so.data_ordine DESC`;
      
    try {
      // Usiamo 'db.query' e 'await', il risultato è in 'rows'
      const { rows } = await db.query(sql, [userId]);
      return rows;
    } catch (err) {
      console.error("Errore in getOrdersByUserId:", err);
      throw err; // Rilanciamo l'errore per gestirlo nella rotta
    }
  }

  /**
   * Crea un nuovo record di ordine nel database.
   * @param {Object} orderData - Dati dell'ordine: { totale, user_id, prodotto_id }.
   * @returns {Promise<number>} L'ID del nuovo ordine creato.
   */
  async createOrder(orderData) {
    const { totale, user_id, prodotto_id } = orderData;
    // Usiamo $1, $2, $3 e 'RETURNING id' per ottenere l'ID generato
    const sql = `
      INSERT INTO storico_ordini (totale, user_id, prodotto_id) 
      VALUES ($1, $2, $3)
      RETURNING id`;
    const params = [totale, user_id, prodotto_id];

    try {
      const { rows } = await db.query(sql, params);
      return rows[0].id; // Restituisce l'ID del nuovo ordine
    } catch (err) {
      console.error("Errore in createOrder:", err);
      throw err;
    }
  }

  /**
   * Recupera un singolo ordine tramite il suo ID.
   * @param {number} id - L'ID dell'ordine.
   * @returns {Promise<Object>} L'oggetto ordine.
   */
  async getOrderById(id) {
    const sql = `SELECT * FROM storico_ordini WHERE id = $1`;
    try {
      const { rows } = await db.query(sql, [id]);
      return rows[0];
    } catch (err) { // <-- MODIFICA: Aggiunte le parentesi graffe { } mancanti
      console.error("Errore in getOrderById:", err);
      throw err;
    } // <-- MODIFICA: Aggiunte le parentesi graffe { } mancanti
  }

  /**
   * Calcola il guadagno totale di tutti gli ordini registrati nel sistema.
   * Utile per la dashboard dell'amministratore.
   * @returns {Promise<number>} Il totale dei guadagni.
   */
  async getTotalSales() {
    // SUM(totale) calcola la somma di tutti i valori nella colonna 'totale'.
    const sql = `SELECT SUM(totale) as total FROM storico_ordini`;
    try {
        const { rows } = await db.query(sql);
        const row = rows[0];
        // Se non ci sono ordini, row.total sarà NULL. In quel caso, restituiamo 0.
        // Usiamo parseFloat per assicurare che il risultato sia un numero.
        return parseFloat(row.total) || 0;
    } catch (err) {
        console.error("Errore in getTotalSales:", err);
        throw err;
    }
  }

  /**
   * Calcola le statistiche di vendita per un singolo venditore (utente).
   * @param {number} sellerId - L'ID dell'utente venditore.
   * @returns {Promise<Object>} Un oggetto con 'totalRevenue' (guadagno totale) e 'productsSoldCount' (prodotti venduti).
   */
  async getSalesStatsBySellerId(sellerId) {
    // Sostituiamo ? con $1
    const sql = `
        SELECT
            SUM(so.totale) as totalRevenue,
            COUNT(so.id) as productsSoldCount
        FROM storico_ordini so
        JOIN prodotti p ON so.prodotto_id = p.id
        WHERE p.user_id = $1`; 

    try {
        const { rows } = await db.query(sql, [sellerId]);
        const row = rows[0];
        
        // --- MODIFICA ---
        // Sostituiamo 'resolve' con 'return'.
        // Una funzione 'async' restituisce automaticamente una promessa risolta con il valore di 'return'.
        return {
            totalRevenue: parseFloat(row.totalrevenue) || 0, // 'totalrevenue' è minuscolo in pg
            productsSoldCount: parseInt(row.productssoldcount, 10) || 0 // 'productssoldcount' è minuscolo
        };
    } catch (err) {
        console.error("Errore in getSalesStatsBySellerId:", err);
        throw err;
    }
  }
}

// Esportiamo una nuova istanza della classe
module.exports = new OrdiniDAO();