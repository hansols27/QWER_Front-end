import { forwardRef, useImperativeHandle, useRef } from "react";

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
    const editorRef = useRef<HTMLDivElement>(null);
    let content = initialContent;

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => {
        content = c;
        if (editorRef.current) editorRef.current.innerHTML = c;
      },
      setReadOnly: (r: boolean) => {
        if (editorRef.current) editorRef.current.contentEditable = (!r).toString();
      },
    }));

    return (
      <div
        ref={editorRef}
        dangerouslySetInnerHTML={{ __html: initialContent }}
        style={{
          minHeight: "300px",          // 최소 높이 지정
          border: "1px solid #ccc",    // 테두리 표시
          padding: "8px",
          borderRadius: "4px",
          overflowY: "auto",
          backgroundColor: "#fff",     // 배경색
        }}
      />
    );
  }
);

export default SmartEditor;
