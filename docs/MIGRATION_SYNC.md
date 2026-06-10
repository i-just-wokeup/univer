# Supabase Migration Sync

기준일: 2026-06-10

## 결론

- 원격 Supabase 프로젝트(`qmslcvnuzjraphvnaqxx`)의 migration 이력을 기준으로 둔다.
- 현재 기능은 원격 DB에 적용되어 정상 동작한다.
- `supabase migration repair`는 바로 실행하지 않는다.
- 로컬 `supabase/migrations`는 원격 이력보다 뒤처져 있으므로, SQL 원문을 확보한 뒤 보강한다.

## 현재 상태

- 원격 적용 이력: 60개
- 로컬 migration 파일: 27개
- 원격에는 있으나 로컬 version이 없는 항목: 51개
- 로컬에만 있는 version: 18개

로컬 파일 일부는 여러 원격 migration을 하나로 합친 사후 정리본이다. 따라서 단순히 파일명을 바꾸거나 빈 migration을 추가하면 새 DB 복구성이 나빠질 수 있다.

## 원격에만 있는 version

```text
20260509091658 fix_posts_update_counter_policy
20260509092400 fix_comments_update_policy
20260509092645 fix_comments_update_select_policy
20260509092706 fix_comments_read_policy_for_update
20260510071805 add_performance_indexes
20260510073559 add_comments_likes_count
20260510081002 comments_hard_delete_cascade
20260510083842 fix_comments_update_likes_count_policy
20260511053930 fix_posts_update_own_with_check
20260511054452 fix_posts_update_policies
20260511060050 fix_posts_select_policy_for_soft_delete
20260511065920 fix_stories_update_policy
20260512015600 fix_stories_select_policy_for_soft_delete
20260513065247 fix_users_rls
20260513065354 revert_users_rls
20260516023959 add_users_bio_and_nickname_unique
20260516040236 add_users_real_name
20260520015944 rename_post_images_to_post_media
20260520021106 post_videos_storage_policies
20260520021302 update_reports_table_v2
20260520030615 add_admin_role
20260520033513 create_notification_triggers
20260520070951 fix_admin_rpc_param_names_v2
20260520071044 fix_admin_reports_story_column
20260520073132 add_target_author_to_reports
20260520073201 add_report_author_trigger
20260520073919 add_report_snapshot
20260527020953 chat_update_conversation_on_message
20260527021442 chat_add_last_message_sender
20260527064924 enable_users_rls_with_sensitive_column_protection
20260527100349 set_replica_identity_full_for_realtime
20260601050551 create_profile_links
20260601064204 soft_delete_account_content
20260605024114 security_revoke_anon_function_access
20260605024129 security_fix_storage_listing
20260605024440 security_fix_search_path_and_dead_user_likes
20260605024622 security_revoke_public_regrant_authenticated
20260605033100 google_oauth_auto_profile_and_realname_visibility
20260605051811 remove_google_avatar_from_handle_new_user
20260606063407 create_follows_table
20260608065634 require_user_entered_nickname
20260608070807 fix_google_profile_metadata_parsing
20260608073628 allow_deleted_user_nickname_reuse_v2
20260608074758 stop_importing_google_avatar_url
20260608081013 create_user_favorites
20260608082844 update_delete_account_user_favorites
20260609020323 fix_delete_account_remove_user_likes
20260609042635 create_block_user_rpc
20260609045910 create_block_management_rpcs
20260609054603 fix_visibility_rls_use_user_connections
20260610044811 add_post_aspect_ratio
```

## 로컬에만 있는 version

```text
20260520090000 replace_post_images_with_post_media_and_update_reports
20260525090000 add_connection_list_rpcs
20260527150000 enable_users_rls_with_sensitive_column_protection
20260527190655 enable_chat_realtime_publication
20260601090000 create_profile_links
20260601100000 soft_delete_account_content
20260605100000 add_google_auth_profile_metadata
20260608150000 require_user_entered_nickname
20260608150500 allow_deleted_user_nickname_reuse
20260608151000 fix_google_profile_metadata_parsing
20260608152000 stop_importing_google_avatar_url
20260608160000 create_user_favorites
20260608161000 update_delete_account_user_favorites
20260609090000 fix_delete_account_remove_user_likes
20260609110000 create_block_user_rpc
20260609120000 create_block_management_rpcs
20260609130000 fix_visibility_rls_use_user_connections
20260610100000 add_post_aspect_ratio
```

## 정리 원칙

1. 원격 DB가 운영 기준이므로 원격 `schema_migrations`를 임의로 repair하지 않는다.
2. 로컬 파일명만 원격 version으로 바꾸는 작업은 SQL 원문이 확실할 때만 한다.
3. 기존 로컬 합본 migration을 여러 원격 migration으로 쪼갤 때는 내용이 실제 적용 순서와 맞는지 확인한다.
4. 원문을 확보할 수 없는 항목은 빈 migration으로 대체하지 않는다. 필요하면 별도 snapshot/baseline 전략을 논의한다.

## 다음 조치

1. Supabase CLI 또는 SQL 이력에서 원격 migration 원문 확보 가능 여부 확인
2. 원문 확보 가능한 항목부터 로컬 `supabase/migrations`에 원격 version으로 복구
3. 원문 확보 불가 항목은 현재 원격 스키마 기준 baseline migration 전략 검토
4. 모든 보강 후 새 로컬 DB에서 migration 재생 테스트
