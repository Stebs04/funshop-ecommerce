// File: models/dao/ordini-dao.js
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
    // La query seleziona i dati principali dell'ordine (id, data, totale, stato)
    // Esegue una JOIN con 'prodotti' (p) per ottenere il nome del prodotto
    // Seleziona la prima immagine dall'array 'percorsi_immagine' (indice [1] in PostgreSQL) come 'immagine_prodotto'
    // Filtra i risultati per uno specifico 'user_id' ($1)
    // Ordina i risultati dal più recente al meno recente
    const sql = `
      SELECT 
        so.id, 
        so.data_ordine, 
        so.totale, 
        so.stato,
        p.nome as nome_prodotto,
        -- Seleziona la prima immagine dall'array 'percorsi_immagine'
        p.percorsi_immagine[1] as immagine_prodotto
      FROM storico_ordini so
      LEFT JOIN prodotti p ON so.prodotto_id = p.id
      WHERE so.user_id = $1
      ORDER BY so.data_ordine DESC`;
      
    try {
      // Esegue la query passando l'ID utente come parametro
      const { rows } = await db.query(sql, [userId]);
      // Restituisce l'array di righe (ordini) trovate
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
    // Inserisce i dati dell'ordine usando i placeholder $1, $2, $3
    // 'RETURNING id' (specifico di PostgreSQL) restituisce l'ID della riga appena inserita
    const sql = `
      INSERT INTO storico_ordini (totale, user_id, prodotto_id) 
      VALUES ($1, $2, $3)
      RETURNING id`;
    const params = [totale, user_id, prodotto_id];

    try {
      // Esegue la query di inserimento
      const { rows } = await db.query(sql, params);
      // Restituisce l'ID del nuovo ordine
      return rows[0].id;
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
    // Seleziona tutti i campi dalla tabella 'storico_ordini' dove l'ID corrisponde
    const sql = `SELECT * FROM storico_ordini WHERE id = $1`;
    try {
      // Esegue la query
      const { rows } = await db.query(sql, [id]);
      // Restituisce la prima riga trovata (o undefined)
      return rows[0];
    } catch (err) {
      console.error("Errore in getOrderById:", err);
      throw err;
    }
  }

  /**
   * Calcola il guadagno totale di tutti gli ordini registrati nel sistema.
   * Utile per la dashboard dell'amministratore.
   * @returns {Promise<number>} Il totale dei guadagni.
   */
  async getTotalSales() {
    // Utilizza la funzione di aggregazione SUM() di SQL per sommare tutti i valori
    // nella colonna 'totale' e la rinomina (alias) 'total'
    const sql = `SELECT SUM(totale) as total FROM storico_ordini`;
    try {
        const { rows } = await db.query(sql);
        const row = rows[0];
        // 'row.total' potrebbe essere NULL se non ci sono ordini.
        // Usiamo parseFloat() per convertire il risultato (che è una stringa numerica o null) in un numero.
        // Se il risultato è NULL, `|| 0` assicura che venga restituito 0.
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
    // Questa query:
    // 1. Somma (SUM) i totali degli ordini ('so.totale') per ottenere 'totalRevenue'
    // 2. Conta (COUNT) gli ID degli ordini ('so.id') per ottenere 'productsSoldCount'
    // 3. Unisce 'storico_ordini' (so) con 'prodotti' (p)
    // 4. Filtra i risultati per trovare solo i prodotti dove l'ID del venditore ('p.user_id') corrisponde a quello fornito ($1)
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
        
        // La funzione 'async' restituisce automaticamente una promessa
        // PostgreSQL restituisce i nomi delle colonne in minuscolo ('totalrevenue', 'productssoldcount')
        return {
            totalRevenue: parseFloat(row.totalrevenue) || 0,
            productsSoldCount: parseInt(row.productssoldcount, 10) || 0
        };
    } catch (err) {
        console.error("Errore in getSalesStatsBySellerId:", err);
        throw err;
    }
  }

  /**
   * Recupera tutti gli ordini dal database (per la dashboard admin).
   * Include il nome del prodotto e l'username dell'acquirente.
   * @returns {Promise<Array<Object>>} Una lista di tutti gli ordini.
   */
  async getAllOrdersAdmin() {
    // Seleziona i dati dell'ordine
    // Esegue una LEFT JOIN con 'prodotti' (p) per ottenere 'nome_prodotto'
    // Esegue una LEFT JOIN con 'users' (u) per ottenere 'nome_acquirente' (l'utente che ha comprato)
    // LEFT JOIN è usato nel caso un prodotto o un utente siano stati eliminati (restituisce NULL)
    // Ordina per data
    const sql = `
        SELECT 
            so.id, 
            so.data_ordine, 
            so.totale, 
            so.stato,
            p.nome as nome_prodotto,
            u.username as nome_acquirente
        FROM storico_ordini so
        LEFT JOIN prodotti p ON so.prodotto_id = p.id
        LEFT JOIN users u ON so.user_id = u.id
        ORDER BY so.data_ordine DESC
    `;
    try {
        // Esegue la query (senza parametri)
        const { rows } = await db.query(sql);
        // Restituisce l'array completo degli ordini
        return rows;
    } catch (err) {
        console.error("Errore in getAllOrdersAdmin:", err);
        throw err;
    }
  }
}

// Esportiamo una nuova istanza della classe
module.exports = new OrdiniDAO();