import nodemailer from 'nodemailer';
import { ImapService } from './imap.service';

export class MailService {
    static async sendMail(sessionData: any, options: { to: string, subject: string, html: string, bodyText?: string, attachments?: any[] }) {
        const mailOptions = {
            from: sessionData.email,
            to: options.to,
            subject: options.subject,
            text: options.bodyText || options.html?.replace(/<[^>]*>?/gm, '') || '',
            html: options.html || options.bodyText?.replace(/\n/g, '<br>'),
            attachments: options.attachments || []
        };

        // 1. Generate Raw Message Buffer
        const streamTransporter = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: 'windows'
        });
        const info = await streamTransporter.sendMail(mailOptions);
        const rawMessage = info.message as Buffer;

        // 2. Send via SMTP
        const smtpTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || sessionData.host.replace('imap', 'mail').replace('993', '465'),
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: sessionData.email,
                pass: sessionData.password
            }
        });

        await smtpTransporter.sendMail({
            envelope: {
                from: sessionData.email,
                to: options.to
            },
            raw: rawMessage
        });

        return rawMessage;
    }

    static async saveToSent(clientData: { email: string, password: string, host: string, port: string, secure: boolean }, rawMessage: Buffer) {
        // We use fresh connection for append or reuse existing?
        // Appending to Sent is usually done after SMTP success.
    }
}
