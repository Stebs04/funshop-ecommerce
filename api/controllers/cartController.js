//Importazione del DAO del carrello
const cartModel = require('../models/cartModels');


//Controller per ottenere il contenuto del carrello di un utente
const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: "ID utente mancante" });
        }
        //Chiama la funzione findByUserId del DAO
        const cart = await cartModel.findByUserId(userId);
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nel recupero del carrello" });
    }
};

//Controller per aggiungere un prodotto al carrello
const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || !quantity) {
            return res.status(400).json({ error: "Dati mancanti (userId, productId, quantity)" });
        }

        //Controllo che la quantità sia un numero, se non lo è blocco l'esecuzione
        if(isNaN(quantity)){
              return res.status(400).json({error: "La quantità deve essere un numero!!"});
        }

        //Controllo se il prodotto è già presente nel carrello
        const existingProduct = await cartModel.findProduct(userId, productId);

        if (existingProduct) {
            //Se esiste, aggiorno la quantità sommando quella nuova
            const newQuantity = existingProduct.quantity + parseInt(quantity);
            await cartModel.updateQuantity({ userId, productId, quantity: newQuantity });
            res.status(200).json({ message: "Quantità aggiornata nel carrello" });
        } else {
            //Se non esiste, lo inserisco
            await cartModel.insert({ userId, productId, quantity });
            res.status(201).json({ message: "Prodotto aggiunto al carrello" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nell'aggiunta al carrello" });
    }
};

//Controller per aggiornare specificamente la quantità (es. modifica nel carrello)
const updateCartItem = async (req, res) => {
    try {
        //Recupero le informazioni dal corpo della richiesta
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || quantity === undefined) {
             return res.status(400).json({ error: "Dati mancanti per l'aggiornamento" });
        }

        //Aggiorno la quantità nel DB
        await cartModel.updateQuantity({ userId, productId, quantity });
        res.json({ message: "Carrello aggiornato con successo" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nell'aggiornamento del carrello" });
    }
};

//Controller per rimuovere un prodotto dal carrello
const removeFromCart = async (req, res) => {
    try {
        //Recupero userId e productId dai parametri dell'URL
        const { userId, productId } = req.params;

        if (!userId || !productId) {
            return res.status(400).json({ error: "ID utente o prodotto mancanti" });
        }

        //Rimuovo il prodotto
        await cartModel.remove(userId, productId);
        res.json({ message: "Prodotto rimosso dal carrello" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nella rimozione del prodotto" });
    }
};

//Funzione che notifica all'utente

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
