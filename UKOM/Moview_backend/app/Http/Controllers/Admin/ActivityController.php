<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ActivityFeedService;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function __construct(private readonly ActivityFeedService $activityFeed)
    {
    }

    public function index(Request $request)
    {
        $activities = $this->activityFeed->list(
            $request->only(['user_search', 'activity_type', 'film_search', 'time_range']),
            $request->query()
        );
        $stats = $this->activityFeed->stats();

        return view('admin.activity.index', compact('activities', 'stats'));
    }
}
