// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\config\mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mailConfig = {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    secure: process.env.MAIL_SECURE === 'true', // true para 465, false para otros puertos como 587 (STARTTLS) o 25
    auth: {
        user: process.env.MAIL_USER || undefined, // undefined si no hay usuario/pass
        pass: process.env.MAIL_PASS || undefined,
    },
};

// Si usas STARTTLS en el puerto 587 y MAIL_SECURE es false, podrías necesitar:
// if (mailConfig.port === 587 && !mailConfig.secure) {
//     mailConfig.tls = { ciphers: 'SSLv3', rejectUnauthorized: false }; // Ajustar según necesidad, rejectUnauthorized: false no es ideal para producción
// }
// Para hMailServer local en puerto 25 sin auth, la configuración es simple.
// Si MAIL_USER o MAIL_PASS están vacíos, se omitirán del objeto 'auth'.
if (!mailConfig.auth.user) {
    delete mailConfig.auth; // Nodemailer maneja bien 'auth: undefined'
}


const transporter = nodemailer.createTransport(mailConfig);

// Verificar la conexión (opcional, pero bueno para depurar)
transporter.verify(function(error, success) {
    if (error) {
        console.error('Error al conectar con el servidor de correo:', error);
        console.error('Configuración usada:', mailConfig);
    } else {
        console.log('Servidor de correo está listo para recibir mensajes (Nodemailer).');
    }
});

module.exports = transporter;