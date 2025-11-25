'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";

// ReactQuill 컴포넌트를 동적으로 로드합니다.
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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
    // ⭐ [수정 1] 부모 컴포넌트와의 타입 에러를 해결하고 변경 감지 로직을 연결
    onChange?: (value: string) => void; 
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady, onChange }, ref) => { // 💡 onChange prop 받기
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
            getContent: () => content,
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
                <ReactQuill
                    theme="snow"
                    value={content}
                    // ⭐ [수정 2] 내용 변경 시 부모 컴포넌트의 onChange 함수 호출
                    onChange={(value) => {
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