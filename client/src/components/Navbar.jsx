import '../../src/App.css';

function Navbar(){
    return(
        <nav>
            {/*Creo una lista di raggruppamento*/}
            <ul>
                {/*Singolo elemento contente un link cliccabile*/}            
                <li>            
                    <a href='#'>Logo</a>
                </li>
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
        </nav>
    );
}

//Esportazione del componente
export default Navbar;