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

    

    // --- LOGICA PROFILO ---
    if (profileButton) {
        const isUserLoggedIn = () => true; // Cambia in `false` per testare

        if (!isUserLoggedIn()) {
            profileButton.addEventListener('click', (event) => {
                event.preventDefault();
                window.location.href = 'registrazione.html';
            });
            return;
        }

        profilePreview = document.createElement('div');
        profilePreview.id = 'profile-preview';
        profilePreview.innerHTML = `
            <a href="utente.html" class="profile-link">Il mio account</a>
            <a href="/impostazioni.html" class="profile-link">Impostazioni</a>
            <a href="/nuovo-prodotto.html" class="profile-link">Aggiungi un nuovo prodotto</a>
            <div style="border-top: 1px solid #eee; margin: 5px 0;"></div>
            <a href="/logout" class="profile-link">Esci da questo account</a>
        `;
        Object.assign(profilePreview.style, {
            position: 'absolute', minWidth: '200px', backgroundColor: 'white',
            border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '5px 0', fontFamily: 'sans-serif', zIndex: '9999',
            opacity: '0', visibility: 'hidden', transform: 'translateY(10px)',
            transition: 'opacity 0.2s, transform 0.2s, visibility 0.2s'
        });
        profilePreview.querySelectorAll('.profile-link').forEach(link => {
            Object.assign(link.style, {
                display: 'block', padding: '8px 15px', color: '#333',
                textDecoration: 'none', fontSize: '14px', transition: 'background-color 0.2s'
            });
            link.addEventListener('mouseenter', () => link.style.backgroundColor = '#f5f5f5');
            link.addEventListener('mouseleave', () => link.style.backgroundColor = 'transparent');
        });
        document.body.appendChild(profilePreview);

        const showProfilePreview = () => {
            clearTimeout(hideProfileTimeout);
            clearTimeout(hideCartTimeout);
            hideCartPreview(); // Nasconde l'altro popup

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
            if (profilePreview.style.visibility === 'hidden') showProfilePreview();
        });

        [profileButton, profilePreview].forEach(element => {
            element.addEventListener('mouseenter', showProfilePreview);
            element.addEventListener('mouseleave', startProfileHideTimer);
        });
    } else {
        console.error('Elemento con id "profile-button" non trovato.');
    }
});

