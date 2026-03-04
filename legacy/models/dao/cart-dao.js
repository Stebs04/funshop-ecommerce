// File: models/dao/cart-dao.js
'use strict';

// Importazione del database (pool 'pg') e del DAO dei prodotti
const { db } = require('../../managedb');
const prodottiDao = require('./prodotti-dao');

/**
 * Classe CartDAO per la gestione dei dati del carrello nel database.
 */
class CartDAO {
    /**
     * Recupera il carrello di un utente dal database.
     * Trasforma i dati in un formato simile a quello del carrello di sessione,
     * includendo i dettagli completi dei prodotti (incluso l'array percorsi_immagine).
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<object>} Un oggetto che rappresenta il carrello.
     */
    async getCartByUserId(userId) {
        const sql = 'SELECT * FROM cart_items WHERE user_id = $1';
        
        try {
            const { rows: cartItems } = await db.query(sql, [userId]);
            
            const cart = { items: {}, totalQty: 0, totalPrice: 0 };
            if (!cartItems || cartItems.length === 0) {
                return cart;
            }
            
            // Estrae tutti gli ID dei prodotti dal carrello.
            const productIds = cartItems.map(item => item.product_id);

            // Recupera tutti i dettagli dei prodotti in una singola query.
            // prodottiDao.getProductsByIds restituisce l'oggetto completo (con l'array percorsi_immagine)
            const products = await prodottiDao.getProductsByIds(productIds);
            const productsMap = products.reduce((map, product) => {
                map[product.id] = product;
                return map;
            }, {});

            // Costruisce l'oggetto carrello.
            for (const item of cartItems) {
                const product = productsMap[item.product_id];
                if (product) {
                    // Convertiamo il prezzo da stringa (di NUMERIC) a numero
                    const itemPrice = parseFloat(product.prezzo_scontato) || parseFloat(product.prezzo);
                    cart.items[product.id] = {
                        item: product, // 'product' contiene l'array 'percorsi_immagine'
                        qty: item.quantity,
                        price: itemPrice * item.quantity
                    };
                    // Aggiunge al totale solo se il prodotto è effettivamente disponibile.
                    if (product.stato === 'disponibile') {
                        cart.totalQty += item.quantity;
                        cart.totalPrice += itemPrice * item.quantity;
                    }
                }
            }
            return cart;
        } catch (err) {
            console.error("Errore in getCartByUserId:", err);
            throw err;
        }
    }


    /**
     * Aggiunge un prodotto al carrello di un utente.
     * Utilizza 'INSERT ... ON CONFLICT ... DO NOTHING' per evitare duplicati.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da aggiungere.
     * @returns {Promise<number>} Il numero di righe modificate (1 se aggiunto, 0 se già presente).
     */
    async addToCart(userId, productId) {
        const sql = `
            INSERT INTO cart_items (user_id, product_id, quantity) 
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id, product_id) DO NOTHING
        `;
        try {
            const { rowCount } = await db.query(sql, [userId, productId]);
            return rowCount; // 1 se inserito, 0 se c'era conflitto
        } catch (err) {
            console.error("Errore in addToCart:", err);
            throw err;
        }
    }

    /**
     * Rimuove un singolo prodotto dal carrello di un utente.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da rimuovere.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    async removeFromCart(userId, productId) {
        const sql = 'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2';
        try {
            const { rowCount } = await db.query(sql, [userId, productId]);
            return rowCount;
        } catch (err) {
            console.error("Errore in removeFromCart:", err);
            throw err;
        }
    }

    /**
     * Svuota completamente il carrello di un utente (usato dopo un checkout).
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<number>} Il numero totale di righe eliminate.
     */
    async clearCart(userId) {
        const sql = 'DELETE FROM cart_items WHERE user_id = $1';
        try {
            const { rowCount } = await db.query(sql, [userId]);
            return rowCount;
        } catch (err) {
            console.error("Errore in clearCart:", err);
            throw err;
        }
    }

    /**
     * Unisce il carrello di un utente ospite (salvato in sessione)
     * con il carrello persistente nel database dopo il login.
     * @param {number} userId - L'ID dell'utente che ha effettuato il login.
     * @param {object} sessionCart - Il carrello presente nella sessione.
     */
    async mergeSessionCart(userId, sessionCart) {
        if (!sessionCart || !sessionCart.items) return;

        // Crea una serie di promesse per aggiungere ogni articolo dal carrello di sessione
        // Usiamo Promise.all per eseguirle in parallelo
        const promises = Object.keys(sessionCart.items).map(productId => {
            // productId è una stringa, lo convertiamo in numero
            return this.addToCart(userId, parseInt(productId, 10));
        });

        try {
            // Attende che tutte le operazioni di inserimento siano completate
            await Promise.all(promises);
        } catch (err) {
            console.error("Errore in mergeSessionCart:", err);
            throw err;
        }
    }
}

module.exports = new CartDAO();