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

    const newProduct = {
        nome: req.body.nome,
        descrizione: req.body.descrizione,
        prezzo: parseFloat(req.body.prezzo),
        categoria: req.body.categoria,
        quantita_disponibile: parseInt(req.body.quantita_disponibile),
        percorso_immagine: '/uploads/' + req.file.filename,
        venditore_id: req.user.id
    };

    try {
        await prodottiDao.createProduct(newProduct);
        req.flash('success', 'Prodotto aggiunto con successo!');
        res.redirect('/utente'); // O dove vuoi reindirizzare dopo la creazione
    } catch (dbErr) {
        console.error(dbErr);
        req.flash('error', 'Errore durante il salvataggio del prodotto.');
        res.redirect('/products/new');
    }
});

// Rotta per visualizzare un singolo prodotto
router.get('/:id', async (req, res) => {
    try {
        const product = await prodottiDao.getProductById(req.params.id);
        if (product) {
            res.render('pages/prodotto', { title: product.nome, product: product, user: req.user });
        } else {
            res.status(404).send('Prodotto non trovato');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore del server');
    }
});

module.exports = router;
