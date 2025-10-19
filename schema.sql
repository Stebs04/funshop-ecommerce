-- File: schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  nome TEXT,
  cognome TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  data_nascita DATE,
  tipo_account TEXT DEFAULT 'cliente'
);

CREATE TABLE IF NOT EXISTS prodotti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descrizione TEXT,
    condizione TEXT,
    parola_chiave TEXT NOT NULL,
    percorso_immagine TEXT,
    prezzo REAL,
    prezzo_asta REAL,
    prezzo_scontato REAL,
    stato TEXT DEFAULT 'disponibile', -- 'disponibile', 'venduto', 'eliminato'
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS accountinfos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    immagine_profilo TEXT,
    descrizione TEXT,
    follower INTEGER DEFAULT 0,
    recensioni INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS indirizzi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    indirizzo TEXT NOT NULL,
    citta TEXT NOT NULL,
    cap TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storico_ordini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_ordine DATETIME DEFAULT CURRENT_TIMESTAMP,
    totale REAL NOT NULL,
    stato TEXT DEFAULT 'In elaborazione',
    user_id INTEGER NOT NULL,
    prodotto_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recensioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contenuto TEXT NOT NULL,
    valutazione INTEGER NOT NULL CHECK(valutazione >= 1 AND valutazione <= 5),
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    prodotto_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metodi_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nome_titolare TEXT NOT NULL,
    numero_carta TEXT NOT NULL,
    data_scadenza TEXT NOT NULL,
    cvv TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS observed_products (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    prezzo_osservato REAL,
    notifica_letta INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES prodotti (id) ON DELETE CASCADE
);

-- NUOVA TABELLA PER IL CARRELLO PERSISTENTE
CREATE TABLE IF NOT EXISTS cart_items (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES prodotti (id) ON DELETE CASCADE
);