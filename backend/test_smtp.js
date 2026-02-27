const nodemailer = require('nodemailer');

const testSMTP = async () => {
    let transporter = nodemailer.createTransport({
        host: 'mail.softigo.com.tr',
        port: 587,
        secure: false, // STARTTLS
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        let result = await transporter.verify();
        console.log("587 verified: " + result);
    } catch (e) {
        console.log("587 err: " + e.message);
    }

    let transporter2 = nodemailer.createTransport({
        host: 'mail.softigo.com.tr',
        port: 465,
        secure: true, // SSL
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        let result2 = await transporter2.verify();
        console.log("465 verified: " + result2);
    } catch (e) {
        console.log("465 err: " + e.message);
    }
};
testSMTP();
