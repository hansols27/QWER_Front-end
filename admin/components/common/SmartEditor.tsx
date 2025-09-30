import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

declare global {
  interface Window {
    HuskyEZCreator: {
      createInIFrame: (params: {
        oAppRef: any[];
        elPlaceHolder: string;
        sSkinURI: string;
        fCreator: () => void;
      }) => void;
    };
  }
}

// SmartEditor2 인스턴스 타입 선언
interface SmartEditorInstance {
  getById: Record<
    string,
    {
      exec: (command: string, args?: any[]) => void;
    }
  >;
}

export interface SmartEditorHandle {
  getContent: () => string;
  setContent: (html: string) => void;
}

interface SmartEditorProps {
  initialContent?: string;
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
  ({ initialContent = "" }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorInstanceRef = useRef<SmartEditorInstance>({ getById: {} });

    useEffect(() => {
      if (textareaRef.current) {
        window.HuskyEZCreator.createInIFrame({
          oAppRef: [editorInstanceRef.current],
          elPlaceHolder: textareaRef.current.id,
          sSkinURI: "/smarteditor2/SmartEditor2Skin.html",
          fCreator: () => {
            if (initialContent) {
              editorInstanceRef.current.getById["editor"].exec("PASTE_HTML", [
                initialContent,
              ]);
            }
          },
        });
      }
    }, [initialContent]);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        let content = "";
        if (editorInstanceRef.current.getById["editor"]) {
          editorInstanceRef.current.getById["editor"].exec(
            "UPDATE_CONTENTS_FIELD",
            []
          );
          content = textareaRef.current?.value || "";
        }
        return content;
      },
      setContent: (html: string) => {
        if (editorInstanceRef.current.getById["editor"]) {
          editorInstanceRef.current.getById["editor"].exec("SET_IR", [html]);
        }
      },
    }));

    return (
      <textarea
        id="editor"
        ref={textareaRef}
        defaultValue={initialContent}
        style={{ width: "100%", height: "400px" }}
      />
    );
  }
);

export default SmartEditor;
