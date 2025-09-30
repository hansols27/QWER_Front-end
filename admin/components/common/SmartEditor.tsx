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
  // 부모 컴포넌트에서 높이를 제어할 수 있도록 height prop 추가
  height?: string; 
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
  // height prop을 받도록 수정
  ({ initialContent = "", height = '300px' }, ref) => {
    const [content, setContent] = useState(initialContent);
    const [readOnly, setReadOnlyState] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => setContent(c),
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }));

    return (
      // wrapperRef의 높이는 minHeight 또는 외부에서 받은 height로 설정
      <div
        ref={wrapperRef}
        style={{
          backgroundColor: "#fff",
          // minHeight 대신 height prop을 사용하여 에디터 전체 높이 지정
          height: height, 
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
          // ReactQuill 컴포넌트가 부모(wrapper)의 높이를 100% 상속받도록 명시
          style={{ height: '100%' }} 
        />
        <style jsx>{`
          /* .smart-editor (ReactQuill 컴포넌트) */
          .smart-editor {
            display: flex;
            flex-direction: column;
            flex: 1; /* 부모(wrapper)의 남은 공간을 모두 차지하도록 flex: 1 설정 (높이가 100%가 되도록) */
            min-height: 0;
            /* height: 100%를 flex: 1로 대체하거나 flex: 1과 함께 사용합니다. */
          }
          
          /* 툴바 */
          .smart-editor .ql-toolbar {
            min-height: 40px;
            padding: 8px; /* 툴바 패딩 조정 */
            border-top: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
          }
          
          /* 에디터 내용 영역 */
          .smart-editor .ql-container {
            flex: 1; /* ql-toolbar를 제외한 남은 공간을 모두 차지 */
            min-height: 0; 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-top: none; /* 툴바 아래 중복되는 border 제거 */
          }
          
          /* 실제 글쓰기 영역 */
          .smart-editor .ql-editor {
            flex: 1;
            min-height: 0;
            padding: 12px 15px; /* 기본 padding 유지 */
            overflow-y: auto;
            box-sizing: border-box;
          }
          
          /* snow 테마의 border를 wrapper에 맞추기 위해 조정 */
          .smart-editor.ql-container.ql-snow {
            border: 1px solid #ccc; /* ql-container에 border가 있다면 재확인 */
          }
        `}</style>
      </div>
    );
  }
);

export default SmartEditor;