//DAO per tutte le operazioni con l'utente

//Importazione del modulo per la connessione al database
const connectDB = require('../config/database');

//Funzione che recupera un utente tramite email
//Passo l'email che server per il recupero dell'utente
const findUserByEmail = async(email) => {
    try{
        const db = await connectDB();
        //Eseguo la ricerca dell'utente mediante la mail
        return await db.get("SELECT * FROM users WHERE email = ?", [email]);
    } catch(error){
        console.error("Errore recupero utente:", error);
        throw error;
    }
};

//Funzione che registra un nuovo utente
//Gli passo userData che è un oggetto contente tutte le informazioni recuperate in fase di registrazione
const createUser = async(userData) =>{
    try{
        const db = await connectDB();
        //Estraggo i valori dall'oggetto userData
        const {username, nome, cognome, email, password, dataNascita} = userData;
        //Eseguo l'inserimento dell'utente con i dati contenuti in userData
        await db.run("INSERT INTO users (username, nome, cognome, email, password, data_nascita) VALUES (?,?,?,?,?,?)", 
           [username, nome, cognome, email, password, dataNascita]);
        return true;
    }catch(error){
        console.error("Errore creazione utente:", error);
        throw error;
    }
};


//Funzione che recupera l'utente tramite il suo id
const findUserById = async(id) =>{
    try{
        const db = await connectDB();
        return await db.get("SELECT * FROM users WHERE id = ?", [id]); //Ritorno l'utente con id corrispondente
    }
    catch(error){
        console.error("Errore recupero utente:", error);
        throw error;
    }
};

//Funzione che aggiorna le informazioni di un Utente
//Gli passo l'id dell'utente di cui si vuole aggiornare le informazioni e l'oggetto newData con le informazioni da sovvrascrivere
const updateUser = async(id, newData) =>{
    try{
        const db = await connectDB();
        const {username, nome, cognome, email, password, dataNascita} = newData;
        //Eseguo l'update dei dati dell'utente
        await db.run("UPDATE users SET username = ?, nome = ?, cognome = ?, email = ?, password_hashata = ?, data_nascita = ? WHERE id = ?", [username, nome,cognome,email,password, dataNascita,id]);
        return true;
    }catch(error){
        console.error("Impossibile aggiornare le informazioni!!!", error)
        throw(error);
    }
};

//Funzione che elimina un Utente dal sistema
//Gli passo l'id dell'utente da cancellare
const deleteUserById = async(id) =>{
    try{
        const db = await connectDB();
        //Eseguo la cancellazione dell'utente
        await db.run("DELETE FROM users WHERE id = ?", [id]); 
        return true;
    }catch(error){
        console.error("Impossibile eliminare l'utente!!", error);
        throw error;
    }
};

//Funzione che ritorna tutti gli utenti salvati nel db
const findAllUsers = async()=>{
    try{
        const db = await connectDB();
        return db.all("SELECT * FROM users", []);
    }catch(error){
         console.error("Impossibile recuperare tutti gli utenti!!", error);
        throw error;
    }
}


module.exports = {findUserByEmail, createUser, findUserById, updateUser, deleteUserById, findAllUsers};