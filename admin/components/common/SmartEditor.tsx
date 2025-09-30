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
    let readOnly = false;
    let content = initialContent;

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => {
        content = c;
        if (editorRef.current) editorRef.current.innerHTML = c;
      },
      setReadOnly: (r: boolean) => {
        readOnly = r;
        if (editorRef.current) editorRef.current.contentEditable = (!r).toString();
      },
    }));

    return <div ref={editorRef} dangerouslySetInnerHTML={{ __html: initialContent }} />;
  }
);

export default SmartEditor;
