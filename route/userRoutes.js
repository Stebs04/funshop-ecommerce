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
const indirizziDao = require('../models/dao/indirizzi-dao'); // <-- NUOVO DAO

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
            indirizziDao.getIndirizziByUserId(req.user.id), // <-- USA NUOVO DAO
            informazioniDao.getAccountInfoByUserId(req.user.id) // Modificato
        ]);
        const accountInfo = accountInfoResult || {};

        res.render('pages/utente', {
            title: 'Il Mio Profilo',
            user: req.user,
            accountInfo,
            currentSection: section,
            prodotti: prodottiUtente,
            ordini: storicoOrdini,
            indirizzi: indirizziUtente, // Passa gli indirizzi dal nuovo DAO
        });
    } catch (error) {
        console.error(`Errore nel caricare la dashboard utente:`, error);
        req.flash('error', 'Si è verificato un errore durante il caricamento del tuo profilo.');
        res.redirect('/');
    }
});

// Aggiorna dati anagrafici
router.post('/dati/aggiorna', [
    check('nome').notEmpty().withMessage('Il nome è obbligatorio'),
    check('cognome').notEmpty().withMessage('Il cognome è obbligatorio'),
    check('username').isLength({ min: 3 }).withMessage('L\'username è obbligatorio'),
    check('data_nascita').isDate().withMessage('La data di nascita non è valida')
], async (req, res) => {
    // ... (nessuna modifica qui)
});

// Configurazione Multer
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits:{fileSize: 1000000}, fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if(mimetype && extname) return cb(null,true);
    cb('Error: Images Only!');
}}).single('immagineProfilo');

// Upload immagine profilo
router.post('/dati/upload-immagine', (req, res) => {
    // ... (nessuna modifica qui)
});


// --- NUOVE ROTTE PER GLI INDIRIZZI ---

// Aggiungi un nuovo indirizzo
router.post('/indirizzi/aggiungi', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isPostalCode('IT').withMessage('Il CAP non è valido.')
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

// Aggiorna un indirizzo
router.post('/indirizzi/aggiorna/:id', [
    check('indirizzo').notEmpty().withMessage('L\'indirizzo è obbligatorio.'),
    check('citta').notEmpty().withMessage('La città è obbligatoria.'),
    check('cap').isPostalCode('IT').withMessage('Il CAP non è valido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(e => e.msg));
        return res.redirect('/utente?section=indirizzi');
    }
    try {
        await indirizziDao.updateIndirizzo(req.params.id, req.body);
        req.flash('success', 'Indirizzo aggiornato con successo!');
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'aggiornamento dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});

// Elimina un indirizzo
router.post('/indirizzi/elimina/:id', async (req, res) => {
    try {
        await indirizziDao.deleteIndirizzo(req.params.id, req.user.id);
        req.flash('success', 'Indirizzo eliminato con successo!');
    } catch (err) {
        console.error(err);
        req.flash('error', "Errore durante l'eliminazione dell'indirizzo.");
    }
    res.redirect('/utente?section=indirizzi');
});


// --- ROTTE PRODOTTI (Nessuna modifica qui) ---
// ...

module.exports = router;