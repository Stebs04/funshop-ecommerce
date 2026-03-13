// Importazione del model degli ordini
const orderModel = require('../models/orderModels');

// Funzione per creare un nuovo ordine
const createOrder = async (req, res) => {
    try {
        // Estrazione dei dati dal corpo della richiesta
        const { dataOrdine, totale, stato, userId } = req.body;

        // Validazione dei campi obbligatori
        if (!totale || !userId) {
            return res.status(400).json({ error: "I campi 'totale' e 'userId' sono obbligatori!" });
        }

        // Preparazione dell'oggetto ordine
        const orderInfo = {
            dataOrdine: dataOrdine || new Date().toISOString(), // Fallback a data ISO corrente se mancante
            totale,
            stato: stato || 'In elaborazione', // Stato di default se non fornito
            userId
        };

        // Chiamata al model per inserire l'ordine
        const orderId = await orderModel.createOrder(orderInfo);

        if (orderId) {
            res.status(201).json({ 
                message: "Ordine creato con successo!", 
                orderId: orderId 
            });
        } else {
            res.status(500).json({ error: "Errore durante la creazione dell'ordine." });
        }

    } catch (error) {
        console.error("Errore nel controller degli ordini (createOrder):", error);
        res.status(500).json({ error: "Errore interno del server durante la creazione dell'ordine." });
    }
};

// Funzione per ottenere tutti gli ordini di un utente dato il suo ID
const getOrdersByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Controllo che l'ID sia presente
        if (!userId) {
            return res.status(400).json({ error: "L'UserId è obbligatorio!" });
        }

        // Recupero degli ordini dal model
        const orders = await orderModel.getOrdiniByUserId(userId);

        if (!orders) {
            // Caso limite: dovrebbe ritornare []
            return res.status(404).json({ message: "Nessun ordine trovato per questo utente." });
        }
        res.status(200).json(orders);

    } catch (error) {
        console.error("Errore nel controller degli ordini (getOrdersByUserId):", error);
        res.status(500).json({ error: "Errore durante il recupero degli ordini." });
    }
};

module.exports = {
    createOrder,
    getOrdersByUserId
};
