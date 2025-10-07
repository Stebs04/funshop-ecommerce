// In public/javascript/script.js

document.addEventListener('DOMContentLoaded', async () => {

    const profileButton = document.getElementById('profile-button');
    if (!profileButton) return;

    let profilePreview; // Il nostro popup
    let hideProfileTimeout;
    const HIDE_DELAY = 300; // Ritardo in ms prima di nascondere il popup

    /**
     * Controlla lo stato del login e recupera i dati dell'utente.
     * @returns {Promise<object|null>} Dati dell'utente o null.
     */
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

    /**
     * Mostra il popup posizionandolo correttamente.
     */
    const showProfilePreview = () => {
        if (!profilePreview) return;
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

    /**
     * Nasconde il popup.
     */
    const hideProfilePreview = () => {
        if (!profilePreview) return;
        profilePreview.style.opacity = '0';
        profilePreview.style.visibility = 'hidden';
        profilePreview.style.transform = 'translateY(10px)';
    };

    /**
     * Avvia un timer per nascondere il popup.
     */
    const startProfileHideTimer = () => {
        hideProfileTimeout = setTimeout(hideProfilePreview, HIDE_DELAY);
    };


    // --- ESECUZIONE PRINCIPALE ---
    const authData = await getAuthData();

    if (authData && authData.isAuthenticated) {
        // --- CASO 1: L'UTENTE È LOGGATO ---

        // 1. Crea l'elemento del popup
        profilePreview = document.createElement('div');
        profilePreview.id = 'profile-preview';

        // 2. Determina quale contenuto mostrare in base al tipo di account
        const isSeller = authData.user.tipo_account === 'venditore';

        if (isSeller) {
            // Contenuto per il VENDITORE
            profilePreview.innerHTML = `
                <a href="/utente" class="profile-link">Il mio account</a>
                <a href="/impostazioni" class="profile-link">Impostazioni</a>
                <a href="/nuovo-prodotto" class="profile-link">Aggiungi un nuovo prodotto</a>
                <div class="profile-divider"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;
        } else {
            // Contenuto per il CLIENTE normale
            profilePreview.innerHTML = `
                <a href="/utente" class="profile-link">Il mio account</a>
                <a href="/impostazioni" class="profile-link">Impostazioni</a>
                <div class="profile-divider"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;
        }

        // 3. Aggiungi il popup al corpo della pagina
        document.body.appendChild(profilePreview);

        // 4. Collega gli eventi di HOVER e CLICK
        profileButton.addEventListener('click', (event) => {
            event.preventDefault(); // Impedisce al link di navigare
            if (profilePreview.style.visibility !== 'visible') {
                showProfilePreview();
            } else {
                hideProfilePreview();
            }
        });

        [profileButton, profilePreview].forEach(element => {
            element.addEventListener('mouseenter', showProfilePreview);
            element.addEventListener('mouseleave', startProfileHideTimer);
        });

    } else {
        // --- CASO 2: L'UTENTE NON È LOGGATO ---

        // Il passaggio del mouse non fa nulla.
        // Collega solo l'evento CLICK per il redirect.
        profileButton.addEventListener('click', (event) => {
            event.preventDefault(); // Impedisce al link di navigare
            window.location.href = '/auth/registrazione'; // Reindirizza alla registrazione
        });
    }

    // Qui puoi inserire altre logiche, come il caricamento dei prodotti
    // loadProducts();
});