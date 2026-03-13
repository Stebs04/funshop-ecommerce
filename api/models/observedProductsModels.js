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
        const result = await db.all("SELECT p.*, u.username as nome_venditore, o.prezzo_osservato, o.notifica_letta FROM prodotti p JOIN observed_products o ON p.id = o.product_id JOIN users u ON p.user_id = u.id WHERE o.user_id = ?", [userId]);
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

//Funzione che notifica un cambio di prezzo
const flagPriceChange = async(productId) =>{
    try{
        const db = await connectDB();
        await db.run(
            'UPDATE observed_products SET notifica_letta = 0 WHERE product_id = ?',
            [productId]
        );
        return true;
    }catch(error){
        console.error("Errore durante l'aggiornamento del campo notifica:", error);
        throw error;
    }
}

//Funzione che resetta notifica letta quando un utente la visiona
const markNotificationAsRead = async(userId) =>{
    try{
        const db = await connectDB();
        await db.run(
            "UPDATE observed_products SET notifica_letta = 1, prezzo_osservato = (SELECT COALESCE(prezzo_scontato, prezzo) FROM prodotti WHERE prodotti.id = observed_products.product_id) WHERE user_id = ? AND notifica_letta = 0",
            [userId]
        );
        return true;
    }catch(error){
        console.error("Errore durante l'aggiornamento", error);
        throw error;
    }
}

module.exports = {
    addObservedProduct,
    getObservedByUserId,
    removeObservedProduct,
    flagPriceChange,
    markNotificationAsRead
};
