//Importazione del DAO dei prodotti
const utentiModel = require('../models/utentiModels');
//Importazione di bcrypt per l'hashing delle password
const bcrypt = require('bcrypt');

//Funzione che estrae tutti gli utenti
const getAllUsers = async(req, res) =>{
    try{
        const results = await utentiModel.getAllUsers();
        if(!results){
            return res.status(404).json({error: "Nessun Utente trovato!!"});
        }
        else{
            res.json(results);
        }
    } catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nel recupero dell'utente!!"});
    }
}

//Funzione che ritorna un utente tramite la sua mail
const getUserByEmail = async(req, res) =>{
    try{
        const email = req.body
        //Controllo che il campo email non sia vuoto
        if(Object.keys(email).length === 0){
            return res.status(400).json({errore: "Il campo email non è opzionale!!"});
        }
        const results = await utentiModel.findUserByEmail(email);
        //Controllo che effettivamente mi sia stato ritornato qualcosa
        if(results){
            res.json(results);
        }else{
            res.status(404).json({error: "Nessun utente trovato!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Errore durante la ricerca dell'utente"});
    }
}


//Funzione che ritorna un utente tramite il suo id
const getUserById = async(req, res) =>{
    try{
        const id = req.params.id
        //Controllo che il campo email non sia vuoto
        if(!id){
            return res.status(400).json({error: "L'UserId è assente!!"});
        }
        const results = await utentiModel.findUserById(id);
        //Controllo che effettivamente mi sia stato ritornato qualcosa
        if(results){
            res.json(results);
        }else{
            res.status(404).json({error: "Nessun utente trovato!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Errore durante la ricerca dell'utente"});
    }
}

//Funzione che permette di modificare i dati all'utente stesso e a nessun altro oltre a lui e l'admin
const updateUser = async(req, res) =>{
    try{
        //Controllo che ci sia l'id
        const id = req.params.id;
        if(!id){
            return res.status(400).json({error: "L'UserId è assente!!"})
        }
        //Controllo che tutti i campi siano stati compilati
        const newInfos = req.body;
        if(Object.keys(newInfos).length === 0){
             return res.status(400).json({error: "Dati dell'utente mancanti!!!"})
        }
        const pwd = newInfos.password;
        if(pwd){ 
            //Hashing della password
            const passwordCriptata = await bcrypt.hash(pwd, 10); //Uso un salt di 10
            newInfos.password = passwordCriptata;
        }
        const results = await utentiModel.updateUser(id, newInfos);
        //Controllo che tutto sia andato a buon fine
        if(results){
            res.status(200).json({message: "Aggiornamento campi utente avvenuto con successo!!"});
        }else{
            res.status(404).json({error:"Nessun Utente trovato!!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Errore durante l'aggiornamento dei valori dell'utente"});
    }
}

//Funzione che permette l'eliminazione dell'account all'utente stesso e a nessun'altro oltre a lui e l'admin
const deleteUser = async(req, res)=>{
    try{
        const id = req.params.id;
        if(!id){
            return res.status(400).json({error: "L'UserId è assente!!"})
        }
        const results = await utentiModel.deleteUserById(id);
         //Controllo che tutto sia andato a buon fine
        if(results){
            res.status(200).json({message: "Eliminazione Account avvenuta con successo!!"});
        }else{
            res.status(404).json({error:"Nessun Utente con questo id da eliminare!!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Errore durante l'eliminazione dell'utente"});
    }
}


//Funzione che salva un nuovo utente nel sistema
const insertUser = async(req, res)=>{
    try{
        const info = req.body;
        //Controllo che tutti i campi siano stati compilati
        if(Object.keys(info).length === 0){
            return res.status(400).json({error: "Dati dell'utente assenti"})
        }
        const pwd = info.password;
        //Hashing della password
        const passwordCriptata = await bcrypt.hash(pwd, 10); //Uso un salt di 10
        info.password = passwordCriptata;
        const results = await utentiModel.createUser(info);
        if(results){
            res.status(201).json({message: "Creazione Account avvenuta con successo!!"});
            }else{
            res.status(500).json({error:"Impossibile creare un nuovo account!!"});
            }
        }catch(error){
        console.error(error);
        res.status(500).json({error:"Errore durante la creazione dell'utente"});
    }
}

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    updateUser,
    deleteUser,
    insertUser
}