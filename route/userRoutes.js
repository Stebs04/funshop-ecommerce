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

/**
 * Middleware `ensureAuthenticated`
 * * Questo middleware "protegge" tutte le rotte definite in questo file.
 * * Logica:
 * 1. `req.isAuthenticated()`: Controlla se l'utente ha una sessione di login attiva.
 * 2. Se l'utente è loggato, `next()` permette alla richiesta di proseguire verso la rotta desiderata.
 * 3. Se l'utente non è loggato, viene mostrato un messaggio di errore e l'utente viene reindirizzato
 * alla pagina di login.
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
 * * Gestisce la visualizzazione della dashboard utente e delle sue varie sezioni
 * (dati personali, ordini, indirizzi, etc.).
 * * Logica:
 * 1. Determina la sezione richiesta dall'URL (es. `/utente/ordini`) o da un parametro query.
 * Se nessuna sezione è specificata, usa 'dati' come default.
 * 2. Valida la sezione richiesta per assicurarsi che sia una delle sezioni consentite.
 * 3. Utilizza `Promise.all` per caricare in parallelo tutti i dati necessari per popolare
 * le varie sezioni della dashboard, ottimizzando i tempi di caricamento.
 * - Se l'utente è un venditore, carica anche le sue statistiche di vendita.
 * 4. Renderizza la pagina `utente.ejs`, passando tutti i dati recuperati.
 * Il template userà la variabile `currentSection` per mostrare la tab corretta.
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
        const dataPromises = [
            prodottiDao.getProductsByUserId(req.user.id),
            ordiniDao.getOrdersByUserId(req.user.id),
            indirizziDao.getIndirizziByUserId(req.user.id),
            informazioniDao.getAccountInfoByUserId(req.user.id),
            metodiPagamentoDao.getMetodiPagamentoByUserId(req.user.id)
        ];

        if (req.user.tipo_account === 'venditore') {
            dataPromises.push(ordiniDao.getSalesStatsBySellerId(req.user.id));
        }

        const results = await Promise.all(dataPromises);

        const [prodottiUtente, storicoOrdini, indirizziUtente, accountInfoResult, metodiPagamento] = results;
        const sellerStats = req.user.tipo_account === 'venditore' ? results[5] : null;

        const accountInfo = accountInfoResult || {};

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            user: req.user,
            accountInfo,
            currentSection: section,
            prodotti: prodottiUtente,
            ordini: storicoOrdini,
            indirizzi: indirizziUtente,
            metodiPagamento: metodiPagamento,
            sellerStats: sellerStats,
        });
    } catch (error) {
        console.error(`Errore nel caricare la dashboard utente:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento del tuo profilo.');
        res.redirect('/');
    }
});

/**
 * ROTTA: POST /utente/profilo/aggiorna
 * * Gestisce l'aggiornamento dei dati personali dell'utente (nome, username, descrizione, etc.).
 * * Logica:
 * 1. Esegue la validazione dei campi inviati tramite il form.
 * 2. Se ci sono errori, li mostra all'utente.
 * 3. Se i dati sono validi, chiama il DAO `updateUserProfile` che esegue una transazione per
 * aggiornare sia la tabella `users` che `accountinfos` in modo atomico.
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
        await utentiDao.updateUserProfile(req.user.id, req.body);
        req.flash('success', 'Dati aggiornati con successo!');
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati:", error);
        req.flash('error', 'Errore durante l\'aggiornamento. L\'username potrebbe essere già in uso.');
    }
    res.redirect('/utente?section=dati');
});

// --- CONFIGURAZIONE MULTER PER CARICAMENTO FILE ---
// Vengono definite due configurazioni separate di Multer: una per le immagini del profilo
// e una per le immagini dei prodotti, per mantenere il codice organizzato.

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
}).single('immagineProfilo');

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
        cb('Errore: Solo immagini (jpeg, jpg, png, gif)!');
    }
}).single('percorso_immagine');

/**
 * ROTTA: POST /utente/dati/upload-immagine
 * * Gestisce il caricamento di una nuova immagine del profilo.
 */
router.post('/dati/upload-immagine', upload, async (req, res) => {
    if (!req.file) {
        req.flash('error', 'Nessun file selezionato o formato non valido.');
        return res.redirect('/utente?section=dati');
    }
    try {
        const imagePath = '/uploads/' + req.file.filename;
        await informazioniDao.updateProfileImage(req.user.id, imagePath);
        req.flash('success', 'Immagine del profilo aggiornata!');
    } catch (error) {
        console.error("Errore durante l'aggiornamento dell'immagine:", error);
        req.flash('error', 'Si è verificato un errore durante l\'aggiornamento dell\'immagine.');
    }
    res.redirect('/utente?section=dati');
});


// --- ROTTE PER LA GESTIONE DEGLI INDIRIZZI ---
// Seguono uno schema CRUD (Create, Read, Update, Delete) standard.

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
        req.flash('error', "Errore durante l'aggiornamento dell'indirizzo.");
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
        req.flash('error', "Errore durante l'eliminazione dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});


// --- ROTTE PER I METODI DI PAGAMENTO ---

/**
 * ROTTA: POST /utente/pagamento/aggiungi
 * * Gestisce l'aggiunta di una nuova carta di credito.
 * * LOGICA CORRETTA:
 * 1. Viene eseguita una validazione completa su tutti i campi necessari:
 * - `nome_titolare`: non deve essere vuoto.
 * - `numero_carta`: deve essere un numero di carta di credito valido.
 * - `data_scadenza`: deve essere nel formato MM/YY.
 * - `cvv`: **(CORREZIONE)** deve essere un numero di 3 o 4 cifre. Questo controllo era mancante.
 * 2. Se la validazione fallisce, vengono mostrati gli errori.
 * 3. Se la validazione ha successo, viene chiamato il DAO per creare il nuovo metodo di pagamento,
 * associandolo all'ID dell'utente loggato.
 */
router.post('/pagamento/aggiungi', [
    check('nome_titolare').notEmpty().withMessage('Il nome del titolare è obbligatorio.'),
    check('numero_carta').isCreditCard().withMessage('Numero di carta non valido.'),
    check('data_scadenza').matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/).withMessage('Data di scadenza non valida (MM/YY).'),
    // --- INIZIO CORREZIONE ---
    // Aggiunta della validazione per il campo CVV, che prima mancava.
    check('cvv').notEmpty().withMessage('Il CVV è obbligatorio.').isNumeric().withMessage('Il CVV deve essere un numero.').isLength({ min: 3, max: 4 }).withMessage('Il CVV deve avere 3 o 4 cifre.')
    // --- FINE CORREZIONE ---
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=pagamento');
    }
    try {
        // Ora tutti i dati, incluso il CVV, vengono passati correttamente al DAO.
        await metodiPagamentoDao.createMetodoPagamento({ ...req.body, user_id: req.user.id });
        req.flash('success', 'Metodo di pagamento aggiunto con successo!');
    } catch (err) {
        console.error("Errore durante l'aggiunta del metodo di pagamento:", err);
        req.flash('error', "Errore durante l'aggiunta del metodo di pagamento.");
    }
    res.redirect('/utente?section=pagamento');
});


router.post('/pagamento/elimina/:id', async (req, res) => {
    try {
        await metodiPagamentoDao.deleteMetodoPagamento(req.params.id, req.user.id);
        req.flash('success', 'Metodo di pagamento eliminato con successo!');
    } catch (err) {
        req.flash('error', "Errore durante l'eliminazione.");
    }
    res.redirect('/utente?section=pagamento');
});


// --- ROTTE PER LA GESTIONE DEI PRODOTTI DEL VENDITORE ---

router.post('/prodotti/:id/delete', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await prodottiDao.deleteProduct(productId, req.user.id);
        
        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto eliminato con successo.');
            // Notifica gli utenti che osservavano il prodotto che è stato rimosso.
            await observedDao.flagPriceChange(productId);
        }
    } catch (err) {
        req.flash('error', 'Errore durante l\'eliminazione del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

router.post('/prodotti/:id/edit', uploadProductImage, async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        
        const oldProduct = await prodottiDao.getProductById(productId);
        if (!oldProduct || oldProduct.user_id !== userId) {
            req.flash('error', 'Azione non permessa.');
            return res.redirect('/utente?section=prodotti');
        }
        const oldPrice = oldProduct.prezzo_scontato || oldProduct.prezzo;

        const updatedData = { ...req.body };
        if (req.file) {
            updatedData.percorso_immagine = '/uploads/' + req.file.filename;
        }
        
        const result = await prodottiDao.updateProduct(productId, updatedData, userId);
        
        if (result > 0) {
            req.flash('success', 'Prodotto aggiornato con successo.');
            
            // Logica di notifica: se il prezzo è cambiato, aggiorna lo stato per gli osservatori.
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
        req.flash('error', 'Errore durante l\'aggiornamento del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

module.exports = router;