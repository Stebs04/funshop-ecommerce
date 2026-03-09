// Importazione hook reattivi di react per gestire la memoria dei componenti
import {useState, useEffect} from 'react';

//Importazione del component Header
import Header from './components/Header';

//Importazione della navbar
import Navbar from './components/Navbar';

// Importazione dello stile
import './App.css';

//Definizione del componente app
function App(){
 //Dichiarazione della variabile di stato per i prodotti 
 const [prodotti, setProdotti] = useState([]);

 //Definizione dell'hook che esegue il codice solo al primo avvio
 useEffect(() => {
  //Costante a cui verranno assegnati in maniera asincrona tutti i prodotti  
  const fetchProdotti = async() =>{
      //Effettuazione di una richiesta GET alla parte di BackEnd
      const response = await fetch('http://localhost:8000/api/prodotti');
      //Estra il corpo della risposta e lo converte da JSON in un array
      const data = await response.json();
      //Funzione di debug, Stampo nel terminale i dati ricevuti
      console.log("Dati dal DB: ", data);
      //Inserimento dei dati nella variabile di stato, aggiornando lo schermo
      setProdotti(data);
    };
    //Invoco la funzione per far partire la chiamata
    fetchProdotti();
 }, []);
 //Return per far comparire gli oggetti a schermo
 return (
    <div>
      {
        //Istanza del componente 'Header'
        <Header />
      }
      {
        //Istanza del componente 'Navbar
        <Navbar />
      }
      <ul className="prodotti-grid">
         {
          //Itero sull'array dei prodotti per generare dinamicamente tutti gli elementi
          prodotti.map((prodotto) => (
            <>
              <li className="prodotto-card" key={prodotto.id}> {prodotto.nome} {prodotto.condizione} - €{prodotto.prezzo}
              <img className="prodotto-immagine" src={"http://localhost:8000" + prodotto.percorso_immagine} alt={prodotto.nome}/>
              </li>
              
            </>
          ))}
      </ul>

    </div>
 );
}

//Esportazione del componente per renderlo globalmente visibile
export default App;