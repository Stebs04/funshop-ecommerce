# FunShop E-commerce 🛍️

Benvenuto in FunShop, un progetto di e-commerce full-stack completo costruito con Node.js, Express e EJS. Questa piattaforma è un marketplace dinamico che consente agli utenti di registrarsi, acquistare e vendere oggetti da collezione, con un sistema di ruoli che include clienti, venditori e amministratori.

---

## ✨ Funzionalità Principali

### Autenticazione e Gestione Utenti
-   **Sistema di Autenticazione Completo**: Registrazione e login sicuri con password crittografate (bcrypt) e gestione delle sessioni tramite `passport.js`.
-   **Recupero Password**: Flusso di reset password sicuro tramite email con token univoci e a scadenza.
-   **Ruoli Utente Multipli**: Sistema a tre livelli (Cliente, Venditore, Amministratore) con permessi e interfacce dedicate.
-   **Profili Pubblici**: Ogni utente ha una pagina profilo pubblica (`/member/:id`) che mostra i prodotti in vendita e le recensioni ricevute.

### Funzionalità E-commerce
-   **Gestione Prodotti**: I venditori possono aggiungere, modificare ed eliminare prodotti, con caricamento di immagini gestito da `multer`.
-   **Carrello Avanzato**: Sistema di carrello funzionante sia per utenti registrati (persistente su database) che per ospiti (basato su sessione), con aggiornamenti in tempo reale.
-   **Checkout Completo**: Processo di checkout sicuro per utenti registrati e ospiti, con gestione di indirizzi e metodi di pagamento (salvati o nuovi) e creazione di ordini tramite transazioni SQL per garantire l'integrità dei dati.
-   **Conferma Ordine via Email**: Invio automatico di email di riepilogo ordine all'acquirente dopo un acquisto andato a buon fine, utilizzando `Nodemailer`.
-   **Sistema di Recensioni**: Gli acquirenti possono lasciare recensioni e valutazioni (da 1 a 5 stelle) per i prodotti acquistati, che vengono visualizzate sui profili pubblici dei venditori.

### Dashboard e Pannelli di Controllo
-   **Dashboard Utente Completa**: Un'area personale (`/utente`) multi-sezione dove gli utenti possono:
    -   Modificare i propri dati anagrafici e l'immagine del profilo.
    -   Visualizzare lo storico degli ordini.
    -   Gestire indirizzi di spedizione e metodi di pagamento.
    -   **Per i venditori**: Gestire i propri prodotti in vendita e visualizzare statistiche sui guadagni e sul numero di articoli venduti.
-   **Pannello di Amministrazione**: Un'area riservata (`/admin`) che fornisce una panoramica completa del sito, con statistiche su utenti registrati, prodotti e guadagni totali. L'admin può gestire (eliminare e modificare) tutti gli utenti e i prodotti della piattaforma.

### User Experience
-   **Ricerca Globale**: Funzionalità di ricerca per trovare sia prodotti che utenti.
-   **Filtri e Ordinamento**: La homepage permette di filtrare i prodotti per categoria, condizione e ordinare per prezzo o data di inserimento.
-   **Prodotti Osservati**: Gli utenti registrati possono "osservare" i prodotti e ricevere notifiche visive nella loro dashboard se il prezzo di un articolo cambia o se non è più disponibile.

## 🛠️ Stack Tecnologico

-   **Backend**: Node.js, Express.js
-   **Database**: SQLite 3
-   **View Engine**: EJS (Embedded JavaScript templates)
-   **Autenticazione**: Passport.js (Local Strategy), bcrypt, express-session
-   **Middleware & Librerie**:
    -   `multer`: Per la gestione dell'upload di file (immagini).
    -   `nodemailer`: Per l'invio di email transazionali (conferma ordine, reset password).
    -   `express-validator`: Per la validazione e sanificazione dei dati dei form.
    -   `connect-flash`: Per mostrare messaggi di notifica temporanei (es. "Login effettuato!").
    -   `morgan`: Per il logging delle richieste HTTP in fase di sviluppo.
-   **Frontend**: HTML, CSS, Bootstrap 5, JavaScript

## 🚀 Avvio Rapido

Segui questi passaggi per avviare il progetto in locale.

### Prerequisiti

-   Node.js (versione 18 o superiore consigliata)
-   npm (incluso con Node.js)

### Installazione

1.  **Clona la repository:**
    ```bash
    git clone [https://github.com/tuo-username/funshop-ecommerce.git](https://github.com/tuo-username/funshop-ecommerce.git)
    cd funshop-ecommerce
    ```

2.  **Installa le dipendenze:**
    ```bash
    npm install
    ```

3.  **Configura le variabili d'ambiente:**
    Crea un file `.env` nella cartella principale del progetto e popola le variabili come mostrato nel file `/.env` del progetto. Assicurati di inserire una chiave segreta per le sessioni e le tue credenziali per il servizio email.

    ```env
    # Configurazione ambiente di sviluppo/produzione
    NODE_ENV=development

    # Porta del server
    PORT=your_port
    
    # Chiave segreta per le sessioni
    SECRET_SESSION=your-secret-session-key-here
    
    # --- VARIABILI POSTGRESQL ---
    # Assicurati di sostituire questi valori con quelli del tuo server PostgreSQL
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=your_db
    DB_PASSWORD=tua_password_segreta
    DB_PORT=your_port
    # ------------------------------------
    
    # Variabili per il servizio mail
    EMAIL_USER=email
    EMAIL_PASS=pwd_email

    ```

4.  **Avvia il server:**
    ```bash
    npm start
    ```
    Il server sarà in ascolto su `http://localhost:5500`. Al primo avvio, il database `datastorage.db` e le relative tabelle verranno create automaticamente, incluso un utente `admin` di default.

## 📜 Script Disponibili

-   `npm start`: Avvia l'applicazione.
-   `npm test`: (Da configurare) Esegue i test.

- ---

## 📂 Struttura del Progetto

Il progetto è organizzato secondo una struttura modulare che separa le diverse responsabilità dell'applicazione, seguendo le best practice per lo sviluppo di applicazioni Node.js.

```
/
├── middleware/
│   └── passport-config.js      # Configurazione di Passport.js per l'autenticazione
├── models/
│   └── dao/                    # Data Access Objects per l'interazione con il DB
│       ├── cart-dao.js
│       ├── indirizzi-dao.js
│       ├── informazioni-dao.js
│       ├── metodi-pagamento-dao.js
│       ├── observed-dao.js
│       ├── ordini-dao.js
│       ├── prodotti-dao.js
│       ├── recensioni-dao.js
│       ├── search-dao.js
│       ├── seller-dao.js
│       └── utenti-dao.js
├── public/
│   ├── immagini/                 # Immagini statiche (logo, avatar di default)
│   ├── javascript/               # File JavaScript per il frontend
│   │   └── script.js
│   ├── stylesheet/               # Fogli di stile CSS
│   │   └── style.css
│   └── uploads/                  # Cartella per le immagini caricate dagli utenti
├── route/
│   ├── adminRoutes.js            # Rotte per il pannello di amministrazione
│   ├── auth.js                   # Rotte per login, registrazione, logout, reset password
│   ├── cartRoutes.js             # Rotte per la gestione del carrello
│   ├── home.js                   # Rotta per la homepage
│   ├── ... (e tutte le altre rotte)
├── services/
│   └── emailService.js           # Logica per l'invio di email transazionali
├── views/
│   ├── pages/                    # Template EJS per le pagine principali
│   │   ├── home.ejs
│   │   ├── prodotto.ejs
│   │   ├── utente.ejs
│   │   └── ... (e tutte le altre pagine)
│   └── partials/                 # Componenti riutilizzabili (header, footer, navbar)
│       ├── header.ejs
│       ├── footer.ejs
│       └── navbar.ejs
├── .env                          # File per le variabili d'ambiente (non versionato)
├── .gitignore                    # File ignorati da Git
├── app.js                        # Configurazione principale dell'applicazione Express
├── managedb.js                   # Logica per l'inizializzazione del database
├── package.json                  # Dipendenze e script del progetto
├── schema.sql                    # Schema del database SQLite
└── server.js                     # Punto di ingresso dell'applicazione (avvia il server)
```
