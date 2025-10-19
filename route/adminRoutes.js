// File: route/adminRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import dei Data Access Objects (DAO) necessari per interagire con il database.
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const ordiniDao = require('../models/dao/ordini-dao');

/**
 * Middleware `isAdmin`
 * * Questo middleware è un "guardiano" per le rotte di amministrazione.
 * Controlla due condizioni prima di permettere a una richiesta di procedere:
 * 1. `req.isAuthenticated()`: L'utente deve essere autenticato (loggato).
 * 2. `req.user.tipo_account === 'admin'`: L'utente loggato deve avere il ruolo di 'admin'.
 * * Se entrambe le condizioni sono vere, `next()` passa il controllo alla rotta successiva.
 * Altrimenti, viene inviato un messaggio di errore e l'utente viene reindirizzato alla homepage.
 */
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.tipo_account === 'admin') {
        return next();
    }
    req.flash('error', 'Accesso non autorizzato. Area riservata agli amministratori.');
    res.redirect('/');
};

// Applica il middleware `isAdmin` a tutte le rotte definite in questo file.
// Questo significa che ogni rotta che segue sarà protetta e accessibile solo agli amministratori.
router.use(isAdmin);

/**
 * Configurazione di Multer per il Caricamento Immagini
 * * Multer è un middleware per Express che gestisce il caricamento di file (`multipart/form-data`).
 * Qui configuriamo dove salvare le immagini dei prodotti e come nominarle.
 * * - `destination`: Specifica la cartella in cui verranno salvati i file caricati (`./public/uploads/`).
 * - `filename`: Crea un nome di file unico per ogni immagine, combinando un prefisso,
 * il timestamp corrente (`Date.now()`) e l'estensione originale del file. Questo previene
 * conflitti tra file con lo stesso nome.
 */
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('percorso_immagine');


/**
 * ROTTA: GET /admin/dashboard
 * * Mostra la pagina principale del pannello di amministrazione.
 * * Logica:
 * 1. Esegue tre operazioni asincrone in parallelo usando `Promise.all` per massimizzare l'efficienza:
 * - `utentiDao.getAllUsers()`: Recupera l'elenco di tutti gli utenti registrati.
 * - `prodottiDao.getAllProductsAdmin()`: Recupera l'elenco completo di tutti i prodotti.
 * - `ordiniDao.getTotalSales()`: Calcola il fatturato totale di tutti gli ordini.
 * 2. Calcola il numero di prodotti attualmente disponibili (`in stock`).
 * 3. Renderizza la pagina `admin-dashboard.ejs`, passando tutti i dati recuperati:
 * - L'elenco degli utenti.
 * - L'elenco dei prodotti.
 * - Le statistiche aggregate (conteggio utenti, prodotti disponibili, fatturato).
 */
router.get('/dashboard', async (req, res) => {
    try {
        // Recupera tutti i dati in parallelo per ottimizzare i tempi
        const [allUsers, allProducts, totalRevenue] = await Promise.all([
            utentiDao.getAllUsers(),
            prodottiDao.getAllProductsAdmin(),
            ordiniDao.getTotalSales()
        ]);

        const totalProductsInStock = allProducts.filter(p => p.stato === 'disponibile').length;

        res.render('pages/admin-dashboard', {
            title: 'Dashboard Amministrazione',
            users: allUsers,
            products: allProducts,
            stats: {
                userCount: allUsers.length,
                productCount: totalProductsInStock,
                revenue: totalRevenue
            }
        });
    } catch (error) {
        console.error("Errore nel caricare la dashboard admin:", error);
        req.flash('error', 'Impossibile caricare i dati per la dashboard.');
        res.redirect('/');
    }
});

/**
 * ROTTA: POST /admin/users/delete/:id
 * * Gestisce la richiesta di eliminazione di un utente.
 * * Logica:
 * 1. Recupera l'ID dell'utente da eliminare dai parametri dell'URL (`req.params.id`).
 * 2. Effettua un controllo di sicurezza per impedire a un amministratore di eliminare il proprio account.
 * 3. Chiama `utentiDao.deleteUser()` per rimuovere l'utente dal database.
 * 4. Invia un messaggio di successo o di errore.
 * 5. Reindirizza l'amministratore alla dashboard.
 */
router.post('/users/delete/:id', async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        // Impedisci all'admin di eliminare se stesso
        if (userIdToDelete == req.user.id) {
            req.flash('error', 'Non puoi eliminare il tuo stesso account.');
            return res.redirect('/admin/dashboard');
        }

        await utentiDao.deleteUser(userIdToDelete);
        req.flash('success', 'Utente eliminato con successo.');
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'utente:", error);
        req.flash('error', 'Si è verificato un errore durante l\'eliminazione dell\'utente.');
    }
    res.redirect('/admin/dashboard');
});

/**
 * ROTTA: POST /admin/products/delete/:id
 * * Gestisce la richiesta di eliminazione di un prodotto da parte di un amministratore.
 * A differenza dell'utente venditore, l'admin può eliminare qualsiasi prodotto.
 * * Logica:
 * 1. Chiama `prodottiDao.deleteProductAdmin()` per rimuovere fisicamente il prodotto dal database.
 * 2. Invia un messaggio di feedback (successo o errore).
 * 3. Reindirizza alla dashboard, specificando l'hash `#prodotti` per far atterrare l'utente
 * direttamente sulla tab di gestione dei prodotti.
 */
router.post('/products/delete/:id', async (req, res) => {
    try {
        // L'admin può eliminare qualsiasi prodotto, quindi non serve il controllo sull'user_id
        await prodottiDao.deleteProductAdmin(req.params.id);
        req.flash('success', 'Prodotto eliminato con successo.');
    } catch (error) {
        console.error("Errore durante l'eliminazione del prodotto:", error);
        req.flash('error', 'Si è verificato un errore durante l\'eliminazione del prodotto.');
    }
    // Reindirizza alla tab dei prodotti
    res.redirect('/admin/dashboard#prodotti');
});

/**
 * ROTTA: POST /admin/products/edit/:id
 * * Gestisce l'aggiornamento dei dati di un prodotto dal pannello di amministrazione.
 * * Logica:
 * 1. Usa il middleware `upload` di Multer per gestire l'eventuale caricamento di una nuova immagine.
 * 2. Crea un oggetto `updatedData` con tutti i dati provenienti dal form (`req.body`).
 * 3. Se è stata caricata una nuova immagine (`req.file`), aggiorna il percorso dell'immagine
 * nell'oggetto `updatedData`.
 * 4. Chiama `prodottiDao.updateProductAdmin()` per salvare le modifiche nel database.
 * 5. Invia un messaggio di feedback.
 * 6. Reindirizza alla dashboard sulla tab dei prodotti.
 */
router.post('/products/edit/:id', upload, async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = { ...req.body };
        if (req.file) {
            updatedData.percorso_immagine = '/uploads/' + req.file.filename;
        }
        
        await prodottiDao.updateProductAdmin(productId, updatedData);
        req.flash('success', 'Prodotto aggiornato con successo.');
    } catch (err) {
        console.error("Errore durante l'aggiornamento del prodotto (admin):", err);
        req.flash('error', 'Errore durante l\'aggiornamento del prodotto.');
    }
    res.redirect('/admin/dashboard#prodotti');
});


module.exports = router;