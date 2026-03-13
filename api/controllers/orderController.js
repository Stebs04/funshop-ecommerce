// Importazione del model degli ordini
const orderModel = require('../models/orderModels');
const userModel = require('../models/utentiModels');
const mailer = require('../service/emailService');

// Funzione per creare un nuovo ordine
const createOrder = async (req, res) => {
    try {
        // Estrazione dei dati dal corpo della richiesta
        const { dataOrdine, totale, stato, userId, prodotti} = req.body;

        // Validazione dei campi obbligatori: verifico che totale e userId siano presenti
        if (!totale || !userId || !prodotti || prodotti.length === 0) {
            return res.status(400).json({ error: "I campi 'totale', 'userId' e l'array dei prodotti sono obbligatori!" });
        }

        // Preparazione dell'oggetto ordine con valori di default se necessario
        const orderInfo = {
            dataOrdine: dataOrdine || new Date().toISOString(), // Fallback a data ISO corrente se mancante
            totale,
            stato: stato || 'In elaborazione', // Stato di default se non fornito
            userId
        };

        // Chiamata al model per inserire il nuovo ordine nel database
        const orderId = await orderModel.createOrder(orderInfo);

        if (orderId) {
            // Se l'ordine è stato creato con successo, cerco l'utente per inviare l'email di conferma
            const user = await userModel.findUserById(userId);
            
            // Se l'utente esiste e ha un'email, procedo con l'invio della conferma
            if(user && user.email){
                // Preparo i dettagli dell'ordine per l'email
                // Nota: l'array prodotti è attualmente vuoto, andrebbe popolato con i dettagli reali del carrello
                const orderDetails = {
                    orderId: orderId,
                    totale: orderInfo.totale,
                    prodotti: prodotti 
                }
               try{ 
                // Invio l'email di riepilogo in modo asincrono
                await mailer.sendOrderSummary(user.email, orderDetails);
            } catch(error){
                // Log dell'errore email, ma non blocco la risposta di successo dell'ordine
                console.error("Errore nell'invio della mail:", error);
            }
            }
            
            // Rispondo al client con successo e l'ID del nuovo ordine
            res.status(201).json({ 
                message: "Ordine creato con successo!", 
                orderId: orderId 
            });
        } else {
            // Gestione del caso in cui il model non restituisca un ID valido
            res.status(500).json({ error: "Errore durante la creazione dell'ordine." });
        }

    } catch (error) {
        // Gestione globale degli errori durante l'esecuzione del controller
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

// Funzione per ottenere un singolo ordine tramite l'ID
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Controllo che l'ID sia presente
        if (!orderId) {
            return res.status(400).json({ error: "L'OrderId è obbligatorio!" });
        }

        // Recupero l'ordine dal model
        const order = await orderModel.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Ordine non trovato." });
        }
        res.status(200).json(order);

    } catch (error) {
        console.error("Errore nel controller degli ordini (getOrderById):", error);
        res.status(500).json({ error: "Errore durante il recupero dell'ordine." });
    }
};

module.exports = {
    createOrder,
    getOrdersByUserId,
    getOrderById
};
