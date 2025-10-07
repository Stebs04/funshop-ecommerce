document.addEventListener('DOMContentLoaded', async () => {

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

    // Esegui la logica del popup SOLO se l'utente è loggato
    if (authData && authData.isAuthenticated) {

        // Crea l'elemento del popup
        profilePreview = document.createElement('div');
        profilePreview.id = 'profile-preview';

        const isSeller = authData.user.tipo_account === 'venditore';

        // Popola con il contenuto corretto
        if (isSeller) {
            profilePreview.innerHTML = `
                <a href="/utente" class="profile-link">Il mio account</a>
                <a href="/utente/impostazioni" class="profile-link">Impostazioni</a>
                <a href="/nuovo-prodotto" class="profile-link">Aggiungi un nuovo prodotto</a>
                <div class="profile-divider"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;
        } else {
            profilePreview.innerHTML = `
                <a href="/utente" class="profile-link">Il mio account</a>
                <a href="/utente/impostazioni" class="profile-link">Impostazioni</a>
                <div class="profile-divider"></div>
                <a href="/auth/logout" class="profile-link">Esci</a>
            `;
        }
        document.body.appendChild(profilePreview);

        // Funzioni per mostrare/nascondere il popup
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

        // Collega gli eventi SOLO per il mouse (hover)
        [profileButton, profilePreview].forEach(element => {
            element.addEventListener('mouseenter', showProfilePreview);
            element.addEventListener('mouseleave', startProfileHideTimer);
        });
        
        // NESSUN event listener per il 'click' viene aggiunto qui.
        // In questo modo, il click sul pulsante si comporterà come un link normale 
        // e ti porterà a "/utente" come specificato in navbar.ejs.

    } else {
        // Se l'utente non è loggato, il link in navbar.ejs punterà già a /auth/registrazione
        // e funzionerà al click senza bisogno di JavaScript.
    }
});