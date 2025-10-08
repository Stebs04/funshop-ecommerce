'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Configurazione di Multer per il caricamento delle immagini
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000}, // Limite di 1MB per file
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).array('percorso_immagine', 5);

// Funzione per controllare il tipo di file
function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!');
    }
}

// Rotta per visualizzare il form di aggiunta prodotto
router.get('/new', isLoggedIn, (req, res) => {
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Solo i venditori possono aggiungere prodotti.');
        return res.redirect('/');
    }
    res.render('pages/nuovo-prodotto', { title: 'Aggiungi Prodotto', user: req.user });
});

// Rotta per creare un nuovo prodotto
router.post('/', isLoggedIn, upload, async (req, res) => {
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Azione non permessa.');
        return res.redirect('/');
    }

    // La gestione dell'errore di upload viene spostata qui
    if (req.fileValidationError) {
        req.flash('error', req.fileValidationError);
        return res.redirect('/products/new');
    }
    if (!req.file) {
        req.flash('error', 'Nessun file immagine selezionato!');
        return res.redirect('/products/new');
    }

    const { sellingType, nome, descrizione, categoria, condizione } = req.body;
    let prezzo = null;
    let prezzo_asta = null;

    if (sellingType === 'sell_now') {
        prezzo = parseFloat(req.body.prezzo);
    } else { // 'auction'
        prezzo_asta = parseFloat(req.body.prezzo_asta);
    }

    const newProduct = {
        nome: nome,
        descrizione: descrizione,
        condizione: condizione,
        parola_chiave: categoria,
        prezzo: prezzo,
        prezzo_asta: prezzo_asta,
        percorso_immagine: '/uploads/' + req.file.filename,
        user_id: req.user.id
    };

    try {
        await prodottiDao.createProduct(newProduct);
        res.render('pages/redirect-message', {
            title: 'Successo',
            message: 'Caricamento andato a buon fine. Redirecting alla home page',
            redirectUrl: '/',
            user: req.user,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (dbErr) {
        console.error(dbErr);
        res.render('pages/redirect-message', {
            title: 'Errore',
            message: 'Caricamento non riuscito. Redirecting alla homepage',
            redirectUrl: '/',
            user: req.user,
            isAuthenticated: req.isAuthenticated()
        });
    }
});

// Rotta per visualizzare un singolo prodotto
router.get('/:id', async (req, res) => {
    try {
        const prodotto = await prodottiDao.getProductById(req.params.id);
        if (prodotto) {
            res.render('pages/prodotto', {
                title: prodotto.nome,
                prodotto: prodotto,
                user: req.user,
                isAuthenticated: req.isAuthenticated()
            });
        } else {
            res.status(404).send('Prodotto non trovato');
        }
    } catch (error) {
        console.error('Errore durante il recupero del prodotto:', error);
        res.status(500).send('Errore del server');
    }
});


// API per ottenere le categorie
router.get('/api/categorie', async (req, res) => {
    try {
        const categorie = await prodottiDao.getAllCategories();
        res.json(categorie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nel recupero delle categorie' });
    }
});

module.exports = router;
