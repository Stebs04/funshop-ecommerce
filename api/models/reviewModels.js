const connectDB = require('../config/database');

// Funzione per l'aggiunta di una nuova recensione
const addRecensione = async (recensioneData) => {
    try {
        const { userId, prodottoId, contenuto, valutazione } = recensioneData;
        const db = await connectDB();
        const result = await db.run(
            'INSERT INTO recensioni (contenuto, valutazione, user_id, prodotto_id) VALUES (?, ?, ?, ?)',
            [contenuto, valutazione, userId, prodottoId]
        );
        return result.lastID;
    } catch (error) {
        console.error("Errore durante l'aggiunta della recensione:", error);
        throw error;
    }
};

// Funzione per ottenere tutte le recensioni di un prodotto specifico
const getRecensioniByProdotto = async (prodottoId) => {
    try {
        const db = await connectDB();
        const recensioni = await db.all('SELECT * FROM recensioni WHERE prodotto_id = ?', [prodottoId]);
        return recensioni;
    } catch (error) {
        console.error("Errore durante il recupero delle recensioni:", error);
        throw error;
    }
};

// Funzione per calcolare la media delle valutazioni di un prodotto
const getMediaValutazioni = async (prodottoId) => {
    try {
        const db = await connectDB();
        // Faccio calcolare la media delle recensioni direttamente al database per ottimizzare le prestazioni.
        const result = await db.get('SELECT AVG(valutazione) AS media FROM recensioni WHERE prodotto_id = ?', [prodottoId]);
        return result;
    } catch (error) {
        console.error("Errore durante il calcolo della media delle valutazioni:", error);
        throw error;
    }
};

module.exports = {
    addRecensione,
    getRecensioniByProdotto,
    getMediaValutazioni
};
