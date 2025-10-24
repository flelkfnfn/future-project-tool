"use client"

import AuthGuardForm from "@/components/AuthGuardForm";
import { addComment } from "@/app/ideas/actions";
import React, { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";

// Supabase 테이블에서 오는 댓글의 타입 정의
type Comment = { 
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  // idea_id가 payload에 포함될 수 있으므로 추가
  idea_id?: number;
};

export default function IdeaComments({ comments, ideaId }: { comments: Comment[]; ideaId: number }) {
  // 1. Supabase 클라이언트 인스턴스 가져오기
  const { supabase } = useSupabase();

  // 2. props로 받은 초기 댓글 목록을 내부 상태로 관리
  const [liveComments, setLiveComments] = useState<Comment[]>(comments);

  const [open, setOpen] = useState(true);

  // 애니메이션용 refs / state
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>("none");

  // 3. 실시간 댓글 구독을 위한 useEffect
  useEffect(() => {
    // 부모 컴포넌트로부터 받은 comments가 변경될 경우, 로컬 상태를 동기화
    setLiveComments(comments);

    // Supabase Realtime 구독 설정
    const channel = supabase
      .channel(`idea-comments:${ideaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments', // 실제 댓글 테이블 이름이 'comments'라고 가정
          filter: `idea_id=eq.${ideaId}` // 현재 ideaId에 해당하는 댓글만 수신
        },
        (payload) => {
          const newComment = payload.new as Comment;
          
          // 중복 추가를 방지하기 위해 기존 댓글 목록에 없는 경우에만 추가
          setLiveComments((prevComments) => {
            if (prevComments.some(c => c.id === newComment.id)) {
              return prevComments;
            }
            // 최신 댓글을 목록의 끝에 추가
            return [...prevComments, newComment];
          });
        }
      )
      .subscribe();

    // 컴포넌트가 언마운트될 때 채널 구독 해제 (메모리 누수 방지)
    return () => {
      supabase.removeChannel(channel);
    };
    
    // 의존성 배열: supabase, ideaId, 또는 초기 comments가 변경될 때마다 이 효과를 다시 실행
  }, [supabase, ideaId, comments]);

  // 애니메이션을 위한 useEffect들 (liveComments.length를 의존성으로 사용)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setMaxHeight(open ? "none" : "0px");
      return;
    }

    if (open) {
      setMaxHeight(`${el.scrollHeight}px`);
    } else {
      setMaxHeight(`${el.scrollHeight}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setMaxHeight("0px")));
    }
  }, [open, liveComments.length]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof window === "undefined") return;

    const ro = new ResizeObserver(() => {
      if (open) {
        if (maxHeight !== "none") {
          setMaxHeight(`${el.scrollHeight}px`);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, liveComments.length, maxHeight]);
  
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "max-height") return;
    if (open) {
      setMaxHeight("none");
    }
  };

  const toggle = () => {
    const el = contentRef.current;
    if (!el) {
      setOpen((v) => !v);
      return;
    }
    setOpen((prevOpen) => {
      const nextOpen = !prevOpen;
      if (nextOpen) { // 열릴 때
        requestAnimationFrame(() => {
          setMaxHeight(`${el.scrollHeight}px`);
        });
      } else { // 닫힐 때
        setMaxHeight(`${el.scrollHeight}px`);
        requestAnimationFrame(() => {
          setMaxHeight("0px");
        });
      }
      return nextOpen;
    });
  };

  const contentStyle: React.CSSProperties =
    maxHeight === "none" && open
      ? { overflow: "visible" }
      : {
          maxHeight,
          overflow: "hidden",
          transition: "max-height 320ms cubic-bezier(0.2, 0, 0, 1)",
        };

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">댓글 ({liveComments.length})</h3>
        <button
          type="button"
          onClick={toggle}
          className="w-8 h-8 rounded-full border dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={open ? "댓글 접기" : "댓글 펼치기"}
          title={open ? "댓글 접기" : "댓글 펼치기"}
          aria-expanded={open}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div
        ref={contentRef}
        style={contentStyle}
        onTransitionEnd={handleTransitionEnd}
        aria-hidden={!open}
      >
        {liveComments && liveComments.length > 0 ? (
          <ul className="space-y-2 text-sm pt-2">
            {liveComments.map((comment) => (
              <li key={comment.id} className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{comment.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">아직 댓글이 없습니다.</p>
        )}

        <AuthGuardForm action={addComment} className="mt-4 flex gap-2 items-start">
          <input type="hidden" name="idea_id" value={ideaId} />
          <textarea
            name="content"
            rows={2}
            className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm flex-1 min-w-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="댓글을 입력해주세요..."
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors self-stretch"
          >
            등록
          </button>
        </AuthGuardForm>
      </div>
    </div>
  );
}