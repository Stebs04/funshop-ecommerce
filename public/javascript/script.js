// File: public/javascript/script.js
// Esegue lo script solo dopo che l'intero contenuto della pagina è stato caricato.
document.addEventListener('DOMContentLoaded', async () => {

    /**
     * Gestisce la creazione e l'interazione del popup del profilo utente
     * che appare al passaggio del mouse sull'icona del profilo.
     */
    const updateUserProfileLogic = async () => {
        const profileButton = document.getElementById('profile-button');
        if (!profileButton) return; // Interrompe se il pulsante del profilo non è presente

        let profilePreview;
        let hideProfileTimeout;
        const HIDE_DELAY = 300; // Millisecondi di ritardo prima di nascondere il popup

        // Funzione per interrogare un'API e verificare se l'utente è loggato
        const getAuthData = async () => {
            try {
                // Chiama la rotta API che restituisce lo stato di autenticazione
                const response = await fetch('/api/auth/status');
                if (!response.ok) return null;
                return await response.json();
            } catch (error) {
                console.error('Errore nel controllo dello stato di autenticazione:', error);
                return null;
            }
        };

        const authData = await getAuthData();

        // Se l'utente è autenticato, crea il popup del profilo
        if (authData && authData.isAuthenticated) {
            profilePreview = document.createElement('div');
            profilePreview.id = 'profile-preview';
            const isSeller = authData.user.tipo_account === 'venditore';
            const isAdmin = authData.user.tipo_account === 'admin';

            // Popola il popup con i link appropriati in base al tipo di account
            profilePreview.innerHTML = `
                <a href="/utente?section=dati" class="profile-link">Il mio account</a>
                <a href="/observed" class="profile-link">Prodotti Osservati</a>
                ${isSeller ? `<a href="/products/new" class="profile-link">Aggiungi un nuovo prodotto</a>` : ''}
                ${isAdmin ? `<a href="/admin/dashboard" class="profile-link" style="color: #dc3545; font-weight: bold;">Pannello Admin</a>` : ''}
                <div class="profile-divider" style="height: 1px; background: #eee; margin: 8px 0;"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;

            document.body.appendChild(profilePreview);

            // Funzione per mostrare il popup, posizionandolo correttamente rispetto al pulsante
            const showProfilePreview = () => {
                clearTimeout(hideProfileTimeout);
                const buttonRect = profileButton.getBoundingClientRect();
                profilePreview.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
                const previewRect = profilePreview.getBoundingClientRect();
                let leftPosition = buttonRect.right + window.scrollX - previewRect.width;
                if (leftPosition < 10) leftPosition = 10;
                profilePreview.style.left = `${leftPosition}px`;
                profilePreview.style.opacity = '1';
                profilePreview.style.visibility = 'visible';
                profilePreview.style.transform = 'translateY(0)';
            };

            // Funzione per nascondere il popup con una transizione
            const hideProfilePreview = () => {
                if (!profilePreview) return;
                profilePreview.style.opacity = '0';
                profilePreview.style.visibility = 'hidden';
                profilePreview.style.transform = 'translateY(10px)';
            };

            // Funzione per avviare un timer prima di nascondere il popup
            const startProfileHideTimer = () => {
                hideProfileTimeout = setTimeout(hideProfilePreview, HIDE_DELAY);
            };

            // Aggiunge gli event listener per mostrare/nascondere il popup al passaggio del mouse
            [profileButton, profilePreview].forEach(element => {
                element.addEventListener('mouseenter', showProfilePreview);
                element.addEventListener('mouseleave', startProfileHideTimer);
            });
        }
    };

    /**
     * Gestisce la logica per il popup del carrello, che mostra un'anteprima
     * del contenuto al passaggio del mouse sull'icona del carrello.
     */
    const updateCartPopupLogic = () => {
        const cartButton = document.getElementById('cart-button');
        if (!cartButton) return;

        let cartPreview;
        let hideCartTimeout;
        const HIDE_DELAY = 300;

        // Crea l'elemento del popup se non esiste già
        const createCartPopup = () => {
            if (document.getElementById('cart-preview')) {
                cartPreview = document.getElementById('cart-preview');
                return;
            };
            cartPreview = document.createElement('div');
            cartPreview.id = 'cart-preview';
            document.body.appendChild(cartPreview);
            // Mantiene il popup aperto se il mouse entra nel popup stesso
            cartPreview.addEventListener('mouseenter', () => clearTimeout(hideCartTimeout));
            cartPreview.addEventListener('mouseleave', startCartHideTimer);
        };

        // Aggiorna il contenuto del popup interrogando l'API del carrello
        const updatePopupContent = async () => {
            try {
                const response = await fetch('/carrello/api/data');
                const cart = await response.json();
                const cartCounter = document.getElementById('cart-counter');

                // Aggiorna il contatore numerico sull'icona del carrello
                if (cart && cart.totalQty > 0) {
                    cartCounter.innerText = cart.totalQty;
                    cartCounter.style.display = 'block';
                } else {
                    cartCounter.innerText = '';
                    cartCounter.style.display = 'none';
                }

                if (!cartPreview) createCartPopup();

                // Mostra un messaggio se il carrello è vuoto
                if (!cart || Object.keys(cart.items).length === 0) {
                    cartPreview.innerHTML = `<p class="text-center text-muted m-0">Il tuo carrello è vuoto.</p>`;
                } else {
                    // Costruisce l'HTML per ogni articolo nel carrello
                    let itemsHtml = Object.values(cart.items).map(product => {
                        // Stile diverso se il prodotto non è più disponibile
                        if (product.item.stato === 'disponibile') {
                            return `
                                <div class="d-flex mb-3">
                                    <img src="${product.item.percorsi_immagine[0]}" alt="${product.item.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                                    <div class="ms-2 flex-grow-1">
                                        <h6 class="mb-0 small">${product.item.nome}</h6>
                                        <small class="text-muted">${product.qty} x €${(product.item.prezzo_scontato || product.item.prezzo).toFixed(2)}</small>
                                    </div>
                                    <span class="fw-bold small">€${product.price.toFixed(2)}</span>
                                </div>
                            `;
                        } else {
                             return `
                                <div class="d-flex mb-3 p-2 bg-light rounded border">
                                     <img src="${product.item.percorsi_immagine[0]}" alt="${product.item.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; opacity: 0.5;">
                                    <div class="ms-2 flex-grow-1">
                                        <h6 class="mb-0 small text-decoration-line-through">${product.item.nome}</h6>
                                        <small class="text-warning fw-bold">Non disponibile</small>
                                    </div>
                                </div>
                            `;
                        }
                    }).join('');
                    
                    // Abilita o disabilita il pulsante di checkout
                    let checkoutButtonHtml = (cart.totalQty > 0)
                        ? `<a href="/carrello/checkout" class="btn btn-primary btn-sm">Vai al Checkout</a>`
                        : `<button class="btn btn-primary btn-sm" disabled>Checkout non disponibile</button>`;

                    // Assembla il contenuto finale del popup
                    cartPreview.innerHTML = `
                        ${itemsHtml}
                        <hr class="my-2">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="fw-bold">Totale disponibili:</span>
                            <span class="fw-bold fs-5">€${cart.totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="/carrello" class="btn btn-outline-primary btn-sm">Vedi il Carrello Completo</a>
                            ${checkoutButtonHtml}
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Errore nel recuperare i dati del carrello:', error);
                if (cartPreview) cartPreview.innerHTML = `<p class="text-center text-danger m-0">Errore caricamento.</p>`;
            }
        };

        // Funzione per mostrare il popup del carrello
        const showCartPreview = () => {
            if (!cartPreview) createCartPopup();
            clearTimeout(hideCartTimeout);
            updatePopupContent(); // Aggiorna il contenuto ogni volta che viene mostrato
            const buttonRect = cartButton.getBoundingClientRect();
            cartPreview.style.top = `${buttonRect.bottom + window.scrollY + 10}px`;
            const previewRect = cartPreview.getBoundingClientRect();
            // Posiziona il popup allineato a destra con il pulsante
            cartPreview.style.left = `${buttonRect.right + window.scrollX - previewRect.width}px`;
            cartPreview.style.opacity = '1';
            cartPreview.style.visibility = 'visible';
            cartPreview.style.transform = 'translateY(0)';
        };

        // Funzione per avviare il timer per nascondere il popup del carrello
        const startCartHideTimer = () => {
            hideCartTimeout = setTimeout(() => {
                if (!cartPreview) return;
                cartPreview.style.opacity = '0';
                cartPreview.style.visibility = 'hidden';
                cartPreview.style.transform = 'translateY(10px)';
            }, HIDE_DELAY);
        };

        // Aggiunge gli event listener e aggiorna il contenuto all'avvio
        cartButton.addEventListener('mouseenter', showCartPreview);
        cartButton.addEventListener('mouseleave', startCartHideTimer);
        updatePopupContent(); // Esegue un primo aggiornamento al caricamento della pagina
    };

    /**
     * Gestisce l'apertura del modale per il caricamento dell'immagine del profilo.
     * Si attiva cliccando sull'immagine del profilo nella dashboard utente.
     */
    const handleProfileImageUpload = () => {
        const imageContainer = document.querySelector('.profile-image-container');
        const uploadModalElement = document.getElementById('uploadModal');
        if (!uploadModalElement) return;
        
        const uploadModal = new bootstrap.Modal(uploadModalElement);
        if (imageContainer) {
            imageContainer.addEventListener('click', () => {
                uploadModal.show();
            });
        }
    };

    /**
     * Gestisce la logica del modale "Chiedi Informazioni" nella pagina prodotto,
     * che apre il client di posta dell'utente con un'email precompilata.
     */
    const handleInfoModalLogic = () => {
        const infoModal = document.getElementById('infoModal');
        if (!infoModal) return;

        let sellerEmail = '';
        let productName = '';

        // Recupera i dati del venditore e del prodotto quando il modale viene aperto
        infoModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            sellerEmail = button.getAttribute('data-seller-email');
            productName = button.getAttribute('data-product-name');
        });

        // Gestisce l'invio del form del modale
        const infoForm = document.getElementById('infoForm');
        infoForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impedisce l'invio tradizionale del form

            const message = document.getElementById('infoMessage').value;
            const subject = `Richiesta informazioni per il prodotto: ${productName}`;
            const body = `${message}\n\n---\nMessaggio inviato tramite FunShop per il prodotto: ${window.location.href}`;
            
            // Crea e apre un link `mailto:` per avviare il client di posta
            const mailtoLink = `mailto:${sellerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;

            // Chiude il modale dopo aver aperto il link
            const modalInstance = bootstrap.Modal.getInstance(infoModal);
            modalInstance.hide();
        });
    };

    // Inizializza tutte le funzionalità al caricamento della pagina
    await updateUserProfileLogic();
    updateCartPopupLogic();
    handleProfileImageUpload();
    // handleInfoModalLogic(); // Questa logica è già inclusa in prodotto.ejs, rimuoviamo la duplicazione
});