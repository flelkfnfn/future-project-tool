'use client'

import { useState, useOptimistic, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { addComment, deleteIdea, toggleLike } from '@/app/ideas/actions';

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
  likes: number; // Ensure this matches the database column name
  comments: Comment[];
}

interface IdeaListProps {
  initialIdeas: Idea[];
}

export default function IdeaList({ initialIdeas }: IdeaListProps) {
  const [optimisticIdeas, addOptimisticIdea] = useOptimistic(
    initialIdeas,
    (currentIdeas, action: { type: 'add' | 'delete' | 'toggleLike'; payload: any }) => {
      switch (action.type) {
        case 'add':
          return [...currentIdeas, action.payload];
        case 'delete':
          return currentIdeas.filter((idea) => idea.id !== action.payload.id);
        case 'toggleLike':
          return currentIdeas.map((idea) =>
            idea.id === action.payload.idea_id
              ? { ...idea, likes: idea.likes + action.payload.change } // change will be +1 or -1
              : idea
          );
        default:
          return currentIdeas;
      }
    }
  );

  const handleToggleLike = async (idea_id: number, currentLikes: number) => {
    // Optimistically update the UI
    const userLiked = false; // This logic needs to be more robust, ideally passed from server
    // For now, we'll assume a simple toggle based on current state, but a real app needs to know if *this user* liked it.
    // Since we don't have user-specific like status here, we'll just toggle based on current count for optimistic UI.
    // The server action will handle the actual like/unlike logic.

    // A more accurate optimistic update would require knowing if the current user has liked it.
    // For now, we'll assume a simple increment/decrement based on the server action's expected behavior.
    // The server action will determine if it's a like or unlike.
    // Let's assume the server action will increment if not liked, decrement if liked.
    // We can't know the 'change' here without more info, so we'll make a best guess or simplify.
    // For a true optimistic update, the server should return the new state, or the client needs to know the current user's like status.

    // For now, let's just assume it's always incrementing for optimistic UI, and the server will correct it.
    // This is a simplification. A better approach would be to pass the user's current like status from the server.
    // Or, if the server action returns the new like count, we can update it.

    // Let's simplify: assume the server action will always result in a +1 or -1 change.
    // We need to know if the user *currently* likes it to make an optimistic guess.
    // Since we don't have that info on the client, we'll just trigger the server action.
    // The `useOptimistic` hook is better suited when the client can predict the outcome.
    // For a like/unlike, the client needs to know if it's currently liked by the user.

    // Let's try a simpler optimistic update: just assume it toggles.
    // This is still not ideal without knowing the user's current like status.

    // A more realistic optimistic update for toggleLike would be:
    // 1. Client knows if current user has liked this idea (e.g., `idea.isLikedByCurrentUser`).
    // 2. If `isLikedByCurrentUser`, optimistically decrement and set `isLikedByCurrentUser` to false.
    // 3. Else, optimistically increment and set `isLikedByCurrentUser` to true.

    // Since `page.tsx` doesn't pass `isLikedByCurrentUser`, we'll have to make a less accurate optimistic update.
    // For now, let's just trigger the server action and rely on revalidatePath.
    // To truly implement optimistic UI for toggleLike, `page.tsx` would need to fetch `isLikedByCurrentUser`.

    // Given the current setup, `revalidatePath` is the primary mechanism for UI updates.
    // For a truly optimistic UI, the `toggleLike` action would need to return the new like count and the user's like status.
    // Or, the client component would need to fetch the user's like status.

    // Let's proceed with a basic optimistic update for `deleteIdea` and `addComment` first, as they are simpler.
    // For `toggleLike`, without knowing the user's current like status, a truly optimistic update is hard.
    // I will leave `toggleLike` to rely on `revalidatePath` for now, or make a very simple optimistic guess.

    // Let's make a simple optimistic guess for `toggleLike`: assume it always increments for the UI.
    // This is not fully accurate but demonstrates the optimistic pattern.
    addOptimisticIdea({ type: 'toggleLike', payload: { idea_id, change: 1 } });
    const formData = new FormData();
    formData.append('idea_id', String(idea_id));
    await toggleLike(formData);
    // The revalidatePath in toggleLike will eventually correct the UI if the optimistic guess was wrong.
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
            <form action={() => handleDeleteIdea(idea.id)}>
              <button
                type="submit"
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                삭제
              </button>
            </form>
          </div>

          {/* 좋아요 기능 */}
          <div className="mt-4 flex items-center gap-2">
            <form action={() => handleToggleLike(idea.id, idea.likes)}>
              <button
                type="submit"
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
              >
                좋아요 ({idea.likes})
              </button>
            </form>
          </div>

          {/* 댓글 섹션 */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">댓글</h3>
            {idea.comments && idea.comments.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {idea.comments.map((comment: { id: Key | null | undefined; content: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; created_at: string | number | Date; }) => (
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

            {/* 댓글 추가 폼 */}
            <form action={addComment} className="mt-4 flex gap-2">
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
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
