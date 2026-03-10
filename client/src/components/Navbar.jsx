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
            {/*Sezione di sinistra: Inserimento del logo*/}
            <a href='#' className='navbar-logo'><img src={logo} alt='logo' /></a>
            
            {/*Sezione centrale: Creo una lista di raggruppamento*/}
            <ul className='nav-links'>
                {/*Singolo elemento contente un link cliccabile*/}   
                <li>            
                    <a href='#'>Home</a>
                </li>
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
            {/*Sezione di destra: Ricerca, Profilo e Carrello*/}
            <div className='navbar-actions'>
                <input type='text' placeholder='Cerca il prodotto o il profilo' className='search-input'/>
                <button className='search-btn'>🔍</button>
            <button 
            className='profile-btn'
            onClick={() =>{
                if(isLoggedIn){
                    alert("Vai alla pagina del profilo");
                }else{
                    alert("Devi prima fare il login");
                }
            }}
            >
                👤
            </button>
            <div className='cart-container'>
                 <button className='cart-button'>
                    🛒({cartItems.length})
                </button>
                <div className='cart-popup'>
                    <ul>
                        {cartItems.map(prodotto => (
                            <div className='cart-item-wrapper' key={prodotto.id}>
                                <li className='prodotto-cart'>
                                    {prodotto.nome} - {prodotto.prezzo}
                                </li>
                                <img 
                                    className="prodotto-immagine-carrello" 
                                    src={"http://localhost:8000" + prodotto.percorso_immagine} 
                                    alt={prodotto.nome}
                                />
                            </div>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </nav>
    );
}

//Esportazione del componente
export default Navbar;