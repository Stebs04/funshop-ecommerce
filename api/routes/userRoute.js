const express = require('express');

// Creazione del router Express per gestire le rotte relative agli utenti
const UserRouter = express.Router();

// Importazione del controller degli utenti
const UserController = require('../controllers/userController');

// Rotta per ottenere tutti gli utenti
UserRouter.get('/', UserController.getAllUsers);

// Rotta per ottenere un singolo utente tramite ID
UserRouter.get('/:id', UserController.getUserById);

// Rotta per la registrazione di un nuovo utente
UserRouter.post('/register', UserController.insertUser);

// Rotta per il login
UserRouter.post('/login', UserController.login);

// Rotta per cercare un utente tramite email
UserRouter.post('/find', UserController.getUserByEmail);

// Rotta per aggiornare i dati di un utente
UserRouter.put('/:id', UserController.updateUser);

// Rotta per eliminare un utente
UserRouter.delete('/:id', UserController.deleteUser);

// Rotta per aggiornare il ruolo dell'utente
UserRouter.put('/:id/role', UserController.updateUserRole);

module.exports = UserRouter;