"use client";

import { Bold, Italic, Underline, List, Link as LinkIcon, Image as ImageIcon, Quote } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const { theme, colors } = useTheme();

    // Sync initial value only once or when value changes externally (careful with loops)
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if significantly different to avoid cursor jumping
            // Simple check: if empty, set it.
            if (editorRef.current.innerHTML === '<br>' && value === '') return;
            // For reply, we need to set the value.
            // We can check if the editor is focused. If focused, maybe don't update to avoid interrupts?
            // But for initial load (Reply click), it is needed.
            // Let's rely on parent controlling "initial" values mainly.
            if (!isFocused) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value, isFocused]);

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colors.sidebarBorder}`,
            borderRadius: '8px',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            overflow: 'hidden',
            minHeight: '300px'
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '8px 12px',
                flexWrap: 'wrap',
                borderBottom: `1px solid ${colors.sidebarBorder}`,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
            }}>
                <ToolbarButton icon={<Bold size={16} />} onClick={() => execCommand('bold')} tooltip="Kalın" />
                <ToolbarButton icon={<Italic size={16} />} onClick={() => execCommand('italic')} tooltip="İtalik" />
                <ToolbarButton icon={<Underline size={16} />} onClick={() => execCommand('underline')} tooltip="Altı Çizili" />
                <div style={{ width: '1px', backgroundColor: colors.sidebarBorder, margin: '0 4px' }} />
                <ToolbarButton icon={<List size={16} />} onClick={() => execCommand('insertUnorderedList')} tooltip="Liste" />
                <ToolbarButton icon={<Quote size={16} />} onClick={() => execCommand('formatBlock', 'blockquote')} tooltip="Alıntı" />
                <ToolbarButton icon={<LinkIcon size={16} />} onClick={() => {
                    const url = prompt('Link URL:');
                    if (url) execCommand('createLink', url);
                }} tooltip="Link" />
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    flex: 1,
                    padding: '16px',
                    outline: 'none',
                    color: colors.text,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    overflowY: 'auto'
                }}
                className="rich-editor-content"
                spellCheck={false}
            />

            <style jsx global>{`
                .rich-editor-content blockquote {
                    border-left: 3px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
                    margin: 1em 0;
                    padding-left: 1em;
                    color: ${colors.subtext};
                }
                .rich-editor-content a {
                    color: ${colors.accent};
                    text-decoration: underline;
                }
                .rich-editor-content ul {
                    padding-left: 20px;
                    list-style-type: disc;
                }
            `}</style>
        </div>
    );
}

function ToolbarButton({ icon, onClick, tooltip }: { icon: React.ReactNode, onClick: () => void, tooltip: string }) {
    const { theme, colors } = useTheme();
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={tooltip}
            style={{
                padding: '6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.subtext,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.subtext;
            }}
        >
            {icon}
        </button>
    );
}
