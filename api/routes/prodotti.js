//Importazione del modulo express
const express = require('express');

//Importazione del controller dei prodotti
const productsController = require('../controllers/prodottiController');

//Creazione del router per gestire solo gli endpoint dei prodotti
const router = express.Router();

//Definizione della rotta GET principale per recuperare la lista dei prodotti
router.get('/', productsController.getAllProducts);

//Definizione della rotta per recuperare un singolo prodotto tramite ID
router.get('/:id', productsController.getProductsById);

//Definizione della rotta per creare un nuovo prodotto
router.post('/', productsController.createProduct);

//Definizione della rotta per aggiornare un prodotto tramite ID
router.put('/:id', productsController.updateProduct);

//Definizione della rotta per aggiornare un prodotto per un utente specifico tramite ID
router.put('/user/:id', productsController.updateProductByUser);

//Definizione della rotta per cercare prodotti tramite nome (POST)
router.post('/search', productsController.getByName);

//Definizione della rotta per cancellare un prodotto tramite ID (Admin)
router.delete('/:id', productsController.deleteProduct);

//Definizione della rotta per cancellare un prodotto tramite ID e UserID (Proprietario)
router.delete('/user/:id', productsController.deleteProductById);

//Definizione della rotta per recuperare i prodotti di un utente specifico
router.post('/user-products', productsController.getByUserId);

//Definizione della rotta per recuperare un prodotto con sconto tramite ID
router.get('/discount/:id', productsController.getProductsByIdWithDiscount);

//Definizione della rotta per recuperare tutti i prodotti con sconto
router.get('/discount/all', productsController.getAllProductsWithDiscount);

//Esportazione del router per poterlo importare al server
module.exports = router;