-- Questo file definisce lo schema completo del database.
-- Eseguire questo script per creare tutte le tabelle necessarie.

-- Tabella per gli utenti
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  nome TEXT,
  cognome TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  data_nascita DATE,
  tipo_account TEXT DEFAULT 'cliente' -- Può essere 'cliente' o 'venditore'
);

-- Tabella per i prodotti
CREATE TABLE IF NOT EXISTS prodotti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descrizione TEXT,
    condizione TEXT, -- Es. 'nuovo', 'usato come nuovo', 'usato'
    parola_chiave TEXT NOT NULL,
    percorso_immagine TEXT, -- Percorso del file dell'immagine
    prezzo REAL, -- Per la vendita 'Compralo Subito'
    prezzo_asta REAL, -- Per la vendita 'Asta'
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per i dati aggiuntivi dei venditori
CREATE TABLE IF NOT EXISTS venditori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_negozio TEXT NOT NULL,
    partita_iva TEXT NOT NULL UNIQUE,
    email_contatto TEXT NOT NULL,
    iban TEXT NOT NULL,
    descrizione TEXT,
    user_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per le informazioni aggiuntive dell'account utente
CREATE TABLE IF NOT EXISTS accountinfos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    indirizzo TEXT,
    citta TEXT, 
    cap TEXT,
    immagine_profilo TEXT, 
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per lo storico degli ordini
CREATE TABLE IF NOT EXISTS storico_ordini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_ordine DATETIME DEFAULT CURRENT_TIMESTAMP,
    totale REAL NOT NULL,
    stato TEXT DEFAULT 'In elaborazione', -- Es. 'In elaborazione', 'Spedito', 'Consegnato'
    user_id INTEGER NOT NULL,
    prodotto_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE SET NULL
);

-- Aggiunge la colonna data_nascita se non esiste, per retrocompatibilità
-- SQLite non ha un comando 'IF NOT EXISTS' per ALTER TABLE, quindi l'errore viene ignorato nell'applicazione.
-- Qui lo commentiamo per chiarezza, ma l'applicazione lo gestisce.
-- ALTER TABLE accountinfos ADD COLUMN data_nascita DATE;

