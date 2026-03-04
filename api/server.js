//Importazione del modulo express dalla cartella node_modules assegnandolo a una costante.
const express = require('express');

//Importazione del modulo locale per la connessione al database
const connectDB = require('./config/database');

//Importazione del router dedicato ai prodotti
const prodottiRoutes = require('./routes/prodotti');

//Importazione del modulo cors per la gestione di richieste da porte diverse
const cors = require('cors');

//Middleware per l'utilizzo di file statici (es. immagini)
app.use(express.static('public'));

//Creazione della istanza dell'applicazione Express per gestire rotte e server
const app = express();

//Creazione del middleware che intercetta ogni richiesta di arrivo e le traduce in JSON
app.use(express.json());

//Abilitazione globale di CORS
app.use(cors());

//Collegamento del router dei prodotti al suo percorso dedicato
app.use('/api/prodotti', prodottiRoutes);

//Funzione asincrona per l'avvio sequenziale: database -> server
const startServer = async () => {
    //Blocco try-catch per l'avvio sicuro andando a intercettare eventuali errori critici
    try{
        //Sospende l'esecuzione finchè la connessione al database non è stabilita con successo
        await connectDB();
        console.log("Connessione con il DB avvenuta con successo");
        // Avvia il server in ascolto sulla porta specificata
        app.listen(8000, () => {
        console.log("Server in esecuzione sulla porta 8000");
});
    }
    catch(err)
    {   
        //In caso di errore stampa il problema e termina forzatamente il processo
        console.error(err.message);
        process.exit(1);
    }
};

// Invocazione della procedura di avvio per far partire l'applicazione
startServer();

//Definizione della rotta principale (root)
app.get('/', (req,res) => {
    
    //Invia una risposta in formato JSON
    res.json({messaggio: "Server Express funzionante e operativo!"});
});