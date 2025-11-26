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
        
        // 1. initialContent 변경 시 상태 업데이트
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        // 2. disabled props 변경 시 readOnly 상태 업데이트
        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);
        
        // 3. ⚠️ 개선된 onReady 호출 로직 (컴포넌트 마운트 시 한 번만 실행)
        useEffect(() => {
            if (onReady) {
                // 동적 로딩 및 Quill 인스턴스 초기화를 위한 충분한 지연 시간 확보
                const timer = setTimeout(() => {
                    onReady(); 
                }, 100); 
                return () => clearTimeout(timer);
            }
        }, []); // ✅ 의존성 배열을 비워 마운트 시 한 번만 실행

        // 💡 핵심: useImperativeHandle을 사용하여 부모에게 노출할 메서드 정의
        useImperativeHandle(ref, () => ({
            getContent: () => {
                // 1. 현재 React 상태의 content를 사용
                const currentContent = content || "";

                // 2. 만약 상태가 비어 있다면, Quill DOM에서 직접 HTML을 가져와서 최종 확인
                if (currentContent.trim() === "<p><br></p>" || currentContent.trim() === "") {
                    const editor = quillRef.current?.getEditor();
                    if (editor && editor.root) {
                        const htmlFromDOM = editor.root.innerHTML || "";
                        
                        // DOM에서 가져온 내용이 실제로 비어 있지 않다면 반환 (혹시 모를 상태 동기화 지연 방지)
                        if (htmlFromDOM.trim() !== "<p><br></p>" && htmlFromDOM.trim() !== "") {
                             return htmlFromDOM;
                        }
                    }
                    return ""; // 최종적으로 빈 문자열 반환
                }
                
                // 3. 일반적으로는 상태의 내용을 반환
                return currentContent;
            },
            setContent: (c: string) => setContent(c),
            setReadOnly: (r: boolean) => setReadOnlyState(r),
        }), [content]); // content가 업데이트될 때마다 새로운 함수를 노출하여 최신 content를 참조하도록 함 (중요)

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