'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState } from "react";
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

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => setContent(c),
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }));

    return (
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        readOnly={readOnly}
        style={{ minHeight: "300px", backgroundColor: "#fff" }}
      />
    );
  }
);

export default SmartEditor;
