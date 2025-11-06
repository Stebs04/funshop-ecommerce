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
    // Definisce la cartella di destinazione per i file caricati
    destination: './public/uploads/',
    filename: function(req, file, cb){
        // Creiamo un nome file unico aggiungendo un timestamp
        cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});

/**
 * Funzione helper per filtrare i tipi di file accettati (solo immagini).
 * @param {object} file - L'oggetto file caricato da multer.
 * @param {function} cb - La callback da chiamare.
 */
function checkFileType(file, cb){
    // Definisce le estensioni e i tipi MIME consentiti
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        // Se il file è valido, procedi
        return cb(null,true);
    } else {
        // Se non è un'immagine, restituisci un errore
        cb(new Error('Errore: Puoi caricare solo immagini!'));
    }
}

// Inizializziamo multer per accettare un array di file (massimo 5)
const upload = multer({
    storage: storage,
    // Aumentiamo il limite per file a 5MB (5 * 1024 * 1024)
    limits:{fileSize: 5242880}, 
    fileFilter: function(req, file, cb){
        // Applica il filtro sul tipo di file
        checkFileType(file, cb);
    }
}).array('percorsi_immagine', 5); // Accetta un array di file, con un massimo di 5 file

/**
 * Middleware wrapper per gestire gli errori specifici di Multer
 * in modo che possano essere mostrati come messaggi 'flash'.
 */
const uploadWrapper = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            // Se l'errore è un errore di Multer (es. troppi file o file troppo grande)
            if (err instanceof multer.MulterError) {
                 if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    req.flash('error', 'Puoi caricare un massimo di 5 immagini.');
                 } else if (err.code === 'LIMIT_FILE_SIZE') {
                     req.flash('error', 'Errore: Ogni immagine non deve superare i 5MB.');
                 } else {
                    req.flash('error', `Errore Multer: ${err.message}`);
                 }
            } else if (err) {
                 // Altri errori (es. tipo di file non valido)
                 req.flash('error', err.message);
            }
            // Reindirizza alla pagina di creazione in caso di errore
            return res.redirect('/products/new');
        }
        // Se non ci sono errori, procedi alla rotta successiva
        next();
    });
};

/**
 * ROTTA: GET /products/new
 * * Mostra la pagina con il form per aggiungere un nuovo prodotto.
 * * Logica:
 * 1. Richiede che l'utente sia loggato (`isLoggedIn`).
 * 2. Controlla che l'utente sia un 'venditore'.
 * 3. Renderizza la pagina `nuovo-prodotto.ejs`, passando l'array delle categorie
 * per popolare il menu a tendina.
 */
router.get('/new', isLoggedIn, (req, res) => {
    // Solo i venditori possono accedere a questa pagina
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Solo i venditori possono aggiungere prodotti.');
        return res.redirect('/');
    }
    // Renderizza la pagina passando il titolo e le categorie
    res.render('pages/nuovo-prodotto', { 
        title: 'Aggiungi Prodotto', 
        user: req.user,
        categorie: categorie
    });
});

/**
 * ROTTA: POST /products/
 * * Gestisce la creazione di un nuovo prodotto e il salvataggio nel database.
 * * Logica:
 * 1. `isLoggedIn`: Assicura che l'utente sia loggato.
 * 2. `uploadWrapper`: Gestisce il caricamento delle immagini (da 1 a 5).
 * 3. Validazione dei campi del form (nome, descrizione, prezzo, ecc.).
 * 4. Controlla che l'utente sia un 'venditore'.
 * 5. Se la validazione fallisce, mostra gli errori.
 * 6. Controlla che almeno un'immagine (`req.files.length > 0`) sia stata caricata.
 * 7. Crea un array `percorsiImmagineArray` mappando i file caricati.
 * 8. Crea l'oggetto `newProduct` da salvare.
 * 9. Chiama `prodottiDao.createProduct()` per salvare il prodotto (con l'array di immagini) nel DB.
 * 10. Reindirizza alla homepage con un messaggio di successo o errore.
 */
router.post('/', isLoggedIn, uploadWrapper, [
    // Validazione dei campi del form
    check('nome').notEmpty().withMessage('Il titolo del prodotto è obbligatorio.'),
    check('descrizione').notEmpty().withMessage('La descrizione è obbligatoria.'),
    check('parola_chiave').notEmpty().withMessage('La categoria è obbligatoria.'),
    check('condizione').notEmpty().withMessage('La condizione è obbligatoria.'),
    check('prezzo').notEmpty().withMessage('Il prezzo è obbligatorio.').isFloat({ gt: 0 }).withMessage('Il prezzo deve essere un numero maggiore di zero.')
], async (req, res) => {
    // Controllo di sicurezza sul tipo di account
    if (req.user.tipo_account !== 'venditore') {
        req.flash('error', 'Azione non permessa.');
        return res.redirect('/');
    }

    // Gestione degli errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/products/new');
    }

    // Controlliamo che almeno un file (il minimo) sia stato caricato
    if (!req.files || req.files.length === 0) {
        req.flash('error', 'Devi caricare almeno un\'immagine per il prodotto.');
        return res.redirect('/products/new');
    }

    const { nome, descrizione, parola_chiave, condizione, prezzo } = req.body;

    // Creiamo l'array di percorsi immagine mappando i file caricati su req.files
    const percorsiImmagineArray = req.files.map(file => '/uploads/' + file.filename);

    // Prepariamo l'oggetto prodotto da passare al DAO
    const newProduct = {
        nome,
        descrizione,
        condizione,
        parola_chiave,
        prezzo: parseFloat(prezzo),
        percorsi_immagine: percorsiImmagineArray, // Passiamo l'array completo
        user_id: req.user.id // Associamo il prodotto all'utente loggato
    };

    try {
        // Salviamo il prodotto nel database
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
 * * Mostra la pagina di dettaglio di un singolo prodotto.
 * * Logica:
 * 1. Recupera il prodotto dal DB usando `prodottiDao.getProductById`.
 * 2. Se il prodotto esiste:
 * a. Controlla se l'utente (se loggato) sta osservando il prodotto (`isObserved`).
 * b. Renderizza `pages/prodotto.ejs`, passando l'oggetto `prodotto` completo
 * (che include l'array `percorsi_immagine` necessario per il carosello),
 * e il flag `isObserved`.
 * 3. Se il prodotto non esiste, invia un errore 404.
 */
router.get('/:id', async (req, res) => {
    try {
        // Recupera il prodotto, il DAO restituisce l'array completo 'percorsi_immagine'
        const prodotto = await prodottiDao.getProductById(req.params.id);
        
        if (prodotto) {
            let isObserved = false;
            // Se l'utente è loggato, controlliamo se sta osservando questo prodotto
            if (req.isAuthenticated()) {
                isObserved = await observedDao.isObserved(req.user.id, req.params.id);
            }
            
            // Renderizza la pagina di dettaglio
            res.render('pages/prodotto', {
                title: prodotto.nome,
                prodotto: prodotto, // prodotto contiene l'array 'percorsi_immagine'
                user: req.user,
                isAuthenticated: req.isAuthenticated(),
                isObserved: isObserved // Flag per il pulsante "Osserva"
            });
        } else {
            // Se il prodotto non è trovato nel database
            req.flash('error', 'Prodotto non trovato.');
            res.status(404).redirect('/');
        }
    } catch (error) {
        console.error('Errore durante il recupero del prodotto:', error);
        req.flash('error', 'Si è verificato un errore del server.');
        res.status(500).redirect('/');
    }
});

module.exports = router;