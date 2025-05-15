// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\controllers\emailController.js
const transporter = require('../config/mailer');
// No necesitamos db aquí si el email del remitente viene del token JWT

exports.sendEmail = async (req, res) => {
    // req.user es añadido por el authMiddleware y contiene { id, username, email }
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: 'Usuario no autenticado o email no encontrado en token.' });
    }
    const senderEmail = req.user.email; 
    const senderName = req.user.username;

    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ message: 'Por favor, proporciona destinatario, asunto y mensaje.' });
    }

    // Verifica que el correo del remitente sea válido para hMailServer si es necesario.
    // Para un sistema local donde los usuarios se registran con emails de tu dominio local (ej. usuario@servidor-juego.casa.local),
    // y hMailServer maneja ese dominio, enviar "desde" ese email debería funcionar bien.
    // Si los usuarios se registran con emails externos (ej. @gmail.com) y quieres que el correo
    // APAREZCA venir de su email de Gmail, eso es "spoofing" y probablemente será bloqueado
    // o marcado como spam, a menos que tu hMailServer esté configurado como un relay autorizado para esos dominios (complejo).

    // Opción 1: Enviar como el usuario logueado.
    // Esto funciona mejor si senderEmail es una cuenta en tu dominio local de hMailServer.
    const mailOptions = {
        from: `"${senderName} (GameHub Local)" <${senderEmail}>`,
        to: to, 
        subject: subject,
        text: text,
        // html: `<p>Este es un <b>correo</b> enviado por ${senderName} (${senderEmail}):</p><p>${text.replace(/\n/g, '<br>')}</p>`
    };

    // Opción 2: Enviar desde una dirección de sistema y usar Reply-To.
    // Esto es más robusto si tienes problemas con que hMailServer rechace el 'from' del usuario.
    // Asegúrate de que MAIL_FROM_ADDRESS esté definido en .env y sea una cuenta válida en hMailServer.
    /*
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        replyTo: `"${senderName}" <${senderEmail}>`, // Para que las respuestas vayan al usuario real
        to: to,
        subject: subject,
        text: `Este es un mensaje enviado a través de GameHub Local por ${senderName} (${senderEmail}):\n\n${text}`,
        // html: `<p>Este es un mensaje enviado a través de GameHub Local por ${senderName} (${senderEmail}):</p><hr><p>${text.replace(/\n/g, '<br>')}</p>`
    };
    */

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: %s', info.messageId);
        res.json({ message: 'Correo enviado exitosamente.' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        // Proporciona más detalles del error si es posible, de forma segura
        let errorMessage = 'Error al enviar el correo.';
        if (error.responseCode) {
            errorMessage += ` (Código SMTP: ${error.responseCode})`;
        }
        res.status(500).json({ message: errorMessage, details: error.message });
    }
};