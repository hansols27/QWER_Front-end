'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill"; 
import { Delta } from 'quill'; // Delta 타입 임포트

// 클라이언트 사이드에서만 ReactQuill 로드 (SSR 방지)
const EditorComponent = dynamic(() => import("react-quill"), { ssr: false });

/**
 * 부모 컴포넌트가 ref를 통해 접근할 수 있는 SmartEditor의 공개 메서드 타입입니다.
 */
export interface SmartEditorHandle {
    getContent: () => string;
    setContent: (content: string) => void;
    setReadOnly: (readOnly: boolean) => void;
}

/**
 * SmartEditor 컴포넌트의 속성 타입입니다.
 */
export interface SmartEditorProps {
    initialContent?: string;
    height?: string; 
    disabled?: boolean;
    onReady?: () => void;
    onChange?: (value: string) => void; 
}

// ReactQuill 컴포넌트 타입을 명시
type QuillRef = ReactQuill | null;

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady, onChange }, ref) => {
        
        const quillRef = useRef<QuillRef>(null); 
        
        // 상태값은 항상 최신 HTML 문자열을 유지합니다.
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        
        // initialContent 변경 시 내부 상태 업데이트
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        // readOnly 상태 동기화
        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);

        // 에디터 인스턴스 초기화 완료 후 onReady 호출 (500ms 지연)
        useEffect(() => {
            if (!onReady) return;

            // 충분한 로딩 시간을 확보하기 위해 지연 호출
            const timer = setTimeout(() => {
                onReady(); 
            }, 500); 

            return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); 

        // 💡 핵심: useImperativeHandle을 사용하여 부모에게 노출할 메서드 정의
        useImperativeHandle(ref, () => ({
            /**
             * 에디터의 현재 내용을 HTML 문자열로 반환합니다.
             */
            getContent: () => {
                // 1. 상태값(content)을 사용하여 최신 내용을 반환합니다.
                const currentContent = content || "";

                if (currentContent.trim() && currentContent.trim() !== "<p><br></p>") {
                    return currentContent;
                }
                
                // 2. 만약 상태값이 비어있다면, 에디터 DOM에서 직접 가져와 최종 확인합니다.
                const editor = quillRef.current?.getEditor();
                if (editor && editor.root) {
                    // Quill API를 사용하여 HTML 가져오기
                    const htmlFromDOM = editor.root.innerHTML || "";
                    if (htmlFromDOM.trim() && htmlFromDOM.trim() !== "<p><br></p>") {
                         return htmlFromDOM;
                    }
                }

                // 3. 완전히 빈 문자열 반환
                return ""; 
            },
            /**
             * 에디터의 내용을 설정합니다.
             */
            setContent: (c: string) => setContent(c),
            /**
             * 에디터의 읽기 전용 상태를 설정합니다.
             */
            setReadOnly: (r: boolean) => setReadOnlyState(r),
        }));

        // Quill 툴바 설정
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

        // Quill 포맷 설정
        const formats = [
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent',
            'link', 'image', 'video'
        ];

        // dynamic import된 컴포넌트의 타입 문제를 해결하기 위한 캐스팅
        const QuillWithRef = EditorComponent as any;


        return (
            <div
                style={{
                    backgroundColor: "#fff",
                    height: height, 
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                }}
            >
                <QuillWithRef
                    ref={quillRef} 
                    theme="snow"
                    value={content}
                    onChange={(value: string, delta: Delta, source: string) => { 
                        setContent(value); 
                        if (onChange) {
                            onChange(value); 
                        }
                    }}
                    readOnly={readOnly}
                    modules={modules} 
                    formats={formats} 
                    className="smart-editor"
                    style={{ height: '100%' }} 
                />
                
                {/* Global CSS for layout flexibility */}
                <style jsx global>{`
                    /* .smart-editor (ReactQuill 컴포넌트 전체) */
                    .smart-editor {
                        display: flex;
                        flex-direction: column;
                        flex: 1; 
                        min-height: 0;
                    }
                    
                    /* 툴바 */
                    .smart-editor .ql-toolbar {
                        min-height: 40px;
                        padding: 8px; 
                        border-top: 1px solid #ccc;
                        border-left: 1px solid #ccc;
                        border-right: 1px solid #ccc;
                        border-radius: 4px 4px 0 0; 
                    }
                    
                    /* 에디터 내용 영역 */
                    .smart-editor .ql-container {
                        flex: 1; 
                        min-height: 0; 
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        border-top: none; 
                        border-left: 1px solid #ccc;
                        border-right: 1px solid #ccc;
                        border-bottom: 1px solid #ccc;
                        border-radius: 0 0 4px 4px; 
                    }
                    
                    /* 실제 글쓰기 영역 */
                    .smart-editor .ql-editor {
                        flex: 1;
                        min-height: 0;
                        padding: 12px 15px; 
                        margin: 0; 
                        overflow-y: auto;
                        box-sizing: border-box;
                    }
                `}</style>
            </div>
        );
    }
);

export default SmartEditor;