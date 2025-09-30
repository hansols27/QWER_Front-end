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
  height?: string; 
}

const SmartEditor = forwardRef<SmartEditorHandle, SmartEditorProps>(
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
      <div
        ref={wrapperRef}
        style={{
          backgroundColor: "#fff",
          height: height, 
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          // 버튼 영역을 포함하지 않도록 패딩을 제거하거나 관리해야 합니다.
          // 현재 wrapper는 에디터 영역만 감싸도록 설정되어 있다고 가정합니다.
        }}
      >
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          readOnly={readOnly}
          className="smart-editor"
          style={{ height: '100%' }} 
        />
        {/* 버튼 영역은 이 div 밖, 즉 상위 컴포넌트에서 별도로 렌더링되어야 합니다. */}
        
        <style jsx global>{`
          /* 전역 스타일로 적용하여 우선 순위를 높입니다. */
          
          /* .smart-editor (ReactQuill 컴포넌트) */
          .smart-editor {
            display: flex;
            flex-direction: column;
            flex: 1; 
            min-height: 0;
          }
          
          /* 툴바 */
          .smart-editor .ql-toolbar {
            min-height: 40px;
            padding: 8px;
            border-top: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
          }
          
          /* 에디터 내용 영역 */
          .smart-editor .ql-container {
            flex: 1; /* 툴바를 제외한 남은 공간 모두 차지 */
            min-height: 0; 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-top: none; 
          }
          
          /* 실제 글쓰기 영역 (가장 중요) */
          .smart-editor .ql-editor {
            flex: 1; /* 남은 공간을 채우고 */
            min-height: 0;
            /* 기존 padding/margin을 제거하여 높이 계산 충돌 방지 */
            padding: 12px 15px !important; /* 기본 padding 값 재적용 (필요시 조정) */
            margin: 0 !important; 
            overflow-y: auto;
            box-sizing: border-box;
          }
          
          /* snow 테마의 border를 wrapper에 맞추기 위해 조정 */
          .smart-editor.ql-snow {
             border-bottom: 1px solid #ccc; /* ql-container에 border가 있다면 재확인 */
          }

        `}</style>
      </div>
    );
  }
);

export default SmartEditor;