import './Navbar.css';
//Importazione del logo
import logo from '../assets/logo.png';

import React, {useState} from 'react';

function Navbar(){
    //Simulazione di login e oggetti nel carrello
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cartItems, setCartItems] = useState([ {id: 1, nome: 'Scarpe', prezzo: '50€'}, { id: 2, nome: 'Maglia', prezzo: '20€' }]);

    return(
       <nav className='navbar'>
        <div className='navbar-left'>
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
        <div className='navbar-center'>
            <form> {/*Campo di testo dove l'utente andrà a cercare prodotti o utenti*/}
                <input type='text' placeholder='Cerca prodotti o Utenti' className='search-input'/>
                <button className='search-btn'>
                    <i className='search-icon'>🔍</i>
                </button>
            </form>
        </div>
        <div className='navbar-right'>
            <div className='cart-container'>
                <button className='cart-btn'>
                    <i className='cart-icon'>🛒({cartItems.length})</i>
                </button>
            <div className='cart-popup'> {/*Riquadro pop-up con tutti gli articoli del carrello*/}
                <ul>
                    {
                        //Itero su tutti i prodotti del carrello
                        cartItems.map(prodotto => (
                            <div className='cart-item-wrapper' key={prodotto.id}>
                                <li className='prodotto-cart'>
                                    {prodotto.nome} - {prodotto.prezzo}
                                </li>
                                <img
                                    className='prodotto-immagine-carrello'
                                    src={"http://localhost:8000" + prodotto.percorso_immagine} 
                                    alt={prodotto.nome}
                                />
                            </div>
                    
                        ))
                    }
                </ul>
            </div>
            </div>
             <button className='profile-btn' onClick={() =>{
                if(isLoggedIn){
                   window.location.href = '/profile';
                }
                else
                {
                    alert("Devi prima fare il login");
                    window.location.href = '/login';
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