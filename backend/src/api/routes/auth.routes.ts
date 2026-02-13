import { FastifyInstance } from 'fastify';
import { ImapFlow } from 'imapflow';
import { CryptoService } from '../../services/crypto.service';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { email, password, host, port, secure } = request.body as any;
        console.log(`🔑 Giriş isteği alındı: ${email}`);

        const client = new ImapFlow({
            host: host || process.env.IMAP_HOST,
            port: parseInt(port || (process.env.IMAP_PORT as string)),
            secure: secure ?? (process.env.IMAP_SECURE === 'true'),
            auth: { user: email, pass: password },
            tls: { rejectUnauthorized: false },
            logger: {} as any,
            greetingTimeout: 15000
        });

        client.on('error', err => {
            console.error('❌ IMAP Client Error Event:', err);
        });

        try {
            console.log(`🔍 IMAP sunucusuna bağlanılıyor: ${host || process.env.IMAP_HOST}`);
            await client.connect();
            console.log('✅ Bağlantı başarılı, token üretiliyor.');
            await client.logout();

            const sessionData = JSON.stringify({ email, password, host, port, secure });
            const token = CryptoService.encrypt(sessionData);

            return { success: true, token };
        } catch (error: any) {
            console.error('❌ IMAP Bağlantı Hatası:', error.message);

            let userMessage = 'Giriş başarısız: ' + (error.response || error.message);
            if (error.message.includes('AUTHENTICATIONFAILED') || error.message.includes('Authentication failed')) {
                userMessage = 'Giriş başarısız: Kullanıcı adı veya şifre hatalı.';
            } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                userMessage = 'Sunucuya bağlanılamadı. Lütfen sunucu bilgilerini kontrol edin.';
            }

            reply.status(401).send({ success: false, message: userMessage });
        }
    });
}
