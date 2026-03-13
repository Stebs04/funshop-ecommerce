//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

const createOrder = async(Orderinfo) =>{
    try{
        const db = await connectDB();
        const {dataOrdine, totale, stato, userId} = Orderinfo;
        //Inserisco nello storico degli ordine un nuovo ordine
        const result = await db.run("INSERT INTO storico_ordini (data_ordine, totale, stato, user_id) VALUES (?,?,?,?)", [dataOrdine, totale, stato, userId]);
        return result.lastID; //ritorno l'id dell'ordine così da averlo per eventuali usi
    }
    catch(error){
        console.error("Impossibile inserire ordine nello storico degli ordini!!", error);
        throw error;
    }
};

//Funzione che seleziona tutti gli ordini di un utente
const getOrdiniByUserId = async(userId) =>{
    try{
        const db = await connectDB();
        //Carico tutti gli ordini di un utente
        return await db.all("SELECT * FROM storico_ordini WHERE user_id = ?",[userId]);
    }catch(error){
        console.error("Impossibile caricare gli ordini!!", error);
        throw error;
    }
}

module.exports ={createOrder, getOrdiniByUserId}