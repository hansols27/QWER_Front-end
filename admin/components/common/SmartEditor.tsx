'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export interface SmartEditorHandle {
  getContent: () => string;
  setContent: (content: string) => void;
  setReadOnly: (readOnly: boolean) => void;
}

export interface SmartEditorProps {
  initialContent?: string;
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
  ({ initialContent = "" }, ref) => {
    const [content, setContent] = useState(initialContent);
    const [readOnly, setReadOnlyState] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => setContent(c),
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }));

    // 높이는 flex와 min-height:0으로 자동 처리
    const updateHeight = () => {
      if (!wrapperRef.current) return;
      // 필요 시 다른 계산 추가 가능
    };

    useEffect(() => {
      updateHeight();
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }, []);

    return (
      <div
        ref={wrapperRef}
        style={{
          backgroundColor: "#fff",
          minHeight: "300px",
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
          className="smart-editor"
        />
        <style jsx>{`
          .smart-editor {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          /* 툴바 */
          .smart-editor .ql-toolbar {
            min-height: 40px;
            padding: 0;
          }
          .smart-editor .ql-toolbar button {
            height: 32px;
            width: 32px;
            line-height: 32px;
            margin: 0;
          }
          /* 에디터 내용 영역 */
          .smart-editor .ql-container {
            flex: 1;
            min-height: 0; /* 부모 높이 벗어나지 않도록 */
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .smart-editor .ql-editor {
            flex: 1;
            min-height: 0; /* 부모 높이 벗어나지 않도록 */
            padding: 0;
            margin: 0;
            overflow-y: auto; /* 내용이 길면 스크롤 */
            box-sizing: border-box;
          }
        `}</style>
      </div>
    );
  }
);

export default SmartEditor;
