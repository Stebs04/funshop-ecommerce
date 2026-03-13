//Importo il modulo nodemailer, per l'invio delle email
const mailer = require('nodemailer');

// Configuro il trasportatore SMTP utilizzando il servizio Gmail
// Le credenziali sono recuperate dalle variabili d'ambiente per sicurezza
const transporter = mailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Funzione asincrona per inviare il riepilogo dell'ordine via email
const sendOrderSummary = async(userEmail, orderDetails) =>{
    try{
        // Costruzione del contenuto HTML dell'email con i dettagli dell'ordine
        const htmlContent= `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <div style="background-color: #4F46E5; padding: 30px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Grazie per il tuo acquisto!</h2>
                        <p style="color: #e0e7ff; margin-top: 10px; font-size: 16px;">Il tuo ordine è stato confermato</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Riepilogo ordine n° <strong style="color: #111827;">${orderDetails.orderId}</strong></p>
                        
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                            <!-- Iterazione sui prodotti per creare le righe della tabella -->
                            ${orderDetails.prodotti.map(prodotto=> 
                                `<tr>
                                    <td style="padding: 15px 0; border-bottom: 1px solid #f3f4f6; width: 80px;">
                                        <img src="${prodotto.immagine}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" alt="Prodotto"/>
                                    </td>
                                    <td style="padding: 15px; border-bottom: 1px solid #f3f4f6;">
                                        <span style="display: block; color: #1f2937; font-weight: 500; font-size: 16px;">${prodotto.nome}</span>
                                    </td>
                                    <td style="padding: 15px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                        <strong style="color: #4F46E5; font-size: 16px;">${prodotto.prezzo}</strong>
                                    </td>
                                </tr>`
                            ).join('')}
                        </table>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f3f4f6; text-align: right;">
                            <span style="color: #6b7280; font-size: 16px; margin-right: 15px;">Totale Ordine:</span>
                            <span style="color: #111827; font-size: 24px; font-weight: 700;">${orderDetails.totale}</span>
                        </div>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Grazie per aver scelto FunShop</p>
                    </div>
                </div>
            </div>`;
        
        // Configurazione delle opzioni dell'email (mittente, destinatario, oggetto, contenuto)
        const mailOption = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Il tuo ordine su FunShop è confermato",
            html: htmlContent // Corpo dell'email in formato HTML
        };
        
        // Invio dell'email tramite il trasportatore configurato
        await transporter.sendMail(mailOption);
        console.log("Email Inviata!!");
    }catch(error){
        // Gestione degli errori durante l'invio
        console.error("Errore nell'invio dell'email:", error);
    }
}

// Funzione asincrona per inviare l'email di reset della password
const sendPasswordResetEmail = async(userEmail, resetLink) =>{
    try{
        // Costruzione del contenuto HTML dell'email con il link per il reset
        const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <div style="background-color: #4F46E5; padding: 30px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Reset Password</h2>
                        <p style="color: #e0e7ff; margin-top: 10px; font-size: 16px;">Hai richiesto di reimpostare la tua password</p>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Ciao,</p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Abbiamo ricevuto una richiesta per resettare la password del tuo account FunShop. Se sei stato tu, clicca sul pulsante qui sotto per impostare una nuova password.</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                                Reimposta Password
                            </a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">Se non hai richiesto tu il reset, puoi tranquillamente ignorare questa email. Il link scadrà tra un'ora.</p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Grazie,<br>Il Team di FunShop</p>
                    </div>
                </div>
            </div>`;

        // Configurazione delle opzioni dell'email (mittente, destinatario, oggetto, contenuto)
        const mailOption = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Resetta la tua password per FunShop',
            html: htmlContent
        };

        // Invio dell'email tramite il trasportatore configurato
        await transporter.sendMail(mailOption);
        console.log("Email Reset Password Inviata!!");
    }catch(error){
        // Gestione degli errori durante l'invio
        console.error("Errore nell'invio dell'email di reset:", error);
    }
}

// Esporto le funzioni per l'invio delle email
module.exports = {sendOrderSummary, sendPasswordResetEmail};