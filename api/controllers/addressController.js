//Importazione del DAO necessario
const addressModel = require('../models/addressModels');

//Funzione che inserisce un nuovo indirizzo per un utente
const addAddress = async (req, res) => {
    try {
        const { userId, indirizzo, citta, cap } = req.body;
        
        //Controllo che tutti i campi siano presenti
        if (!userId || !indirizzo || !citta || !cap) {
            return res.status(400).json({ error: "Tutti i campi (userId, indirizzo, citta, cap) sono obbligatori!" });
        }

        await addressModel.insertAddress({ userId, indirizzo, citta, cap });
        res.status(201).json({ message: "Indirizzo inserito con successo!" });
    } catch (error) {
        console.error("Errore nell'inserimento dell'indirizzo:", error);
        res.status(500).json({ error: "Errore durante l'inserimento dell'indirizzo" });
    }
};

//Funzione che aggiorna un indirizzo esistente
const editAddress = async (req, res) => {
    try {
        const { userId, indirizzo, citta, cap, id } = req.body;
        
        //Controllo che tutti i campi siano presenti
        if (!id || !userId || !indirizzo || !citta || !cap) {
            return res.status(400).json({ error: "Tutti i campi sono obbligatori per l'aggiornamento!" });
        }

        await addressModel.updateAddress({ userId, indirizzo, citta, cap, id });
        res.status(200).json({ message: "Indirizzo aggiornato con successo!" });
    } catch (error) {
        console.error("Errore nell'aggiornamento dell'indirizzo:", error);
        res.status(500).json({ error: "Errore durante l'aggiornamento dell'indirizzo" });
    }
};

//Funzione che elimina un indirizzo
const removeAddress = async (req, res) => {
    try {
        const { id, userId } = req.body; // Si presuppone che userId venga passato nel body (es. nascosto nel form o dalla sessione) e id indirizzo pure o via params
        
        if (!id || !userId) {
            return res.status(400).json({ error: "ID indirizzo e UserId sono richiesti!" });
        }

        await addressModel.deleteAddress(id, userId);
        res.status(200).json({ message: "Indirizzo eliminato con successo!" });
    } catch (error) {
        console.error("Errore nell'eliminazione dell'indirizzo:", error);
        res.status(500).json({ error: "Errore durante l'eliminazione dell'indirizzo" });
    }
};

//Funzione che ottiene tutti gli indirizzi di un utente
const getAddresses = async (req, res) => {
    try {
        const userId = req.params.userId; // Recupero userId dai parametri dell'URL
        
        if (!userId) {
            return res.status(400).json({ error: "UserId mancante!" });
        }

        const addresses = await addressModel.getAddressByUserId(userId);
        
        if (addresses) {
            res.status(200).json(addresses);
        } else {
            res.status(404).json({ message: "Nessun indirizzo trovato." });
        }
    } catch (error) {
        console.error("Errore nel recupero degli indirizzi:", error);
        res.status(500).json({ error: "Errore durante il recupero degli indirizzi" });
    }
};

module.exports = { addAddress, editAddress, removeAddress, getAddresses };
