'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill"; 
import { Box } from '@mui/material'; 

// 클라이언트 사이드에서만 ReactQuill 로드 (SSR 방지)
const EditorComponent = dynamic(() => import("react-quill"), { ssr: false });

/**
 * 부모 컴포넌트가 ref를 통해 접근할 수 있는 공개 메서드 인터페이스
 */
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
        
        // ... (props 연동 useEffect 생략)
        
        // 3. onReady 호출 로직 (quillRef.current가 연결된 후 100ms 지연)
        useEffect(() => {
            if (onReady && quillRef.current) { // ✅ quillRef가 연결된 후 실행 보장
                // 동적 로딩 및 Quill 인스턴스 초기화를 위한 충분한 지연 시간 확보
                const timer = setTimeout(() => {
                    onReady(); 
                }, 100); 
                return () => clearTimeout(timer);
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [quillRef.current]); 

        // 💡 최종 핵심 수정: useImperativeHandle
        useImperativeHandle(ref, () => {
            // Ref가 아직 연결되지 않았거나, 내부 Quill 인스턴스가 없는 경우
            // 임시로 getContent가 없거나 (또는 throw error) Ref가 연결되지 않도록 null 반환
            if (!quillRef.current || !quillRef.current.getEditor()) {
                // 이 상황이 발생하면 부모 컴포넌트의 `!editorRef.current` 체크에서 걸리거나,
                // Ref가 아예 연결되지 않도록 하여, 잘못된 함수 호출을 막습니다.
                return {
                    getContent: () => {
                        console.error("SmartEditor: getContent 호출 오류! Quill 인스턴스가 준비되지 않았습니다.");
                        return "";
                    },
                    setContent: () => {},
                    setReadOnly: () => {},
                } as SmartEditorHandle;
            }

            // Quill 인스턴스가 준비된 경우에만 올바른 함수 집합을 반환
            return {
                getContent: () => {
                    const currentContent = content || "";
                    // ... (기존 getContent 로직 유지)
                    if (currentContent.trim() === "<p><br></p>" || currentContent.trim() === "") {
                        const editor = quillRef.current?.getEditor();
                        if (editor && editor.root) {
                            const htmlFromDOM = editor.root.innerHTML || "";
                            if (htmlFromDOM.trim() !== "<p><br></p>" && htmlFromDOM.trim() !== "") {
                                 return htmlFromDOM;
                            }
                        }
                        return "";
                    }
                    return currentContent;
                },
                setContent: (c: string) => setContent(c),
                setReadOnly: (r: boolean) => setReadOnlyState(r),
            };
        }, [content, quillRef.current]);

        const modules = {
            toolbar: [
                [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                [{size: []}],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, 
                 {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image', 'video'],
                ['clean']
            ],
            clipboard: {
                matchVisual: false,
            }
        };

        const formats = [
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent',
            'link', 'image', 'video'
        ];

        // dynamic import된 컴포넌트의 타입 문제를 해결하기 위해 as any 사용
        const QuillWithRef = EditorComponent as any;


        return (
            <Box
                className="smart-editor-wrapper"
                sx={{
                    backgroundColor: "#fff",
                    height: height, 
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    border: readOnly ? 'none' : '1px solid #ccc',
                    borderRadius: '4px',
                    // Quill 내부 스타일 오버라이드
                    '& .ql-container': {
                        border: 'none !important', 
                        flex: 1, 
                        minHeight: 0,
                        ...(readOnly && { 
                            borderTop: '1px solid #eee !important', 
                        })
                    },
                    '& .ql-toolbar': {
                        border: 'none !important', 
                        borderBottom: readOnly ? 'none' : '1px solid #eee',
                        display: readOnly ? 'none' : 'block', // readOnly일 때 툴바 숨김
                    },
                    '& .ql-editor': {
                        minHeight: 0,
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px 15px', 
                    },
                }}
            >
                <QuillWithRef
                    ref={quillRef} 
                    theme="snow"
                    value={content}
                    onChange={(value: string) => { 
                        setContent(value); 
                        if (onChange) {
                            onChange(value); 
                        }
                    }}
                    readOnly={readOnly}
                    modules={modules} 
                    formats={formats} 
                    className="smart-editor-inner"
                    style={{ 
                        height: '100%', 
                        minHeight: readOnly ? 'auto' : height,
                    }} 
                />
            </Box>
        );
    }
);

export default SmartEditor;