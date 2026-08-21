type RecentUpload = {
  id: string;
  uploadedAt: number;
};

export const RECENT_UPLOAD_WINDOW_MS = 10 * 60 * 1000;

let recentUploads: RecentUpload[] = [];

export function addRecentUpload(id: string): void {
  recentUploads = [
    { id, uploadedAt: Date.now() },
    ...recentUploads.filter((upload) => upload.id !== id),
  ];
}

export function getRecentUploadIds(windowMs: number): string[] {
  const cutoff = Date.now() - windowMs;

  recentUploads = recentUploads.filter(
    (upload) => upload.uploadedAt > cutoff,
  );

  return recentUploads.map((upload) => upload.id);
}
