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
  padding?: string; // 부모 박스 패딩
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
  ({ initialContent = "", padding = "16px" }, ref) => {
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
      const container = wrapper.querySelector(".ql-container") as HTMLElement | null;

      const wrapperStyles = getComputedStyle(wrapper);
      const wrapperPaddingTop = parseFloat(wrapperStyles.paddingTop) || 0;
      const wrapperPaddingBottom = parseFloat(wrapperStyles.paddingBottom) || 0;

      const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
      const containerMarginTop = container ? parseFloat(getComputedStyle(container).marginTop) : 0;
      const containerMarginBottom = container ? parseFloat(getComputedStyle(container).marginBottom) : 0;

      let minHeight = 300;
      const width = window.innerWidth;
      if (width < 768) minHeight = 200;
      else if (width < 1024) minHeight = 250;

      const availableHeight =
        wrapper.clientHeight -
        toolbarHeight -
        wrapperPaddingTop -
        wrapperPaddingBottom -
        (containerMarginTop || 0) -
        (containerMarginBottom || 0);

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
          boxSizing: "border-box",
          padding,
        }}
      >
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          readOnly={readOnly}
          style={{
            height: editorHeight,
            padding: 0,
            boxSizing: "border-box",
          }}
          className="smart-editor"
        />
        <style jsx>{`
          /* 툴바 버튼 크기, 간격 통일 */
          .smart-editor .ql-toolbar {
            min-height: 40px;
            padding: 4px;
          }
          .smart-editor .ql-toolbar button {
            height: 32px;
            width: 32px;
            line-height: 32px;
            margin: 0 2px;
          }
          .smart-editor .ql-editor {
            padding: 8px 12px;
            overflow-y: auto;
          }
        `}</style>
      </div>
    );
  }
);

export default SmartEditor;
