import { CommentsSheet } from "../comments/CommentsSheet";
import { PostShareSheet } from "../feed/PostShareSheet";
import type { PostShareTarget } from "../../features/chat/usePostShare";
import type { FeedPost } from "../../features/feed/types";
import { SITE_URL } from "../../lib/site";

type HomeSheetsProps = {
  commentSheetPostId: string | null;
  isShareLoading: boolean;
  isShareSearching: boolean;
  onCloseComments: () => void;
  onCloseShare: () => void;
  onAddToStory?: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  onCommentUserPress: (nickname: string) => void;
  onQueryChange: (query: string) => void;
  onSelectShareTarget: (target: PostShareTarget) => void;
  query: string;
  sendingTargetId: string | null;
  shareErrorMessage: string | null;
  sharePost: FeedPost | null;
  targets: PostShareTarget[];
};

export function HomeSheets({
  commentSheetPostId,
  isShareLoading,
  isShareSearching,
  onCloseComments,
  onCloseShare,
  onAddToStory,
  onCommentCountChange,
  onCommentUserPress,
  onQueryChange,
  onSelectShareTarget,
  query,
  sendingTargetId,
  shareErrorMessage,
  sharePost,
  targets,
}: HomeSheetsProps) {
  return (
    <>
      <CommentsSheet
        isOpen={Boolean(commentSheetPostId)}
        onClose={onCloseComments}
        onCommentCountChange={onCommentCountChange}
        onUserPress={onCommentUserPress}
        postId={commentSheetPostId}
      />
      <PostShareSheet
        errorMessage={shareErrorMessage}
        externalShareUrl={
          sharePost?.visibility === "public"
            ? `${SITE_URL}/p/${sharePost.id}`
            : null
        }
        isLoading={isShareLoading}
        isOpen={Boolean(sharePost)}
        isSearching={isShareSearching}
        onClose={onCloseShare}
        onAddToStory={onAddToStory}
        onQueryChange={onQueryChange}
        onSelectTarget={onSelectShareTarget}
        query={query}
        sendingTargetId={sendingTargetId}
        targets={targets}
      />
    </>
  );
}
