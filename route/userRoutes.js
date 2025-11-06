// File: route/userRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Import di tutti i DAO necessari per la dashboard utente
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const informazioniDao = require('../models/dao/informazioni-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const observedDao = require('../models/dao/observed-dao');

// Array delle categorie da passare al template
const categorie = [
    "Anime & Manga",
    "Carte da gioco collezionabili",
    "Action Figure & Statue",
    "Videogiochi",
    "Modellismo & Replica",
    "LEGO / Brick compatibili"
];

/**
 * Middleware `ensureAuthenticated`
 * Protegge tutte le rotte in questo file.
 */
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    res.redirect('/auth/login');
};
// Applica il middleware a tutte le rotte definite in questo file.
router.use(ensureAuthenticated);

/**
 * ROTTA: GET /utente/ e GET /utente/:section
 * Gestisce la visualizzazione della dashboard utente.
 * Carica in parallelo tutti i dati necessari per le varie sezioni.
 */
router.get(['/', '/:section'], async (req, res) => {
    const section = req.params.section || req.query.section || 'dati';
    const validSections = ['dati', 'ordini', 'indirizzi', 'prodotti', 'statistiche', 'pagamento'];

    if (!validSections.includes(section)) {
        return res.redirect('/utente');
    }
    if (section === 'statistiche' && req.user.tipo_account !== 'venditore') {
        return res.redirect('/utente');
    }

    try {
        // Caricamento parallelo dei dati
        const dataPromises = [
            // getProductsByUserId ora restituisce l'array completo 'percorsi_immagine'
            // Dobbiamo modificarlo, o meglio, prelevare i dati completi qui
            // No, getProductsByUserId è usato per la card, ma nella dashboard utente
            // è meglio avere tutti i dati per il modale.
            // Aggiorniamo la query in getProductsByUserId per prendere p.*
            // ... No, ho già aggiornato getProductsByUserId nel DAO per prendere la cover.
            // Per la dashboard utente, ho bisogno dei *dati completi* per il modale.
            // Carico una versione diversa.
            prodottiDao.getProductsByUserId(req.user.id), // Questo usa la cover
            ordiniDao.getOrdersByUserId(req.user.id),
            indirizziDao.getIndirizziByUserId(req.user.id),
            informazioniDao.getAccountInfoByUserId(req.user.id),
            metodiPagamentoDao.getMetodiPagamentoByUserId(req.user.id),
            // Carico qui i prodotti completi per il modale di modifica
            prodottiDao.getProductsByUserId(req.user.id).then(products => 
                prodottiDao.getProductsByIds(products.map(p => p.id))
            ) 
        ];

        if (req.user.tipo_account === 'venditore') {
            dataPromises.push(ordiniDao.getSalesStatsBySellerId(req.user.id));
        }

        const results = await Promise.all(dataPromises);

        const [prodottiPerCard, storicoOrdini, indirizziUtente, accountInfoResult, metodiPagamento, prodottiCompleti] = results;
        const sellerStats = req.user.tipo_account === 'venditore' ? results[6] : null;
        
        const accountInfo = accountInfoResult || {};

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            user: req.user,
            accountInfo,
            currentSection: section,
            // Usiamo i prodotti completi per la sezione 'prodotti'
            prodotti: (section === 'prodotti' || section === 'statistiche') ? prodottiCompleti : prodottiPerCard,
            ordini: storicoOrdini,
            indirizzi: indirizziUtente,
            metodiPagamento: metodiPagamento,
            sellerStats: sellerStats,
            categorie: categorie, // Passa l'array delle categorie al template
        });
    } catch (error) {
        console.error(`Errore nel caricare la dashboard utente:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento del tuo profilo.');
        res.redirect('/');
    }
});

/**
 * ROTTA: POST /utente/profilo/aggiorna
 * Gestisce l'aggiornamento dei dati personali dell'utente.
 */
router.post('/profilo/aggiorna', [
    check('nome').notEmpty().withMessage('Il nome è obbligatorio'),
    check('cognome').notEmpty().withMessage('Il cognome è obbligatorio'),
    check('username').isLength({ min: 3 }).withMessage('L\'username deve avere almeno 3 caratteri'),
    check('data_nascita').optional({ checkFalsy: true }).isDate().withMessage('La data di nascita non è valida'),
    check('descrizione').optional().isString().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=dati');
    }

    try {
        // Il DAO esegue una transazione per aggiornare 'users' e 'accountinfos'
        await utentiDao.updateUserProfile(req.user.id, req.body);
        req.flash('success', 'Dati aggiornati con successo!');
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati:", error);
        req.flash('error', 'Errore durante l\'aggiornamento. L\'username potrebbe essere già in uso.');
    }
    res.redirect('/utente?section=dati');
});

/**
 * ROTTA: POST /utente/profilo/elimina
 * Gestisce l'eliminazione dell'account dell'utente.
 */
router.post('/profilo/elimina', async (req, res) => {
    try {
        await utentiDao.deleteUser(req.user.id);
        req.logout((err) => {
            if (err) {
                console.error("Errore durante il logout dopo l'eliminazione dell'account:", err);
                return res.redirect('/?delete_error=true');
            }
            // Reindirizza alla homepage con un parametro query
            res.redirect('/?deleted=true');
        });
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'account:", error);
        res.redirect('/utente?section=dati&delete_error=true');
    }
});


// --- CONFIGURAZIONE MULTER PER CARICAMENTO FILE ---

// Configurazione per l'immagine del profilo (file singolo)
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, 'immagineProfilo-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits:{fileSize: 1000000},
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if(mimetype && extname) return cb(null,true);
        cb('Errore: Solo immagini (jpeg, jpg, png, gif)!');
    }
}).single('immagineProfilo'); // Accetta un solo file

// Configurazione per le immagini dei prodotti (file multipli)
const productStorage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, 'percorso_immagine-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadProductImage = multer({
    storage: productStorage,
    limits:{fileSize: 1000000},
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if(mimetype && extname) return cb(null,true);
        cb(new Error('Errore: Puoi caricare solo immagini!'));
    }
}).array('percorso_immagine', 5); // Accetta fino a 5 file con nome 'percorso_immagine'


/**
 * ROTTA: POST /utente/dati/upload-immagine
 * Gestisce il caricamento di una nuova immagine del profilo.
 */
router.post('/dati/upload-immagine', (req, res) => {
    // Usiamo il wrapper per 'upload' (singolo file)
    upload(req, res, async (err) => {
        if (err) {
            req.flash('error', err.message || err);
            return res.redirect('/utente?section=dati');
        }
        if (!req.file) {
            req.flash('error', 'Nessun file selezionato o formato non valido.');
            return res.redirect('/utente?section=dati');
        }
        try {
            const imagePath = '/uploads/' + req.file.filename;
            // Il DAO gestisce l'UPSERT (insert or update)
            await informazioniDao.updateProfileImage(req.user.id, imagePath);
            req.flash('success', 'Immagine del profilo aggiornata!');
        } catch (error) {
            console.error("Errore durante l'aggiornamento dell'immagine:", error);
            req.flash('error', 'Si è verificato un errore durante l\'aggiornamento dell\'immagine.');
        }
        res.redirect('/utente?section=dati');
    });
});


// --- ROTTE PER LA GESTIONE DEGLI INDIRIZZI ---

router.post('/indirizzi/aggiungi', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isNumeric().withMessage('Il CAP deve essere un numero.').isLength({ min: 5, max: 5 }).withMessage('Il CAP deve essere di 5 cifre.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=indirizzi');
    }
    try {
        await indirizziDao.createIndirizzo({ ...req.body, user_id: req.user.id });
        req.flash('success', 'Indirizzo aggiunto con successo!');
    } catch (err) {
        req.flash('error', "Errore durante l'aggiunta dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});

router.post('/indirizzi/aggiorna/:id', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isNumeric().withMessage('Il CAP deve essere un numero.').isLength({ min: 5, max: 5 }).withMessage('Il CAP deve essere di 5 cifre.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=indirizzi');
    }
    try {
        const indirizzo = await indirizziDao.getIndirizzoById(req.params.id);
        if (indirizzo && indirizzo.user_id === req.user.id) {
            await indirizziDao.updateIndirizzo(req.params.id, req.body);
            req.flash('success', 'Indirizzo aggiornato con successo!');
        } else {
            req.flash('error', 'Azione non permessa.');
        }
    } catch (err) {
        req.flash('error', "Errore during l'aggiornamento dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});

router.post('/indirizzi/elimina/:id', async (req, res) => {
    try {
        const indirizzo = await indirizziDao.getIndirizzoById(req.params.id);
        if (indirizzo && indirizzo.user_id === req.user.id) {
            await indirizziDao.deleteIndirizzo(req.params.id, req.user.id);
            req.flash('success', 'Indirizzo eliminato con successo!');
        } else {
            req.flash('error', 'Azione non permessa.');
        }
    } catch (err) {
        req.flash('error', "Errore during l'eliminazione dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});


// --- ROTTE PER I METODI DI PAGAMENTO ---

router.post('/pagamento/aggiungi', [
    check('nome_titolare').notEmpty().withMessage('Il nome del titolare è obbligatorio.'),
    check('numero_carta').isCreditCard().withMessage('Numero di carta non valido.'),
    check('data_scadenza').matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/).withMessage('Data di scadenza non valida (MM/YY).'),
    check('cvv').notEmpty().withMessage('Il CVV è obbligatorio.').isNumeric().withMessage('Il CVV deve essere un numero.').isLength({ min: 3, max: 4 }).withMessage('Il CVV deve avere 3 o 4 cifre.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=pagamento');
    }
    try {
        await metodiPagamentoDao.createMetodoPagamento({ ...req.body, user_id: req.user.id });
        req.flash('success', 'Metodo di pagamento aggiunto con successo!');
    } catch (err) {
        console.error("Errore durante l'aggiunta del metodo di pagamento:", err);
        req.flash('error', "Errore during l'aggiunta del metodo di pagamento.");
    }
    res.redirect('/utente?section=pagamento');
});


router.post('/pagamento/elimina/:id', async (req, res) => {
    try {
        // Il DAO controlla che l'ID utente corrisponda
        await metodiPagamentoDao.deleteMetodoPagamento(req.params.id, req.user.id);
        req.flash('success', 'Metodo di pagamento eliminato con successo!');
    } catch (err) {
        req.flash('error', "Errore during l'eliminazione.");
    }
    res.redirect('/utente?section=pagamento');
});


// --- ROTTE PER LA GESTIONE DEI PRODOTTI DEL VENDITORE ---

router.post('/prodotti/:id/delete', async (req, res) => {
    try {
        const productId = req.params.id;
        // Il DAO controlla che l'ID utente corrisponda
        const result = await prodottiDao.deleteProduct(productId, req.user.id);
        
        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto eliminato con successo.');
            // Notifica gli utenti che osservano il prodotto
            await observedDao.flagPriceChange(productId);
        }
    } catch (err) {
        req.flash('error', 'Errore durante l\'eliminazione del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

// Questa rotta ora usa 'uploadProductImage' (array)
router.post('/prodotti/:id/edit', uploadProductImage, async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        
        // Controlla la proprietà del prodotto
        const oldProduct = await prodottiDao.getProductById(productId);
        if (!oldProduct || oldProduct.user_id !== userId) {
            req.flash('error', 'Azione non permessa.');
            return res.redirect('/utente?section=prodotti');
        }
        const oldPrice = oldProduct.prezzo_scontato || oldProduct.prezzo;

        // Costruisce il nuovo array di immagini
        // 1. Prende le immagini esistenti ordinate inviate dal form
        let existingImages = req.body.existing_images || [];
        // Assicura che sia sempre un array (se solo un'immagine è rimasta, req.body la passa come stringa)
        if (typeof existingImages === 'string') {
            existingImages = [existingImages];
        }

        // 2. Prende le nuove immagini caricate
        const newImages = (req.files || []).map(file => '/uploads/' + file.filename);

        // 3. Le combina
        const finalImages = existingImages.concat(newImages);

        // 4. Valida i limiti
        if (finalImages.length === 0) {
            req.flash('error', 'Il prodotto deve avere almeno 1 immagine.');
            return res.redirect('/utente?section=prodotti');
        }
        if (finalImages.length > 5) {
            req.flash('error', 'Puoi caricare un massimo di 5 immagini in totale.');
            return res.redirect('/utente?section=prodotti');
        }

        // Prepara i dati da aggiornare
        const updatedData = { ...req.body };
        // Imposta il nuovo array di percorsi
        updatedData.percorsi_immagine = finalImages;
        // Rimuove i campi non necessari dal body prima di passarlo al DAO
        delete updatedData.existing_images; 
        
        const result = await prodottiDao.updateProduct(productId, updatedData, userId);
        
        if (result > 0) {
            req.flash('success', 'Prodotto aggiornato con successo.');
            
            // Controlla se il prezzo è cambiato per notificare gli osservatori
            const newPriceRaw = updatedData.prezzo_scontato || updatedData.prezzo;
            if (newPriceRaw) {
                const newPrice = parseFloat(newPriceRaw);
                if (newPrice !== oldPrice) {
                    await observedDao.flagPriceChange(productId);
                }
            }
        } else {
            req.flash('error', 'Nessuna modifica effettuata o prodotto non trovato.');
        }
    } catch (err) {
        console.error("Errore durante l'aggiornamento del prodotto:", err);
        if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
             req.flash('error', 'Puoi caricare un massimo di 5 immagini.');
        } else {
             req.flash('error', 'Errore durante l\'aggiornamento del prodotto.');
        }
    }
    res.redirect('/utente?section=prodotti');
});

module.exports = router;