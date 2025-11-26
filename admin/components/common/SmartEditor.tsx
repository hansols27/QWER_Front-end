'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill";
import { Box } from '@mui/material';

// 클라이언트 사이드에서만 ReactQuill 로드 (SSR 방지)
const EditorComponent = dynamic(() => import("react-quill"), { ssr: false });

export interface SmartEditorHandle {
    getContent: () => string;
    setContent: (content: string) => void;
    setReadOnly: (readOnly: boolean) => void;
}

export interface SmartEditorProps {
    initialContent?: string;
    height?: string; 
    disabled?: boolean;
    onReady?: () => void;
    onChange?: (value: string) => void; 
}

type QuillRef = ReactQuill | null;

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady, onChange }, ref) => {
        
        const quillRef = useRef<QuillRef>(null); 
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);

        // 에디터 준비 시 onReady 호출
        useEffect(() => {
            if (onReady && quillRef.current) {
                const timer = setTimeout(() => {
                    onReady();
                }, 50); 
                return () => clearTimeout(timer);
            }
        }, [quillRef.current, onReady]);

        // 부모 ref 노출
        useImperativeHandle(ref, () => ({
            getContent: () => {
                if (!quillRef.current) return "";
                const editor = quillRef.current.getEditor();
                const html = editor.root.innerHTML;
                return html === "<p><br></p>" ? "" : html;
            },
            setContent: (c: string) => {
                setContent(c);
                if (quillRef.current) {
                    const editor = quillRef.current.getEditor();
                    editor.root.innerHTML = c;
                }
            },
            setReadOnly: (r: boolean) => setReadOnlyState(r),
        }), []);

        const modules = {
            toolbar: [
                [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                [{size: []}],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image', 'video'],
                ['clean']
            ],
            clipboard: { matchVisual: false }
        };

        const formats = [
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent',
            'link', 'image', 'video'
        ];

        const QuillWithRef = EditorComponent as any;

        return (
            <Box
                sx={{
                    backgroundColor: "#fff",
                    height: height, 
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    border: readOnly ? 'none' : '1px solid #ccc',
                    borderRadius: '4px',
                    '& .ql-container': { border: 'none !important', flex: 1, minHeight: 0 },
                    '& .ql-toolbar': { borderBottom: readOnly ? 'none' : '1px solid #eee', display: readOnly ? 'none' : 'block' },
                    '& .ql-editor': { minHeight: 0, flex: 1, overflowY: 'auto', padding: '12px 15px' }
                }}
            >
                <QuillWithRef
                    ref={quillRef} 
                    theme="snow"
                    value={content}
                    onChange={(value: string) => { 
                        setContent(value); 
                        onChange?.(value);
                    }}
                    readOnly={readOnly}
                    modules={modules} 
                    formats={formats} 
                    style={{ height: '100%', minHeight: readOnly ? 'auto' : height }} 
                />
            </Box>
        );
    }
);

export default SmartEditor;
