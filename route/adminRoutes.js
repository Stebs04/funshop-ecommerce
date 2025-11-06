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

// Array di categorie per popolare il menu a tendina nel modale di modifica prodotto.
const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

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
 * * Configurazione storage per definire destinazione e nome file.
 */
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});

/**
 * Funzione helper per filtrare i tipi di file accettati (solo immagini).
 * @param {object} file - L'oggetto file caricato da multer.
 * @param {function} cb - La callback da chiamare.
 */
function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true); // Accetta il file
    } else {
        cb(new Error('Errore: Puoi caricare solo immagini!')); // Rifiuta il file
    }
}

// Inizializziamo multer per accettare un array di file (massimo 5)
const upload = multer({
    storage: storage,
    // Aumentiamo il limite per file a 5MB (5 * 1024 * 1024)
    limits:{fileSize: 5242880}, 
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).array('percorso_immagine', 5); // Nome del campo e limite massimo di *nuovi* file

/**
 * Middleware wrapper per gestire gli errori specifici di Multer
 * in modo che possano essere mostrati come messaggi 'flash'.
 */
const uploadWrapper = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                 if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    req.flash('error', 'Puoi caricare un massimo di 5 immagini.');
                 } else if (err.code === 'LIMIT_FILE_SIZE') {
                     req.flash('error', 'Errore: Ogni immagine non deve superare i 5MB.');
                 } else {
                    req.flash('error', `Errore Multer: ${err.message}`);
                 }
            } else if (err) {
                 req.flash('error', err.message);
            }
            // Reindirizza alla dashboard in caso di errore
            return res.redirect('/admin/dashboard#prodotti');
        }
        next();
    });
};


/**
 * ROTTA: GET /admin/dashboard
 * * Mostra la pagina principale del pannello di amministrazione.
 * * Logica:
 * 1. Esegue tre operazioni asincrone in parallelo usando `Promise.all`:
 * - `utentiDao.getAllUsers()`: Recupera l'elenco di tutti gli utenti.
 * - `prodottiDao.getAllProductsAdmin()`: Recupera l'elenco completo di tutti i prodotti
 * (incluso l'array `percorsi_immagine` per il modale di modifica).
 * - `ordiniDao.getTotalSales()`: Calcola il fatturato totale.
 * 2. Calcola il numero di prodotti disponibili.
 * 3. Renderizza `admin-dashboard.ejs`, passando tutti i dati recuperati.
 */
router.get('/dashboard', async (req, res) => {
    try {
        // Recupera tutti i dati in parallelo per ottimizzare i tempi
        const [allUsers, allProducts, totalRevenue] = await Promise.all([
            utentiDao.getAllUsers(),
            prodottiDao.getAllProductsAdmin(),
            ordiniDao.getTotalSales()
        ]);

        // Calcola le statistiche
        const totalProductsInStock = allProducts.filter(p => p.stato === 'disponibile').length;

        // Renderizza la pagina
        res.render('pages/admin-dashboard', {
            title: 'Dashboard Amministrazione',
            users: allUsers,
            products: allProducts, // Contiene l'array completo 'percorsi_immagine'
            stats: {
                userCount: allUsers.length,
                productCount: totalProductsInStock,
                revenue: totalRevenue
            },
            categorie: categorie // Passa l'array delle categorie al template
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
 * 1. Recupera l'ID dell'utente da eliminare.
 * 2. Controlla che l'admin non stia cercando di eliminare se stesso.
 * 3. Chiama `utentiDao.deleteUser()` per rimuovere l'utente.
 * 4. Reindirizza alla dashboard.
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
        req.flash('error', 'Si è verificato un errore during l\'eliminazione dell\'utente.');
    }
    // Reindirizza alla tab utenti
    res.redirect('/admin/dashboard#users');
});

/**
 * ROTTA: POST /admin/products/delete/:id
 * * Gestisce l'eliminazione fisica (hard delete) di un prodotto da parte di un amministratore.
 * * Logica:
 * 1. Chiama `prodottiDao.deleteProductAdmin()` per rimuovere fisicamente il prodotto.
 * 2. Reindirizza alla dashboard, ancorando alla tab dei prodotti.
 */
router.post('/products/delete/:id', async (req, res) => {
    try {
        // L'admin può eliminare qualsiasi prodotto, non serve il controllo sull'user_id
        await prodottiDao.deleteProductAdmin(req.params.id);
        req.flash('success', 'Prodotto eliminato con successo.');
    } catch (error) {
        console.error("Errore during l'eliminazione del prodotto:", error);
        req.flash('error', 'Si è verificato un errore during l\'eliminazione del prodotto.');
    }
    // Reindirizza alla tab dei prodotti
    res.redirect('/admin/dashboard#prodotti');
});

/**
 * ROTTA: POST /admin/products/edit/:id
 * * Gestisce l'aggiornamento dei dati di un prodotto dal pannello di amministrazione,
 * inclusa la gestione avanzata delle immagini multiple.
 * * Logica:
 * 1. Usa il middleware `uploadWrapper` per gestire il caricamento di nuove immagini (max 5).
 * 2. Recupera le immagini esistenti riordinate (`existing_images`) dal form.
 * 3. Recupera le nuove immagini caricate (`req.files`).
 * 4. Combina i due array per creare `finalImages`.
 * 5. Valida che il numero totale di immagini sia compreso tra 1 e 5.
 * 6. Crea un oggetto `updatedData` con tutti i dati (incluso `percorsi_immagine = finalImages`).
 * 7. Chiama `prodottiDao.updateProductAdmin()` per salvare le modifiche.
 * 8. Reindirizza alla dashboard sulla tab dei prodotti.
 */
router.post('/products/edit/:id', uploadWrapper, async (req, res) => {
    try {
        const productId = req.params.id;
        
        // --- Logica di gestione delle immagini (come in userRoutes.js) ---

        // 1. Immagini esistenti (riordinate/rimaste) dal form
        let existingImages = req.body.existing_images || [];
        if (typeof existingImages === 'string') {
            existingImages = [existingImages];
        }

        // 2. Nuove immagini caricate
        const newImages = (req.files || []).map(file => '/uploads/' + file.filename);

        // 3. Combinazione
        const finalImages = existingImages.concat(newImages);

        // 4. Validazione
        if (finalImages.length === 0) {
            req.flash('error', 'Il prodotto deve avere almeno 1 immagine.');
            return res.redirect('/admin/dashboard#prodotti');
        }
        if (finalImages.length > 5) {
            req.flash('error', 'Puoi caricare un massimo di 5 immagini in totale.');
            return res.redirect('/admin/dashboard#prodotti');
        }

        // 5. Prepara i dati da aggiornare
        const updatedData = { ...req.body };
        updatedData.percorsi_immagine = finalImages; // Imposta l'array di immagini aggiornato
        delete updatedData.existing_images; // Rimuove il campo non necessario

        // 6. Chiama il DAO per l'aggiornamento
        await prodottiDao.updateProductAdmin(productId, updatedData);
        req.flash('success', 'Prodotto aggiornato con successo.');
    } catch (err) {
        console.error("Errore during l'aggiornamento del prodotto (admin):", err);
        // Gestisce anche l'errore di file troppo grande
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
             req.flash('error', 'Errore: Ogni immagine non deve superare i 5MB.');
        } else {
             req.flash('error', 'Errore during l\'aggiornamento del prodotto.');
        }
    }
    // Reindirizza alla tab dei prodotti
    res.redirect('/admin/dashboard#prodotti');
});


module.exports = router;