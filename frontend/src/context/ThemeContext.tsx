"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    colors: typeof colors.dark;
}

export const colors = {
    dark: {
        bg: '#0F172A', // Slate-900 (Corporate Anthracite)
        text: '#F8FAFC',
        subtext: '#94A3B8', // Slate-400
        cardBg: '#1E293B', // Slate-800
        inputBg: 'rgba(15,23,42,0.6)',
        inputBorder: 'rgba(255,255,255,0.08)',
        inputFocus: '#3B82F6',
        iconColor: '#94A3B8',
        footerText: '#64748B',
        glow: 'rgba(59,130,246,0.15)',
        logoText: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%)',
        accent: '#3B82F6', // Blue-500
        accentHover: '#2563EB',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.15)',
        success: '#10B981',
        sidebarBg: '#0B1121', // Slightly darker than bg for contrast
        sidebarBorder: 'rgba(255,255,255,0.06)',
        headerBg: '#0F172A',
        folderActive: 'rgba(59,130,246,0.15)',
        mailListBg: '#0F172A',
        mailListBorder: 'rgba(255,255,255,0.06)',
        mailItemHover: 'rgba(255,255,255,0.03)',
        mailItemActive: 'rgba(59,130,246,0.1)',
        mailDetailBg: '#0B1121' // Deepest background for reading pane contrast
    },
    light: {
        bg: '#F1F5F9', // Slate-100 (Clean light gray)
        text: '#0F172A', // Slate-900
        subtext: '#64748B', // Slate-500
        cardBg: '#FFFFFF',
        inputBg: '#FFFFFF',
        inputBorder: '#E2E8F0', // Slate-200
        inputFocus: '#3B82F6',
        iconColor: '#64748B',
        footerText: '#94A3B8',
        glow: 'rgba(59,130,246,0.08)',
        logoText: 'linear-gradient(180deg, #0F172A 0%, #334155 100%)',
        accent: '#2563EB', // Blue-600
        accentHover: '#1D4ED8',
        danger: '#DC2626',
        dangerBg: 'rgba(220,38,38,0.1)',
        success: '#059669',
        sidebarBg: '#F8FAFC', // Slate-50
        sidebarBorder: '#E2E8F0',
        headerBg: '#FFFFFF',
        folderActive: 'rgba(37,99,235,0.08)',
        mailListBg: '#F8FAFC',
        mailListBorder: '#E2E8F0',
        mailItemHover: 'rgba(15,23,42,0.02)',
        mailItemActive: 'rgba(37,99,235,0.06)',
        mailDetailBg: '#FFFFFF'
    }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem("nerzen_theme") as Theme;
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme("light");
        }
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("nerzen_theme", newTheme);
    };

    if (!mounted) {
        return null; // Or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors: colors[theme] }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
