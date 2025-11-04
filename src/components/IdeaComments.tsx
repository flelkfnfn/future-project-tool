/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

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

export default function IdeaComments({
  comments,
  ideaId,
}: {
  comments: Comment[];
  ideaId: number;
}) {
  const { supabase } = useSupabase();
  const [liveComments, setLiveComments] = useState<Comment[]>(comments);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLiveComments(comments);

    const channel = supabase
      .channel(`idea-comments:${ideaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `idea_id=eq.${ideaId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setLiveComments((prevComments) => {
            if (prevComments.some((c) => c.id === newComment.id)) {
              return prevComments;
            }
            return [...prevComments, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ideaId, comments]);

  const commentsToShow = showAll ? liveComments : liveComments.slice(0, 3);

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        댓글 ({liveComments.length})
      </h3>

      <div>
        {liveComments.length > 0 ? (
          <ul className="space-y-2 text-sm pt-2">
            {commentsToShow.map((comment) => (
              <li
                key={comment.id}
                className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg"
              >
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
            아직 댓글이 없습니다.
          </p>
        )}

        {liveComments.length > 3 && (
          <div className="text-center mt-4">
            {showAll ? (
              <button
                onClick={() => setShowAll(false)}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                닫기
              </button>
            ) : (
              <button
                onClick={() => setShowAll(true)}
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
              >
                더보기+
              </button>
            )}
          </div>
        )}

        <AuthGuardForm
          action={addComment}
          className="mt-4 flex gap-2 items-center"
        >
          <input type="hidden" name="idea_id" value={ideaId} />
          <textarea
            name="content"
            rows={1}
            className="h-10 border dark:border-gray-600 rounded-md px-3 py-0 text-sm leading-5 flex-1 min-w-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="댓글을 입력해주세요..."
            required
          />
          <button
            type="submit"
            className="h-10 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            등록
          </button>
        </AuthGuardForm>
      </div>
    </div>
  );
}
