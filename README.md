# FunShop E-commerce 🛍️

Benvenuto in FunShop, un progetto di e-commerce full-stack costruito con Node.js, Express e EJS. Questa piattaforma consente agli utenti di registrarsi, acquistare e vendere prodotti in un ambiente dinamico e interattivo.

---

### ⚠️ Stato del Progetto: In Fase di Sviluppo

Questo progetto è attualmente in **fase di sviluppo attivo**. Le funzionalità presenti sono una base solida ma verranno aggiornate, migliorate e ampliate nel tempo. L'obiettivo è trasformare FunShop in una piattaforma e-commerce completa e robusta.

---

## ✨ Features Attuali

-   **Sistema di Autenticazione Completo**:
    -   Registrazione e login sicuri con password crittografate (bcrypt).
    -   Gestione delle sessioni utente con `express-session` e `passport.js`.
    -   Login automatico dopo la registrazione.
    -   Logout sicuro con reindirizzamento alla homepage.

-   **Gestione Prodotti**:
    -   I venditori possono aggiungere nuovi prodotti tramite un form dedicato, con caricamento di immagini.
    -   I venditori possono modificare e aggiornare i dettagli dei propri prodotti, inclusa l'immagine.
    -   I venditori possono eliminare i prodotti che hanno messo in vendita.

-   **Dashboard Utente**:
    -   Area personale multi-sezione per la gestione del profilo.
    -   **I Miei Dati**: Aggiornamento delle informazioni personali (nome, cognome, username, descrizione) e caricamento di un'immagine del profilo.
    -   **Storico Ordini**: Visualizzazione degli ordini passati (struttura pronta).
    -   **Indirizzi**: Aggiunta, modifica ed eliminazione degli indirizzi di spedizione.
    -   **I Miei Prodotti**: Sezione dedicata ai venditori per gestire i loro articoli in vendita.

-   **Logica Venditore**:
    -   Funzionalità "Diventa un Venditore" che aggiorna il ruolo dell'utente da 'cliente' a 'venditore'.
    -   Il link per diventare venditore è visibile solo agli utenti non-venditori e reindirizza al login se l'utente non è autenticato.

-   **Sistema di Recensioni**:
    -   Le recensioni vengono visualizzate nella pagina di dettaglio del prodotto.
    -   La pagina del profilo pubblico di un venditore (`member.ejs`) mostra la media delle valutazioni ricevute (con stelline) e il numero totale di recensioni.

-   **Pagine Pubbliche**:
    -   Homepage dinamica che mostra tutti i prodotti presenti nel database, ordinati dal più recente.
    -   Pagina di dettaglio del singolo prodotto.
    -   Pagina profilo pubblico per ogni utente, dove sono visibili i suoi prodotti in vendita e le recensioni ricevute.

## 🔮 Sviluppi Futuri

-   **Gestione completa del carrello e del checkout** sia per utenti registrati che per ospiti.
-   Un pannello di amministrazione per la gestione di utenti e prodotti.
-   Funzionalità di ricerca e filtro avanzato per i prodotti.

## 🛠️ Stack Tecnologico

-   **Backend**: Node.js, Express.js
-   **Database**: SQLite 3
-   **View Engine**: EJS (Embedded JavaScript templates)
-   **Autenticazione**: Passport.js (Local Strategy)
-   **Middleware**: express-session, bcrypt, express-validator, connect-flash, morgan, multer
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
    Crea un file `.env` nella cartella principale del progetto.
    ```
    NODE_ENV=development
    DB_NAME=datastorage.db
    PORT=5500
    SECRET_SESSION=una-chiave-segreta-molto-lunga-e-casuale
    ```

4.  **Avvia il server:**
    ```bash
    npm start
    ```
    Il server sarà in ascolto su `http://localhost:5500`. Al primo avvio, il database `datastorage.db` e le relative tabelle verranno create automaticamente.

## 📜 Script Disponibili

-   `npm start`: Avvia l'applicazione in modalità di produzione.
