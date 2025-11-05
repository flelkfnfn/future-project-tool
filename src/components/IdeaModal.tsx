"use client";

import AuthGuardForm from "@/components/AuthGuardForm";
import IdeaComments from "@/components/IdeaComments";
import { toggleLike } from "@/app/ideas/actions";
import React from "react";

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
};
type IdeaLike = { user_id: string };
export type Idea = {
  id: number;
  title: string;
  description: string;
  idea_likes: IdeaLike[];
  comments: Comment[];
};

export default function IdeaModal({
  idea,
  onClose,
  currentUserId,
}: {
  idea: Idea;
  onClose: () => void;
  currentUserId: string | null;
}) {
  const likeCount = idea.idea_likes.length;
  const userHasLiked = idea.idea_likes.some((l) => l.user_id === currentUserId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[44rem] max-w-[95vw] max-h-[90vh] p-6 relative overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 break-words">
              {idea.title}
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {idea.description}
            </p>
          </div>
          {/* <div className="flex items-center gap-2">
            <AuthGuardForm
              action={deleteIdea}
              confirmMessage="아이디어를 삭제하시겠습니까?"
            >
              <input type="hidden" name="id" value={idea.id} />
              <button
                type="submit"
                className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                data-no-modal
              >
                삭제
              </button>
            </AuthGuardForm>
          </div> */}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <AuthGuardForm action={toggleLike}>
            <input type="hidden" name="idea_id" value={idea.id} />
            <button
              type="submit"
              className={`flex items-center gap-2 transition-colors ${
                userHasLiked
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
              data-no-modal
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a2 2 0 00-.8 1.4z" />
              </svg>
              <span>{likeCount}</span>
            </button>
          </AuthGuardForm>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            댓글 {idea.comments.length}
          </span>
        </div>

        <IdeaComments comments={idea.comments} ideaId={idea.id} />
      </div>
    </div>
  );
}
