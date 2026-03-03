//Importazione del modulo express
const express = require('express');

//Creazione del router per gestire solo gli endpoint dei prodotti
const router = express.Router();

//Definizione della rotta GET principale per recuperare la lista dei prodotti
router.get('/', (req,res)=>{
    res.json({messaggio: "Qui arriverà la lista dei prodotti dal DB"});
});

//Esportazione del router per poterlo importare al server
module.exports = router;