'use client';
import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import { Box } from "@mui/material";

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
  onChange?: (value: string) => void;
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
  ({ initialContent = "", height = "400px", disabled = false, onReady, onChange }, ref) => {
    const quillRef = useRef<any>(null);
    const [content, setContent] = useState(initialContent);
    const [readOnly, setReadOnlyState] = useState(disabled);

    // 안전하게 초기 핸들러 제공
    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!quillRef.current) return "";
        const editor = quillRef.current.getEditor();
        return editor?.root?.innerHTML || "";
      },
      setContent: (c: string) => {
        setContent(c);
        if (quillRef.current) {
          const editor = quillRef.current.getEditor();
          if (editor?.root) editor.root.innerHTML = c;
        }
      },
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }), []);

    useEffect(() => {
      if (onReady && quillRef.current) {
        onReady();
      }
    }, [onReady]);

    const modules = {
      toolbar: [
        [{ header: '1' }, { header: '2' }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'], ['clean']
      ],
      clipboard: { matchVisual: false }
    };

    const formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video'
    ];

    const QuillComponent: any = ReactQuill;

    return (
      <Box sx={{ height, width: "100%" }}>
        <QuillComponent
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={(v: string) => { setContent(v); onChange?.(v); }}
          readOnly={readOnly}
          modules={modules}
          formats={formats}
          style={{ height: "100%" }}
        />
      </Box>
    );
  }
);

export default SmartEditor;
