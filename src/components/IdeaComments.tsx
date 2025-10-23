"use client"

import AuthGuardForm from "@/components/AuthGuardForm";
import { addComment } from "@/app/ideas/actions";
import React, { useState } from "react";

type Comment = { id: number; content: string; created_at: string; user_id: string };

export default function IdeaComments({ comments, ideaId }: { comments: Comment[]; ideaId: number }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">댓글</h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-6 h-6 rounded border dark:border-gray-600 flex items-center justify-center text-sm"
          aria-label={open ? "댓글 접기" : "댓글 펼치기"}
          title={open ? "댓글 접기" : "댓글 펼치기"}
        >
          {open ? "-" : "+"}
        </button>
      </div>

      {open && (
        <>
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
              className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm flex-grow min-w-0 max-w-[480px] w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
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
        </>
      )}
    </div>
  );
}

