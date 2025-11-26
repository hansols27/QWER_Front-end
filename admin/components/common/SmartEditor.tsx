'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill";
import { Box } from "@mui/material";

// ReactQuill Dynamic Import (SSR 방지)
const EditorComponent = dynamic(() => import("react-quill"), { ssr: false });

/** 외부에서 사용할 핸들러 타입 */
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
    ({ initialContent = "", height = "400px", disabled = false, onReady, onChange }, ref) => {
        const quillRef = useRef<QuillRef>(null);
        const [content, setContent] = useState(initialContent);
        const [readOnly, setReadOnlyState] = useState(disabled);
        const [isReady, setIsReady] = useState(false);

        /** ⛳ initialContent 변경 → 에디터에 반영 */
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        /** ⛳ disabled 변경 → readOnly 반영 */
        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);

        /**
         * ⛳ Quill 초기화 직후 onReady 이벤트 호출
         * quillRef.current가 잡히고 DOM이 그려진 뒤 호출 보장
         */
        useEffect(() => {
            if (!onReady) return;

            // quillRef가 준비된 후 50~100ms 지연 후 콜백 실행
            const t = setTimeout(() => {
                if (quillRef.current && !isReady) {
                    setIsReady(true);
                    onReady();
                }
            }, 120);

            return () => clearTimeout(t);
        }, [quillRef.current]);

        /**
         * ⛳ ImperativeHandler
         * ref.current.getContent / setContent / setReadOnly 제공
         */
        useImperativeHandle(ref, () => {
            const instance = quillRef.current?.getEditor();

            if (!instance) {
                return {
                    getContent: () => {
                        console.warn("SmartEditor: Quill 인스턴스가 아직 준비되지 않았습니다.");
                        return "";
                    },
                    setContent: () => {},
                    setReadOnly: () => {},
                } as SmartEditorHandle;
            }

            return {
                getContent: () => {
                    const currentContent = content || "";

                    // 에디터가 비어있는 경우 dom에서 추출
                    if (
                        currentContent.trim() === "<p><br></p>" ||
                        currentContent.trim() === ""
                    ) {
                        const html = instance.root.innerHTML || "";
                        if (html.trim() !== "<p><br></p>" && html.trim() !== "") {
                            return html;
                        }
                        return "";
                    }

                    return currentContent;
                },

                setContent: (value: string) => {
                    setContent(value);
                    // Quill DOM 즉시 반영 (지연 없이)
                    if (instance.root) {
                        instance.root.innerHTML = value;
                    }
                },

                setReadOnly: (r: boolean) => {
                    setReadOnlyState(r);
                },
            };
        }, [content, quillRef.current]);

        /** Quill toolbar & formats */
        const modules = {
            toolbar: readOnly
                ? false
                : [
                      [{ header: "1" }, { header: "2" }, { font: [] }],
                      [{ size: [] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      [
                          { list: "ordered" },
                          { list: "bullet" },
                          { indent: "-1" },
                          { indent: "+1" },
                      ],
                      ["link", "image", "video"],
                      ["clean"],
                  ],
            clipboard: { matchVisual: false },
        };

        const formats = [
            "header",
            "font",
            "size",
            "bold",
            "italic",
            "underline",
            "strike",
            "blockquote",
            "list",
            "bullet",
            "indent",
            "link",
            "image",
            "video",
        ];

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
                    border: readOnly ? "none" : "1px solid #ccc",
                    borderRadius: "4px",
                    "& .ql-container": {
                        border: "none !important",
                        flex: 1,
                        minHeight: 0,
                    },
                    "& .ql-toolbar": {
                        border: "none !important",
                        borderBottom: readOnly ? "none" : "1px solid #eee",
                        display: readOnly ? "none" : "block",
                    },
                    "& .ql-editor": {
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px 15px",
                    },
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
                    style={{
                        height: "100%",
                        minHeight: readOnly ? "auto" : height,
                    }}
                />
            </Box>
        );
    }
);

export default SmartEditor;
