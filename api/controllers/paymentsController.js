// Importazione del model dei pagamenti
const paymentsModel = require('../models/paymentsModels');

// Controller per aggiungere un nuovo metodo di pagamento
const addPaymentMethod = async (req, res) => {
    try {
        const paymentData = req.body;
        const { userId, nomeTitolare, numeroCarta, dataScadenza, cvv } = paymentData;

        // Validazione dei campi obbligatori
        if (!userId || !nomeTitolare || !numeroCarta || !dataScadenza || !cvv) {
            return res.status(400).json({ error: "Tutti i campi sono obbligatori (userId, nomeTitolare, numeroCarta, dataScadenza, cvv)" });
        }

        const paymentId = await paymentsModel.addMetodoPagamento(paymentData);

        if (paymentId) {
            res.status(201).json({ 
                message: "Metodo di pagamento aggiunto con successo", 
                id: paymentId 
            });
        } else {
            res.status(500).json({ error: "Errore durante l'aggiunta del metodo di pagamento" });
        }

    } catch (error) {
        console.error("Errore nel controller dei pagamenti (addPaymentMethod):", error);
        res.status(500).json({ error: "Errore interno durante l'aggiunta del metodo di pagamento" });
    }
};

// Controller per ottenere i metodi di pagamento di un utente
const getPaymentMethodsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "ID Utente mancante" });
        }

        const methods = await paymentsModel.getMetodiByUserId(userId);

        if (!methods) {
            // Se non trova nulla, restituisce un array vuoto o 404
             return res.status(404).json({ message: "Nessun metodo di pagamento trovato per questo utente" });
        }
        
        res.status(200).json(methods);

    } catch (error) {
        console.error("Errore nel controller dei pagamenti (getPaymentMethodsByUserId):", error);
        res.status(500).json({ error: "Errore interno nel recupero dei metodi di pagamento" });
    }
};

// Controller per eliminare un metodo di pagamento
const deletePaymentMethod = async (req, res) => {
    try {
        const paymentId = req.params.id;
        // userId serve per verificare che l'utente stia cancellando il proprio metodo di pagamento
        const { userId } = req.body; 

        if (!paymentId || !userId) {
            return res.status(400).json({ error: "ID metodo di pagamento e UserID sono richiesti per l'eliminazione" });
        }

        const result = await paymentsModel.deleteMetodoPagamento(paymentId, userId);

        if (result) {
            res.status(200).json({ message: "Metodo di pagamento eliminato con successo" });
        } else {
            // Se il risultato è false o null potrebbe significare che non è stato trovato o non apparteneva all'utente
            res.status(404).json({ error: "Metodo di pagamento non trovato o non appartenente all'utente" });
        }

    } catch (error) {
        console.error("Errore nel controller dei pagamenti (deletePaymentMethod):", error);
        res.status(500).json({ error: "Errore interno durante l'eliminazione del metodo di pagamento" });
    }
};

module.exports = {
    addPaymentMethod,
    getPaymentMethodsByUserId,
    deletePaymentMethod
};
