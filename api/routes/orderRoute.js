const express = require('express');

// Creazione del router Express per gestire le rotte relative agli ordini
const orderRouter = express.Router();

// Importazione del controller degli ordini
const orderController = require('../controllers/orderController');

// Rotta per ottenere tutti gli ordini di un utente
orderRouter.get('/', orderController.getOrdersByUserId);

// Rotta per ottenere un singolo ordine tramite il suo ID
orderRouter.get('/:id', orderController.getOrderById);

// Rotta per creare un nuovo ordine
orderRouter.post('/', orderController.createOrder);

module.exports = orderRouter;