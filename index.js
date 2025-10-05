// --- 1. IMPORTAZIONI DELLE LIBRERIE ---
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer'); // Aggiungi multer
const path = require('path');
const fs = require('fs');


// --- 2. CONFIGURAZIONE INIZIALE DI EXPRESS ---
const app = express();
const port = 5500;

// --- 3. CONFIGURAZIONE DEI MIDDLEWARE (ORDINE CORRETTO) ---

// 1. PRIMO: Servi i file statici (HTML, CSS, JS del client) dalla cartella 'public'
// In questo modo, le richieste per i file non vengono processate dalle sessioni.
app.use(express.static(path.join(__dirname, 'public')));

// 2. POI: Permetti a Express di leggere i dati inviati dai form
app.use(express.urlencoded({ extended: true }));

// 3. DOPO: Configura le sessioni. Questo deve venire PRIMA di passport.
app.use(session({
    secret: 'una-chiave-segreta-molto-importante-e-difficile-da-indovinare', // CAMBIA QUESTA CHIAVE!
    resave: false,
    saveUninitialized: false
}));

// 4. INFINE: Inizializza Passport.js per l'autenticazione
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
    // Aggiungi 'tipo_account' alla query SELECT
    db.get('SELECT id, username, tipo_account FROM users WHERE id = ?', id, (err, user) => {
        done(err, user);
    });
});

const uploadsDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    // Se la cartella non esiste...
    fs.mkdirSync(uploadsDir, { recursive: true }); // ...creala (e anche 'public' se necessario)
    console.log(`Cartella 'uploads' creata con successo in: ${uploadsDir}`);
}


// Configurazione di Multer per il caricamento dei file (VERSIONE CORRETTA E ROBUSTA)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Usiamo path.join per creare un percorso assoluto e sicuro
        // __dirname è il percorso della cartella corrente (dove si trova index.js)
        const dest = path.join(__dirname, 'public', 'uploads');
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        // Crea un nome univoco per il file per evitare sovrascritture
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


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
    successRedirect: '/index.html',   // Se il login ha successo, vai alla pagina profilo
    failureRedirect: '/login.html'     // Se fallisce, torna alla pagina di login
}));

// Rotta per il LOGOUT
app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/'); // Reindirizza alla homepage dopo il logout
    });
});


// AGGIUNGI QUESTA NUOVA ROTTA NEL TUO index.js
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        // Aggiungi tipo_account all'oggetto utente
        res.json({ 
            isAuthenticated: true, 
            user: { 
                id: req.user.id, 
                username: req.user.username, 
                tipo_account: req.user.tipo_account // <-- Riga aggiunta
            } 
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});


// Query per creare la tabella dei prodotti se non esiste già
const createProdottiTableSql = `
CREATE TABLE IF NOT EXISTS prodotti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descrizione TEXT,
    condizione TEXT, -- Es. 'nuovo', 'usato come nuovo', 'usato'
    parola_chiave TEXT NOT NULL,
    percorso_immagine TEXT, -- Percorso del file dell'immagine salvata in locale
    prezzo REAL,
    prezzo_asta REAL,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);`;

db.run(createProdottiTableSql, (err) => {
        if (err) {
                console.error("Errore durante la creazione della tabella prodotti:", err.message);
        } else {
                console.log("Tabella 'prodotti' pronta.");
        }
});

const deleteuser = `DROP TABLE users`;
const deleteproduct = `DROP TABLE prodotti`

// Middleware per verificare se l'utente è autenticato
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).redirect('/login.html'); // Non autorizzato, reindirizza al login
}

// SOSTITUISCI la tua attuale rotta /nuovo-prodotto con questa

app.post('/nuovo-prodotto', ensureAuthenticated, upload.single('percorso_immagine'), (req, res) => {
    // I dati testuali del form ora sono in req.body
    const { nome, descrizione, condizione, parola_chiave, sellingType } = req.body;
    
    // Le informazioni sul file caricato sono in req.file
    if (!req.file) {
        return res.status(400).send("È necessario caricare un'immagine per il prodotto.");
    }
    const percorsoImmagine = '/uploads/' + req.file.filename;
    const userId = req.user.id;

    // --- LOGICA DI VALIDAZIONE CORRETTA ---
    let prezzo = 0;
    let prezzo_asta = 0;

    // Controlliamo i campi comuni
    if (!nome || !condizione || !parola_chiave) {
        return res.status(400).send("Per favore, compila tutti i campi obbligatori (nome, condizione, parole chiave).");
    }

    // Controlliamo il prezzo in base al tipo di vendita
    if (sellingType === 'buyNow') {
        if (!req.body.prezzo) {
            return res.status(400).send("Per favore, inserisci un prezzo di vendita.");
        }
        prezzo = parseFloat(req.body.prezzo);
    } else if (sellingType === 'auction') {
        if (!req.body.prezzo_asta) {
            return res.status(400).send("Per favore, inserisci un prezzo di partenza per l'asta.");
        }
        prezzo_asta = parseFloat(req.body.prezzo_asta);
    } else {
        return res.status(400).send("Modalità di vendita non valida.");
    }
    // --- FINE LOGICA DI VALIDAZIONE ---

    const sql = `INSERT INTO prodotti 
                 (nome, descrizione, condizione, parola_chiave, percorso_immagine, prezzo, prezzo_asta, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [nome, descrizione, condizione, parola_chiave, percorsoImmagine, prezzo, prezzo_asta, userId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Errore durante l'inserimento del prodotto:", err.message);
            return res.status(500).send("Si è verificato un errore durante l'inserimento del prodotto.");
        }
        console.log(`Nuovo prodotto inserito con ID: ${this.lastID}`);
        res.redirect('/index.html');
    });
});

// NUOVA ROTTA: Fornisce tutti i prodotti per la homepage
app.get('/api/products', (req, res) => {
    // La query JOIN unisce prodotti e utenti per ottenere il nome del venditore
    const sql = `
        SELECT
            p.id,
            p.nome,
            p.descrizione,
            p.condizione,
            p.parola_chiave,
            p.percorso_immagine,
            p.prezzo,
            p.prezzo_asta,
            u.username AS nome_venditore
        FROM
            prodotti p
        JOIN
            users u ON p.user_id = u.id
        ORDER BY
            p.data_inserimento DESC; -- Ordina per i più recenti
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Errore durante il recupero dei prodotti:", err.message);
            return res.status(500).json({ error: "Errore interno del server" });
        }
        res.json(rows); // Invia i prodotti trovati come risposta JSON
    });
});


// Query per creare la tabella dei venditori se non esiste già
const createVenditoriTableSql = `
CREATE TABLE IF NOT EXISTS venditori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_negozio TEXT NOT NULL,
    partita_iva TEXT NOT NULL UNIQUE,
    email_contatto TEXT NOT NULL,
    iban TEXT NOT NULL,
    descrizione TEXT,
    user_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);`;

db.run(createVenditoriTableSql, (err) => {
        if (err) {
                console.error("Errore durante la creazione della tabella venditori:", err.message);
        } else {
                console.log("Tabella 'venditori' pronta.");
        }
});


// NUOVA ROTTA: Gestisce la registrazione come venditore
app.post('/venditore', ensureAuthenticated, (req, res) => {
    console.log("Dati ricevuti dal modulo:", req.body); 
    const { nome_negozio, partita_iva, email_contatto, iban, descrizione } = req.body;
    const userId = req.user.id;

    // Validazione di base
    if (!nome_negozio || !partita_iva || !email_contatto || !iban) {
        return res.status(400).send("Per favore, compila tutti i campi obbligatori.");
    }

    // Usiamo una transazione per garantire che entrambe le query vengano eseguite correttamente
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        const insertVenditoreSql = `
            INSERT INTO venditori (nome_negozio, partita_iva, email_contatto, iban, descrizione, user_id)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const paramsVenditore = [nome_negozio, partita_iva, email_contatto, iban, descrizione, userId];

        db.run(insertVenditoreSql, paramsVenditore, function(err) {
            if (err) {
                console.error("Errore durante l'inserimento nella tabella venditori:", err.message);
                db.run("ROLLBACK;"); // Annulla la transazione
                return res.status(500).send("Errore durante la registrazione come venditore. La Partita IVA potrebbe essere già in uso.");
            }

            const updateUserSql = `UPDATE users SET tipo_account = 'venditore' WHERE id = ?;`;
            db.run(updateUserSql, [userId], function(err) {
                if (err) {
                    console.error("Errore durante l'aggiornamento del tipo di account:", err.message);
                    db.run("ROLLBACK;"); // Annulla la transazione
                    return res.status(500).send("Errore durante l'aggiornamento del tuo account.");
                }

                // Se entrambe le query hanno successo, conferma la transazione
                db.run("COMMIT;", (err) => {
                    if (err) {
                        console.error("Errore durante il commit della transazione:", err.message);
                        return res.status(500).send("Errore critico del database.");
                    }
                    console.log(`L'utente con ID ${userId} è ora un venditore.`);
                    res.redirect('/index.html'); // Reindirizza alla homepage o a una pagina di successo
                });
            });
        });
    });
});

// Query per creare la tabella delle informazioni account se non esiste già
const createAccountInfosTableSql = `
CREATE TABLE IF NOT EXISTS accountinfos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    indirizzo TEXT,      -- Indirizzo di spedizione principale
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);`;

db.run(createAccountInfosTableSql, (err) => {
    if (err) {
        console.error("Errore durante la creazione della tabella accountinfos:", err.message);
    } else {
        console.log("Tabella 'accountinfos' pronta.");
    }
});

// Aggiungi una colonna per la data di nascita se non esiste
db.run("ALTER TABLE accountinfos ADD COLUMN data_nascita DATE;", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error("Errore durante l'aggiunta della colonna data_nascita:", err.message);
    } else {
        console.log("Colonna 'data_nascita' pronta in 'accountinfos'.");
    }
});

// NUOVA ROTTA: Aggiorna i dati dell'utente
app.post('/api/user/update', ensureAuthenticated, (req, res) => {
    const { nome, cognome, email, data_nascita } = req.body;
    const userId = req.user.id;

    // Validazione di base
    if (!nome || !cognome || !email) {
        return res.status(400).send("Nome, cognome e email sono campi obbligatori.");
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        // 1. Aggiorna la tabella 'users'
        const updateUserSql = `UPDATE users SET nome = ?, cognome = ?, email = ? WHERE id = ?`;
        db.run(updateUserSql, [nome, cognome, email, userId], function(err) {
            if (err) {
                console.error("Errore durante l'aggiornamento della tabella users:", err.message);
                db.run("ROLLBACK;");
                return res.status(500).send("Errore durante l'aggiornamento dei dati. L'email potrebbe essere già in uso.");
            }

            // 2. Gestisci la data di nascita nella tabella 'accountinfos' (UPSERT)
            // Prova a inserire, se l'utente esiste già, aggiorna la data di nascita.
            const upsertAccountInfoSql = `
                INSERT INTO accountinfos (user_id, data_nascita) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET data_nascita = excluded.data_nascita;
            `;
            db.run(upsertAccountInfoSql, [userId, data_nascita || null], function(err) {
                if (err) {
                    console.error("Errore durante l'aggiornamento della tabella accountinfos:", err.message);
                    db.run("ROLLBACK;");
                    return res.status(500).send("Errore durante l'aggiornamento delle informazioni dell'account.");
                }

                // Se tutto è andato a buon fine, conferma la transazione
                db.run("COMMIT;", (err) => {
                    if (err) {
                        console.error("Errore durante il commit della transazione:", err.message);
                        return res.status(500).send("Errore critico del database.");
                    }
                    console.log(`Dati dell'utente con ID ${userId} aggiornati con successo.`);
                    res.redirect('/utente.html?success=true'); // Reindirizza con un parametro di successo
                });
            });
        });
    });
});

// NUOVA ROTTA: Fornisce lo storico degli ordini dell'utente
app.get('/api/user/orders', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT id, data_ordine, totale, stato FROM storico_ordini WHERE user_id = ? ORDER BY data_ordine DESC`;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Errore durante il recupero dello storico ordini:", err.message);
            return res.status(500).json({ error: "Errore interno del server." });
        }
        res.json(rows);
    });
});

// NUOVA ROTTA: Fornisce i dati dell'utente per la pagina del profilo
app.get('/api/user/details', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;

    // Query per ottenere i dati da entrambe le tabelle
    const sql = `
        SELECT
            u.nome,
            u.cognome,
            u.email,
            ai.data_nascita
        FROM
            users u
        LEFT JOIN
            accountinfos ai ON u.id = ai.user_id
        WHERE
            u.id = ?;
    `;

    db.get(sql, [userId], (err, row) => {
        if (err) {
            console.error("Errore durante il recupero dei dati dell'utente:", err.message);
            return res.status(500).json({ error: "Errore interno del server." });
        }
        if (!row) {
            return res.status(404).json({ error: "Utente non trovato." });
        }
        res.json(row);
    });
});

// Query per creare la tabella storico_ordini se non esiste già
db.run(`
CREATE TABLE IF NOT EXISTS storico_ordini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_ordine DATETIME DEFAULT CURRENT_TIMESTAMP,
    totale REAL NOT NULL,
    stato TEXT DEFAULT 'In elaborazione', -- Es. 'In elaborazione', 'Spedito', 'Consegnato'
    user_id INTEGER NOT NULL,
    prodotto_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE SET NULL
);`, (err) => {
    if (err) {
        console.error("Errore durante la creazione della tabella storico_ordini:", err.message);
    } else {
        console.log("Tabella 'storico_ordini' pronta.");
    }
});

// --- 7. AVVIO DEL SERVER ---
app.listen(port, () => {
    console.log(`Server FunShop in ascolto su http://localhost:${port}`);
});



