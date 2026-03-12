//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

//Funzione che inserisce un prodotto nel carrello
const insert = async(productInfo) =>{
    try{
        const db = await connectDB();
        const {userId, productId, quantity} = productInfo;
        //Inserisco un prodotto nel carrello
        await db.run("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?,?,?)", [userId, productId, quantity]);
        return true;
    }
    catch(error){
        console.error("Impossibile aggiungere il prodotto al carrello!!!", error);
        throw error;
    }
};

//Funzione che dato lo stesso prodotto cambia solo la quantita
const updateQuantity = async(productInfo) => {
    try{
        const db = await connectDB();
        const {userId, productId, quantity} = productInfo;
        //Aggiorno la quantità di un prodotto
        await db.run("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?", [quantity,userId,productId]);
        return true;
    }
    catch(error){
        console.error("Impossibile cambiare la quantità del prodotto!!!", error);
        throw error;
    }
}

//Funzione che rimuove un articolo dal carrello
const remove = async(userId, productId) =>{
     try{
        const db = await connectDB();
        //Cancello un prodotto dal carrello
        await db.run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [userId,productId]);
        return true;
    }
    catch(error){
        console.error("Impossibile cancellare il prodotto!!!", error);
        throw error;
    }
}

//Funzione che seleziona tutti i prodotti di un singolo utente
const findByUserId = async(userId) =>{
    try{
        const db = await connectDB();
        //Carico tutti i prodotti di un singolo utente
        return await db.all("SELECT * FROM cart_items WHERE user_id = ?", [userId]);
    }
    catch(error){
        console.error("Impossibile caricare i prodotti!!!", error);
        throw error;
    }
}

//Funzione che ritorna un singolo oggetto nel carrello
const findProduct = async(userId, productId) =>{
     try{
        const db = await connectDB();
        //Carico il prodotto
        return await db.get("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [userId, productId]);
    }
    catch(error){
        console.error("Impossibile caricare il prodotto!!!", error);
        throw error;
    }
}

//Esportazione del Model
module.exports = {insert, updateQuantity, remove, findByUserId, findProduct};