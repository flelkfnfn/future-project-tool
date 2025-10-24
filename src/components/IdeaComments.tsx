"use client"

import AuthGuardForm from "@/components/AuthGuardForm";
import { addComment } from "@/app/ideas/actions";
import React, { useEffect, useRef, useState } from "react";

type Comment = { id: number; content: string; created_at: string; user_id: string };

export default function IdeaComments({ comments, ideaId }: { comments: Comment[]; ideaId: number }) {
  const [open, setOpen] = useState(true);

  // 애니메이션용 refs / state
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>("none"); // 'none' means auto height (열려있을 때)
  const transitionRef = useRef(false);

  // 초기 마운트 시, open 상태에 맞춰 maxHeight 설정
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setMaxHeight(open ? "none" : "0px");
      return;
    }

    if (open) {
      // open 상태라면 일단 px로 맞춰 애니메이션이 동작하도록 한 뒤에 transition 끝나면 none으로 둔다.
      setMaxHeight(`${el.scrollHeight}px`);
      // transition 끝난 후 auto 높이가 되도록 onTransitionEnd에서 처리
    } else {
      // 닫힐 때는 보이는 높이(px)에서 0으로 전환
      // content가 'none'일 수 있으므로 현재 scrollHeight로 맞춘 뒤 0으로 변경
      setMaxHeight(`${el.scrollHeight}px`);
      // 다음 프레임에서 닫기 애니메이션 시작
      requestAnimationFrame(() => requestAnimationFrame(() => setMaxHeight("0px")));
    }
    // comments 내용이 변하면 높이 재조정(댓글 추가/삭제 등)
  }, [open, comments.length]);

  // ResizeObserver: 내부 컨텐츠가 변경될 때 열려있으면 maxHeight를 갱신
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof window === "undefined") return;

    const ro = new ResizeObserver(() => {
      // 열려있고 현재 maxHeight가 'none'이 아닌 경우 (애니메이션 중/직후), 실제 높이로 갱신
      if (open) {
        // maxHeight가 none이면 아무것도 할 필요 없음 (auto 높이)
        if (maxHeight !== "none") {
          setMaxHeight(`${el.scrollHeight}px`);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // maxHeight는 의존성에서 제외하여 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, comments.length]);

  // 전환 종료 처리: 열림 끝나면 maxHeight를 none으로 두어 내부 컨텐츠가 자유롭게 늘어나도록 함
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "max-height") return;
    // transitionRef로 애니메이션 진행 여부 체크 (선택적 안전장치)
    if (open) {
      setMaxHeight("none");
    }
  };

  // 토글 버튼: open 상태 토글 + 애니메이션 시작을 위한 프레임 조작
  const toggle = () => {
    const el = contentRef.current;
    if (!el) {
      setOpen((v) => !v);
      return;
    }

    if (open) {
      // 닫기: 현재 높이(px)로 세팅 후 다음 프레임에서 0으로 바꿔 애니메이션
      setMaxHeight(`${el.scrollHeight}px`);
      requestAnimationFrame(() => {
        transitionRef.current = true;
        setMaxHeight("0px");
        setOpen(false);
      });
    } else {
      // 열기: 먼저 open true로 바꾼 뒤, 다음 프레임에서 scrollHeight(px)로 세팅해서 애니메이션
      setOpen(true);
      requestAnimationFrame(() => {
        transitionRef.current = true;
        setMaxHeight(`${el.scrollHeight}px`);
      });
    }
  };

  // 스타일 객체: maxHeight가 'none'이면 스타일에서 제외하여 자동 높이 허용
  const contentStyle: React.CSSProperties =
    maxHeight === "none"
      ? { overflow: "visible", transition: undefined }
      : {
          maxHeight,
          overflow: "hidden",
          transition: "max-height 320ms cubic-bezier(0.2, 0, 0, 1)",
        };

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">댓글</h3>
        <button
          type="button"
          onClick={toggle}
          className="w-6 h-6 rounded border dark:border-gray-600 flex items-center justify-center text-sm"
          aria-label={open ? "댓글 접기" : "댓글 펼치기"}
          title={open ? "댓글 접기" : "댓글 펼치기"}
          aria-expanded={open}
        >
          <span
            style={{
              display: "inline-block",
              transform: open ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 220ms ease",
              fontSize: "2rem",
            }}
          >
            {open ? "-" : "+"}
          </span>
        </button>
      </div>

      {/* 애니메이션 컨테이너: 댓글 목록 + 입력 폼을 모두 감싸도록 유지 */}
      <div
        ref={contentRef}
        style={contentStyle}
        onTransitionEnd={handleTransitionEnd}
        aria-hidden={!open}
      >
        {comments && comments.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {comments.map((comment) => (
              <li key={comment.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">댓글이 없습니다.</p>
        )}

        <AuthGuardForm action={addComment} className="mt-4 flex gap-2 items-center">
          <input type="hidden" name="idea_id" value={ideaId} />
          <input
            name="content"
            type="text"
            className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm flex-1 min-w-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
            placeholder="댓글을 입력해주세요..."
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            댓글 추가
          </button>
        </AuthGuardForm>
      </div>
    </div>
  );
}
