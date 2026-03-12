//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

//Funzione che inserisce un nuovo indirizzo per un utente
const insertAddress = async(addressInfos) =>{
    try{
        const db = await connectDB();
        const {userId, indirizzo, citta, cap} = addressInfos
        await db.run("INSERT INTO indirizzi (user_id, indirizzo, citta, cap) VALUES (?,?,?,?)", [userId, indirizzo, citta, cap]);
        return true;
    }catch(error){
        console.error("Impossibile inserire l'indirizzo nel DB!!!", error);
        throw error;
    }
};

//Funzione che aggiorna i campi di un indirizzo
const updateAddress = async(addressInfos) =>{
      try{
        const db = await connectDB();
        const {userId, indirizzo, citta, cap, id} = addressInfos
        await db.run("UPDATE indirizzi SET indirizzo=? , citta=?, cap=? WHERE id = ? AND user_id = ?", [indirizzo, citta, cap,id,userId]);
        return true;
    }catch(error){
        console.error("Impossibile aggiornare l'indirizzo nel DB!!!", error);
        throw error;
    }
};

//Funzione che elimina l'indirizzo di un utente
const deleteAddress = async(id, userId) =>{
      try{
        const db = await connectDB();
        await db.run("DELETE FROM indirizzi WHERE id = ? AND user_id = ?", [id, userId]);
        return true;
    }catch(error){
        console.error("Impossibile eliminare l'indirizzo nel DB!!!", error);
        throw error;
    }
};

//Funzione che carica tutti gli indirizzi di un utente
const getAddressByUserId = async(userId) =>{
    try{
        const db = await connectDB();
        return await db.all("SELECT * FROM indirizzi WHERE user_id = ?", [userId]);
    }catch(error){
        console.error("Impossibile caricare gli indirizzi!!!", error);
        throw error;
    }
}

module.exports = {insertAddress, updateAddress, deleteAddress, getAddressByUserId};