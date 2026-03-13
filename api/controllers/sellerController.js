const sellerModel = require('../models/sellersModels');

// Funzione per registrare un nuovo venditore (Apri il negozio)
const createSeller = async (req, res) => {
    try {
        const { userId, nomeNegozio, partitaIva, emailContatto, iban, descrizione } = req.body;

        // Validazione: controlla che i campi obbligatori siano presenti
        if (!userId || !nomeNegozio || !partitaIva || !emailContatto || !iban) {
            return res.status(400).json({ error: "Tutti i campi obbligatori devono essere compilati." });
        }

        const sellerData = { userId, nomeNegozio, partitaIva, emailContatto, iban, descrizione };
        const newSellerId = await sellerModel.becomeSeller(sellerData);
        
        res.status(201).json({ message: "Negozio creato con successo!", sellerId: newSellerId });
    } catch (error) {
        console.error("Errore durante la creazione del venditore:", error);
        res.status(500).json({ error: "Errore durante la creazione del negozio." });
    }
};

// Funzione per ottenere le informazioni del venditore tramite User ID
const getSellerByUserId = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!userId) {
            return res.status(400).json({ error: "L'ID utente è obbligatorio." });
        }

        const seller = await sellerModel.getSellerByUserId(userId);
        
        if (seller) {
            res.json(seller);
        } else {
            res.status(404).json({ error: "Venditore non trovato per questo utente." });
        }
    } catch (error) {
        console.error("Errore nel recupero del venditore:", error);
        res.status(500).json({ error: "Errore nel recupero delle informazioni del venditore." });
    }
};

// Funzione per aggiornare le informazioni del venditore
const updateSeller = async (req, res) => {
    try {
        const userId = req.params.id;
        const { nomeNegozio, partitaIva, emailContatto, iban, descrizione } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "L'ID utente è obbligatorio." });
        }

        const newSellerData = { nomeNegozio, partitaIva, emailContatto, iban, descrizione };
        
        await sellerModel.updateSellerInfo(userId, newSellerData);
        
        res.json({ message: "Informazioni del negozio aggiornate con successo." });
    } catch (error) {
        console.error("Errore durante l'aggiornamento del venditore:", error);
        res.status(500).json({ error: "Errore durante l'aggiornamento delle informazioni del negozio." });
    }
};

module.exports = {
    createSeller,
    getSellerByUserId,
    updateSeller
};
