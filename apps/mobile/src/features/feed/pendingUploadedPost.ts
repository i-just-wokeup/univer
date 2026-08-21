type PendingUploadedPostListener = () => void;

const listeners = new Set<PendingUploadedPostListener>();
let pendingUploadedPostId: string | null = null;

export function setPendingUploadedPost(postId: string): void {
  pendingUploadedPostId = postId;
  listeners.forEach((listener) => listener());
}

export function consumePendingUploadedPost(): string | null {
  const postId = pendingUploadedPostId;
  pendingUploadedPostId = null;
  return postId;
}

export function subscribePendingUploadedPost(
  listener: PendingUploadedPostListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
