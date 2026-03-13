//Importazione delle librerie necessarie per le operazioni con il database
const sqlite3 = require('sqlite3');
const {open} = require('sqlite'); //Estrazione della specifica frunzione open dalla libreria sqlite
const path = require('path');

//Funzione che quando chiamata va a cercare il file contente il database,
//aprendo un canale di comunicazione asincrono per la scrittura dei dati
const connectDB = async () => {
    //Blocco try catch per l'apertura sicura del file, lancia eccezzione se non trova il file al percorso specificato
    try{
        //Costruisco il percordo del database usando il nome definito nella variabili di ambiente
       const dbPath = path.join(__dirname, process.env.DB_PATH);
       return await open({
        filename: dbPath,
         driver: sqlite3.Database
        });
    } catch(err){
        //Gestione dell'eccezione se il file non viene trovato o genera altri errori
        if(err.code === 'ENOENT'){
        console.error("Errore: il file non esiste al percorso specificato!!!");
        }
        else{
            console.error("Errore nell'apertura del file!!: ", err.message);
        }
        throw err; //Lancio l'errore per fermare il server in caso di mancata apertura del file
    }
};

//Esportazione di connectDB mediante pattern singleton, rendendolo l'unico punto di accesso
module.exports = connectDB;


