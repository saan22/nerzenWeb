"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Shield, Settings, Server, Hash, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function LoginPage() {
    const router = useRouter();
    const { theme, toggleTheme, colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    });

    // Mobile Support
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    // Advanced Settings State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [serverConfig, setServerConfig] = useState({
        host: "",
        port: "993",
        secure: true
    });

    useEffect(() => {
        const token = localStorage.getItem("nerzen_token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    // Auto-fill host based on email
    useEffect(() => {
        if (!showAdvanced && credentials.email.includes('@')) {
            const domain = credentials.email.split('@')[1];
            if (domain) {
                setServerConfig(prev => ({ ...prev, host: `mail.${domain}` }));
            }
        }
    }, [credentials.email, showAdvanced]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Determine host/port
            let imapHost = serverConfig.host;
            let imapPort = parseInt(serverConfig.port);

            if (!showAdvanced) {
                const emailDomain = credentials.email.split('@')[1];
                if (!emailDomain) {
                    throw new Error("Geçersiz e-posta adresi");
                }
                imapHost = `mail.${emailDomain}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    host: imapHost,
                    port: imapPort,
                    secure: serverConfig.secure
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.success) {
                localStorage.setItem("nerzen_token", data.token);
                localStorage.setItem("nerzen_user", credentials.email);
                router.push("/dashboard");
            } else {
                setError(data.message || "Giriş başarısız. Bilgilerinizi kontrol edin.");
                setLoading(false);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError("Bağlantı zaman aşımına uğradı. Sunucu yanıt vermiyor.");
            } else if (err.message === "Geçersiz e-posta adresi") {
                setError("Lütfen geçerli bir e-posta adresi girin.");
            } else {
                setError("Sisteme bağlanılamıyor. Lütfen internetinizi veya sunucuyu kontrol edin.");
            }
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            color: colors.text,
            position: 'relative',
            overflow: 'hidden',
            transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    zIndex: 20,
                    padding: '10px',
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '50%',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: colors.text,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Background Gradient */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                pointerEvents: 'none'
            }} />

            {/* Login Container */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '440px',
                padding: '0 24px'
            }}>
                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src="/logo.png"
                            alt="Nerzen Logo"
                            style={{
                                height: isMobile ? '70px' : '100px',
                                width: 'auto',
                                filter: theme === 'dark'
                                    ? 'drop-shadow(0 0 15px rgba(59,130,246,0.4))'
                                    : 'drop-shadow(0 2px 10px rgba(0,0,0,0.15))',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                    }}>
                        <div style={{ height: '1px', width: '32px', backgroundColor: 'rgba(59,130,246,0.3)' }} />
                        <span style={{
                            fontSize: '11px',
                            color: 'rgba(59,130,246,0.6)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Webmail
                        </span>
                        <div style={{ height: '1px', width: '32px', backgroundColor: 'rgba(59,130,246,0.3)' }} />
                    </div>
                    <p style={{
                        fontSize: '12px',
                        color: colors.subtext,
                        fontWeight: 500
                    }}>
                        Kurumsal E-Posta Yönetim Sistemi
                    </p>
                </div>

                {/* Login Form */}
                <div style={{
                    backgroundColor: colors.cardBg,
                    backdropFilter: 'blur(20px)',
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    boxShadow: theme === 'dark' ? '0 20px 60px rgba(0,0,0,0.3)' : '0 20px 60px rgba(0,0,0,0.05)',
                    position: 'relative',
                    transition: 'background-color 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
                }}>
                    {/* Top Glow */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)'
                    }} />

                    <form onSubmit={handleSubmit} style={{ padding: isMobile ? '24px' : '40px' }}>
                        {/* Error Message */}
                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                padding: '12px 16px',
                                marginBottom: '24px',
                                borderRadius: '4px'
                            }}>
                                <p style={{
                                    color: '#EF4444',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '11px',
                                color: colors.subtext,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '8px',
                                fontWeight: 600
                            }}>
                                E-Posta Adresi
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: colors.iconColor
                                }} />
                                <input
                                    type="email"
                                    required
                                    style={{
                                        width: '100%',
                                        backgroundColor: colors.inputBg,
                                        border: `1px solid ${colors.inputBorder}`,
                                        padding: '14px 16px 14px 48px',
                                        color: colors.text,
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                    placeholder="kullanici@nerzen.com"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                    onFocus={(e) => e.target.style.borderColor = colors.inputFocus}
                                    onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
                                />
                            </div>
                            <p style={{
                                fontSize: '11px',
                                color: colors.subtext,
                                marginTop: '8px',
                                fontStyle: 'italic',
                                opacity: 0.7
                            }}>
                                IMAP sunucusu otomatik algılanır (örn: mail.nerzen.com)
                            </p>
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '11px',
                                color: colors.subtext,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '8px',
                                fontWeight: 600
                            }}>
                                Şifre
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: colors.iconColor
                                }} />
                                <input
                                    type="password"
                                    required
                                    style={{
                                        width: '100%',
                                        backgroundColor: colors.inputBg,
                                        border: `1px solid ${colors.inputBorder}`,
                                        padding: '14px 16px 14px 48px',
                                        color: colors.text,
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                    placeholder="••••••••"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    onFocus={(e) => e.target.style.borderColor = colors.inputFocus}
                                    onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
                                />
                            </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <div style={{ marginBottom: '24px' }}>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(59,130,246,0.8)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Settings size={14} />
                                {showAdvanced ? 'Gelişmiş Ayarları Gizle' : 'Gelişmiş Ayarlar (Host/Port)'}
                            </button>

                            {/* Advanced Fields */}
                            {showAdvanced && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${colors.inputBorder}`,
                                    borderRadius: '4px'
                                }}>
                                    {/* Host */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', color: colors.subtext, marginBottom: '6px', textTransform: 'uppercase' }}>IMAP Sunucusu</label>
                                        <div style={{ position: 'relative' }}>
                                            <Server size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.iconColor }} />
                                            <input
                                                type="text"
                                                value={serverConfig.host}
                                                onChange={(e) => setServerConfig({ ...serverConfig, host: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: colors.inputBg,
                                                    border: `1px solid ${colors.inputBorder}`,
                                                    padding: '10px 12px 10px 36px',
                                                    color: colors.text,
                                                    fontSize: '13px'
                                                }}
                                                placeholder="mail.example.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Port */}
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '10px', color: colors.subtext, marginBottom: '6px', textTransform: 'uppercase' }}>Port</label>
                                            <div style={{ position: 'relative' }}>
                                                <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.iconColor }} />
                                                <input
                                                    type="number"
                                                    value={serverConfig.port}
                                                    onChange={(e) => setServerConfig({ ...serverConfig, port: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: colors.inputBg,
                                                        border: `1px solid ${colors.inputBorder}`,
                                                        padding: '10px 12px 10px 36px',
                                                        color: colors.text,
                                                        fontSize: '13px'
                                                    }}
                                                    placeholder="993"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: colors.text }}>
                                                <input
                                                    type="checkbox"
                                                    checked={serverConfig.secure}
                                                    onChange={(e) => setServerConfig({ ...serverConfig, secure: e.target.checked })}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                SSL / TLS
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '52px',
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 20px rgba(59,130,246,0.3)'
                            }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                        >
                            {loading ? (
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            ) : (
                                <>
                                    <Shield size={18} />
                                    Güvenli Giriş Yap
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '40px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '10px',
                        color: colors.footerText,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontWeight: 600
                    }}>
                        Nerzen Bilişim Teknolojileri
                    </p>
                    <p style={{
                        fontSize: '9px',
                        color: colors.footerText,
                        marginTop: '4px',
                        letterSpacing: '1px'
                    }}>
                        Professional Mail Client v1.0
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
