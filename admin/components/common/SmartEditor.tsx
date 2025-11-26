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

    // [1] Prop 변경 시 내부 상태 동기화 및 에디터 내용 설정
    useEffect(() => {
        // initialContent가 Prop으로 변경될 때 (데이터 로드 완료 시) 내부 상태와 에디터 업데이트
        if (initialContent !== content) {
            setContent(initialContent);
            
            // 이 시점에 quillRef.current가 유효하다면 즉시 에디터에 내용 설정
            if (quillRef.current) {
                const editor = quillRef.current.getEditor();
                if (editor?.root) {
                    editor.root.innerHTML = initialContent;
                }
            }
        }
    }, [initialContent]);

    // [2] 외부 노출 API 정의 (setContent/getContent)
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
    }), [quillRef]); 

    // [3] 에디터 준비 완료 시점 알림
    useEffect(() => {
        // quillRef.current가 유효해졌을 때 onReady 호출
        if (onReady && quillRef.current) {
            onReady();
        }
    }, [onReady, quillRef.current]);

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