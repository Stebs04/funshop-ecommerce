// File: models/dao/cart-dao.js
'use strict';

const { db } = require('../../managedb');
const prodottiDao = require('./prodotti-dao');

class CartDAO {
    /**
     * Recupera il carrello di un utente dal database e lo formatta
     * come l'oggetto carrello della sessione.
     * @param {number} userId L'ID dell'utente.
     * @returns {Promise<object>} L'oggetto carrello.
     */
    async getCartByUserId(userId) {
        const sql = 'SELECT * FROM cart_items WHERE user_id = ?';
        return new Promise((resolve, reject) => {
            db.all(sql, [userId], async (err, rows) => {
                if (err) return reject(err);

                const cart = { items: {}, totalQty: 0, totalPrice: 0 };
                if (!rows) return resolve(cart);

                for (const row of rows) {
                    const product = await prodottiDao.getProductById(row.product_id);
                    // --- INIZIO MODIFICA ---
                    // Se il prodotto esiste ancora nel DB (non è stato eliminato fisicamente)...
                    if (product) {
                        const itemPrice = product.prezzo_scontato || product.prezzo;
                        cart.items[product.id] = {
                            item: product, // L'oggetto 'item' contiene lo stato ('disponibile', 'venduto', ecc.)
                            qty: row.quantity,
                            price: itemPrice * row.quantity
                        };
                        // ...ma aggiungilo al totale solo se è effettivamente disponibile per l'acquisto.
                        if (product.stato === 'disponibile') {
                            cart.totalQty += row.quantity;
                            cart.totalPrice += itemPrice * row.quantity;
                        }
                    }
                    // --- FINE MODIFICA ---
                }
                resolve(cart);
            });
        });
    }

    /**
     * Aggiunge un prodotto al carrello di un utente nel database.
     * @param {number} userId L'ID dell'utente.
     * @param {number} productId L'ID del prodotto.
     */
    addToCart(userId, productId) {
        // Usiamo INSERT OR IGNORE per evitare errori se l'articolo è già presente
        const sql = 'INSERT OR IGNORE INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)';
        return new Promise((resolve, reject) => {
            db.run(sql, [userId, productId], function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }

    /**
     * Rimuove un prodotto dal carrello di un utente.
     * @param {number} userId L'ID dell'utente.
     * @param {number} productId L'ID del prodotto.
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
     * Svuota il carrello di un utente dopo un acquisto.
     * @param {number} userId L'ID dell'utente.
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
     * Unisce il carrello della sessione (ospite) con il carrello del database (utente loggato).
     * @param {number} userId L'ID dell'utente.
     * @param {object} sessionCart Il carrello dalla sessione.
     */
    async mergeSessionCart(userId, sessionCart) {
        if (!sessionCart || !sessionCart.items) return;

        const promises = Object.keys(sessionCart.items).map(productId => {
            return this.addToCart(userId, productId);
        });

        await Promise.all(promises);
    }
}

module.exports = new CartDAO();