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
        
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);
        
        // 에디터 인스턴스 초기화 완료 후 onReady 호출
        // ReactQuill이 마운트된 후 약간의 지연 시간을 주어 DOM 접근이 가능하도록 보장
        useEffect(() => {
            if (onReady) {
                const timer = setTimeout(() => {
                    onReady(); 
                }, 100); // 100ms 지연으로 충분한 마운트 시간 확보
                return () => clearTimeout(timer);
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [quillRef.current]); // Quill Ref가 연결된 후 실행되도록 유도


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
                        // DOM에서 가져온 내용도 비어 있다면 빈 문자열 반환
                        if (htmlFromDOM.trim() !== "<p><br></p>" && htmlFromDOM.trim() !== "") {
                             return htmlFromDOM;
                        }
                    }
                    return ""; 
                }
                
                // 3. 일반적으로는 상태의 내용을 반환
                return currentContent;
            },
            setContent: (c: string) => setContent(c),
            setReadOnly: (r: boolean) => setReadOnlyState(r),
        }));

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
                    '& .ql-container': {
                        border: 'none !important', 
                        flex: 1, 
                        minHeight: 0,
                        ...(readOnly && { // readOnly일 때 스타일 조정
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
                        padding: '12px 15px', // 패딩 조정
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
                        // readOnly일 때 툴바 숨김에 따른 높이 조정
                        minHeight: readOnly ? 'auto' : height,
                    }} 
                />
            </Box>
        );
    }
);

export default SmartEditor;