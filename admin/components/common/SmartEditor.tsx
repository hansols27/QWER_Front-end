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

    // ⭐ 수정 사항: useImperativeHandle의 의존성 배열에 [quillRef] 추가 
    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!quillRef.current) return "";
        const editor = quillRef.current.getEditor();
        return editor?.root?.innerHTML || "";
      },
      setContent: (c: string) => {
        // setContent state를 직접 변경하는 것은 충돌을 일으킬 수 있으므로
        // 직접 에디터 DOM에 삽입하거나, Quill API의 setValue/setContents를 사용합니다.
        if (quillRef.current) {
          const editor = quillRef.current.getEditor();
          if (editor?.root) {
            // 안전을 위해 state도 업데이트하고 DOM도 직접 업데이트합니다.
            setContent(c);
            editor.root.innerHTML = c; 
          }
        }
      },
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }), [quillRef]); // 👈 오류 해결 핵심: quillRef를 의존성으로 추가

    useEffect(() => {
      // ⭐ 수정 사항: quillRef.current가 유효해졌을 때만 onReady 호출
      if (onReady && quillRef.current) {
        onReady();
      }
    }, [onReady, quillRef.current]); // 👈 quillRef.current가 null에서 인스턴스로 바뀔 때 감지

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