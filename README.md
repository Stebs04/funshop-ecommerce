# FunShop E-commerce 🛍️

Benvenuto in FunShop, un progetto di e-commerce full-stack completo costruito con **Node.js, Express, PostgreSQL e EJS**. Questa piattaforma è un marketplace dinamico che consente agli utenti di registrarsi, acquistare e vendere oggetti da collezione, con un sistema di ruoli che include clienti, venditori e amministratori.

L'applicazione è stata migrata da SQLite a PostgreSQL per garantire maggiore scalabilità, integrità dei dati e funzionalità avanzate come transazioni e tipi di dati array.

---

## ✨ Funzionalità Principali

### Autenticazione e Gestione Utenti
-   **Sistema di Autenticazione Completo**: Registrazione e login sicuri con password crittografate (usando `bcrypt`) e gestione delle sessioni tramite `passport.js`.
-   **Recupero Password**: Flusso di reset password sicuro tramite email (`nodemailer`), che invia un link univoco con token a scadenza (`crypto`).
-   **Ruoli Utente Multipli**: Sistema a tre livelli (`cliente`, `venditore`, `admin`) con permessi e interfacce dedicate.
-   **Profili Pubblici**: Ogni utente ha una pagina profilo pubblica (`/member/:id`) che mostra i prodotti in vendita, la descrizione e le recensioni ricevute, completa di valutazione media a stelle.
-   **Unione Carrelli**: Al login, il carrello della sessione (ospite) viene automaticamente unito al carrello persistente dell'utente nel database.

### Funzionalità E-commerce
-   **Gestione Prodotti Avanzata**: I venditori possono aggiungere prodotti specificando categoria, condizione e prezzo. La gestione delle immagini supporta:
    -   **Upload Multiplo** (fino a 5 immagini per prodotto) gestito da `multer`.
    -   **Modifica Avanzata**: Il modale di modifica permette di riordinare le immagini (drag-and-drop non implementato, ma la logica di riordino via form sì), eliminare foto esistenti e caricarne di nuove.
    -   I percorsi delle immagini sono salvati come array (`TEXT[]`) in PostgreSQL.
-   **Carrello Ibrido**: Sistema di carrello funzionante sia per utenti registrati (persistente sul database PostgreSQL, tabella `cart_items`) che per ospiti (basato su `express-session`).
-   **Checkout Transazionale**: Processo di checkout sicuro che utilizza **transazioni SQL PostgreSQL** (`BEGIN`, `COMMIT`, `ROLLBACK`). Questo garantisce l'integrità dei dati: un ordine viene creato solo se tutte le operazioni (creazione ordine, aggiornamento stato prodotto, svuotamento carrello) vanno a buon fine.
-   **Gestione Guest e Utente**: Il checkout gestisce indirizzi e pagamenti salvati per utenti loggati, e un form completo per gli utenti ospiti.
-   **Conferma Ordine via Email**: Invio automatico di email di riepilogo ordine (`Nodemailer`) all'acquirente dopo un acquisto, con un template HTML.
-   **Sistema di Recensioni**: Gli acquirenti (non ospiti) possono lasciare recensioni e valutazioni (da 1 a 5 stelle) per i prodotti acquistati, che vengono visualizzate sui profili pubblici dei venditori.

### Dashboard e Pannelli di Controllo
-   **Dashboard Utente Completa (`/utente`)**: Un'area personale multi-sezione (caricata in parallelo con `Promise.all`) dove gli utenti possono:
    -   Modificare i dati anagrafici e caricare/aggiornare l'immagine del profilo.
    -   Visualizzare lo storico degli ordini.
    -   Gestire indirizzi di spedizione e metodi di pagamento.
    -   **Per i venditori**: Gestire i propri prodotti (con modifica avanzata delle immagini) e visualizzare statistiche sui guadagni e sul numero di articoli venduti.
-   **Pannello di Amministrazione (`/admin`)**: Un'area riservata (protetta da middleware `isAdmin`) con:
    -   Statistiche aggregate: Utenti totali, prodotti in stock, guadagni totali.
    -   Gestione Utenti: Tabella di tutti gli utenti con possibilità di eliminazione (Hard Delete).
    -   Gestione Prodotti: Tabella di tutti i prodotti (inclusi venduti/eliminati) con modifica avanzata ed eliminazione (Hard Delete).
    -   Storico Ordini: Vista di tutti gli ordini effettuati sulla piattaforma.

### User Experience (UX)
-   **Ricerca Globale**: Funzionalità di ricerca (`/search`) che restituisce risultati sia per i **prodotti** che per gli **utenti** che corrispondono al termine.
-   **Filtri e Ordinamento**: La homepage e la pagina di ricerca permettono di filtrare i prodotti per categoria, condizione e ordinare per prezzo (crescente/decrescente) o data di inserimento.
-   **Prodotti Osservati**: Gli utenti registrati possono "osservare" i prodotti. Ricevono **notifiche visive** nella loro dashboard se:
    -   Il prezzo del prodotto diminuisce (notifica verde).
    -   Il prezzo del prodotto aumenta (notifica gialla).
    -   Il prodotto viene venduto o eliminato (notifica rossa/blu).
-   **Popup Dinamici**: L'header include popup (hover) per il profilo utente e l'anteprima del carrello, aggiornati dinamicamente tramite API REST (`/api/auth/status`, `/api/data/cart`).

## 🛠️ Stack Tecnologico

-   **Backend**: Node.js, Express.js
-   **Database**: **PostgreSQL**
-   **View Engine**: EJS (Embedded JavaScript templates)
-   **Driver Database**: `pg` (node-postgres)
-   **Autenticazione**: Passport.js (Local Strategy), `bcrypt`, `express-session`
-   **Middleware & Librerie**:
    -   `multer`: Per la gestione dell'upload di file (immagini).
    -   `nodemailer`: Per l'invio di email transazionali (conferma ordine, reset password).
    -   `express-validator`: Per la validazione e sanificazione dei dati dei form.
    -   `connect-flash`: Per mostrare messaggi di notifica temporanei.
    -   `morgan`: Per il logging delle richieste HTTP in fase di sviluppo.
-   **Frontend**: HTML, CSS, Bootstrap 5, JavaScript (lato client)

## 🚀 Avvio Rapido

Segui questi passaggi per avviare il progetto in locale.

### Prerequisiti

-   Node.js (versione 18 o superiore consigliata)
-   npm (incluso con Node.js)
-   Un server **PostgreSQL** in esecuzione.

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
    Crea un file `.env` nella cartella principale del progetto e popola le variabili come mostrato nel file `.env.example`. Assicurati di inserire una chiave segreta per le sessioni, le tue credenziali per il servizio email e i dettagli di connessione al tuo database PostgreSQL.

    ```env
    # Configurazione ambiente di sviluppo/produzione
    NODE_ENV=development

    # Porta del server
    PORT=5500
    
    # Chiave segreta per le sessioni
    SECRET_SESSION=your-secret-session-key-here
    
    # --- VARIABILI POSTGRESQL ---
    # Assicurati di sostituire questi valori con quelli del tuo server PostgreSQL
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=funshop_db
    DB_PASSWORD=tua_password_segreta
    DB_PORT=5432
    # ------------------------------------
    
    # Variabili per il servizio mail (es. Gmail)
    EMAIL_USER=tua.email@gmail.com
    EMAIL_PASS=tua_password_app_gmail
    ```

4.  **Avvia il server:**
    ```bash
    npm start
    ```
    Il server sarà in ascolto su `http://localhost:5500` (o la porta specificata). Al primo avvio, lo script `managedb.js` contatterà il database PostgreSQL, eseguirà lo script `schema.sql` per creare tutte le tabelle e inserirà un utente `admin` di default (password: `admin1234`).

## 📜 Script Disponibili

-   `npm start`: Avvia l'applicazione in modalità standard.
-   `npm test`: (Da configurare) Esegue i test.

---

## 📂 Struttura del Progetto
    /
    ├── middleware/
    │   └── passport-config.js      # Configurazione di Passport.js e middleware isLoggedIn
    ├── models/
    │   └── dao/                    # Data Access Objects (logica query PostgreSQL)
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
    │   ├── immagini/                 # Immagini statiche (logo, avatar default)
    │   ├── javascript/               # Script JS lato client
    │   │   └── script.js             # (Logica popup header)
    │   ├── stylesheet/               # Fogli di stile CSS
    │   │   └── style.css
    │   └── uploads/                  # Cartella per le immagini caricate (prodotti, profili)
    ├── route/
    │   ├── adminRoutes.js            # Rotte per /admin (protette)
    │   ├── auth.js                   # Rotte per login, registrazione, logout, reset password
    │   ├── cartRoutes.js             # Rotte per /carrello (add, remove, checkout)
    │   ├── home.js                   # Rotta per la homepage (/) e filtri
    │   ├── information.js            # Rotta per pagina info statica
    │   ├── memberRoutes.js           # Rotta per profili pubblici (/member/:id)
    │   ├── observedRoutes.js         # Rotte per /observed (prodotti osservati)
    │   ├── orderRoutes.js            # Rotta per /ordine/riepilogo
    │   ├── productRoutes.js          # Rotte per /products (dettaglio e creazione)
    │   ├── recensioniRoutes.js       # Rotte per /recensioni (creazione)
    │   ├── search.js                 # Rotta per /search
    │   ├── sellerRoutes.js           # Rotta per /venditore (registrazione venditore)
    │   └── userRoutes.js             # Rotte per la dashboard /utente
    ├── services/
    │   └── emailService.js           # Logica per invio email (Nodemailer)
    ├── views/
    │   ├── pages/                    # Template EJS per le pagine principali
    │   │   ├── home.ejs
    │   │   ├── prodotto.ejs
    │   │   ├── utente.ejs
    │   │   ├── admin-dashboard.ejs
    │   │   ├── carrello.ejs
    │   │   ├── checkout.ejs
    │   │   └── ... (e tutte le altre pagine)
    │   └── partials/                 # Componenti riutilizzabili (header, footer, navbar)
    │       ├── header.ejs
    │       ├── footer.ejs
    │       └── navbar.ejs
    ├── .env.example                  # File di esempio per le variabili d'ambiente
    ├── .gitignore                    # File ignorati da Git
    ├── app.js                        # Configurazione principale Express (middleware, rotte)
    ├── managedb.js                   # Logica per connessione e inizializzazione DB PostgreSQL
    ├── package.json                  # Dipendenze e script del progetto
    ├── schema.sql                    # Schema del database PostgreSQL
    └── server.js                     # Punto di ingresso (avvia il server)
