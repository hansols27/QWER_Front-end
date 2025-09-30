'use client';

import dynamic from "next/dynamic";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
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
  // height prop을 받도록 수정하고, 기본 높이를 넉넉하게 설정
  ({ initialContent = "", height = '400px' }, ref) => {
    const [content, setContent] = useState(initialContent);
    const [readOnly, setReadOnlyState] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (c: string) => setContent(c),
      setReadOnly: (r: boolean) => setReadOnlyState(r),
    }));

    return (
      <div
        ref={wrapperRef}
        style={{
          backgroundColor: "#fff",
          // 부모에서 받은 height prop을 적용하여 전체 높이를 고정
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
        
        {/* Next.js에서 ReactQuill의 내부 요소를 스타일링하기 위해 global 스타일 사용 */}
        <style jsx global>{`
          /* .smart-editor (ReactQuill 컴포넌트 전체) */
          .smart-editor {
            display: flex;
            flex-direction: column;
            flex: 1; /* 부모 wrapper의 남은 공간을 모두 차지 */
            min-height: 0;
          }
          
          /* 툴바 */
          .smart-editor .ql-toolbar {
            min-height: 40px;
            padding: 8px; 
            /* snow 테마의 border를 덮어씁니다. */
            border-top: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-radius: 4px 4px 0 0; /* 상단 모서리 둥글게 */
          }
          
          /* 에디터 내용 영역 */
          .smart-editor .ql-container {
            flex: 1; /* 툴바를 제외한 남은 공간을 모두 차지 */
            min-height: 0; 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-top: none; /* 툴바 아래 중복되는 border 제거 */
            /* snow 테마의 border를 덮어씁니다. */
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            border-radius: 0 0 4px 4px; /* 하단 모서리 둥글게 */
          }
          
          /* 실제 글쓰기 영역 (가장 중요: Flexbox에서 높이 계산 문제 방지) */
          .smart-editor .ql-editor {
            flex: 1;
            min-height: 0;
            /* 기존 padding/margin을 오버라이드하여 높이 계산 충돌 방지 */
            padding: 12px 15px; 
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