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
    // onReady prop을 추가하여 부모 컴포넌트의 타입 오류 해결
    onReady?: () => void;
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
    ({ initialContent = "", height = '400px', disabled = false, onReady }, ref) => {
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        
        // 1. initialContent 변경 시 content 상태 업데이트
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        // 2. 💡 onReady 구현 (수정): 컴포넌트 마운트 완료 후 onReady 호출
        // setTimeout을 제거하여 지연 없이 즉시 호출하도록 변경
        useEffect(() => {
            if (onReady) {
                // 💡 마운트 직후, 렌더링 루프 내에서 즉시 onReady를 호출하여
                // 부모 컴포넌트의 editorLoaded 상태를 바로 true로 변경합니다.
                onReady(); 
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); // 빈 배열: 컴포넌트 마운트 시점에 단 한 번만 실행

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

        // modules와 formats 정의 (Quill 설정을 커스텀하려면 여기에 추가)
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
                    onChange={setContent}
                    readOnly={readOnly}
                    modules={modules} // 모듈 적용
                    formats={formats} // 포맷 적용
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