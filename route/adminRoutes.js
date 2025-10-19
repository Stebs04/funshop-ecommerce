// File: route/adminRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Importa i DAO necessari
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const ordiniDao = require('../models/dao/ordini-dao');

// Middleware per assicurarsi che l'utente sia loggato E sia un admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.tipo_account === 'admin') {
        return next();
    }
    req.flash('error', 'Accesso non autorizzato. Area riservata agli amministratori.');
    res.redirect('/');
};

// Applica il middleware a tutte le rotte in questo file
router.use(isAdmin);

// Configurazione di Multer per il caricamento delle immagini dei prodotti
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('percorso_immagine');


// GET /admin/dashboard - La pagina principale della dashboard
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

// POST /admin/users/delete/:id - Elimina un utente
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

// POST /admin/products/delete/:id - Elimina un prodotto
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

// GET /admin/products/edit/:id - Mostra la pagina di modifica per un prodotto
router.get('/products/edit/:id', async (req, res) => {
    try {
        const product = await prodottiDao.getProductById(req.params.id);
        if (!product) {
            req.flash('error', 'Prodotto non trovato.');
            return res.redirect('/admin/dashboard');
        }
        res.render('pages/admin-edit-prodotto', {
            title: `Modifica: ${product.nome}`,
            prodotto: product
        });
    } catch (err) {
        req.flash('error', 'Errore nel caricamento della pagina di modifica.');
        res.redirect('/admin/dashboard');
    }
});

// POST /admin/products/edit/:id - Aggiorna un prodotto
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