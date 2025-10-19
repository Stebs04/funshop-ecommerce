// File: route/productRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

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
 * * Multer gestisce il caricamento dei file. Qui viene configurato per:
 * - `storage`: Salvare i file su disco (`diskStorage`).
 * - `destination`: Nella cartella `./public/uploads/`.
 * - `filename`: Con un nome univoco basato sul timestamp per evitare sovrascritture.
 * - `limits`: Imposta un limite di dimensione del file a 1MB.
 * - `fileFilter`: Definisce una funzione per accettare solo file di tipo immagine
 * (jpeg, jpg, png, gif), controllando sia l'estensione (`extname`) sia il tipo MIME (`mimetype`).
 */
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('percorso_immagine'); // Accetta un singolo file dal campo 'percorso_immagine' del form

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
 * * Mostra la pagina con il form per aggiungere un nuovo prodotto.
 * * Logica:
 * 1. `isLoggedIn`: Assicura che solo gli utenti loggati possano accedere.
 * 2. Controlla che il `tipo_account` dell'utente sia 'venditore'. Se non lo è,
 * mostra un errore e reindirizza.
 * 3. Renderizza la pagina `nuovo-prodotto.ejs`, passando il titolo, i dati dell'utente
 * e l'array delle categorie per popolare il menu a tendina.
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
 * * Gestisce la creazione di un nuovo prodotto.
 * * Logica:
 * 1. `isLoggedIn`: Protegge la rotta.
 * 2. `upload`: Middleware di Multer che processa il caricamento dell'immagine.
 * 3. Controlla che l'utente sia un 'venditore'.
 * 4. Verifica che un file sia stato effettivamente caricato.
 * 5. Estrae tutti i dati del prodotto dal corpo della richiesta (`req.body`).
 * 6. Determina il prezzo in base alla modalità di vendita scelta ('Vendi ora' o 'Asta').
 * 7. Crea un oggetto `newProduct` con tutti i dati pronti per essere inseriti nel database,
 * incluso il percorso dell'immagine caricata e l'ID del venditore.
 * 8. Chiama `prodottiDao.createProduct()` per salvare il nuovo prodotto.
 * 9. Invia un messaggio di successo e reindirizza alla homepage.
 */
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
    } else {
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

/**
 * ROTTA: GET /products/:id
 * * Mostra la pagina di dettaglio di un singolo prodotto.
 * * Logica:
 * 1. Recupera l'ID del prodotto dall'URL.
 * 2. Chiama `prodottiDao.getProductById()` per ottenere tutti i dettagli del prodotto,
 * inclusi i dati del venditore.
 * 3. Se il prodotto non viene trovato, invia una risposta 404.
 * 4. Se l'utente è loggato, controlla se sta già osservando questo prodotto
 * chiamando `observedDao.isObserved()`. Il risultato (true/false) viene salvato
 * in `isObserved`.
 * 5. Renderizza la pagina `prodotto.ejs`, passando tutti i dettagli del prodotto,
 * i dati dell'utente e il booleano `isObserved`, che il template userà per
 * mostrare il pulsante "Osserva" o "Rimuovi dagli Osservati".
 */
router.get('/:id', async (req, res) => {
    try {
        const prodotto = await prodottiDao.getProductById(req.params.id);
        if (prodotto) {
            // Controlla se l'utente loggato sta osservando questo prodotto
            let isObserved = false;
            if (req.isAuthenticated()) {
                isObserved = await observedDao.isObserved(req.user.id, req.params.id);
            }
            
            res.render('pages/prodotto', {
                title: prodotto.nome,
                prodotto: prodotto,
                user: req.user,
                isAuthenticated: req.isAuthenticated(),
                isObserved: isObserved // Passa la variabile alla vista
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