const connectDB = require('../config/database');

// Funzione per registrare un nuovo venditore (Apri il negozio)
const becomeSeller = async (sellerData) => {
    try {
        const { userId, nomeNegozio, partitaIva, emailContatto, iban, descrizione } = sellerData;
        const db = await connectDB();
        const result = await db.run(
            'INSERT INTO venditori (user_id, nome_negozio, partita_iva, email_contatto, iban, descrizione) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, nomeNegozio, partitaIva, emailContatto, iban, descrizione]
        );
        return result.lastID; // Restituisce l'ID del nuovo negozio
    } catch (error) {
        console.error("Errore durante la registrazione del venditore:", error);
        throw error;
    }
};

// Funzione per ottenere le informazioni del negozio di un utente (Visita il negozio)
const getSellerByUserId = async (userId) => {
    try {
        const db = await connectDB();
        const seller = await db.get('SELECT * FROM venditori WHERE user_id = ?', [userId]);
        return seller;
    } catch (error) {
        console.error("Errore durante il recupero dei dati del venditore:", error);
        throw error;
    }
};

// Funzione per aggiornare le informazioni del negozio (Ristruttura il negozio)
const updateSellerInfo = async (userId, newSellerData) => {
    try {
        const { nomeNegozio, partitaIva, emailContatto, iban, descrizione } = newSellerData;
        const db = await connectDB();
        await db.run(
            'UPDATE venditori SET nome_negozio = ?, partita_iva = ?, email_contatto = ?, iban = ?, descrizione = ? WHERE user_id = ?',
            [nomeNegozio, partitaIva, emailContatto, iban, descrizione, userId]
        );
        return true;
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati del venditore:", error);
        throw error;
    }
};

module.exports = {
    becomeSeller,
    getSellerByUserId,
    updateSellerInfo
};
