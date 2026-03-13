//Importazione del DAO necessario
const accountInfosModel = require('../models/accountInfosModels');

//Funzione che inserisce tutte le informazioni supplementari di un account nel DB
const insertAccInf = async(req, res) =>{
    try{
        const info = req.body;
        //Controllo che l'oggetto non sia vuoto
        if(Object.keys(info).length === 0){
            return res.status(400).json({error: "Informazioni Mancanti"});
        }
        const results = await accountInfosModel.createAccountInfo(info);
        //Controllo che tutto sia andato a buon fine
        if(results){
            res.status(201).json({message: "Informazioni supplementari inserite con successo!!"});
        }else{
            res.status(404).json({error: "Impossibile salvare le informazioni!!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore durante il salvataggio delle informazioni!!"});
    }
};

    //Funzione che permette all'utente di aggiornare le informazioni
    const updateUserInfo = async(req, res) =>{
        try{
            const id = req.params.id;
            if(!id){
                return res.status(400).json({error: "UserId mancante!!"});
            }
            const info = req.body;
            if(Object.keys(info).length === 0){
                return res.status(400).json({error: "Informazioni Mancanti"});
            }
            const results = await accountInfosModel.updateAccountInfo(id, info);
            if(results){
            res.status(201).json({message: "Informazioni aggiornate con successo!!"});
            }else{
                res.status(404).json({error: "Impossibile aggiornare le informazioni!!!"});
                }
            }catch(error){
                console.error(error);
                res.status(500).json({error: "Errore durante l'aggiornamento delle informazioni!!"});
    }
};

//Funzione che restituisce tutte le informazioni aggiuntive di un utente
const getInfoByUserId = async(req, res) =>{
      try{
            const id = req.params.id;
            if(!id){
                return res.status(400).json({error: "UserId mancante!!"});
            }
            const results = await accountInfosModel.getAccountInfoByUserId(id);
            if(results){
            res.json(results);
            }else{
                res.status(404).json({error: "Impossibile caricare le informazioni!!!"});
                }
            }catch(error){
                console.error(error);
                res.status(500).json({error: "Errore durante il caricamento delle informazioni!!"});
    }
};

module.exports ={
    insertAccInf,
    updateUserInfo,
    getInfoByUserId
};