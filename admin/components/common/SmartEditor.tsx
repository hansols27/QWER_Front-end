'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill"; 
import { Delta } from 'quill'; // Delta 타입 임포트 (추가)

// 클라이언트 사이드에서만 ReactQuill 로드
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

// ReactQuill 컴포넌트 타입을 명시 (forwardRef에 의해 ref로 전달됨)
type QuillRef = ReactQuill | null;

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady, onChange }, ref) => {
        
        const quillRef = useRef<QuillRef>(null); 
        
        // **상태값은 항상 최신 HTML 문자열을 유지합니다.**
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        
        useEffect(() => {
            // 외부에서 initialContent가 변경되면 내부 상태 업데이트
            setContent(initialContent);
        }, [initialContent]);

        useEffect(() => {
            if (onReady) {
                onReady(); 
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); 

        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);

        // 💡 핵심: 외부에서 접근 가능한 메소드를 정의합니다.
        useImperativeHandle(ref, () => ({
            getContent: () => {
                // 1. 상태값(content)을 사용하여 **최신 내용**을 반환합니다.
                // ReactQuill은 onChange를 통해 state를 업데이트하므로, state가 가장 신뢰할 수 있는 최신 값입니다.
                // 비어 있는 <p><br></p> 등의 초기값은 여기서 무시합니다.
                
                const currentContent = content || "";

                if (currentContent.trim() && currentContent.trim() !== "<p><br></p>") {
                    return currentContent;
                }
                
                // 2. 만약 상태값이 비어있다면, 에디터 DOM에서 직접 가져와 최종 확인합니다.
                const editor = quillRef.current?.getEditor();
                if (editor && editor.root) {
                    const htmlFromDOM = editor.root.innerHTML || "";
                    if (htmlFromDOM.trim() && htmlFromDOM.trim() !== "<p><br></p>") {
                         return htmlFromDOM;
                    }
                }

                // 3. 완전히 빈 문자열 반환
                return ""; 
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
                    // 💡 ReactQuill의 onChange는 value, delta, source를 제공하지만, 
                    // HTML 문자열인 value만 사용하여 상태를 업데이트하는 것이 일반적입니다.
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