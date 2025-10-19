'use strict';

// Importazione di Nodemailer per l'invio di email
const nodemailer = require('nodemailer');
// Caricamento delle variabili d'ambiente
require('dotenv').config();

// Configurazione del "trasportatore" di email, utilizzando Gmail come servizio.
// Le credenziali (utente e password) sono caricate in modo sicuro dalle variabili d'ambiente.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Invia un'email di conferma dopo che un ordine è stato completato.
 * @param {string} buyerEmail - L'indirizzo email del cliente.
 * @param {object} orderDetails - Un oggetto contenente tutti i dettagli dell'ordine.
 */
const sendOrderConfirmationEmail = async (buyerEmail, orderDetails) => {
    // Costruisce dinamicamente la sezione per lasciare una recensione,
    // mostrandola solo se l'utente non è un ospite (isGuest è false).
    const reviewSectionHtml = !orderDetails.isGuest ? `
        <div style="text-align: center; margin-top: 20px;">
            <p>La tua opinione è importante! Aiuta la community lasciando una recensione al venditore.</p>
            <a href="${orderDetails.reviewLink}" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Lascia una Recensione
            </a>
        </div>
    ` : '';

    // Opzioni dell'email, inclusi mittente, destinatario, oggetto e corpo HTML.
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

    // Tenta di inviare l'email e gestisce eventuali errori.
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email di conferma inviata con successo a ${buyerEmail}`);
    } catch (error) {
        console.error(`Errore durante l'invio dell'email a ${buyerEmail}:`, error);
    }
};

/**
 * Invia un'email contenente un link per il reset della password.
 * @param {string} userEmail - L'indirizzo email dell'utente che ha richiesto il reset.
 * @param {string} resetLink - L'URL univoco per la pagina di reset della password.
 */
const sendPasswordResetEmail = async (userEmail, resetLink) => {
    const mailOptions = {
        from: `"FunShop" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Resetta la tua password per FunShop',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #4F46E5;">Richiesta di Reset Password</h2>
                    <p>Ciao,</p>
                    <p>Abbiamo ricevuto una richiesta per resettare la password del tuo account. Clicca sul pulsante qui sotto per impostare una nuova password.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Resetta Password
                        </a>
                    </div>
                    <p>Se non hai richiesto tu il reset, puoi tranquillamente ignorare questa email. Il link scadrà tra un'ora.</p>
                    <p style="margin-top: 30px; font-size: 0.9em; text-align: center; color: #777;">Grazie,<br>Il Team di FunShop</p>
                </div>
            </div>
        `
    };

    // Tenta di inviare l'email e, in caso di errore, lo rilancia per gestirlo nella rotta chiamante.
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email di reset password inviata a ${userEmail}`);
    } catch (error) {
        console.error(`Errore durante l'invio dell'email di reset a ${userEmail}:`, error);
        throw error;
    }
};

// Esporta le funzioni per renderle disponibili in altre parti dell'applicazione.
module.exports = { sendOrderConfirmationEmail, sendPasswordResetEmail };