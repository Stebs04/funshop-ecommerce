// Importazione hook reattivi di react per gestire la memoria dei componenti
import {useState, useEffect} from 'react';

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
      //Inserimento dei dati nella variabile di stato, aggiornando lo schermo
      setProdotti(data);
    };
    //Invoco la funzione per far partire la chiamata
    fetchProdotti();
 }, []);
 //Return per far comparire gli oggetti a schermo
 return (
    <div>
      <h1>I miei prodotti</h1>
      <ul>


      </ul>

    </div>
    
 );
}
