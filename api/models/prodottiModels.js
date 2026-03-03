//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

//Implementazione del funzione per estrarre tutti i prodotti
const findAll = async () => {
    const db = await connectDB(); //Sospende l'esecuzione finchè non è connesso al database
    const prodotti = await db.all('SELECT * FROM prodotti'); //Esegue la query SQL per selezionare tutti i prodotti
    return prodotti; // Restituisce l'array dei prodotti
};

//Esportazione del Model
module.exports = {findAll};