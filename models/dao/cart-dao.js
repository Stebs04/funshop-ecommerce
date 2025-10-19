// File: models/dao/cart-dao.js
'use strict';

// Importazione del database e del DAO dei prodotti
const { db } = require('../../managedb');
const prodottiDao = require('./prodotti-dao');

/**
 * Classe CartDAO per la gestione dei dati del carrello nel database.
 */
class CartDAO {
    /**
     * Recupera il carrello di un utente dal database.
     * Trasforma i dati in un formato simile a quello del carrello di sessione,
     * includendo i dettagli completi dei prodotti.
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<object>} Un oggetto che rappresenta il carrello.
     */
    async getCartByUserId(userId) {
        const sql = 'SELECT * FROM cart_items WHERE user_id = ?';
        return new Promise((resolve, reject) => {
            db.all(sql, [userId], async (err, cartItems) => {
                if (err) return reject(err);

                const cart = { items: {}, totalQty: 0, totalPrice: 0 };
                if (!cartItems || cartItems.length === 0) {
                    return resolve(cart);
                }
                
                // Estrae tutti gli ID dei prodotti dal carrello.
                const productIds = cartItems.map(item => item.product_id);

                // Recupera tutti i dettagli dei prodotti in una singola query.
                const products = await prodottiDao.getProductsByIds(productIds);
                const productsMap = products.reduce((map, product) => {
                    map[product.id] = product;
                    return map;
                }, {});

                // Costruisce l'oggetto carrello.
                for (const item of cartItems) {
                    const product = productsMap[item.product_id];
                    if (product) {
                        const itemPrice = product.prezzo_scontato || product.prezzo;
                        cart.items[product.id] = {
                            item: product,
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
                resolve(cart);
            });
        });
    }


    /**
     * Aggiunge un prodotto al carrello di un utente.
     * Utilizza 'INSERT OR IGNORE' per evitare di inserire duplicati.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da aggiungere.
     * @returns {Promise<number>} Il numero di righe modificate (1 se aggiunto, 0 se già presente).
     */
    addToCart(userId, productId) {
        const sql = 'INSERT OR IGNORE INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    /**
     * Rimuove un singolo prodotto dal carrello di un utente.
     * @param {number} userId - L'ID dell'utente.
     * @param {number} productId - L'ID del prodotto da rimuovere.
     * @returns {Promise<number>} Il numero di righe eliminate.
     */
    removeFromCart(userId, productId) {
        const sql = 'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    /**
     * Svuota completamente il carrello di un utente (usato dopo un checkout).
     * @param {number} userId - L'ID dell'utente.
     * @returns {Promise<number>} Il numero totale di righe eliminate.
     */
    clearCart(userId) {
        const sql = 'DELETE FROM cart_items WHERE user_id = ?';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId], function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
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
        const promises = Object.keys(sessionCart.items).map(productId => {
            return this.addToCart(userId, productId);
        });

        // Attende che tutte le operazioni di inserimento siano completate
        await Promise.all(promises);
    }
}

module.exports = new CartDAO();