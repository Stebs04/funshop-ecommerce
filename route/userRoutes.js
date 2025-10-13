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
    const validSections = ['dati', 'ordini', 'indirizzi', 'prodotti', 'statistiche'];

    if (!validSections.includes(section)) {
        return res.redirect('/utente');
    }
    if (section === 'statistiche' && req.user.tipo_account !== 'venditore') {
        return res.redirect('/utente');
    }

    try {
        // Carica tutti i dati in parallelo
        const [prodottiUtente, storicoOrdini, indirizziUtente, accountInfoResult] = await Promise.all([
            prodottiDao.getProductsByUserId(req.user.id),
            ordiniDao.getOrdersByUserId(req.user.id),
            indirizziDao.getIndirizziByUserId(req.user.id),
            informazioniDao.getAccountInfoByUserId(req.user.id)
        ]);
       const accountInfo = accountInfoResult || {}; // Assicura che accountInfo sia sempre un oggetto

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            user: req.user,
            accountInfo,
            currentSection: section,
            prodotti: prodottiUtente,
            ordini: storicoOrdini,
            indirizzi: indirizziUtente,
        });
    } catch (error) {
        console.error(`Errore nel caricare la dashboard utente:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento del tuo profilo.');
        res.redirect('/');
    }
});

/**
 * ROTTA UNIFICATA PER AGGIORNARE IL PROFILO UTENTE
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


// Configurazione Multer per upload immagine
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

// Rotta per upload immagine profilo
router.post('/dati/upload-immagine', upload, async (req, res) => {
    // Aggiungiamo un log per il debug
    console.log('File ricevuto:', req.file);

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
// (La logica qui è corretta e non necessita modifiche)

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
        console.error(err);
        req.flash('error', "Errore durante l'aggiunta dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});

router.post('/indirizzi/aggiorna/:id', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isNumeric().withMessage('Il CAP deve essere un numero.').isLength({ min: 5, max: 5 }).withMessage('Il CAP deve essere di 5 cifre.')
], async (req, res) => {
    console.log('--- Richiesta di aggiornamento indirizzo ---');
    console.log('ID Indirizzo:', req.params.id);
    console.log('Dati ricevuti:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Errore di validazione:', errors.array());
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=indirizzi');
    }

    try {
        const indirizzoId = req.params.id;
        const userId = req.user.id;

        console.log(`Recupero indirizzo con ID: ${indirizzoId}`);
        const indirizzo = await indirizziDao.getIndirizzoById(indirizzoId);

        if (indirizzo) {
            console.log('Indirizzo trovato:', indirizzo);
            console.log(`Confronto ID utente: (req.user.id: ${userId}, tipo: ${typeof userId}) vs (indirizzo.user_id: ${indirizzo.user_id}, tipo: ${typeof indirizzo.user_id})`);

            if (indirizzo.user_id === userId) {
                console.log('Autorizzazione confermata. Aggiornamento in corso...');
                await indirizziDao.updateIndirizzo(indirizzoId, req.body);
                req.flash('success', 'Indirizzo aggiornato con successo!');
                console.log('Aggiornamento completato con successo.');
            } else {
                console.log('Autorizzazione negata.');
                req.flash('error', 'Azione non permessa.');
            }
        } else {
            console.log('Indirizzo non trovato.');
            req.flash('error', 'Indirizzo non trovato.');
        }
    } catch (err) {
        console.error('--- ERRORE CRITICO ---');
        console.error(err);
        req.flash('error', "Si è verificato un errore grave durante l'aggiornamento dell'indirizzo.");
    }
    console.log('--- Fine richiesta ---');
    res.redirect('/utente?section=indirizzi');
});

router.post('/indirizzi/elimina/:id', async (req, res) => {
    try {
        // Aggiungi un controllo per assicurarti che l'utente possa eliminare solo i propri indirizzi
        const indirizzo = await indirizziDao.getIndirizzoById(req.params.id);
        if (indirizzo && indirizzo.user_id === req.user.id) {
            await indirizziDao.deleteIndirizzo(req.params.id, req.user.id);
            req.flash('success', 'Indirizzo eliminato con successo!');
        } else {
            req.flash('error', 'Azione non permessa.');
        }
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'eliminazione dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});


// --- ROTTE PRODOTTI ---
// (Nessuna modifica qui)

router.post('/prodotti/:id/delete', async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        const result = await prodottiDao.deleteProduct(productId, userId);
        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto eliminato con successo.');
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'eliminazione del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

router.get('/prodotti/:id/edit', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await prodottiDao.getProductById(productId);

        if (!product || product.user_id !== req.user.id) {
            req.flash('error', 'Azione non permessa.');
            return res.redirect('/utente?section=prodotti');
        }

        res.render('pages/edit-prodotto', {
            title: 'Modifica Prodotto',
            prodotto: product,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore nel caricamento della pagina di modifica.');
        res.redirect('/utente?section=prodotti');
    }
});

router.post('/prodotti/:id/edit', async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        const updatedData = { ...req.body };

        if (req.file) {
            updatedData.percorso_immagine = '/uploads/' + req.file.filename;
        }
        
        const result = await prodottiDao.updateProduct(productId, updatedData, userId);

        if (result === 0) {
            req.flash('error', 'Azione non permessa o prodotto non trovato.');
        } else {
            req.flash('success', 'Prodotto aggiornato con successo.');
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'aggiornamento del prodotto.');
    }
    res.redirect('/utente?section=prodotti');
});

module.exports = router;