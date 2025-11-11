"use client";

import React, { useState } from "react";
import AuthGuardForm from "@/components/AuthGuardForm";
import { deleteIdea, toggleLike } from "@/app/ideas/actions";
import IdeaModal, { Idea } from "@/components/IdeaModal";

function truncate(s: string, n: number) {

  if (!s) return "";

  return s.length > n ? s.slice(0, n) + "..." : s;

}



export default function IdeasGrid({

  ideas,

  currentUserId,

}: {

  ideas: Idea[];

  currentUserId: string | null;

}) {

  const [selected, setSelected] = useState<Idea | null>(null);



  return (

    <>

      <ul className="grid grid-cols-3 gap-6">

        {ideas.map((idea) => {

          const likeCount = idea.idea_likes.length;

          const userHasLiked = idea.idea_likes.some(

            (l) => l.user_id === currentUserId

          );



          const d = truncate(idea.description ?? "", 100);
          return (
            <li key={idea.id}>
              <article
                className="h-56 bg-white dark:bg-gray-800 p-5 border dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest("[data-no-modal]") ||
                    target.tagName === "BUTTON"
                  )
                    return;
                  setSelected(idea);
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 overflow-hidden whitespace-nowrap text-ellipsis">
                      {idea.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      {d}
                    </p>
                  </div>
                  <AuthGuardForm
                    action={deleteIdea}
                    confirmMessage="아이디어를 삭제하시겠습니까?"
                  >
                    <input type="hidden" name="id" value={idea.id} />
                    <button
                      type="submit"
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 whitespace-nowrap"
                      data-no-modal
                    >
                      삭제
                    </button>
                  </AuthGuardForm>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    댓글 ({idea.comments.length})
                  </span>
                  <AuthGuardForm action={toggleLike}>
                    <input type="hidden" name="idea_id" value={idea.id} />
                    <button
                      type="submit"
                      className={`flex items-center gap-2 transition-colors ${
                        userHasLiked
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
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
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {selected && (
        <IdeaModal
          idea={selected}
          onClose={() => setSelected(null)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
