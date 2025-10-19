// File: route/orderRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

/**
 * ROTTA: GET /ordine/riepilogo
 * * Mostra la pagina di riepilogo subito dopo che un ordine è stato completato con successo.
 * * Logica:
 * 1. Controlla se nella sessione (`req.session`) esistono i dati dell'ultimo ordine (`latestOrder`).
 * Questi dati vengono salvati dalla rotta di checkout.
 * 2. Se non ci sono dati, significa che l'utente ha provato ad accedere a questa pagina
 * direttamente senza aver completato un acquisto. Viene quindi mostrato un errore
 * e l'utente viene reindirizzato.
 * 3. Se i dati esistono, vengono recuperati e passati al template `ordine-riepilogo.ejs`
 * per essere visualizzati.
 * 4. **Importante**: Subito dopo aver recuperato i dati, `delete req.session.latestOrder;`
 * li rimuove dalla sessione. Questo è un passo cruciale per la sicurezza e la logica
 * dell'applicazione, in quanto impedisce all'utente di ricaricare la pagina di riepilogo
 * o di accedervi di nuovo in un secondo momento, garantendo che sia una pagina "usa e getta".
 */
router.get('/riepilogo', (req, res) => {
    // Se non ci sono dati di un ordine recente nella sessione, non c'è nulla da mostrare.
    if (!req.session.latestOrder) {
        req.flash('error', 'Nessun riepilogo ordine da visualizzare.');
        return res.redirect('/');
    }

    // Recupera i dettagli dell'ordine dalla sessione.
    const orderDetails = req.session.latestOrder;

    // Pulisce la sessione dopo l'uso per evitare che la pagina sia ricaricata o accessibile di nuovo.
    delete req.session.latestOrder; 
    
    // Renderizza la pagina di riepilogo passando i dettagli dell'ordine.
    res.render('pages/ordine-riepilogo', {
        title: 'Ordine Completato!',
        order: orderDetails
    });
});

module.exports = router;