// --- 1. IMPORTAZIONI DELLE LIBRERIE ---
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');

// --- 2. CONFIGURAZIONE INIZIALE DI EXPRESS ---
const app = express();
const port = 5500;

// --- 3. CONFIGURAZIONE DEI MIDDLEWARE ---

// Servi i file statici (HTML, CSS, JS del client) dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Permetti a Express di leggere i dati inviati dai form
app.use(express.urlencoded({ extended: true }));

// Configurazione di express-session per la gestione delle sessioni
app.use(session({
    secret: 'una-chiave-segreta-molto-importante-e-difficile-da-indovinare', // CAMBIA QUESTA CHIAVE!
    resave: false,
    saveUninitialized: false
}));

// Inizializzazione di Passport.js per l'autenticazione
app.use(passport.initialize());
app.use(passport.session());

const db = new sqlite3.Database('database/datastorage.db', (err) => {
    if (err) {
        console.error("Errore durante la connessione al database:", err.message);
    } else {
        console.log('Connesso al database SQLite.');
    }
});

// Query per creare la tabella degli utenti se non esiste già
const createUserTableSql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  nome TEXT,
  cognome TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  tipo_account TEXT DEFAULT 'cliente' 
);`;

db.run(createUserTableSql, (err) => {
    if (err) {
        console.error("Errore durante la creazione della tabella:", err.message);
    } else {
        console.log("Tabella 'users' pronta.");
    }
});

// --- 5. CONFIGURAZIONE DI PASSPORT.JS ---

// Definiamo come Passport deve verificare le credenziali (la "strategia locale")
passport.use(new LocalStrategy({
    usernameField: 'email' // Specifichiamo che il campo "username" per il login è l'email
}, (email, password, done) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, user) => {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Email non trovata.' }); }
        
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) { return done(err); }
            if (isMatch) {
                return done(null, user); // Le password corrispondono, l'utente è autenticato
            } else {
                return done(null, false, { message: 'Password errata.' });
            }
        });
    });
}));

// Spieghiamo a Passport come salvare l'utente nella sessione (salviamo solo l'ID)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Spieghiamo a Passport come recuperare i dati dell'utente dalla sessione usando l'ID
passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});


// --- 6. DEFINIZIONE DELLE ROTTE ---

// Rotta per la REGISTRAZIONE
app.post('/registrazione', async (req, res) => {
    const { username, nome, cognome, email, password } = req.body;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (username, nome, cognome, email, password_hash) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [username, nome, cognome, email, password_hash], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Errore durante la registrazione. L'email o l'username potrebbero essere già in uso.");
            }
            console.log(`Nuovo utente registrato con ID: ${this.lastID}`);
            res.redirect('/login.html'); // Reindirizza al login dopo la registrazione
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Si è verificato un errore nel server.");
    }
});

// Rotta per il LOGIN (usa Passport per l'autenticazione)
app.post('/login', passport.authenticate('local', {
    successRedirect: '/index_login.html',   // Se il login ha successo, vai alla pagina profilo
    failureRedirect: '/login.html'     // Se fallisce, torna alla pagina di login
}));

// Rotta per il LOGOUT
app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/'); // Reindirizza alla homepage dopo il logout
    });
});


// --- 7. AVVIO DEL SERVER ---
app.listen(port, () => {
    console.log(`Server FunShop in ascolto su http://localhost:${port}`);
}); 

