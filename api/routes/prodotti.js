//Importazione del modulo express
const express = require('express');

//Importazione del controller dei prodotti
const productsController = require('../controllers/prodottiController');

//Creazione del router per gestire solo gli endpoint dei prodotti
const router = express.Router();

//Definizione della rotta GET principale per recuperare la lista dei prodotti
router.get('/', productsController.getAllProducts);

//Esportazione del router per poterlo importare al server
module.exports = router;