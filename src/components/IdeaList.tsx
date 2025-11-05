"use client"

import AuthGuardForm from "@/components/AuthGuardForm";
import { addComment, deleteIdea, toggleLike } from '@/app/ideas/actions';
import React from 'react';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
}

interface Idea {
  id: number;
  title: string;
  description: string;
  likes: number;
  comments: Comment[];
}

interface IdeaListProps {
  initialIdeas: Idea[];
}

export default function IdeaList({ initialIdeas }: IdeaListProps) {
  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {initialIdeas.map((idea) => (
        <li key={idea.id}>
          <article className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{idea.title}</h2>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{idea.description}</p>
            </div>
            <AuthGuardForm action={deleteIdea} confirmMessage="아이디어를 삭제하시겠습니까?">
              <input type="hidden" name="id" value={idea.id} />
              <button
                type="submit"
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                삭제
              </button>
            </AuthGuardForm>
            </div>

          <div className="mt-4 flex items-center gap-2">
            <AuthGuardForm action={toggleLike}>
              <input type="hidden" name="idea_id" value={idea.id} />
              <button
                type="submit"
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
              >
                좋아요({idea.likes})
              </button>
            </AuthGuardForm>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">댓글</h3>
              {/* lightweight collapse using <details> would work too; keeping client-state in parent is out-of-scope here */}
            </div>
            {idea.comments && idea.comments.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {idea.comments.map((comment: Comment) => (
                  <li key={comment.id} className="bg-gray-100 p-2 rounded">
                    <p>{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">댓글이 없습니다.</p>
            )}

            <AuthGuardForm action={addComment} className="mt-4 flex gap-2 items-center">
              <input type="hidden" name="idea_id" value={idea.id} />
              <textarea
                name="content"
                className="border rounded px-2 py-1 flex-grow min-w-0 max-w-[400px]"
                placeholder="댓글을 입력해주세요..."
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                댓글 추가
              </button>
            </AuthGuardForm>
          </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
