const reviewModel = require('../models/reviewModels');

// Controller per aggiungere una nuova recensione
const createReview = async (req, res) => {
    try {
        const { userId, prodottoId, contenuto, valutazione } = req.body;

        // Validazione input
        if (!userId || !prodottoId || !valutazione) {
             return res.status(400).json({ error: "userId, prodottoId e valutazione sono campi obbligatori." });
        }
        
        // Validazione range valutazione (assumendo scala 1-5)
        if (valutazione < 1 || valutazione > 5) {
             return res.status(400).json({ error: "La valutazione deve essere compresa tra 1 e 5." });
        }

        const recensioneData = { userId, prodottoId, contenuto, valutazione };
        const recensioneId = await reviewModel.addRecensione(recensioneData);

        res.status(201).json({ message: "Recensione aggiunta con successo", id: recensioneId });
    } catch (error) {
        console.error("Errore nel controller createReview:", error);
        res.status(500).json({ error: "Errore durante l'aggiunta della recensione" });
    }
};

// Controller per ottenere le recensioni di un prodotto
const getProductReviews = async (req, res) => {
    try {
        const prodottoId = req.params.prodottoId;

        if (!prodottoId) {
            return res.status(400).json({ error: "ID prodotto mancante" });
        }

        const reviews = await reviewModel.getRecensioniByProdotto(prodottoId);
        
        // Se non ci sono recensioni, ritorna array vuoto
        res.json(reviews);
    } catch (error) {
        console.error("Errore nel controller getProductReviews:", error);
        res.status(500).json({ error: "Errore durante il recupero delle recensioni" });
    }
};

// Controller per ottenere la media delle valutazioni
const getProductRatingAverage = async (req, res) => {
    try {
        const prodottoId = req.params.prodottoId;

        if (!prodottoId) {
            return res.status(400).json({ error: "ID prodotto mancante" });
        }

        const result = await reviewModel.getMediaValutazioni(prodottoId);
        
        // Gestione del caso in cui non ci siano recensioni (result.media sarà null)
        const media = result && result.media ? result.media : 0;
        
        res.json({ media: media }); 
    } catch (error) {
        console.error("Errore nel controller getProductRatingAverage:", error);
        res.status(500).json({ error: "Errore durante il calcolo della media" });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    getProductRatingAverage
};
