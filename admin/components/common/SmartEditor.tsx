'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
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
    // onReady prop을 추가하여 부모 컴포넌트의 타입 오류 해결
    onReady?: () => void;
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady }, ref) => {
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        const wrapperRef = useRef<HTMLDivElement>(null);
        
        // 💡 런타임 오류를 유발했던 quillRef를 제거합니다. 
        // useImperativeHandle을 통해 이미 getContent를 제공하고 있습니다.
        // const quillRef = useRef<any>(null); 

        // 1. initialContent 변경 시 content 상태 업데이트
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        // 2. onReady 구현: 컴포넌트 마운트 완료 후 onReady 호출
        useEffect(() => {
            if (onReady) {
                // setTimeout을 사용하여 렌더링 사이클 이후에 호출, 안정성 확보
                const timer = setTimeout(() => {
                    onReady(); 
                }, 0); 
                return () => clearTimeout(timer);
            }
        }, [onReady]);

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

        return (
            <div
                ref={wrapperRef}
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
                    // ref prop 제거: TypeScript 오류 해결
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    readOnly={readOnly}
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
                    
                    /* 실제 글쓰기 영역 (가장 중요: Flexbox에서 높이 계산 문제 방지) */
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