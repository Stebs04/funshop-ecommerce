'use strict';

const recensioniDao = require('../models/dao/recensioni-dao');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prodottiDao = require('../models/dao/prodotti-dao');
const { isLoggedIn } = require('../middleware/passport-config');

const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

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
}).single('percorso_immagine');

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
    res.render('pages/nuovo-prodotto', { 
        title: 'Aggiungi Prodotto', 
        user: req.user,
        categorie: categorie // Passa le categorie al template
    });
});

// Rotta per creare un nuovo prodotto
router.post('/', isLoggedIn, upload, async (req, res) => {
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Azione non permessa.');
        return res.redirect('/');
    }

    if (!req.file) {
        req.flash('error', 'Devi caricare un\'immagine per il prodotto.');
        return res.redirect('/products/new');
    }

    const { sellingType, nome, descrizione, categoria, condizione } = req.body;
    let prezzo = null;
    let prezzo_asta = null;

    if (sellingType === 'sell_now') {
        prezzo = parseFloat(req.body.prezzo) || 0;
    } else { // 'auction'
        prezzo_asta = parseFloat(req.body.prezzo_asta) || 0;
    }

    const newProduct = {
        nome,
        descrizione,
        condizione,
        parola_chiave: categoria,
        prezzo,
        prezzo_asta,
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

// Rotta per visualizzare un singolo prodotto
router.get('/:id', async (req, res) => {
    try {
        const prodotto = await prodottiDao.getProductById(req.params.id);
        if (prodotto) {
            // Recupera le recensioni per questo prodotto
            const recensioni = await recensioniDao.getReviewsByProductId(req.params.id);
            
            res.render('pages/prodotto', {
                title: prodotto.nome,
                prodotto: prodotto,
                recensioni: recensioni, // Passa le recensioni al template
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
