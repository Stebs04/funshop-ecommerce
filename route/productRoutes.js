// File: route/productRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Import dei DAO e del middleware di autenticazione
const prodottiDao = require('../models/dao/prodotti-dao');
const observedDao = require('../models/dao/observed-dao');
const { isLoggedIn } = require('../middleware/passport-config');

// Array di categorie predefinite per popolare il form di aggiunta prodotto.
const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

/**
 * Configurazione di Multer per il caricamento delle immagini
 */
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000}, // Limite di 1MB per file
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('percorso_immagine');

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

/**
 * ROTTA: GET /products/new
 * Mostra la pagina con il form per aggiungere un nuovo prodotto.
 */
router.get('/new', isLoggedIn, (req, res) => {
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Solo i venditori possono aggiungere prodotti.');
        return res.redirect('/');
    }
    res.render('pages/nuovo-prodotto', { 
        title: 'Aggiungi Prodotto', 
        user: req.user,
        categorie: categorie
    });
});

/**
 * ROTTA: POST /products/
 * Gestisce la creazione di un nuovo prodotto.
 */
router.post('/', isLoggedIn, upload, [
    // Aggiunge la validazione dei campi del form
    check('nome').notEmpty().withMessage('Il titolo del prodotto è obbligatorio.'),
    check('descrizione').notEmpty().withMessage('La descrizione è obbligatoria.'),
    check('categoria').notEmpty().withMessage('La categoria è obbligatoria.'),
    check('condizione').notEmpty().withMessage('La condizione è obbligatoria.'),
    check('prezzo').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('Il prezzo deve essere un numero valido.')
], async (req, res) => {
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Azione non permessa.');
        return res.redirect('/');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/products/new');
    }

    if (!req.file) {
        req.flash('error', 'Devi caricare un\'immagine per il prodotto.');
        return res.redirect('/products/new');
    }

    const { nome, descrizione, categoria, condizione } = req.body;
    let prezzo = parseFloat(req.body.prezzo);
    
    if (isNaN(prezzo) || prezzo <= 0) {
        req.flash('error', 'Il prezzo specificato non è valido.');
        return res.redirect('/products/new');
    }

    const newProduct = {
        nome,
        descrizione,
        condizione,
        parola_chiave: categoria,
        prezzo,
        percorso_immagine: '/uploads/' + req.file.filename,
        user_id: req.user.id
    };

    try {
        await prodottiDao.createProduct(newProduct);
        req.flash('success', 'Prodotto aggiunto con successo!');
        res.redirect('/');
    } catch (dbErr) {
        console.error(dbErr);
        req.flash('error', 'Si è verificato un errore durante l\'aggiunta del prodotto.');
        res.redirect('/products/new');
    }
});

/**
 * ROTTA: GET /products/:id
 * Mostra la pagina di dettaglio di un singolo prodotto.
 */
router.get('/:id', async (req, res) => {
    try {
        const prodotto = await prodottiDao.getProductById(req.params.id);
        if (prodotto) {
            let isObserved = false;
            if (req.isAuthenticated()) {
                isObserved = await observedDao.isObserved(req.user.id, req.params.id);
            }
            
            res.render('pages/prodotto', {
                title: prodotto.nome,
                prodotto: prodotto,
                user: req.user,
                isAuthenticated: req.isAuthenticated(),
                isObserved: isObserved
            });
        } else {
            res.status(404).send('Prodotto non trovato');
        }
    } catch (error) {
        console.error('Errore durante il recupero del prodotto:', error);
        res.status(500).send('Errore del server');
    }
});

module.exports = router;