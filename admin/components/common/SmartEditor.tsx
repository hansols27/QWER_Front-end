'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import type ReactQuill from "react-quill";
import { Box } from '@mui/material';

// 클라이언트 사이드에서만 ReactQuill 로드 (SSR 방지)
const EditorComponent = dynamic(() => import("react-quill"), { ssr: false });

/** 부모가 접근 가능한 메서드 */
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

        /** props → 내부 state 반영 */
        useEffect(() => {
            setContent(initialContent);
        }, [initialContent]);

        useEffect(() => {
            setReadOnlyState(disabled);
        }, [disabled]);

        /** onReady 호출 (dynamic 로딩 후) */
        useEffect(() => {
            if (quillRef.current && onReady) {
                const timer = setTimeout(() => onReady(), 100);
                return () => clearTimeout(timer);
            }
        }, [quillRef.current]);

        /** ⭐ 핵심: useImperativeHandle 안정화 버전 */
        useImperativeHandle(ref, () => {
            const editorInstance = quillRef.current?.getEditor();

            return {
                /** 현재 내용 반환 */
                getContent: () => {
                    if (!editorInstance) return "";

                    // state 값 우선
                    const currentContent = content || "";

                    if (
                        currentContent.trim() === "<p><br></p>" ||
                        currentContent.trim() === ""
                    ) {
                        const htmlFromDOM = editorInstance.root.innerHTML || "";
                        if (
                            htmlFromDOM.trim() !== "<p><br></p>" &&
                            htmlFromDOM.trim() !== ""
                        ) {
                            return htmlFromDOM;
                        }
                        return "";
                    }
                    return currentContent;
                },

                /** setContent 시 DOM도 즉시 반영 */
                setContent: (value: string) => {
                    setContent(value);

                    if (editorInstance?.root) {
                        editorInstance.root.innerHTML = value;
                    }
                },

                /** readOnly 변경 */
                setReadOnly: (value: boolean) => {
                    setReadOnlyState(value);
                },
            };
        }, [content]); // quillRef.current 제거 (중요!)

        /** Quill 설정 */
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
                        ...(readOnly && {
                            borderTop: "1px solid #eee !important",
                        }),
                    },
                    "& .ql-toolbar": {
                        border: "none !important",
                        borderBottom: readOnly ? "none" : "1px solid #eee",
                    },
                    "& .ql-editor": {
                        minHeight: 0,
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
                    readOnly={readOnly}
                    onChange={(value: string) => {
                        setContent(value);
                        onChange?.(value);
                    }}
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
