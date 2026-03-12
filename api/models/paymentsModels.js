const connectDB = require('../config/database');

// Funzione per l'aggiunta di una nuova carta di credito
const addMetodoPagamento = async (metodoData) => {
    try {
        const { userId, nomeTitolare, numeroCarta, dataScadenza, cvv } = metodoData;
        const db = await connectDB();
        const result = await db.run(
            'INSERT INTO metodi_pagamento (user_id, nome_titolare, numero_carta, data_scadenza, cvv) VALUES (?, ?, ?, ?, ?)',
            [userId, nomeTitolare, numeroCarta, dataScadenza, cvv]
        );
        return result.lastID; // Restituisce l'ID assegnato alla nuova carta
    } catch (error) {
        console.error("Errore durante l'aggiunta del metodo di pagamento:", error);
        throw error;
    }
};

// Funzione per ottenere tutti i metodi di pagamento di un utente (Apri il portafoglio)
const getMetodiByUserId = async (userId) => {
    try {
        const db = await connectDB();
        const result = await db.all('SELECT * FROM metodi_pagamento WHERE user_id = ?', [userId]);
        return result;
    } catch (error) {
        console.error("Errore durante il recupero dei metodi di pagamento:", error);
        throw error;
    }
};

// Funzione per eliminare un metodo di pagamento (Taglia la carta)
const deleteMetodoPagamento = async (id, userId) => {
    try {
        const db = await connectDB();
        // Trappola di sicurezza: verifica che l'utente sia proprietario della carta prima di cancellarla
        await db.run('DELETE FROM metodi_pagamento WHERE id = ? AND user_id = ?', [id, userId]);
        return true;
    } catch (error) {
        console.error("Errore durante l'eliminazione del metodo di pagamento:", error);
        throw error;
    }
};

module.exports = {
    addMetodoPagamento,
    getMetodiByUserId,
    deleteMetodoPagamento
};
