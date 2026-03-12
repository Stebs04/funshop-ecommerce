//Importazione del DAO dei prodotti
const prodottoModel = require('../models/prodottiModels');

//Controller per la rotta GET
const getAllProducts = async (req, res) =>{
    try{
        //Chiama la funzione findAll del DAO e attende che restituisca i dati
        const prodotti = await prodottoModel.findAll(); 
        //Invia i dati estratti al client
        res.json(prodotti);
    }
    catch(error)
    {
        console.error(error);
        // Risponde al client con uno status 500 e un messaggio di errore
        res.status(500).json({ errore: "Errore nel recupero dei prodotti" });
    }
};

//Restituisce il singolo prodotto usando il suo id
const getProductsById = async(req,res) => {
    try{
        //Salvo l'id del prodotto prendendolo dai parametri passati nella barra degli indirizzi
        const productId = req.params.id;
        //Creo una costante prodotto dove salverò l'oggetto ritornatomi dalla funzione del DAO
        const prodotto = await prodottoModel.findProductById(productId);
        //Controllo che il prodotto effettivamente esista
        if(!prodotto){
            return res.status(404).json({error: "Prodotto non trovato"});
        }
        res.json(prodotto);
    } catch(error)
    {
        console.error(error);
        res.status(500).json({error: "Errore nel recupero del prodotto"})
    }
};

//Inserisce il prodotto nel database mediante una richiesta POST
const createProduct = async(req, res) =>{
    try{
        //Recupero le informazioni dal corpo della richiesta
        const productInfo = req.body;
          //Controllo che l'oggetto non sia vuoto
        if(Object.keys(productInfo).length == 0){
            return res.status(400).json({errore: "Dati del prodotto mancanti!!"});
        }
        //Inserisco l'oggetto dentro al DB
        const results = await prodottoModel.createProduct(productInfo);
        //Controllo che tutto sia andato a buon fine
        if(!results){
           res.status(500).json({error: "Impossibile creare il prodotto"});
        }else{
             res.status(201).json({message: "Oggetto creato con successo"});
        }
    }catch(error){
         console.error(error);
        res.status(500).json({error: "Errore nel inserimento del prodotto"})
    }
};

//Modifica i campi di un prodotto
const updateProduct = async(req, res)=>{
    try{
        //Recupero l'id dall'url
        const productId = req.params.id;
        //Recupero i dati da sovrascrivere
        const newProductInfos = req.body;
        //Controllo che l'oggetto non sia vuoto
        if(Object.keys(newProductInfos).length == 0){
            return res.status(400).json({errore: "Dati del prodotto mancanti!!"});
        }
        //Aggiorno i campi del prodotto all'interno del DB
        const results = await prodottoModel.updateById(productId, newProductInfos);
         //Controllo che tutto sia andato a buon fine
        if(!results){
            res.status(404).json({error: "Il prodotto non esiste"});
        }
        else{
            res.status(200).json({message: "Oggetto aggiornato con successo"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nel aggiornamento del prodotto"});
    }
};



//Modifica i campi di un prodotto per un utente specifico
const updateProductByUser = async(req, res)=>{
    try{
        const productId = req.params.id;
        const newProductInfos = req.body;
        const userId = newProductInfos.userID;

        //Vari controlli di correttezza
        if(!userId){
            return res.status(400).json({error: "User ID mancante!!"});
        }

        if(Object.keys(newProductInfos).length == 0){
            return res.status(400).json({error: "Dati del prodotto mancanti!!"});
        }

        const results = await prodottoModel.updateByUserId(productId, userId, newProductInfos);
        
        if(results){
            res.status(200).json({message: "Prodotto aggiornato con successo"});
        } else {
            res.status(404).json({error: "Impossibile aggiornare il prodotto"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nell'aggiornamento del prodotto"});
    }
};

//Funzione che restituisce un prodotto tramite la ricerca testuale
const getByName = async(req, res) =>{
    try{
        const research = req.body;

        if(Object.keys(research).length === 0){
            return res.status(400).json({error: "Il campo della ricerca è vuoto!!!"});
        }

        const results = await prodottoModel.searchByName(research);

        if(results){
            res.json(results);
        }
        else{
            res.status(404).json({error: "Impossibile trovare il prodotto!!"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nella ricerca del prodotto!!"});
    }
}

//Funzione che cancella un prodotto tramite il suo id
const deleteProduct = async(req, res) =>{
    try{
        const productId = req.params.id;
        const result = await prodottoModel.deleteProduct(productId);
        if(!result){
            return res.status(404).json({error: "Prodotto da eliminare non trovato!!"});
        }
        else{
            res.status(200).json({message: "Eliminazione andata a buon fine"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nella cancellazione del prodotto!!"});
    }
};

//Funzione che cancella un prodotto solo se a richiederne la eliminazione è chi lo ha caricato
const deleteProductById = async(req, res) =>{
    try{
        const productId = req.params.id;
        const userID = req.body.userID;
        if(!userID){
            return res.status(400).json({error:"UserId Mancante!!!"});
        }
        const result = await prodottoModel.deleteByUserId(productId, userID);
        if(!result){
            return res.status(404).json({error: "Prodotto da eliminare non trovato!!"});
        }
        else{
            res.status(200).json({message: "Eliminazione andata a buon fine"});
        }
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Errore nella cancellazione del prodotto!!"});
    }
}

//Funzione che recupera tutti i prodotti di un utente
const getByUserId = async(req, res) =>{
    try{
        const userId = req.body.userID;
        if(!userId){
            return res.status(400).json({error:"UserID mancante!!!"});
        }
        const results = await prodottoModel.findByUserId(userId);
        if(results){
            return res.json(results);
        }
        else{
            return res.status(404).json({error: "Prodotto non trovato!!"});
        }
    }catch(error){
        console.error(error);
       res.status(500).json({error: "Errore nella ricerca del prodotto!!"});
    }
}

//Esportazione della funzione del controller
module.exports = {
    getAllProducts,
    getProductsById,
    createProduct,
    updateProduct,
    updateProductByUser,
    getByName, 
    deleteProduct,
    deleteProductById,
    getByUserId
};

