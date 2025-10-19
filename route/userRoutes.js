// File: route/userRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Importa i DAO
const utentiDao = require('../models/dao/utenti-dao');
const prodottiDao = require('../models/dao/prodotti-dao');
const ordiniDao = require('../models/dao/ordini-dao');
const informazioniDao = require('../models/dao/informazioni-dao');
const indirizziDao = require('../models/dao/indirizzi-dao');
const metodiPagamentoDao = require('../models/dao/metodi-pagamento-dao');
const observedDao = require('../models/dao/observed-dao');

// Middleware di autenticazione
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    res.redirect('/auth/login');
};
router.use(ensureAuthenticated);

// Rotta per la dashboard utente
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


// --- ROTTE INDIRIZZI ---
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


// --- NUOVE ROTTE PER I METODI DI PAGAMENTO ---

router.post('/pagamento/aggiungi', [
    check('nome_titolare').notEmpty().withMessage('Il nome del titolare è obbligatorio.'),
    check('numero_carta').isCreditCard().withMessage('Numero di carta non valido.'),
    check('data_scadenza').matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/).withMessage('Data di scadenza non valida (MM/YY).')
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


// --- ROTTE PRODOTTI ---
router.post('/prodotti/:id/delete', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await prodottiDao.deleteProduct(productId, req.user.id);
        
        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto eliminato con successo.');
            await observedDao.flagPriceChange(productId);
        }
    } catch (err) {
        req.flash('error', 'Errore durante l\'eliminazione del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

// --- INIZIO MODIFICA: La rotta GET per la pagina di modifica è stata rimossa ---
// router.get('/prodotti/:id/edit', ...); // QUESTA ROTTA NON ESISTE PIÙ
// --- FINE MODIFICA ---

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