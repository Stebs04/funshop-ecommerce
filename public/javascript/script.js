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
                <div class="profile-divider"></div>
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
     * Carica i prodotti dal database e li visualizza nella pagina.
     */
    const loadProducts = async () => {
        const container = document.getElementById('product-container');
        if (!container) {
            // Se il contenitore non c'è, significa che non siamo nella homepage.
            return;
        }

        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`Errore HTTP! stato: ${response.status}`);
            }
            const products = await response.json();

            container.innerHTML = ''; // Pulisce il contenitore

            if (products.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">Nessun prodotto disponibile al momento.</p>';
                return;
            }

            products.forEach(product => {
                const displayPrice = product.prezzo > 0 ? product.prezzo : product.prezzo_asta;
                const col = document.createElement('div');
                col.className = 'col-12 col-md-4 col-lg-3 mb-4';

                col.innerHTML = `
                    <div class="card h-100 shadow-sm product-card" data-product-id="${product.id}">
                        <img src="${product.percorso_immagine}" class="card-img-top" alt="${product.nome}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                <a href="/products/${product.id}" class="text-decoration-none text-dark">
                                    ${product.nome}
                                </a>
                            </h5>
                            <p class="card-text text-muted small">${product.parola_chiave || ''}</p>
                            <p class="card-text text-primary small">Venduto da <strong>${product.nome_venditore}</strong></p>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">€ ${displayPrice.toFixed(2)}</span>
                                <a href="#" class="btn btn-sm btn-primary add-to-cart-btn" style="position: relative; z-index: 2;" title="Aggiungi al carrello">
                                    <i class="bi bi-cart-plus-fill fs-5"></i>
                                </a>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 text-center">
                            <small class="text-success fw-bold">${product.condizione}</small>
                        </div>
                    </div>
                `;
                container.appendChild(col);

                const card = col.querySelector('.product-card');
                card.addEventListener('click', (event) => {
                    // Se il click non proviene dal pulsante "Aggiungi al carrello"
                    if (!event.target.closest('.add-to-cart-btn')) {
                        const productId = card.dataset.productId;
                        window.location.href = `/products/${productId}`;
                    }
                });
            });

        } catch (error) {
            console.error('Impossibile caricare i prodotti:', error);
            container.innerHTML = '<p class="text-center text-danger">Non è stato possibile caricare i prodotti. Riprova più tardi.</p>';
        }
    };

    /**
     * Nasconde il link "Diventa un venditore" se l'utente lo è già.
     */
    const updateNavbarForSeller = async () => {
        try {
            const response = await fetch('/api/auth/status');
            if (!response.ok) return;

            const data = await response.json();
            if (data.isAuthenticated && data.user.tipo_account === 'venditore') {
                // Cerca il link tramite una classe o un ID più specifico se necessario
                const becomeSellerLink = document.querySelector('a[href="venditore.html"]');
                if (becomeSellerLink) {
                    becomeSellerLink.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Errore nel controllare lo stato del venditore:', error);
        }
    };

    /**
     * Gestisce il pop-up per il caricamento dell'immagine del profilo.
     */
    const handleProfileImageUpload = () => {
        const imageContainer = document.querySelector('.profile-image-container');
        const uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));

        if (imageContainer) {
            imageContainer.addEventListener('click', () => {
                uploadModal.show();
            });
        }
    };

    // Inizializza tutte le funzioni
    await updateUserProfileLogic();
    await loadProducts();
    handleProfileImageUpload();
});