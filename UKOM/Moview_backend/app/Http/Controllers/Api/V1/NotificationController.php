<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get notifications for a user
     */
    public function getNotifications($userId)
    {
        try {
            $notifications = DB::table('notifications')
                ->join('users as actor', 'notifications.actor_id', '=', 'actor.id')
                ->leftJoin('user_profiles as actor_profile', 'actor.id', '=', 'actor_profile.user_id')
                ->leftJoin('movies', 'notifications.film_id', '=', 'movies.id')
                ->leftJoin('review_comments', function($join) {
                    $join->on('notifications.related_id', '=', 'review_comments.id')
                         ->whereIn('notifications.type', ['comment_review', 'reply_comment']);
                })
                ->where('notifications.user_id', $userId)
                ->select(
                    'notifications.id',
                    'notifications.user_id',
                    'notifications.actor_id',
                    'actor.username as actor_username',
                    'actor_profile.display_name as actor_display_name',
                    'actor_profile.profile_photo as actor_profile_photo',
                    'notifications.type',
                    'notifications.film_id',
                    'notifications.related_id',
                    'notifications.message',
                    'notifications.is_read',
                    'notifications.created_at',
                    'movies.title as movie_title',
                    'movies.default_poster_path as movie_poster',
                    'review_comments.review_id as review_id',
                    'review_comments.content as comment_content'
                )
                ->orderBy('notifications.created_at', 'desc')
                ->take(50)
                ->get();

            // Group notifications by time sections
            $grouped = [
                'today' => [],
                'yesterday' => [],
                'last_week' => []
            ];

            $now = Carbon::now();
            $yesterday = $now->copy()->subDay();
            $lastWeek = $now->copy()->subWeek();

            foreach ($notifications as $notification) {
                $createdAt = Carbon::parse($notification->created_at);
                
                // Calculate time ago
                $timeAgo = $createdAt->diffForHumans();
                
                // Determine section
                $section = 'last_week';
                if ($createdAt->isToday()) {
                    $section = 'today';
                } elseif ($createdAt->isYesterday()) {
                    $section = 'yesterday';
                }

                // Build profile photo URL
                $profilePhotoUrl = '';
                if (!empty($notification->actor_profile_photo)) {
                    if (str_starts_with($notification->actor_profile_photo, 'http')) {
                        $profilePhotoUrl = str_replace('127.0.0.1', '10.0.2.2', $notification->actor_profile_photo);
                    } else {
                        $profilePhotoUrl = "http://10.0.2.2:8000/storage/{$notification->actor_profile_photo}";
                    }
                }

                // Build movie poster URL
                $posterUrl = null;
                if (!empty($notification->movie_poster)) {
                    if (str_starts_with($notification->movie_poster, 'http')) {
                        $posterUrl = str_replace('127.0.0.1', '10.0.2.2', $notification->movie_poster);
                    } else {
                        $posterUrl = "http://10.0.2.2:8000/storage/{$notification->movie_poster}";
                    }
                }
                
                // Determine review_id based on notification type
                $reviewId = null;
                if ($notification->type === 'like_review') {
                    $reviewId = $notification->related_id; // For like, related_id IS review_id
                } elseif (in_array($notification->type, ['comment_review', 'reply_comment'])) {
                    $reviewId = $notification->review_id; // From join with review_comments
                }

                $grouped[$section][] = [
                    'id' => $notification->id,
                    'user_id' => $notification->user_id,
                    'actor_id' => $notification->actor_id,
                    'actor_username' => $notification->actor_username,
                    'actor_display_name' => $notification->actor_display_name,
                    'actor_profile_photo' => $profilePhotoUrl,
                    'type' => $notification->type,
                    'film_id' => $notification->film_id,
                    'related_id' => $notification->related_id,
                    'review_id' => $reviewId,
                    'comment_content' => $notification->comment_content,
                    'message' => $notification->message,
                    'is_read' => (bool)$notification->is_read,
                    'time_ago' => $timeAgo,
                    'section' => $section,
                    'movie_title' => $notification->movie_title,
                    'movie_poster' => $posterUrl,
                    'created_at' => $notification->created_at
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $grouped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($userId, $notificationId)
    {
        try {
            DB::table('notifications')
                ->where('id', $notificationId)
                ->where('user_id', $userId)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead($userId)
    {
        try {
            DB::table('notifications')
                ->where('user_id', $userId)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a notification (helper method)
     */
    public static function createNotification($userId, $actorId, $type, $message, $filmId = null, $relatedId = null)
    {
        try {
            // Don't create notification if actor is the same as user
            if ($userId == $actorId) {
                return false;
            }

            DB::table('notifications')->insert([
                'user_id' => $userId,
                'actor_id' => $actorId,
                'type' => $type,
                'film_id' => $filmId,
                'related_id' => $relatedId,
                'message' => $message,
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to create notification: ' . $e->getMessage());
            return false;
        }
    }
}
