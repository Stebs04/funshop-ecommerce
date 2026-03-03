//Importazione del DAO dei prodotti
const prodottoModel = require('../models/prodottiModels');

//Controller per la rotta GET
getAllProducts = async (req, res) =>{
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

//Esportazione della funzione del controller
module.exports = {getAllProducts};

