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