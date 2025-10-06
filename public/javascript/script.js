document.addEventListener('DOMContentLoaded', () => {
    const cartButton = document.getElementById('cart-button');
    const profileButton = document.getElementById('profile-button');

    let cartPreview, profilePreview;
    let hideCartTimeout, hideProfileTimeout;
    const HIDE_DELAY = 300;

    // --- FUNZIONI GENERICHE DI NASCONDI/MOSTRA ---
    const hideCartPreview = () => {
        if (!cartPreview) return;
        cartPreview.style.opacity = '0';
        cartPreview.style.visibility = 'hidden';
        cartPreview.style.transform = 'translateY(10px)';
    };

    const hideProfilePreview = () => {
        if (!profilePreview) return;
        profilePreview.style.opacity = '0';
        profilePreview.style.visibility = 'hidden';
        profilePreview.style.transform = 'translateY(10px)';
    };

    // --- LOGICA CARRELLO ---
    if (cartButton) {
        cartPreview = document.createElement('div');
        cartPreview.id = 'cart-preview';
        cartPreview.innerHTML = `
            <div style="display: flex; gap: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <img src="https://images.sbito.it/api/v1/sbt-ads-images-pro/images/41/41e8e8b4-a070-4737-bf0c-6b29561ccf9e?rule=gallery-desktop-1x-auto" alt="Prodotto" style="width: 80px; height: 80px; border-radius: 4px;">
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0 0 5px; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">Action figure son goku</h4>
                    <p style="margin: 0; font-size: 14px; color: #555;">€ 49,99</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #d9534f; font-weight: bold;">Ultimo disponibile</p>
                </div>
            </div>
            <div style="padding: 15px 0; border-bottom: 1px solid #eee; font-size: 14px;">
                <p style="margin: 0; color: #28a745; font-weight: bold;">Spedizione gratuita</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px;">
                <span style="font-size: 16px; font-weight: bold;">Totale:</span>
                <span style="font-size: 18px; font-weight: bold;">€ 79,99</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <a href="checkout.html" style="width: 100%; padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; text-align: center; text-decoration: none;">Paga</a>
                <button onclick="window.location.href='/carrello.html'" style="width: 100%; padding: 12px; background-color: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 5px; font-size: 16px; cursor: pointer;">Vedi il carrello</button>
            </div>
        `;
        Object.assign(cartPreview.style, {
            position: 'absolute', width: '90vw', maxWidth: '320px', backgroundColor: 'white',
            border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '20px', fontFamily: 'sans-serif', zIndex: '9999', boxSizing: 'border-box',
            opacity: '0', visibility: 'hidden', transform: 'translateY(10px)',
            transition: 'opacity 0.2s, transform 0.2s, visibility 0.2s'
        });
        document.body.appendChild(cartPreview);

        const showCartPreview = () => {
            clearTimeout(hideCartTimeout);
            clearTimeout(hideProfileTimeout);
            hideProfilePreview(); // Nasconde l'altro popup

            const buttonRect = cartButton.getBoundingClientRect();
            const previewRect = cartPreview.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            cartPreview.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
            let leftPosition = buttonRect.left + window.scrollX;
            if (leftPosition + previewRect.width > viewportWidth) {
                leftPosition = buttonRect.right + window.scrollX - previewRect.width;
            }
            if (leftPosition + previewRect.width > viewportWidth - 10) {
                leftPosition = viewportWidth - previewRect.width - 10;
            }
            if (leftPosition < 0) { leftPosition = 10; }
            cartPreview.style.left = `${leftPosition}px`;
            cartPreview.style.opacity = '1';
            cartPreview.style.visibility = 'visible';
            cartPreview.style.transform = 'translateY(0)';
        };

        const startCartHideTimer = () => {
            hideCartTimeout = setTimeout(hideCartPreview, HIDE_DELAY);
        };

        cartButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (cartPreview.style.visibility === 'hidden') showCartPreview();
        });

        [cartButton, cartPreview].forEach(element => {
            element.addEventListener('mouseenter', showCartPreview);
            element.addEventListener('mouseleave', startCartHideTimer);
        });
    } else {
        console.error('Elemento con id "cart-button" non trovato.');
    }


    // Funzione per aggiornare la logica del profilo in base allo stato di autenticazione
    const updateUserProfileLogic = async () => {
        if (!profileButton) {
            console.error('Elemento con id "profile-button" non trovato.');
            return;
        }

        try {
            const response = await fetch('/api/auth/status');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.isAuthenticated) {
    // L'utente è loggato: crea e gestisce il popup del profilo
    profilePreview = document.createElement('div');
    profilePreview.id = 'profile-preview'; // Applica gli stili dal CSS tramite ID

     const sellLink = data.user.tipo_account;
     if(sellLink == 'venditore')
    // Popola con i link
   { profilePreview.innerHTML = `
        <a href="utente.html" class="profile-link">Il mio account</a>
        <a href="/impostazioni.html" class="profile-link">Impostazioni</a>
        <a href="/nuovo-prodotto.html" class="profile-link">Aggiungi un nuovo prodotto</a>
        <div style="border-top: 1px solid #eee; margin: 5px 0;"></div>
        <a href="/logout" class="profile-link">Esci da questo account</a>
    `;}
    else
        {
            profilePreview.innerHTML = `
        <a href="utente.html" class="profile-link">Il mio account</a>
        <a href="/impostazioni.html" class="profile-link">Impostazioni</a>
        <div style="border-top: 1px solid #eee; margin: 5px 0;"></div>
        <a href="/logout" class="profile-link">Esci da questo account</a>
    `;
        }
    
    document.body.appendChild(profilePreview);

    // La logica per mostrare/nascondere rimane IDENTICA
    const showProfilePreview = () => {
        clearTimeout(hideProfileTimeout);
        clearTimeout(hideCartTimeout);
        hideCartPreview();

        const buttonRect = profileButton.getBoundingClientRect();
        const previewRect = profilePreview.getBoundingClientRect();
        profilePreview.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
        let leftPosition = buttonRect.right + window.scrollX - previewRect.width;
        if (leftPosition < 10) leftPosition = 10;
        profilePreview.style.left = `${leftPosition}px`;
        profilePreview.style.opacity = '1';
        profilePreview.style.visibility = 'visible';
        profilePreview.style.transform = 'translateY(0)';
    };

    const startProfileHideTimer = () => {
        hideProfileTimeout = setTimeout(hideProfilePreview, HIDE_DELAY);
    };

    profileButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (profilePreview.style.visibility === 'hidden') {
            showProfilePreview();
        }
    });

    [profileButton, profilePreview].forEach(element => {
        element.addEventListener('mouseenter', showProfilePreview);
        element.addEventListener('mouseleave', startProfileHideTimer);
    });

            } else {
                // L'utente non è loggato: il pulsante del profilo reindirizza alla registrazione
                profileButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    window.location.href = 'registrazione.html';
                });
            }
        } catch (error) {
            console.error('Errore nel recuperare lo stato di autenticazione:', error);
            // Fallback: il pulsante del profilo reindirizza alla registrazione in caso di errore
            profileButton.addEventListener('click', (event) => {
                event.preventDefault();
                window.location.href = 'registrazione.html';
            });
        }
    };

    // Chiama la funzione per configurare la logica del profilo
    updateUserProfileLogic();

     const loadProducts = async () => {
        const container = document.getElementById('product-container');
        if (!container) {
            console.error('Elemento con id "product-container" non trovato.');
            return;
        }

        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`Errore HTTP! stato: ${response.status}`);
            }
            const products = await response.json();

            container.innerHTML = ''; // Pulisce il contenitore da eventuali placeholder

            products.forEach(product => {
                // Determina quale prezzo mostrare (prezzo fisso o prezzo d'asta)
                const displayPrice = product.prezzo > 0 ? product.prezzo : product.prezzo_asta;
                
                // Crea l'elemento wrapper per la colonna della griglia
                const col = document.createElement('div');
                col.className = 'col';

                // Popola l'HTML della card con i dati del prodotto
                col.innerHTML = `
                    <div class="card h-100 shadow-sm product-card">
                        <img src="${product.percorso_immagine}" class="card-img-top" alt="${product.nome}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="prodotto.html?id=${product.id}" class="text-decoration-none text-dark stretched-link">
                                    ${product.nome}
                                </a>
                            </h5>
                            <p class="card-text text-muted small">${product.parola_chiave}</p>
                            <p class="card-text text-primary small">Venduto da <strong>${product.nome_venditore}</strong></p>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">€ ${displayPrice.toFixed(2)}</span>
                                <a href="#" class="btn btn-sm btn-primary" style="position: relative; z-index: 2;" title="Aggiungi al carrello">
                                    <i class="bi bi-cart-plus-fill fs-5"></i>
                                </a>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 text-center">
                            <small class="text-success fw-bold">${product.condizione}</small>
                        </div>
                    </div>
                `;
                // Aggiunge la card completa al contenitore
                container.appendChild(col);
            });

        } catch (error) {
            console.error('Impossibile caricare i prodotti:', error);
            container.innerHTML = '<p class="text-center text-danger">Non è stato possibile caricare i prodotti. Riprova più tardi.</p>';
        }
    };



    const updateNavbarForSeller = async () => {
        try {
            const response = await fetch('/api/auth/status');
            if (!response.ok) return; // Non fare nulla se la richiesta fallisce

            const data = await response.json();
            if (data.isAuthenticated && data.user.tipo_account === 'venditore') {
                const becomeSellerLink = document.getElementById('become-seller-link');
                if (becomeSellerLink) {
                    becomeSellerLink.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Errore nel controllare lo stato del venditore:', error);
        }
    };


    const updateUserPageVisibility = async () => {
        // Esegui questa logica solo se ci troviamo in utente.html
        if (window.location.pathname.endsWith('/utente.html')) {
            try {
                const response = await fetch('/api/auth/status');
                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status}`);
                }
                const data = await response.json();

                // Se l'utente è autenticato ma non è un venditore
                if (data.isAuthenticated && data.user.tipo_account !== 'venditore') {
                    // Selettori per gli elementi da nascondere. Adattali se necessario.
                    const myProductsElement = document.querySelector('a[href="i-miei-prodotti.html"]');
                    const statsElement = document.querySelector('a[href="statistiche.html"]');

                    if (myProductsElement) {
                        // Nasconde l'intero elemento della lista (il genitore <li>)
                        myProductsElement.parentElement.style.display = 'none';
                    }
                    if (statsElement) {
                        statsElement.parentElement.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error("Impossibile aggiornare la visibilità della pagina utente:", error);
            }
        }
    };

    // Chiama la nuova funzione per gestire la visibilità degli elementi in utente.html
    updateUserPageVisibility();


    // Aggiorna la navbar in base allo stato dell'utente
    updateNavbarForSeller();

    // Chiama la funzione per caricare i prodotti quando la pagina è pronta
    loadProducts();
});

