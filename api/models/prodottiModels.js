//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

//Implementazione del funzione per estrarre tutti i prodotti
const findAll = async () => {
    try
    {
        const db = await connectDB(); //Sospende l'esecuzione finchè non è connesso al database
        return await db.all('SELECT * FROM prodotti', []); //Esegue la query SQL per selezionare tutti i prodotti
    }catch(error){
        console.error("Impossibile recuperare i prodotti", error);
        throw error;
    }
};

//Funzione che restituisce un singolo prodotto tramite il suo id
const findProductById = async(id) =>{
    try{
        const db = await connectDB();
        return await db.get("SELECT * FROM prodotti WHERE id = ?", [id]); //Restuisco il prodotto corrispondente
    }catch(error){
        console.error("Impossibile recuperare il prodotto", error);
        throw error;
    }
}

//Funzione che restuisce tutti i prodotti di un singolo utente
const findByUserId = async (userId) => {
    try
    {
        const db = await connectDB(); //Sospende l'esecuzione finchè non è connesso al database
        return await db.all('SELECT * FROM prodotti WHERE user_id = ?', [userId]); //Esegue la query SQL per selezionare tutti i prodotti di un singolo utente
    }catch(error){
        console.error("Impossibile recuperare i prodotti per questo utente", error);
        throw error;
    }
};

//Funzione per la ricerca di prodotti tramite la barra di ricerca
const searchByName = async(research) =>{
    try{
        const db = await connectDB();
        return await db.all("SELECT * FROM prodotti WHERE nome LIKE ?", ['%' + research + '%']); //Restituisco il prodotto che contiene la parola
    }catch(error){
        console.error("Nessun prodotto trovato con la parola inserita!!", error);
        throw error;
    }
};

//Funzione per l'inserimento di nuovi prodotti nel sistema
const createProduct = async(productData) =>{
    try{
        const db = await connectDB();
        const {nome, descrizione, condizione, parolaChiave, percorsoImmagine, prezzo, userID} = productData;
        //Inserimento nel db di un nuovo prodotto
        await db.run("INSERT INTO prodotti (nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, user_id) VALUES(?,?,?,?,?,?,?)", [nome, descrizione, condizione, parolaChiave, percorsoImmagine, prezzo, userID]);
        return true;
    }catch(error){
        console.error("Impossibile inserire il prodotto", error);
        throw error;
    }
};

//Funzione per aggiornare le informazioni di un prodotto tramite il suo id
const updateById = async(id, newProductData) =>{
    try{
        const db = await connectDB();
         const {nome, descrizione, condizione, parolaChiave, percorsoImmagine} = newProductData;
        //aggiornamento dei campi del prodotto
        await db.run("UPDATE prodotti SET nome = ?, descrizione = ?, condizione = ?, parola_chiave = ?, percorso_immagine = ? WHERE id = ?", [nome, descrizione, condizione, parolaChiave, percorsoImmagine, id]);
        return true;
    }catch(error){
        console.error("Impossibile aggiornare il prodotto", error);
        throw error;
    }
}

//Funzione che permette all'utente che ha caricato il prodotto di modificarlo
const updateByUserId = async(id,userId, newProductData) =>{
    try{
        const db = await connectDB();
         const {nome, descrizione, condizione, parolaChiave, percorsoImmagine} = newProductData;
        //aggiornamento dei campi del prodotto
        await db.run("UPDATE prodotti SET nome = ?, descrizione = ?, condizione = ?, parola_chiave = ?, percorso_immagine = ? WHERE id = ? AND user_id = ?", [nome, descrizione, condizione, parolaChiave, percorsoImmagine,id,userId]);
        return true;
    }catch(error){
        console.error("Impossibile aggiornare il prodotto", error);
        throw error;
    }
}

//Funzione che cancella un prodotto tramirte il suo id
const deleteProduct = async(id) =>{
    try{
        const db = await connectDB();
        //Eseguo la cancellazione del prodotto!!!
        await db.run("DELETE FROM prodotti WHERE id = ?", [id]);
        return true;
    }catch(error){
         console.log("Impossibile eliminare il prodotto!!", error);
        throw error;
    }
}

//Funzione che permette solo all'utente che ha caricato il prodotto di cancellarlo!!!!
const deleteByUserId = async(id, userId) =>{
    try{
        const db = await connectDB();
        //Eseguo la cancellazione del prodotto!!!
        await db.run("DELETE FROM prodotti WHERE id = ? AND user_id = ?", [id,userId]);
        return true;
    }catch(error){
         console.log("Impossibile eliminare il prodotto!!", error);
        throw error;
    }
}



//Funzione per aggiornare solamente il prezzo scontato di un prodotto tramite il suo id
const updateDiscountedPriceById = async(id, prezzoScontato) =>{
    try{
        const db = await connectDB();
        //aggiornamento del campo prezzo_scontato
        await db.run("UPDATE prodotti SET prezzo_scontato = ? WHERE id = ?", [prezzoScontato, id]);
        return true;
    }catch(error){
        console.error("Impossibile aggiornare il prezzo scontato del prodotto", error);
        throw error;
    }
}



//Funzione che mostra il prezzo scontato invece del prezzo normale
const findProductByIdWithDiscount = async(id) =>{
    try{
        const db = await connectDB();
        return await db.get("SELECT id, nome, descrizione, condizione, parola_chiave, percorso_immagine, COALESCE(prezzo_scontato, prezzo) as prezzo, user_id FROM prodotti WHERE id = ?", [id]);
    }catch(error){
        console.error("Impossibile recuperare il prodotto con prezzo scontato", error);
        throw error;
    }
}

//Funzione che restituisce tutti i prodotti mostrando il prezzo scontato al posto del prezzo normale del singolo prodotto
const findAllWithDiscount = async() =>{
    try{
        const db = await connectDB();
        return await db.all("SELECT id, nome, descrizione, condizione, parola_chiave, percorso_immagine, COALESCE(prezzo_scontato, prezzo) as prezzo, user_id FROM prodotti");
    }catch(error){
        console.error("Impossibile recuperare i prodotti con prezzo scontato", error);
        throw error;
    }
}

//Esportazione del Model
module.exports = {findAll, findProductById, searchByName, createProduct, updateById, updateByUserId, deleteProduct, deleteByUserId, findByUserId, updateDiscountedPriceById, findProductByIdWithDiscount, findAllWithDiscount};