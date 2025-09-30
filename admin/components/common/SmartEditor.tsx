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
    const [editorHeight, setEditorHeight] = useState<number>(300);

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => setContent(c),
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }));

    const updateHeight = () => {
      if (!wrapperRef.current) return;

      const wrapper = wrapperRef.current;
      const toolbar = wrapper.querySelector(".ql-toolbar") as HTMLElement | null;
      const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

      let minHeight = 300;
      const width = window.innerWidth;
      if (width < 768) minHeight = 200;
      else if (width < 1024) minHeight = 250;

      const availableHeight = wrapper.clientHeight - toolbarHeight;

      setEditorHeight(availableHeight > minHeight ? availableHeight : minHeight);
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
          flexDirection: "column", // 툴바 위쪽, 에디터 아래쪽
          boxSizing: "border-box",
        }}
      >
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          readOnly={readOnly}
          style={{
            flex: 1, // 남은 공간 모두 차지
            backgroundColor: "#fff",
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
            height: editorHeight, // 필요시 fallback
          }}
          className="smart-editor"
        />
        <style jsx>{`
          /* 툴바 버튼 크기 통일 */
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
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
          }
          .smart-editor .ql-editor {
            flex: 1;
            padding: 0;
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
