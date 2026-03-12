const connectDB = require('../config/database');

// Funzione per aggiungere un prodotto ai preferiti (osservati)
const addObservedProduct = async (osservatoData) => {
    try {
        const { userId, productId, prezzoOsservato } = osservatoData;
        const db = await connectDB();
        await db.run(
            'INSERT INTO observed_products (user_id, product_id, prezzo_osservato) VALUES (?, ?, ?)',
            [userId, productId, prezzoOsservato]
        );
        return true;
    } catch (error) {
        console.error("Errore durante l'aggiunta del prodotto ai preferiti:", error);
        throw error;
    }
};

// Funzione per ottenere tutti i prodotti osservati da un utente
const getObservedByUserId = async (userId) => {
    try {
        const db = await connectDB();
        const result = await db.all('SELECT * FROM observed_products WHERE user_id = ?', [userId]);
        return result;
    } catch (error) {
        console.error("Errore durante il recupero della lista dei preferiti:", error);
        throw error;
    }
};

// Funzione per rimuovere un prodotto dai preferiti
const removeObservedProduct = async (userId, productId) => {
    try {
        const db = await connectDB();
        await db.run(
            'DELETE FROM observed_products WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return true;
    } catch (error) {
        console.error("Errore durante la rimozione del prodotto dai preferiti:", error);
        throw error;
    }
};

module.exports = {
    addObservedProduct,
    getObservedByUserId,
    removeObservedProduct
};
