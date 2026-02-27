"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Inbox, Send, Trash2, Star, Mail, Search,
    RefreshCw, LogOut, Calendar, User, X, ArrowRight,
    FileText, AlertOctagon, Archive, Reply, Paperclip,
    Sun, Moon, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "../../components/RichTextEditor";
import { useTheme } from "../../context/ThemeContext";

export default function Dashboard() {
    const router = useRouter();
    const { theme, toggleTheme, colors } = useTheme();
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMail, setSelectedMail] = useState<any>(null);
    const [draftUid, setDraftUid] = useState<number | null>(null);
    const [userEmail, setUserEmail] = useState("");
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState("INBOX");
    const [folders, setFolders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUids, setSelectedUids] = useState<number[]>([]);

    // Mobile Support States
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar when folder changed on mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
            fetchMails(selectedFolder);
        }
    }, [selectedFolder]);

    // Filter mails based on search term
    const filteredMails = mails.filter(mail => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (mail.subject && mail.subject.toLowerCase().includes(term)) ||
            (mail.from && mail.from.toLowerCase().includes(term))
        );
    });

    useEffect(() => {
        const token = localStorage.getItem("nerzen_token");
        const email = localStorage.getItem("nerzen_user");

        if (!token) {
            router.push("/");
            return;
        }

        setUserEmail(email || "");
        fetchFolders();
        fetchMails(selectedFolder);
    }, [router, selectedFolder]);

    const fetchFolders = async () => {
        const token = localStorage.getItem("nerzen_token");
        setSelectedUids([]); // Clear selection when fetching folders
        try {
            const response = await fetch(`/api/folders`, {
                headers: { "Authorization": token || "" }
            });
            const result = await response.json();
            if (result.success) {
                const order = ['INBOX', 'DRAFTS', 'SENT', 'JUNK', 'TRASH', 'ARCHIVE'];
                const sortedFolders = result.data.sort((a: any, b: any) => {
                    const indexA = order.indexOf(a.type);
                    const indexB = order.indexOf(b.type);

                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;

                    return a.name.localeCompare(b.name);
                });
                setFolders(sortedFolders);
            }
        } catch (error) {
            console.error("Klasör çekme hatası:", error);
        }
    };

    const fetchMails = async (folder: string) => {
        setLoading(true);
        setSelectedMail(null);
        const token = localStorage.getItem("nerzen_token");

        try {
            const encodedFolder = encodeURIComponent(folder);
            const response = await fetch(`/api/mails?folder=${encodedFolder}`, {
                headers: { "Authorization": token || "" }
            });
            const result = await response.json() as any;
            if (result.success) {
                setMails(result.data);
            } else {
                if (response.status === 401) {
                    // Only logout if unauthorized
                    localStorage.removeItem("nerzen_token");
                    localStorage.removeItem("nerzen_user");
                    window.location.href = "/";
                } else {
                    console.error("Mail listesi yüklenemedi:", result.error || "Bilinmeyen hata");
                    setMails([]); // Clear list on error
                }
            }
        } catch (error) {
            console.error("Mail çekme hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFolderInfo = (type: string, name: string) => {
        const mappings: any = {
            'INBOX': { label: 'Gelen', icon: <Inbox size={18} /> },
            'DRAFTS': { label: 'Taslak', icon: <FileText size={18} /> },
            'SENT': { label: 'Gönderilmiş', icon: <Send size={18} /> },
            'JUNK': { label: 'İstenmeyen', icon: <AlertOctagon size={18} /> },
            'TRASH': { label: 'Çöp', icon: <Trash2 size={18} /> },
            'ARCHIVE': { label: 'Arşiv', icon: <Archive size={18} /> },
            'USER': { label: name, icon: <Mail size={18} /> }
        };
        return mappings[type] || { label: name, icon: <Mail size={18} /> };
    };

    const handleLogout = () => {
        if (confirm("Oturumu kapatmak istediğinizden emin misiniz?")) {
            localStorage.removeItem("nerzen_token");
            localStorage.removeItem("nerzen_user");
            window.location.href = "/";
        }
    };

    const handleMailSelect = async (mail: any) => {
        setSelectedMail({ ...mail, loading: true });

        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${mail.uid}?folder=${encodedFolder}`, {
                headers: { "Authorization": token || "" }
            });
            const result = await response.json();
            if (result.success) {
                setSelectedMail(result.data);

                // Update local list state to mark as read immediately
                setMails(prevMails => prevMails.map(m =>
                    m.uid === mail.uid
                        ? { ...m, flags: [...(m.flags || []), '\\Seen'] }
                        : m
                ));
            }
        } catch (error) {
            console.error("Mail detayı hatası:", error);
        }
    };

    const handleToggleSelect = (uid: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUids(prev =>
            prev.includes(uid)
                ? prev.filter(id => id !== uid)
                : [...prev, uid]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUids(filteredMails.map(m => m.uid));
        } else {
            setSelectedUids([]);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        const token = localStorage.getItem("nerzen_token");

        try {
            const formData = new FormData();
            formData.append('to', composeData.to);
            formData.append('subject', composeData.subject);
            formData.append('html', composeData.body); // Send body as HTML

            attachments.forEach(file => {
                formData.append('attachments', file, file.name || 'attachment');
            });

            const response = await fetch(`/api/send`, {
                method: "POST",
                headers: {
                    // "Content-Type" NOT SET (browser sets multipart/form-data boundary automatically)
                    "Authorization": token || ""
                },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                // If this was a draft, delete it from drafts folder
                if (draftUid) {
                    try {
                        const delResponse = await fetch(`/api/mails/${draftUid}?folder=DRAFTS`, {
                            method: 'DELETE',
                            headers: { "Authorization": token || "" }
                        });
                        if (delResponse.ok) {
                            console.log("Taslak gönderildikten sonra silindi.");
                            if (selectedFolder === 'DRAFTS') fetchMails('DRAFTS');
                        }
                    } catch (delErr) {
                        console.error("Taslak silinemedi:", delErr);
                    }
                }

                setIsComposeOpen(false);
                setComposeData({ to: "", subject: "", body: "" });
                setAttachments([]);
                setDraftUid(null);
                alert("E-posta başarıyla gönderildi!");
            }
        } catch (error) {
            console.error("Gönderim hatası:", error);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMail = async (uid: number | string) => {
        const isBulk = typeof uid === 'string' && uid.includes(',');
        if (!confirm(isBulk ? "Seçili mailleri silmek istediğinizden emin misiniz?" : "Bu maili silmek istediğinizden emin misiniz?")) return;

        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${uid}?folder=${encodedFolder}`, {
                method: 'DELETE',
                headers: { "Authorization": token || "" }
            });

            if (response.ok) {
                let message = 'Mail başarıyla silindi';
                if (response.status !== 204) {
                    const result = await response.json();
                    message = result.message || message;
                }
                alert(message);
                if (isBulk) {
                    setSelectedUids([]);
                } else {
                    setSelectedMail(null);
                }
                fetchMails(selectedFolder);
            } else {
                alert('Mail silinirken hata oluştu');
            }
        } catch (error) {
            console.error("Silme hatası:", error);
            alert("Sunucuya bağlanılamadı. Lütfen internetinizi veya sunucuyu kontrol edin.");
        }
    };

    const handleMarkAsSpam = async (uid: number | string) => {
        const isBulk = typeof uid === 'string' && uid.includes(',');
        if (!confirm(isBulk ? "Seçili mailler istenmeyen olarak işaretlensin mi?" : "Bu mail istenmeyen olarak işaretlensin mi?")) return;

        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${uid}/spam?folder=${encodedFolder}`, {
                method: 'POST',
                headers: { "Authorization": token || "" }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Mail istenmeyen olarak işaretlendi');
                if (isBulk) {
                    setSelectedUids([]);
                } else {
                    setSelectedMail(null);
                }
                fetchMails(selectedFolder);
            } else {
                alert('İşlem sırasında hata oluştu');
            }
        } catch (error) {
            console.error("Spam işaretleme hatası:", error);
            alert("Sunucuya bağlanılamadı. Lütfen sunucuyu kontrol edin.");
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Çöp kutusundaki tüm mailler kalıcı olarak silinecek. Emin misiniz?")) return;

        const token = localStorage.getItem("nerzen_token");
        try {
            const response = await fetch(`/api/trash/empty`, {
                method: 'DELETE',
                headers: { "Authorization": token || "" }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Çöp kutusu boşaltıldı');
                setSelectedMail(null);
                fetchMails('TRASH');
            } else {
                alert('Çöp kutusu boşaltılırken hata oluştu');
            }
        } catch (error) {
            console.error("Çöp kutusu boşaltma hatası:", error);
            alert("Sunucuya bağlanılamadı. Lütfen sunucuyu kontrol edin.");
        }
    };

    const handleSaveDraft = async () => {
        if (!composeData.to && !composeData.subject && !composeData.body) {
            alert("Taslak kaydetmek için en az bir alan doldurulmalıdır.");
            return;
        }

        const token = localStorage.getItem("nerzen_token");
        const formData = new FormData();
        formData.append("to", composeData.to);
        formData.append("subject", composeData.subject);
        formData.append("html", composeData.body);

        attachments.forEach((file) => {
            formData.append("attachments", file, file.name || 'attachment');
        });

        try {
            const response = await fetch(`/api/drafts`, {
                method: "POST",
                headers: {
                    "Authorization": token || ""
                },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert("Taslak başarıyla kaydedildi!");
                setIsComposeOpen(false); // Optional: close or keep open? standard is close or notify.
                setComposeData({ to: "", subject: "", body: "" });
                setAttachments([]);
                if (selectedFolder === 'DRAFTS') fetchMails('DRAFTS'); // Refresh current view if drafts
            } else {
                alert("Taslak kaydedilemedi: " + result.error);
            }
        } catch (error) {
            console.error("Taslak kaydetme hatası:", error);
            alert("Bir hata oluştu.");
        }
    };

    const handleEditDraft = () => {
        if (!selectedMail) return;
        setDraftUid(selectedMail.uid); // Track that we are editing this draft
        setComposeData({
            to: selectedMail.to || "",
            subject: selectedMail.subject || "",
            body: selectedMail.body || ""
        });
        setIsComposeOpen(true);
    };

    const handleArchiveMail = async (uid: number | string) => {
        const isBulk = typeof uid === 'string' && uid.includes(',');
        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${uid}/archive?folder=${encodedFolder}`, {
                method: 'POST',
                headers: { "Authorization": token || "" }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Mail arşivlendi');
                if (isBulk) {
                    setSelectedUids([]);
                } else {
                    setSelectedMail(null);
                }
                fetchMails(selectedFolder);
            } else {
                alert('Arşivleme hatası');
            }
        } catch (error) {
            console.error("Arşivleme hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleMarkAsUnread = async (uid: number | string) => {
        const isBulk = typeof uid === 'string' && uid.includes(',');
        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${uid}/unread?folder=${encodedFolder}`, {
                method: 'POST',
                headers: { "Authorization": token || "" }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Mail okunmadı olarak işaretlendi');
                if (isBulk) {
                    setSelectedUids([]);
                } else {
                    setSelectedMail(null);
                }
                fetchMails(selectedFolder);
            } else {
                alert('İşlem hatası');
            }
        } catch (error) {
            console.error("Okunmadı işaretleme hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleMoveMail = async (uid: number | string, destination: string) => {
        const isBulk = typeof uid === 'string' && uid.includes(',');
        if (!destination || destination === selectedFolder) return;

        const token = localStorage.getItem("nerzen_token");
        try {
            const encodedFolder = encodeURIComponent(selectedFolder);
            const response = await fetch(`/api/mails/${uid}/move?folder=${encodedFolder}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token || ""
                },
                body: JSON.stringify({ destination })
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Mail taşındı');
                if (isBulk) {
                    setSelectedUids([]);
                } else {
                    setSelectedMail(null);
                }
                fetchMails(selectedFolder);
            } else {
                alert('Taşıma hatası');
            }
        } catch (error) {
            console.error("Taşıma hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleReplyMail = (mail: any) => {
        setComposeData({
            to: mail.from,
            subject: `Re: ${mail.subject}`,
            body: `\n\n\n--------------------------------\nKimden: ${mail.from}\nTarih: ${new Date(mail.date).toLocaleString('tr-TR')}\nKonu: ${mail.subject}\n\n${mail.body || ''}`
        });
        setIsComposeOpen(true);
    };

    const handleDownloadMail = async (uid: number) => {
        if (!confirm("Bu e-postayı .eml formatında indirmek istediğinize emin misiniz?")) return;

        const token = localStorage.getItem("nerzen_token");
        try {
            const res = await fetch(`/api/mails/${uid}/download?folder=${encodeURIComponent(selectedFolder)}`, {
                headers: { "Authorization": token || "" }
            });
            if (!res.ok) throw new Error('İndirme başarısız');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mail-${uid}.eml`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("İndirme hatası:", err);
            alert("E-posta indirilemedi");
        }
    };



    // Bulk Action Wrappers
    const handleBulkDelete = () => handleDeleteMail(selectedUids.join(','));
    const handleBulkMarkAsSpam = () => handleMarkAsSpam(selectedUids.join(','));
    const handleBulkArchive = () => handleArchiveMail(selectedUids.join(','));
    const handleBulkMarkAsUnread = () => handleMarkAsUnread(selectedUids.join(','));
    const handleBulkMove = (dest: string) => handleMoveMail(selectedUids.join(','), dest);

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            backgroundColor: colors.bg,
            color: colors.text,
            overflow: 'hidden',
            transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
            {/* SIDEBAR */}
            <div style={{
                position: isMobile ? 'fixed' : 'relative',
                left: isMobile ? (isSidebarOpen ? '0' : '-280px') : '0',
                top: 0,
                bottom: 0,
                zIndex: 100,
                width: '280px',
                backgroundColor: colors.sidebarBg,
                borderRight: `1px solid ${colors.sidebarBorder}`,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                boxShadow: isMobile && isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
            }}>
                {/* Logo */}
                <div style={{
                    height: '64px',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: `1px solid ${colors.sidebarBorder}`
                }}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            height: '40px',
                            width: 'auto',
                            filter: theme === 'dark'
                                ? 'drop-shadow(0 0 4px rgba(59,130,246,0.3))'
                                : 'drop-shadow(0 1px 4px rgba(0,0,0,0.2))'
                        }}
                    />
                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            style={{ position: 'absolute', right: '16px', color: colors.subtext }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Compose Button */}
                <div style={{ padding: '16px' }}>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        style={{
                            width: '100%',
                            height: '48px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                    >
                        <Send size={16} />
                        Yeni Posta
                    </button>
                </div>

                {/* Navigation */}
                <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
                    {folders.length > 0 ? (
                        folders.map((folder) => {
                            const info = getFolderInfo(folder.type, folder.name);

                            return (
                                <NavItem
                                    key={folder.path}
                                    icon={info.icon}
                                    label={info.label}
                                    active={selectedFolder === folder.path}
                                    count={selectedFolder === folder.path ? mails.length : 0}
                                    onClick={() => setSelectedFolder(folder.path)}
                                />
                            );
                        })
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', opacity: 0.3 }}>
                            <p style={{ fontSize: '11px' }}>Klasörler yükleniyor...</p>
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${colors.sidebarBorder}`,
                    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(59,130,246,0.2)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: colors.accent
                        }}>
                            {userEmail?.substring(0, 2).toUpperCase() || "NB"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.text }}>
                                {userEmail || "Kullanıcı"}
                            </p>
                            <p style={{ fontSize: '10px', color: colors.subtext }}>Aktif Oturum</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '11px',
                            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            border: `1px solid ${colors.sidebarBorder}`,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.danger;
                            e.currentTarget.style.backgroundColor = colors.dangerBg;
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = colors.sidebarBorder;
                        }}
                    >
                        <LogOut size={16} />
                        Oturumu Kapat
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 90,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Bar */}
                <div style={{
                    height: '64px',
                    backgroundColor: colors.headerBg,
                    borderBottom: `1px solid ${colors.sidebarBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0 12px' : '0 24px',
                    flexShrink: 0,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flex: 1, maxWidth: isMobile ? '70%' : '400px' }}>
                        {isMobile && (
                            <button
                                onClick={() => selectedMail ? setSelectedMail(null) : setIsSidebarOpen(true)}
                                style={{ padding: '8px', color: colors.iconColor }}
                            >
                                {selectedMail ? <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> : <Inbox size={20} />}
                            </button>
                        )}
                        <Search size={16} style={{ color: colors.iconColor, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder={isMobile ? "Ara..." : "E-postaları ara..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: colors.text,
                                fontSize: '14px',
                                minWidth: 0
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Empty Trash Button */}
                        {(folders.find(f => f.path === selectedFolder)?.type === 'TRASH' || selectedFolder === 'TRASH') && (
                            <button
                                onClick={handleEmptyTrash}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(239,68,68,0.1)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginRight: '8px',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                            >
                                <Trash2 size={14} />
                                Çöpü Boşalt
                            </button>
                        )}
                        <button
                            onClick={toggleTheme}
                            style={{
                                padding: '10px',
                                color: colors.iconColor,
                                borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                                e.currentTarget.style.color = colors.text;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.iconColor;
                            }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px',
                                color: colors.accent,
                                borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                    {/* Mail List */}
                    <div style={{
                        width: isMobile ? '100%' : '380px',
                        display: isMobile ? (selectedMail ? 'none' : 'flex') : 'flex',
                        borderRight: isMobile ? 'none' : `1px solid ${colors.mailListBorder}`,
                        overflowY: 'auto',
                        flexShrink: 0,
                        backgroundColor: colors.mailListBg,
                        transition: 'background-color 0.3s ease, border-color 0.3s ease',
                        flexDirection: 'column'
                    }}>
                        {/* Select All Header */}
                        {!loading && filteredMails.length > 0 && (
                            <div style={{
                                padding: '12px 20px',
                                borderBottom: `1px solid ${colors.mailListBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedUids.length > 0 && selectedUids.length === filteredMails.length}
                                    onChange={handleSelectAll}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: colors.subtext }}>
                                    {selectedUids.length > 0 ? `${selectedUids.length} seçildi` : 'Tümünü Seç'}
                                </span>
                            </div>
                        )}
                        {loading ? (
                            <div style={{ padding: '32px' }}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} style={{ marginBottom: '16px', animation: 'pulse 2s infinite' }}>
                                        <div style={{ height: '12px', width: '60%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
                                        <div style={{ height: '16px', width: '80%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '4px' }} />
                                        <div style={{ height: '10px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                    </div>
                                ))}
                            </div>
                        ) : filteredMails.length === 0 ? (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                                padding: '32px'
                            }}>
                                <Mail size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p style={{ fontSize: '14px' }}>
                                    {searchTerm ? "Sonuç bulunamadı" : "Gelen kutunuz boş"}
                                </p>
                            </div>
                        ) : (
                            filteredMails.map((mail) => (
                                <MailItem
                                    key={mail.uid}
                                    mail={mail}
                                    active={selectedMail?.uid === mail.uid}
                                    selected={selectedUids.includes(mail.uid)}
                                    onToggleSelect={(e: any) => handleToggleSelect(mail.uid, e)}
                                    onClick={() => handleMailSelect(mail)}
                                />
                            ))
                        )}
                    </div>

                    {/* Mail Detail or Bulk Actions Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        backgroundColor: colors.mailDetailBg,
                        transition: 'background-color 0.3s ease',
                        display: isMobile ? (selectedMail || selectedUids.length > 0 ? 'flex' : 'none') : 'flex',
                        flexDirection: 'column'
                    }}>
                        {selectedUids.length > 0 ? (
                            /* Bulk Actions View */
                            <div style={{ padding: isMobile ? '20px' : '32px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, marginBottom: '8px', color: colors.text }}>
                                        {selectedUids.length} Öğe Seçildi
                                    </h2>
                                    <p style={{ color: colors.subtext, fontSize: '14px' }}>
                                        Seçili öğeler üzerinde toplu işlem yapabilirsiniz.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => handleBulkDelete()}
                                        style={{
                                            padding: isMobile ? '14px 20px' : '12px 24px',
                                            backgroundColor: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            color: '#EF4444',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Trash2 size={20} />
                                        {isMobile ? '' : (selectedFolder === 'TRASH' ? 'Kalıcı Sil' : 'Sil')}
                                    </button>
                                    <button
                                        onClick={() => handleBulkArchive()}
                                        style={{
                                            padding: isMobile ? '14px 20px' : '12px 24px',
                                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            border: `1px solid ${colors.sidebarBorder}`,
                                            color: colors.text,
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Archive size={20} />
                                        {isMobile ? '' : 'Arşivle'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedUids([])}
                                        style={{
                                            padding: isMobile ? '14px 20px' : '12px 24px',
                                            color: colors.subtext,
                                            fontSize: '14px',
                                            fontWeight: 600
                                        }}
                                    >
                                        Vazgeç
                                    </button>
                                </div>
                            </div>
                        ) : selectedMail ? (
                            /* Single Mail View */
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Mail Header Area */}
                                <div style={{
                                    padding: isMobile ? '16px' : '24px',
                                    borderBottom: `1px solid ${colors.sidebarBorder}`,
                                    backgroundColor: colors.headerBg
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: colors.text, lineHeight: 1.3 }}>
                                            {selectedMail.subject || '(Konu Yok)'}
                                        </h2>
                                        {isMobile && (
                                            <button
                                                onClick={() => setSelectedMail(null)}
                                                style={{ color: colors.accent, fontWeight: 700, padding: '8px' }}
                                            >
                                                Kapat
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '20px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '18px'
                                        }}>
                                            {selectedMail.from?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedMail.from}
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.subtext }}>
                                                {new Date(selectedMail.date).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Toolbar */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderBottom: `1px solid ${colors.sidebarBorder}`,
                                    overflowX: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    flexShrink: 0
                                }}>
                                    <button onClick={() => handleReplyMail(selectedMail)} style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        backgroundColor: colors.accent,
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <Reply size={18} /> Yanıtla
                                    </button>
                                    <button onClick={() => handleDeleteMail(selectedMail.uid)} style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(239,68,68,0.1)',
                                        color: '#EF4444',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Trash2 size={18} />
                                    </button>
                                    <button onClick={() => handleArchiveMail(selectedMail.uid)} style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: colors.subtext,
                                        fontSize: '13px',
                                        fontWeight: 700
                                    }}>
                                        <Archive size={18} />
                                    </button>
                                </div>

                                {/* Mail Body Content */}
                                <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'white' }}>
                                    {selectedMail.loading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <div className="loader" />
                                        </div>
                                    ) : (
                                        <iframe
                                            srcDoc={(() => {
                                                let content = selectedMail.body || "";
                                                const script = `
                                                    <base target="_blank" />
                                                    <script>
                                                        document.addEventListener('click', function(e) {
                                                            var anchor = e.target.closest('a');
                                                            if (anchor && anchor.href && !anchor.href.startsWith('mailto:') && !anchor.href.startsWith('javascript:')) {
                                                                e.preventDefault();
                                                                if (confirm('Bu bağlantıyı yeni sekmede açmak istiyor musunuz?\\n\\n' + anchor.href)) {
                                                                    window.open(anchor.href, '_blank', 'noopener,noreferrer');
                                                                }
                                                            }
                                                        }, true);
                                                    </script>
                                                `;
                                                return content.includes('<html') ? content.replace('<html', script + '<html') : script + content;
                                            })()}
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                            title="E-posta İçeriği"
                                        />
                                    )}
                                </div>

                                {/* Attachments Section (Bottom Strip) */}
                                {selectedMail.attachments?.length > 0 && (
                                    <div style={{
                                        padding: '16px',
                                        borderTop: `1px solid ${colors.sidebarBorder}`,
                                        backgroundColor: colors.headerBg,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: colors.subtext, textTransform: 'uppercase' }}>EK DOSYALAR ({selectedMail.attachments.length})</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedMail.attachments.map((att: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (confirm(`'${att.filename}' adlı dosyayı indirmek istediğinize emin misiniz?`)) {
                                                            const token = localStorage.getItem("nerzen_token");
                                                            window.open(`/api/mails/${selectedMail.uid}/attachments/${encodeURIComponent(att.filename)}?folder=${encodeURIComponent(selectedFolder)}&token=${token}`, '_blank');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${colors.sidebarBorder}`,
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: colors.text,
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <Paperclip size={14} /> {att.filename}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Empty State - No Mail Selected */
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.subtext,
                                padding: '40px',
                                textAlign: 'center'
                            }}>
                                <Mail size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>E-posta Seçilmedi</h3>
                                <p style={{ fontSize: '14px' }}>Okumak veya işlem yapmak için listeden bir e-posta seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* COMPOSE MODAL */}
            <AnimatePresence>
                {isComposeOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: isMobile ? '0' : '16px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{
                                width: isMobile ? '100%' : '800px',
                                maxWidth: '100%',
                                height: isMobile ? '100%' : 'auto',
                                maxHeight: isMobile ? '100%' : '90vh',
                                backgroundColor: colors.cardBg,
                                border: isMobile ? 'none' : `1px solid ${colors.sidebarBorder}`,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                borderRadius: isMobile ? '0' : '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                height: '60px',
                                padding: '0 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: `1px solid ${colors.sidebarBorder}`,
                                backgroundColor: colors.headerBg,
                                flexShrink: 0
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {draftUid ? 'Taslağı Düzenle' : 'Yeni İleti'}
                                </h3>
                                <button
                                    onClick={() => {
                                        if (composeData.body || composeData.to || composeData.subject) {
                                            if (confirm("Değişiklikleri kaydetmeden kapatmak istediğinize emin misiniz?")) {
                                                setIsComposeOpen(false);
                                                setDraftUid(null);
                                            }
                                        } else {
                                            setIsComposeOpen(false);
                                            setDraftUid(null);
                                        }
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '50%',
                                        transition: 'all 0.2s',
                                        color: colors.text
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSend} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                padding: isMobile ? '16px' : '24px',
                                overflowY: 'auto'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: colors.subtext, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                                            Alıcı
                                        </label>
                                        <input
                                            type="email"
                                            multiple
                                            required
                                            style={{
                                                width: '100%',
                                                backgroundColor: colors.inputBg,
                                                border: `1px solid ${colors.inputBorder}`,
                                                borderRadius: '6px',
                                                padding: '12px 16px',
                                                color: colors.text,
                                                fontSize: '14px'
                                            }}
                                            placeholder="ali@nerzen.com"
                                            value={composeData.to}
                                            onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: colors.subtext, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                                            Konu
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            style={{
                                                width: '100%',
                                                backgroundColor: colors.inputBg,
                                                border: `1px solid ${colors.inputBorder}`,
                                                borderRadius: '6px',
                                                padding: '12px 16px',
                                                color: colors.text,
                                                fontSize: '14px'
                                            }}
                                            placeholder="İleti konusu..."
                                            value={composeData.subject}
                                            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ flex: 1, minHeight: isMobile ? '300px' : '400px', display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: colors.subtext, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                                        Mesaj
                                    </label>
                                    <RichTextEditor
                                        value={composeData.body}
                                        onChange={(html) => setComposeData({ ...composeData, body: html })}
                                        placeholder="Mesajınızı buraya yazın..."
                                    />
                                </div>

                                {/* Attachments Selection */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        border: `1px solid ${colors.sidebarBorder}`,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: colors.text,
                                        fontWeight: 600
                                    }}>
                                        <Paperclip size={18} />
                                        Dosya Ekle
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setAttachments([...attachments, ...Array.from(e.target.files)]);
                                                }
                                            }}
                                        />
                                    </label>

                                    {attachments.length > 0 && (
                                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {attachments.map((file, idx) => (
                                                <div key={idx} style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'rgba(59,130,246,0.1)',
                                                    border: '1px solid rgba(59,130,246,0.2)',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    color: colors.accent,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span>{file.name}</span>
                                                    <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    paddingTop: '20px',
                                    borderTop: `1px solid ${colors.sidebarBorder}`,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px'
                                }}>
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 600, color: colors.text }}
                                    >
                                        Taslak Kaydet
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        style={{
                                            backgroundColor: colors.accent,
                                            padding: '12px 32px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: 'white',
                                            borderRadius: '8px',
                                            opacity: sending ? 0.7 : 1
                                        }}
                                    >
                                        {sending ? "Gönderiliyor..." : "GÖNDER"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .loader {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(59,130,246,0.1);
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function NavItem({ icon, label, active = false, count = 0, onClick }: any) {
    const [isHovered, setIsHovered] = useState(false);
    const { theme, colors } = useTheme();

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                fontSize: '14px',
                marginBottom: '4px',
                backgroundColor: active ? colors.folderActive : (isHovered ? (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent'),
                color: active ? colors.accent : (isHovered ? colors.text : colors.subtext),
                borderLeft: active ? `2px solid ${colors.accent}` : '2px solid transparent',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {icon}
                <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
            {count > 0 && (
                <span style={{
                    backgroundColor: 'rgba(59,130,246,0.2)',
                    color: '#3B82F6',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}

function MailItem({ mail, active, selected, onToggleSelect, onClick }: any) {
    const [isHovered, setIsHovered] = useState(false);
    const { theme, colors } = useTheme();
    const fromName = mail?.from?.split('@')?.[0] || 'Bilinmeyen';
    const mailDate = mail?.date ? new Date(mail.date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    // Check if mail is unread (does NOT have \Seen flag)
    const isUnread = !mail.flags || !mail.flags.includes('\\Seen');

    return (
        <div
            style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.mailListBorder}`,
                backgroundColor: active ? colors.mailItemActive : (selected ? 'rgba(59,130,246,0.1)' : (isHovered ? colors.mailItemHover : (isUnread ? (theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent'))),
                borderLeft: active ? `3px solid ${colors.accent}` : (isUnread ? `3px solid ${colors.accent}` : '3px solid transparent'),
                transition: 'all 0.2s',
                position: 'relative',
                height: 'auto',
                minHeight: '100px'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Checkbox - Fixed large touch target */}
            <div style={{
                padding: '24px 0 24px 16px',
                display: 'flex',
                alignItems: 'start',
                cursor: 'pointer',
                zIndex: 10
            }} onClick={onToggleSelect}>
                <input
                    type="checkbox"
                    checked={selected || false}
                    onChange={() => { }} // Handled by div click
                    style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                />
            </div>

            <button
                onClick={onClick}
                style={{
                    flex: 1,
                    padding: '16px 16px 16px 12px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: isUnread ? 800 : 600,
                        color: active ? colors.accent : (isUnread ? colors.text : colors.subtext),
                    }}>
                        {fromName}
                    </span>
                    <span style={{
                        fontSize: '11px',
                        color: colors.subtext,
                        fontWeight: isUnread ? 600 : 400
                    }}>
                        {mailDate}
                    </span>
                </div>
                <h4 style={{
                    fontSize: '15px',
                    fontWeight: isUnread ? 700 : (active ? 600 : 400),
                    marginBottom: '4px',
                    color: active ? colors.text : (isUnread ? colors.text : colors.subtext),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                }}>
                    {mail?.subject || '(Konu Yok)'}
                </h4>
                <p style={{
                    fontSize: '13px',
                    color: isUnread ? colors.subtext : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(30,41,59,0.3)'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {mail?.from}
                </p>
            </button>
        </div>
    );
}
