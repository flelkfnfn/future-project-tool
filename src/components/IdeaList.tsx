'use client'

import AuthGuardForm from "@/components/AuthGuardForm";
import { useOptimistic } from 'react';
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

type OptimisticAction =
  | { type: 'add'; payload: Idea }
  | { type: 'delete'; payload: { id: number } }
  | { type: 'toggleLike'; payload: { idea_id: number; change: number } }

export default function IdeaList({ initialIdeas }: IdeaListProps) {
  const [optimisticIdeas, addOptimisticIdea] = useOptimistic(
    initialIdeas,
    (currentIdeas: Idea[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [...currentIdeas, action.payload];
        case 'delete':
          return currentIdeas.filter((idea) => idea.id !== action.payload.id);
        case 'toggleLike':
          return currentIdeas.map((idea) =>
            idea.id === action.payload.idea_id
              ? { ...idea, likes: idea.likes + action.payload.change }
              : idea
          );
        default:
          return currentIdeas;
      }
    }
  );

  const handleToggleLike = async (idea_id: number) => {
    addOptimisticIdea({ type: 'toggleLike', payload: { idea_id, change: 1 } });
    const formData = new FormData();
    formData.append('idea_id', String(idea_id));
    await toggleLike(formData);
  };

  const handleDeleteIdea = async (id: number) => {
    addOptimisticIdea({ type: 'delete', payload: { id } });
    const formData = new FormData();
    formData.append('id', String(id));
    await deleteIdea(formData);
  };

  return (
    <ul className="mt-4 space-y-4">
      {optimisticIdeas.map((idea) => (
        <li key={idea.id} className="p-4 border rounded-md shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{idea.title}</h2>
              <p className="mt-2 text-gray-700">{idea.description}</p>
            </div>
            <AuthGuardForm action={() => handleDeleteIdea(idea.id)}>
              <button
                type="submit"
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                삭제
              </button>
            </AuthGuardForm>
          </div>

          {/* 좋아요 기능 */}
          <div className="mt-4 flex items-center gap-2">
            <AuthGuardForm action={() => handleToggleLike(idea.id)}>
              <button
                type="submit"
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
              >
                좋아요({idea.likes})
              </button>
            </AuthGuardForm>
          </div>

          {/* 댓글 섹션 */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">댓글</h3>
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
              <p className="text-sm text-gray-500">아직 댓글이 없습니다.</p>
            )}

            {/* 댓글 추가 */}
            <AuthGuardForm action={addComment} className="mt-4 flex gap-2">
              <input type="hidden" name="idea_id" value={idea.id} />
              <textarea
                name="content"
                className="border rounded px-2 py-1 flex-grow"
                placeholder="댓글을 남겨주세요..."
                rows={1}
                required
              ></textarea>
              <button
                type="submit"
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                댓글 추가
              </button>
            </AuthGuardForm>
          </div>
        </li>
      ))}
    </ul>
  );
}

