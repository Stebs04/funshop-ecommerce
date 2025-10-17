document.addEventListener('DOMContentLoaded', async () => {

    /**
     * Gestisce la logica per il popup del profilo utente.
     */
    const updateUserProfileLogic = async () => {
        const profileButton = document.getElementById('profile-button');
        if (!profileButton) return;

        let profilePreview;
        let hideProfileTimeout;
        const HIDE_DELAY = 300;

        const getAuthData = async () => {
            try {
                const response = await fetch('/api/auth/status');
                if (!response.ok) return null;
                return await response.json();
            } catch (error) {
                console.error('Errore nel controllo dello stato di autenticazione:', error);
                return null;
            }
        };

        const authData = await getAuthData();

        if (authData && authData.isAuthenticated) {
            profilePreview = document.createElement('div');
            profilePreview.id = 'profile-preview';
            const isSeller = authData.user.tipo_account === 'venditore';

            profilePreview.innerHTML = `
                <a href="/utente?section=dati" class="profile-link">Il mio account</a>
                <a href="/utente?section=impostazioni" class="profile-link">Impostazioni</a>
                ${isSeller ? `<a href="/products/new" class="profile-link">Aggiungi un nuovo prodotto</a>` : ''}
                <div class="profile-divider" style="height: 1px; background: #eee; margin: 8px 0;"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;
            document.body.appendChild(profilePreview);

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

            const hideProfilePreview = () => {
                if (!profilePreview) return;
                profilePreview.style.opacity = '0';
                profilePreview.style.visibility = 'hidden';
                profilePreview.style.transform = 'translateY(10px)';
            };

            const startProfileHideTimer = () => {
                hideProfileTimeout = setTimeout(hideProfilePreview, HIDE_DELAY);
            };

            [profileButton, profilePreview].forEach(element => {
                element.addEventListener('mouseenter', showProfilePreview);
                element.addEventListener('mouseleave', startProfileHideTimer);
            });
        }
    };

    /**
     * NUOVA FUNZIONE: Gestisce la logica per il popup del carrello.
     */
    const updateCartPopupLogic = () => {
        const cartButton = document.getElementById('cart-button');
        if (!cartButton) return;

        let cartPreview;
        let hideCartTimeout;
        const HIDE_DELAY = 300;

        const createCartPopup = () => {
            if (document.getElementById('cart-preview')) {
                cartPreview = document.getElementById('cart-preview');
                return;
            };

            cartPreview = document.createElement('div');
            cartPreview.id = 'cart-preview';
            document.body.appendChild(cartPreview);

            cartPreview.addEventListener('mouseenter', () => clearTimeout(hideCartTimeout));
            cartPreview.addEventListener('mouseleave', startCartHideTimer);
        };

        const updatePopupContent = async () => {
            try {
                const response = await fetch('/carrello/api/data');
                const cart = await response.json();
                const cartCounter = document.getElementById('cart-counter');

                if (cart && cart.totalQty > 0) {
                    cartCounter.innerText = cart.totalQty;
                    cartCounter.style.display = 'block';
                } else {
                    cartCounter.innerText = '';
                    cartCounter.style.display = 'none';
                }

                if (!cartPreview) createCartPopup();

                if (!cart || cart.totalQty === 0) {
                    cartPreview.innerHTML = `<p class="text-center text-muted m-0">Il tuo carrello è vuoto.</p>`;
                } else {
                    let itemsHtml = Object.values(cart.items).map(product => `
                        <div class="d-flex mb-3">
                            <img src="${product.item.percorso_immagine}" alt="${product.item.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                            <div class="ms-2 flex-grow-1">
                                <h6 class="mb-0 small">${product.item.nome}</h6>
                                <small class="text-muted">${product.qty} x €${(product.item.prezzo_scontato || product.item.prezzo).toFixed(2)}</small>
                            </div>
                            <span class="fw-bold small">€${product.price.toFixed(2)}</span>
                        </div>
                    `).join('');
                    
                    cartPreview.innerHTML = `
                        ${itemsHtml}
                        <hr class="my-2">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="fw-bold">Totale:</span>
                            <span class="fw-bold fs-5">€${cart.totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="/carrello" class="btn btn-outline-primary btn-sm">Vedi il Carrello</a>
                            <a href="/carrello/checkout" class="btn btn-primary btn-sm">Vai al Checkout</a>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Errore nel recuperare i dati del carrello:', error);
                if (cartPreview) cartPreview.innerHTML = `<p class="text-center text-danger m-0">Errore caricamento.</p>`;
            }
        };

        const showCartPreview = () => {
            if (!cartPreview) createCartPopup();
            clearTimeout(hideCartTimeout);
            updatePopupContent();

            const buttonRect = cartButton.getBoundingClientRect();
            cartPreview.style.top = `${buttonRect.bottom + window.scrollY + 10}px`;
            const previewRect = cartPreview.getBoundingClientRect();
            cartPreview.style.left = `${buttonRect.right + window.scrollX - previewRect.width}px`;

            cartPreview.style.opacity = '1';
            cartPreview.style.visibility = 'visible';
            cartPreview.style.transform = 'translateY(0)';
        };

        const startCartHideTimer = () => {
            hideCartTimeout = setTimeout(() => {
                if (!cartPreview) return;
                cartPreview.style.opacity = '0';
                cartPreview.style.visibility = 'hidden';
                cartPreview.style.transform = 'translateY(10px)';
            }, HIDE_DELAY);
        };

        cartButton.addEventListener('mouseenter', showCartPreview);
        cartButton.addEventListener('mouseleave', startCartHideTimer);

        updatePopupContent();
    };

    /**
     * Gestisce il pop-up per il caricamento dell'immagine del profilo.
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

    // Inizializza tutte le funzioni
    await updateUserProfileLogic();
    updateCartPopupLogic();
    handleProfileImageUpload();
});