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
    
    // --- INIZIO MODIFICA QUI ---
    // Definiamo il blocco HTML per la recensione in una variabile
    const reviewSectionHtml = !orderDetails.isGuest ? `
        <div style="text-align: center; margin-top: 20px;">
            <p>La tua opinione è importante! Aiuta la community lasciando una recensione al venditore.</p>
            <a href="${orderDetails.reviewLink}" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Lascia una Recensione
            </a>
        </div>
    ` : ''; // Se è un ospite, la stringa è vuota
    // --- FINE MODIFICA QUI ---

    const mailOptions = {
        from: `"FunShop" <${process.env.EMAIL_USER}>`,
        to: buyerEmail,
        subject: '🎉 Il tuo ordine su FunShop è stato confermato!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #4F46E5;">Grazie per il tuo acquisto, ${orderDetails.buyer.nome}!</h2>
                    <p>Il tuo ordine è stato confermato con successo e verrà elaborato a breve. Ecco un riepilogo dei dettagli.</p>
                    
                    <hr>
                    
                    <h3 style="color: #4F46E5;">Riepilogo Prodotti</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${orderDetails.items.map(item => `
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.nome}</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>€${(item.prezzo_scontato || item.prezzo).toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td style="padding: 15px 0; font-size: 1.2em; text-align: right;"><strong>Totale:</strong></td>
                            <td style="padding: 15px 0; font-size: 1.2em; text-align: right;"><strong>€${orderDetails.total.toFixed(2)}</strong></td>
                        </tr>
                    </table>

                    <hr>

                    <table style="width: 100%;">
                        <tr>
                            <td style="vertical-align: top; padding-right: 10px; width: 50%;">
                                <h3 style="color: #4F46E5;">Spedito a:</h3>
                                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                                    <strong>${orderDetails.address.nome} ${orderDetails.address.cognome}</strong><br>
                                    ${orderDetails.address.indirizzo}<br>
                                    ${orderDetails.address.cap}, ${orderDetails.address.citta}
                                </div>
                            </td>
                            <td style="vertical-align: top; padding-left: 10px; width: 50%;">
                                <h3 style="color: #4F46E5;">Pagamento:</h3>
                                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                                    Carta che termina con <strong>**** ${orderDetails.payment.last4}</strong><br>
                                    Titolare: ${orderDetails.payment.nome_titolare}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <hr>
                    
                    ${reviewSectionHtml}
                    
                    <p style="margin-top: 30px; font-size: 0.9em; text-align: center; color: #777;">Grazie,<br>Il Team di FunShop</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email di conferma inviata con successo a ${buyerEmail}`);
    } catch (error) {
        console.error(`Errore durante l'invio dell'email a ${buyerEmail}:`, error);
    }
};

module.exports = { sendOrderConfirmationEmail };