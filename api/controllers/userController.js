//Importazione del DAO necessario
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
        const { email } = req.body;
        //Controllo che il campo email non sia vuoto
        if(!email){
            return res.status(400).json({errore: "Il campo email è obbligatorio!!"});
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
        if(!newInfos || Object.keys(newInfos).length === 0){
             return res.status(400).json({error: "Dati dell'utente mancanti!!!"})
        }
        
        if(newInfos.password){
            const pwd = newInfos.password;
            if (typeof pwd !== 'string' || pwd.trim() === '') {
                return res.status(400).json({error: "La password non è valida!"});
            } 
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
        const {username, nome, cognome, email, password, data_nascita, tipo_account} = req.body;
        //Controllo che tutti i campi siano stati compilati
        if(!username || !nome || !cognome || !email || !password || !data_nascita){
            return res.status(400).json({error: "Dati dell'utente assenti"})
        }

        //Hashing della password
        const passwordCriptata = await bcrypt.hash(password, 10); //Uso un salt di 10
        
        const userData ={
            username,
            nome,
            cognome,
            email,
            password: passwordCriptata, //Assegno qui la password criptata
            dataNascita: data_nascita, // Mapping corretto: il model si aspetta 'dataNascita'
            tipo_account : tipo_account || 'cliente' //Prende il tipo venditore di default se non specificato
        }
        
        const results = await utentiModel.createUser(userData);
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

// Funzione per aggiornare il ruolo (tipo_account) di un utente
// Utilizzata sia dall'admin dashboard sia da processi/form di cambio status (es. "Diventa Venditore")
const updateUserRole = async(req, res) => {
    try {
        // L'ID target può arrivare dai parametri URL (es. chiamata API admin) o dal body (es. form utente)
        const id = req.params.id || req.body.userId; 
        const { tipo_account } = req.body; 

        // Validazione
        if (!id) {
            return res.status(400).json({ error: "L'ID utente è richiesto (nei parametri o nel body)!" });
        }
        if (!tipo_account) {
            return res.status(400).json({ error: "Il campo tipo_account è obbligatorio!" });
        }

        // Chiamo il model
        const result = await utentiModel.updateUserType(id, tipo_account);

        if (result) {
            res.status(200).json({ message: "Ruolo utente aggiornato con successo!" });
        } else {
            res.status(404).json({ error: "Utente non trovato o errore nell'aggiornamento." });
        }

    } catch (error) {
        console.error("Errore nell'aggiornamento del ruolo utente:", error);
        res.status(500).json({ error: "Errore interno durante l'aggiornamento del ruolo." });
    }
};

//Funzione che si occupa del login
const login = async(req, res) =>{
    try{
        const {email, password} = req.body;
        // Controllo che email e password siano stati forniti
        if(!email || !password){
            return res.status(400).json({error: "I campi email e password sono obbligatori!!"});
        }

        // Cerco l'utente nel database tramite email
        const user = await utentiModel.findUserByEmail(email);

        // Se l'utente non esiste, restituisco errore 404
        if(!user){
            return res.status(404).json({error: "Nessun utente trovato con questa mail!!"});
        }

        // Confronto la password fornita con quella salvata (hashata) nel database
        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch){
            // Rigenera la sessione per sicurezza (previene session fixation)
            req.session.regenerate((err) => {
                if(err) {
                     console.error("Errore durante la rigenerazione della sessione:", err);
                     return res.status(500).json({error: "Errore durante il login"});
                }

                // Salva i dati utente nella nuova sessione
                req.session.user = {
                    id: user.id,
                    nome: user.nome,
                    cognome: user.cognome,
                    email: user.email,
                    ruolo: user.tipo_account
                };

                // Login riuscito
                res.status(200).json({
                    message: "Login andato a buon fine",
                    user: req.session.user
                });
            });
        } else {
            // Password errata
            res.status(401).json({error: "La password non corrisponde!!!"});
        }
        
    }catch(error){
        console.error("Errore durante il login:", error);
        res.status(500).json({error: "Errore durante la fase di login!!"});
    }
};

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    updateUser,
    deleteUser,
    insertUser,
    updateUserRole,
    login
}