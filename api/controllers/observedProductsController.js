const observedProductsModel = require('../models/observedProductsModels');

// Controller per ottenere i prodotti osservati da un utente
const getObservedProducts = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: "ID utente mancante" });
        }
        
        const products = await observedProductsModel.getObservedByUserId(userId);
        await observedProductsModel.markNotificationAsRead(userId);
        res.status(200).json(products);
    } catch (error) {
        console.error("Errore nel recupero dei prodotti osservati:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};

// Controller per aggiungere un prodotto ai preferiti (osservati)
const addObservedProduct = async (req, res) => {
    try {
        const { userId, productId, prezzoOsservato } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ error: "Dati mancanti (userId, productId)" });
        }

        await observedProductsModel.addObservedProduct({ userId, productId, prezzoOsservato });
        
        res.status(201).json({ message: "Prodotto aggiunto ai preferiti con successo" });
    } catch (error) {
        console.error("Errore nell'aggiunta del prodotto ai preferiti:", error);
        res.status(500).json({ error: "Errore durante l'aggiunta ai preferiti" });
    }
};

// Controller per rimuovere un prodotto dai preferiti
const removeObservedProduct = async (req, res) => {
    try {
        // Recupero userId e productId dai parametri dell'URL
        // Assumo che la rotta sia definita come /:userId/:productId o simile
        const { userId, productId } = req.params;

        if (!userId || !productId) {
            return res.status(400).json({ error: "ID utente o ID prodotto mancanti" });
        }

        await observedProductsModel.removeObservedProduct(userId, productId);
        
        res.status(200).json({ message: "Prodotto rimosso dai preferiti con successo" });
    } catch (error) {
        console.error("Errore nella rimozione del prodotto dai preferiti:", error);
        res.status(500).json({ error: "Errore durante la rimozione dai preferiti" });
    }
};

module.exports = {
    getObservedProducts,
    addObservedProduct,
    removeObservedProduct
};
