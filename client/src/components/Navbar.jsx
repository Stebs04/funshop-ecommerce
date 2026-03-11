import './Navbar.css';
//Importazione del logo
import logo from '../assets/logo.png';

import React, {useState} from 'react';

//Importo useNavigate per il redirecting delle pagine
import {useNavigate} from 'react-router-dom';

function Navbar(){
    //Simulazione di login e oggetti nel carrello
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cartItems, setCartItems] = useState([ {id: 1, nome: 'Scarpe', prezzo: '50€'}, { id: 2, nome: 'Maglia', prezzo: '20€' }]);
    const navigate = useNavigate();

    return(
       <nav className='navbar'> {/** Creo un contenitore che raggruppa tutta la navbar */}
        <div className='navbar-left'> {/**Parte sinistra della navbar che contiene il logo e i link di navigazione */}
            <a href='/' className='navbar-logo'><img src={logo} alt='logo-sito'/></a> {/*Logo del sito*/}
            <ul className='nav-links'> {/*Link di reindirizzamento della navbar*/}
                <li>
                     <a href='#'>Novità</a>
                </li>
                <li>
                     <a href='#'>Offerte</a>
                </li>
                <li>
                     <a href='#'>Diventa un venditore</a>
                </li>
            </ul>

        </div>
        <div className='navbar-center'> {/**Parte centrale della navbar che contiene il campo di ricerca */}
            <form> {/*Campo di testo dove l'utente andrà a cercare prodotti o utenti*/}
                <input type='text' placeholder='Cerca prodotti o Utenti' className='search-input'/>
                <button className='search-btn'>
                    <i className='search-icon'>🔍</i>
                </button>
            </form>
        </div>
        <div className='navbar-right'> {/**Parte destra della navbar che contiene i bottoni del carrello e del profilo */}
            <div className='cart-container'> {/**Container del bottone e della icona del carrello */}
                <button className='cart-btn'>
                    <i className='cart-icon'>🛒({cartItems.length})</i>
                </button>
            <div className='cart-popup'> {/*Riquadro pop-up con tutti gli articoli del carrello*/}
                <ul>
                    {
                        //Itero su tutti i prodotti del carrello
                        cartItems.map(prodotto => (
                                <li className='prodotto-cart'> {/**Singolo prodotto del carrello */}
                                    {prodotto.nome} - {prodotto.prezzo}
                                    <img
                                    className='prodotto-immagine-carrello'
                                    src={"http://localhost:8000" + prodotto.percorso_immagine} 
                                    alt={prodotto.nome}
                                    />
                                </li>
                        ))
                    }
                </ul>
            </div>
            </div>
             <button className='profile-btn' onClick={() =>{
                if(isLoggedIn){
                   navigate('/profile'); // Se l'utente è loggato redirecto alla pagina del profilo
                }
                else
                {
                    alert("Devi prima fare il login");
                    navigate('/login'); //Sennò redirecto alla pagina di login 
                }
            }}> {/*Gestione del reindirizzamento*/}
                <i className='profile-icon'>👤</i>
            </button>
        </div>
       </nav>
    );
}

//Esportazione del componente
export default Navbar;