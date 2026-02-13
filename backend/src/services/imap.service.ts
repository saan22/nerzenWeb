import { ImapFlow } from 'imapflow';
import { CryptoService } from './crypto.service';

export class ImapService {
    static async getClient(token: string) {
        const sessionData = JSON.parse(CryptoService.decrypt(token));
        const client = new ImapFlow({
            host: sessionData.host || process.env.IMAP_HOST,
            port: parseInt(sessionData.port || process.env.IMAP_PORT),
            secure: sessionData.secure ?? (process.env.IMAP_SECURE === 'true'),
            auth: { user: sessionData.email, pass: sessionData.password },
            tls: { rejectUnauthorized: false },
            logger: false,
            greetingTimeout: 15000
        });

        client.on('error', err => {
            console.error('❌ IMAP Client Error:', err);
        });

        await client.connect();
        return client;
    }

    static async findSystemFolders(client: ImapFlow) {
        const folders = await client.list();

        const findFolder = (types: string[], keywords: string[]) => {
            return folders.find(f =>
                (f.specialUse && types.includes(f.specialUse)) ||
                keywords.some(k => f.path.toLowerCase().includes(k.toLowerCase()))
            )?.path;
        };

        return {
            trash: findFolder(['\\Trash'], ['trash', 'çöp', 'deleted']) || 'Trash',
            junk: findFolder(['\\Junk'], ['junk', 'spam', 'istenmeyen']) || 'Junk',
            sent: findFolder(['\\Sent'], ['sent', 'gönderil', 'sent items']) || 'Sent',
            drafts: findFolder(['\\Drafts'], ['draft', 'taslak']) || 'Drafts',
            archive: findFolder(['\\Archive'], ['archive', 'arşiv']) || 'Archive'
        };
    }

    static getFolderMap(systemFolders: any) {
        return {
            'INBOX': 'INBOX',
            'DRAFTS': systemFolders.drafts,
            'SENT': systemFolders.sent,
            'SPAM': systemFolders.junk,
            'TRASH': systemFolders.trash,
            'ARCHIVE': systemFolders.archive,
            'STARRED': 'INBOX'
        };
    }
}
