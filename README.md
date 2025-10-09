# FunShop E-commerce 🛍️

Benvenuto in FunShop, un progetto di e-commerce full-stack costruito con Node.js, Express e EJS. Questa piattaforma consente agli utenti di registrarsi, acquistare e vendere prodotti in un ambiente dinamico e interattivo.

---

### ⚠️ Stato del Progetto: In Fase di Sviluppo

Questo progetto è attualmente in **fase di sviluppo attivo**. Le funzionalità presenti sono una base solida ma verranno aggiornate, migliorate e ampliate nel tempo. L'obiettivo è trasformare FunShop in una piattaforma e-commerce completa e robusta.

**Sviluppi futuri includeranno:**
-   **Chat in tempo reale** tra venditore e acquirente.
-   **Gestione completa del checkout** sia per utenti registrati che per ospiti.
-   Integrazione di un sistema di pagamento reale (es. Stripe).
-   Un pannello di amministrazione per la gestione di utenti e prodotti.

---

## ✨ Features Attuali

-   **Sistema di Autenticazione Completo**: Registrazione e login funzionanti, con gestione delle sessioni e login automatico dopo la registrazione.
-   **Homepage Dinamica**: Visualizza i prodotti caricati nel database con le informazioni principali.
-   **Dashboard Utente**: Area personale multi-sezione (quasi interamente funzionante) per la gestione dei propri dati e dei prodotti in vendita.
-   **Pagina di Dettaglio Prodotto**: Struttura base della pagina del singolo prodotto (quasi interamente funzionante).
-   **Frontend Interattivo**: L'interfaccia utente è arricchita da JavaScript per la gestione di popup dinamici che si adattano allo stato di login e al ruolo dell'utente (cliente/venditore).


## 🛠️ Stack Tecnologico

-   **Backend**: Node.js, Express.js
-   **Database**: SQLite 3
-   **View Engine**: EJS (Embedded JavaScript templates)
-   **Autenticazione**: Passport.js (Local Strategy)
-   **Middleware**: express-session, bcrypt, express-validator, connect-flash, morgan
-   **Frontend**: HTML, CSS, Bootstrap 5, JavaScript (Fetch API)

## 🚀 Getting Started

Segui questi passaggi per avviare il progetto in locale.

### Prerequisiti

-   Node.js (versione 14 o superiore)
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
    Crea un file `.env` nella cartella principale del progetto copiando il file `.env.example`.
    ```bash
    # Esempio di file .env
    NODE_ENV=development
    DB_NAME=datastorage.db
    PORT=5500
    SECRET_SESSION=una-chiave-segreta-molto-lunga-e-casuale
    ```

4.  **Avvia il server:**
    ```bash
    npm start
    ```
    Il server sarà in ascolto su `http://localhost:5500` (o sulla porta specificata nel file `.env`). Al primo avvio, il database `datastorage.db` e le relative tabelle verranno create automaticamente.

## 📜 Script Disponibili

-   `npm start`: Avvia l'applicazione in modalità di sviluppo.
