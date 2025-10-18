// File: services/emailService.js
'use strict';

const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configura il "trasportatore" (il servizio che invierà l'email)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usiamo Gmail
    auth: {
        user: process.env.EMAIL_USER, // La tua email dal file .env
        pass: process.env.EMAIL_PASS  // La tua password per le app dal file .env
    }
});

/**
 * Invia un'email di conferma ordine all'acquirente.
 * @param {string} buyerEmail - L'indirizzo email dell'acquirente.
 * @param {object} orderDetails - I dettagli dell'ordine salvati in sessione.
 */
const sendOrderConfirmationEmail = async (buyerEmail, orderDetails) => {
    // Il link per la recensione ora viene passato direttamente
    const reviewLink = orderDetails.reviewLink;

    // 2. Definisci il contenuto dell'email (puoi usare HTML per un look migliore)
    const mailOptions = {
        from: `"FunShop" <${process.env.EMAIL_USER}>`,
        to: buyerEmail,
        subject: '🎉 Il tuo ordine su FunShop è stato confermato!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Ciao ${orderDetails.buyer.nome},</h2>
                <p>Grazie per il tuo acquisto! Il tuo ordine è stato confermato con successo.</p>
                <h3>Riepilogo Ordine:</h3>
                <ul>
                    ${orderDetails.items.map(item => `<li>${item.nome} - <strong>€${(item.prezzo_scontato || item.prezzo).toFixed(2)}</strong></li>`).join('')}
                </ul>
                <p style="font-size: 1.2em;"><strong>Totale: €${orderDetails.total.toFixed(2)}</strong></p>
                <hr>
                <p>La tua opinione è importante! Aiuta la community lasciando una recensione al venditore.</p>
                <a href="${reviewLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                    Lascia una recensione
                </a>
                <p style="margin-top: 20px;">Grazie,<br>Il Team di FunShop</p>
            </div>
        `
    };

    // 3. Invia l'email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email di conferma inviata con successo a ${buyerEmail}`);
    } catch (error) {
        console.error(`Errore durante l'invio dell'email a ${buyerEmail}:`, error);
        // In un'applicazione reale, qui potresti voler registrare l'errore
        // senza bloccare il flusso dell'utente.
    }
};

module.exports = { sendOrderConfirmationEmail };