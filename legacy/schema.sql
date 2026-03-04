-- Questo file definisce la struttura completa del database PostgreSQL.
-- L'uso di "CREATE TABLE IF NOT EXISTS" garantisce che l'esecuzione di questo script
-- non generi errori se le tabelle sono già presenti.

-- Tabella per la gestione degli utenti e delle loro credenziali.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                         -- Identificativo univoco dell'utente (PostgreSQL).
  username TEXT NOT NULL UNIQUE,               -- Nome utente pubblico, deve essere unico.
  nome TEXT,                                   -- Nome di battesimo dell'utente.
  cognome TEXT,                                -- Cognome dell'utente.
  email TEXT NOT NULL UNIQUE,                  -- Email per login e comunicazioni, deve essere unica.
  password_hash TEXT NOT NULL,                 -- Password crittografata (mai in chiaro!).
  data_nascita DATE,                           -- Data di nascita dell'utente.
  tipo_account TEXT DEFAULT 'cliente',         -- Ruolo dell'utente (es. 'cliente', 'venditore', 'admin').
  -- Campi per la funzionalità di reset della password.
  password_reset_token TEXT,                   -- Token temporaneo per il reset.
  password_reset_expires BIGINT                -- Timestamp di scadenza del token (es. Date.now()).
);

-- Tabella per la gestione dei prodotti messi in vendita.
CREATE TABLE IF NOT EXISTS prodotti (
    id SERIAL PRIMARY KEY,                     -- Identificativo univoco del prodotto.
    nome TEXT NOT NULL,                        -- Nome del prodotto.
    descrizione TEXT,                          -- Descrizione dettagliata.
    condizione TEXT,                           -- Stato del prodotto (es. "Come nuovo", "Usato").
    parola_chiave TEXT NOT NULL,               -- Categoria o parola chiave principale per la ricerca.
    -- Campo per memorizzare i percorsi delle immagini come un array di stringhe.
    percorsi_immagine TEXT[],                  -- Array di percorsi delle immagini sul server.
    prezzo NUMERIC(10, 2),                     -- Prezzo per la vendita immediata.
    prezzo_scontato NUMERIC(10, 2),            -- Prezzo scontato, se in offerta.
    stato TEXT DEFAULT 'disponibile',          -- Stato attuale del prodotto ('disponibile', 'venduto', 'eliminato').
    data_inserimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e ora di creazione del prodotto.
    user_id INTEGER NOT NULL,                  -- ID dell'utente (venditore) che ha inserito il prodotto.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE -- Se l'utente viene eliminato, anche i suoi prodotti vengono rimossi.
);

-- Tabella per le informazioni aggiuntive dei venditori.
CREATE TABLE IF NOT EXISTS venditori (
    id SERIAL PRIMARY KEY,                     -- Identificativo univoco del venditore.
    nome_negozio TEXT NOT NULL,                -- Nome pubblico del negozio.
    partita_iva TEXT NOT NULL UNIQUE,          -- Partita IVA, deve essere unica.
    email_contatto TEXT NOT NULL,              -- Email di contatto per questioni commerciali.
    iban TEXT NOT NULL,                        -- IBAN per ricevere i pagamenti.
    descrizione TEXT,                          -- Descrizione del negozio o del tipo di prodotti venduti.
    user_id INTEGER NOT NULL UNIQUE,           -- ID dell'utente associato, deve essere unico.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE -- Se l'utente viene eliminato, anche i dati da venditore vengono rimossi.
);

-- Tabella per informazioni aggiuntive del profilo utente (es. bio, immagine).
CREATE TABLE IF NOT EXISTS accountinfos (
    id SERIAL PRIMARY KEY,                     -- ID univoco.
    user_id INTEGER NOT NULL UNIQUE,           -- Associazione univoca con un utente.
    immagine_profilo TEXT,                     -- Path dell'immagine del profilo.
    descrizione TEXT,                          -- Breve biografia o descrizione dell'utente.
    follower INTEGER DEFAULT 0,                -- Conteggio dei follower (funzionalità futura).
    recensioni INTEGER DEFAULT 0,              -- Conteggio delle recensioni ricevute (funzionalità futura).
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per gli indirizzi di spedizione degli utenti.
CREATE TABLE IF NOT EXISTS indirizzi (
    id SERIAL PRIMARY KEY,                     -- ID univoco dell'indirizzo.
    user_id INTEGER NOT NULL,                  -- Utente a cui appartiene l'indirizzo.
    indirizzo TEXT NOT NULL,                   -- Via e numero civico.
    citta TEXT NOT NULL,                       -- Città.
    cap TEXT NOT NULL,                         -- Codice di avviamento postale.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per lo storico degli ordini effettuati.
CREATE TABLE IF NOT EXISTS storico_ordini (
    id SERIAL PRIMARY KEY,                     -- ID univoco dell'ordine.
    data_ordine TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e ora dell'ordine.
    totale NUMERIC(10, 2) NOT NULL,            -- Importo totale dell'ordine.
    stato TEXT DEFAULT 'In elaborazione',      -- Stato dell'ordine (es. 'In elaborazione', 'Spedito').
    user_id INTEGER,                           -- ID dell'acquirente (può essere NULL per acquisti da ospite).
    prodotto_id INTEGER,                       -- ID del prodotto acquistato (può diventare NULL se il prodotto viene eliminato).
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE SET NULL -- Se il prodotto viene eliminato, l'ordine lo ricorda ma il riferimento viene annullato.
);

-- Tabella per le recensioni lasciate dagli acquirenti.
CREATE TABLE IF NOT EXISTS recensioni (
    id SERIAL PRIMARY KEY,                     -- ID univoco della recensione.
    contenuto TEXT NOT NULL,                   -- Testo della recensione.
    valutazione INTEGER NOT NULL CHECK(valutazione >= 1 AND valutazione <= 5), -- Voto da 1 a 5.
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data di creazione.
    prodotto_id INTEGER NOT NULL,              -- Prodotto a cui si riferisce la recensione.
    user_id INTEGER NOT NULL,                  -- Utente che ha scritto la recensione.
    FOREIGN KEY (prodotto_id) REFERENCES prodotti (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per i metodi di pagamento salvati dagli utenti.
CREATE TABLE IF NOT EXISTS metodi_pagamento (
    id SERIAL PRIMARY KEY,                     -- ID univoco del metodo.
    user_id INTEGER NOT NULL,                  -- Utente proprietario.
    nome_titolare TEXT NOT NULL,               -- Nome e cognome del titolare della carta.
    numero_carta TEXT NOT NULL,                -- Numero della carta (da gestire con cura!).
    data_scadenza TEXT NOT NULL,               -- Data di scadenza (formato MM/YY).
    cvv TEXT NOT NULL,                         -- Codice di sicurezza.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabella per i prodotti che un utente sta "osservando".
CREATE TABLE IF NOT EXISTS observed_products (
    user_id INTEGER NOT NULL,                  -- ID dell'utente che osserva.
    product_id INTEGER NOT NULL,               -- ID del prodotto osservato.
    prezzo_osservato NUMERIC(10, 2),           -- Prezzo del prodotto al momento in cui è stato aggiunto agli osservati.
    notifica_letta INTEGER DEFAULT 1,          -- Flag per le notifiche di cambio prezzo (1 = letta, 0 = non letta).
    PRIMARY KEY (user_id, product_id),         -- Una coppia utente-prodotto può esistere solo una volta.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES prodotti (id) ON DELETE CASCADE
);

-- Tabella per gli articoli presenti nel carrello di un utente.
CREATE TABLE IF NOT EXISTS cart_items (
    user_id INTEGER NOT NULL,                  -- ID dell'utente proprietario del carrello.
    product_id INTEGER NOT NULL,               -- ID del prodotto nel carrello.
    quantity INTEGER NOT NULL DEFAULT 1,       -- Quantità del prodotto (attualmente sempre 1).
    PRIMARY KEY (user_id, product_id),         -- Una coppia utente-prodotto può esistere solo una volta.
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES prodotti (id) ON DELETE CASCADE
);