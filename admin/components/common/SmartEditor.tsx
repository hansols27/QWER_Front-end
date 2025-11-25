'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
// ⭐ [수정 1] ReactQuill 자체를 import하는 대신, 타입스크립트 오류를 피하기 위해 타입만 임포트
import type ReactQuill from "react-quill"; 

// ⭐ [수정 2] 동적 로드 시 이름 변경 (타입 오류 회피)
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

// ReactQuill 인스턴스 타입을 정의합니다. getEditor() 메서드를 노출합니다.
// null을 허용하고, forwardRef가 아닌 일반 useRef를 위해 ReactQuill 타입을 확장합니다.
type QuillRef = ReactQuill | null;


const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady, onChange }, ref) => {
        
        // ⭐ [수정 3] useRef의 초기값을 null로 설정하고, 타입은 ReactQuill의 인스턴스로 지정
        // ReactQuill은 DOM 요소가 아닌 컴포넌트 인스턴스를 반환하므로 HTMLInputElement가 아님.
        const quillRef = useRef<QuillRef>(null); 
        
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        
        // 1. initialContent 변경 시 content 상태 업데이트
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        // 2. onReady 구현: 컴포넌트 마운트 완료 후 onReady 호출
        useEffect(() => {
            if (onReady) {
                onReady(); 
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); 

        // 3. disabled prop이 변경될 때 readOnly 상태 업데이트
        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);

        // 4. ref를 통해 부모에게 노출할 메서드 정의
        useImperativeHandle(ref, () => ({
            // ⭐ [수정 4] getContent 로직에서 null 체크와 getEditor() 사용 안전하게 구현
            getContent: () => {
                const editor = quillRef.current?.getEditor();
                if (editor && editor.root) {
                    // 최신 DOM 내용을 반환합니다.
                    return editor.root.innerHTML || "";
                }
                // 인스턴스가 준비되지 않은 경우, 현재 content 상태를 반환합니다.
                return content; 
            },
            setContent: (c: string) => setContent(c),
            setReadOnly: (r: boolean) => setReadOnlyState(r),
        }));

        // modules와 formats 정의
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

        // ⭐ [핵심 수정] 동적 로드된 컴포넌트의 타입 오류를 피하기 위해 any로 캐스팅
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
                {/* ⭐ [수정 5] 캐스팅된 QuillWithRef를 사용합니다. */}
                <QuillWithRef
                    ref={quillRef} 
                    theme="snow"
                    value={content}
                    // ⭐ [수정 6] value 매개변수에 string 타입을 명시적으로 지정
                    onChange={(value: string) => { 
                        setContent(value); // 1. 에디터 자체 상태 업데이트
                        if (onChange) {
                            onChange(value); // 2. 부모 컴포넌트의 contentChanged 상태 변경 유도
                        }
                    }}
                    readOnly={readOnly}
                    modules={modules} 
                    formats={formats} 
                    className="smart-editor"
                    style={{ height: '100%' }} 
                />
                
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