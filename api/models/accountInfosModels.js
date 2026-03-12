const connectDB = require('../config/database');

// Funzione per ottenere i dettagli extra dell'account di un utente
const getAccountInfoByUserId = async (userId) => {
    try {
        const db = await connectDB();
        const result = await db.get('SELECT * FROM accountinfos WHERE user_id = ?', [userId]);
        return result;
    } catch (error) {
        console.error("Errore durante il recupero delle informazioni dell'account:", error);
        throw error;
    }
};

// Funzione per creare i dettagli extra per la prima volta
const createAccountInfo = async (infoData) => {
    try {
        const { userId, immagineProfilo, descrizione } = infoData;
        const db = await connectDB();
        await db.run(
            'INSERT INTO accountinfos (user_id, immagine_profilo, descrizione) VALUES (?, ?, ?)',
            [userId, immagineProfilo, descrizione]
        );
        return true;
    } catch (error) {
        console.error("Errore durante la creazione delle informazioni dell'account:", error);
        throw error;
    }
};

// Funzione per aggiornare la bio o la foto profilo
const updateAccountInfo = async (userId, newInfoData) => {
    try {
        const { immagineProfilo, descrizione } = newInfoData;
        const db = await connectDB();
        await db.run(
            'UPDATE accountinfos SET immagine_profilo = ?, descrizione = ? WHERE user_id = ?',
            [immagineProfilo, descrizione, userId]
        );
        return true;
    } catch (error) {
        console.error("Errore durante l'aggiornamento delle informazioni dell'account:", error);
        throw error;
    }
};

module.exports = {
    getAccountInfoByUserId,
    createAccountInfo,
    updateAccountInfo
};
