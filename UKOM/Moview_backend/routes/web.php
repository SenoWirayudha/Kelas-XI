<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\FilmController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\CastCrewController;
use App\Http\Controllers\Admin\CastCrewManagementController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CinemaController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\ManagerAccountController;
use App\Http\Controllers\Manager\ManagerStatsController;
use App\Http\Controllers\Manager\StaffAccountController;
use App\Http\Controllers\Manager\StaffStatsController;
use App\Http\Controllers\Staff\CashierController;
use App\Http\Controllers\Staff\TicketPrintController;
use App\Http\Controllers\Staff\TicketScannerController as StaffTicketScannerController;
use App\Http\Controllers\Admin\StudioController;
use App\Http\Controllers\Admin\SeatController;
use App\Http\Controllers\Admin\SeatTypeController;
use App\Http\Controllers\Admin\ScheduleController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\PublicPageController;

// Public Routes
Route::get('/', [PublicPageController::class, 'landing'])->name('home');

// One login page for every role.
Route::get('/login', [AuthController::class, 'showLoginForm'])->middleware('no-store')->name('admin.login');
Route::post('/login', [AuthController::class, 'login'])->middleware('no-store')->name('admin.login.post');

// Legacy login URL.
Route::get('/admin/login', fn () => redirect()->route('admin.login'));

// Public password reset page (linked from the forgot-password email).
// The form posts to POST /api/v1/reset-password from the page's JS.
Route::get('/reset-password/{token}', function (string $token) {
    return view('auth.reset-password', ['token' => $token]);
})->name('password.reset');

// Authentication
Route::post('/logout', [AuthController::class, 'logout'])->middleware('no-store')->name('admin.logout');

// Admin root redirect
Route::get('/admin', function () {
    return redirect()->route(match (session('admin_role')) {
        'manager' => 'manager.dashboard',
        'staff' => 'staff.dashboard',
        null => 'admin.login',
        default => 'admin.analytics.index',
    });
})->name('admin.index');

Route::get('/manager', function () {
    return redirect()->route(session('admin_role') === 'manager' ? 'manager.dashboard' : 'admin.login');
})->name('manager.index');

Route::get('/staff', function () {
    return redirect()->route(session('admin_role') === 'staff' ? 'staff.dashboard' : 'admin.login');
})->name('staff.index');

// Admin Routes (Protected)
Route::prefix('admin')->name('admin.')->middleware(['admin.auth', 'role:admin', 'no-store'])->group(function () {
    Route::get('/dashboard', fn () => redirect()->route('admin.analytics.index'))->name('dashboard');

    // Manager accounts (admin can pick the cinema)
    Route::get('/accounts', [ManagerAccountController::class, 'index'])->name('accounts.index');
    Route::get('/accounts/create', [ManagerAccountController::class, 'create'])->name('accounts.create');
    Route::post('/accounts', [ManagerAccountController::class, 'store'])->name('accounts.store');
    Route::get('/accounts/{account}/edit', [ManagerAccountController::class, 'edit'])->name('accounts.edit');
    Route::put('/accounts/{account}', [ManagerAccountController::class, 'update'])->name('accounts.update');
    Route::delete('/accounts/{account}', [ManagerAccountController::class, 'destroy'])->name('accounts.destroy');

    // Film Management
    Route::get('/films', [FilmController::class, 'index'])->name('films.index');
    Route::get('/films/create', [FilmController::class, 'create'])->name('films.create');
    Route::post('/films', [FilmController::class, 'store'])->name('films.store');
    Route::get('/films/{id}', [FilmController::class, 'show'])->name('films.show');
    Route::get('/films/{id}/edit', [FilmController::class, 'edit'])->name('films.edit');
    Route::put('/films/{id}', [FilmController::class, 'update'])->name('films.update');
    Route::delete('/films/{id}', [FilmController::class, 'destroy'])->name('films.destroy');
    Route::put('/films/{id}/toggle-status', [FilmController::class, 'toggleStatus'])->name('films.toggle-status');
    Route::post('/films/{id}/duplicate', [FilmController::class, 'duplicate'])->name('films.duplicate');
    Route::get('/films/{id}/cast-crew', [FilmController::class, 'castCrew'])->name('films.cast-crew');
    Route::get('/films/{id}/reviews', [FilmController::class, 'reviews'])->name('films.reviews');
    Route::post('/films/parse-releases', [FilmController::class, 'parseReleases'])->name('films.parse-releases');
    
    // Media Management (Upload, Set Default, Delete)
    Route::post('/films/{id}/media', [MediaController::class, 'upload'])->name('films.media.upload');
    Route::put('/films/{id}/media/{mediaId}/default', [MediaController::class, 'setDefault'])->name('films.media.setDefault');
    Route::delete('/films/{id}/media/{mediaId}', [MediaController::class, 'delete'])->name('films.media.delete');
    
    // Services Management
    Route::put('/films/{id}/services', [FilmController::class, 'updateServices'])->name('films.services.update');
    Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
    Route::put('/services/{service}', [ServiceController::class, 'update'])->name('services.update');
    
    // Quick-add metadata (used by the film form)
    Route::post('/production-houses', [FilmController::class, 'storeProductionHouse'])->name('production-houses.store');
    Route::post('/themes', [FilmController::class, 'storeTheme'])->name('themes.store');
    
    // Cast & Crew Management
    Route::get('/persons', [CastCrewController::class, 'getPersons'])->name('persons.list');
    Route::post('/films/{id}/cast-crew', [CastCrewController::class, 'store'])->name('films.castcrew.store');
    Route::put('/films/{id}/cast-crew/{moviePersonId}', [CastCrewController::class, 'update'])->name('films.castcrew.update');
    Route::delete('/films/{id}/cast-crew/{moviePersonId}', [CastCrewController::class, 'destroy'])->name('films.castcrew.destroy');
    
    // Users Management (UI only - dummy data)
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users/{id}/ban', [UserController::class, 'ban'])->name('users.ban');
    
    // User Activity
    Route::get('/activity', [ActivityController::class, 'index'])->name('activity.index');
    
    // Cast & Crew Management
    Route::get('/cast-crew', [CastCrewManagementController::class, 'index'])->name('cast-crew.index');
    Route::get('/cast-crew/add', [CastCrewManagementController::class, 'create'])->name('cast-crew.add');
    Route::post('/cast-crew', [CastCrewManagementController::class, 'store'])->name('cast-crew.store');
    Route::get('/cast-crew/{id}', [CastCrewManagementController::class, 'show'])->name('cast-crew.show');
    Route::get('/cast-crew/{id}/edit', [CastCrewManagementController::class, 'edit'])->name('cast-crew.edit');
    Route::put('/cast-crew/{id}', [CastCrewManagementController::class, 'update'])->name('cast-crew.update');
    Route::delete('/cast-crew/{id}', [CastCrewManagementController::class, 'destroy'])->name('cast-crew.destroy');
    
    // Reviews Management
    Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::delete('/reviews/{id}/delete', [ReviewController::class, 'delete'])->name('reviews.delete');
    Route::post('/reviews/{id}/restore', [ReviewController::class, 'restore'])->name('reviews.restore');
    
    // Comments Management
    Route::get('/comments', [\App\Http\Controllers\Admin\CommentController::class, 'index'])->name('comments.index');
    Route::get('/comments/notifications', [\App\Http\Controllers\Admin\CommentController::class, 'notifications'])->name('comments.notifications');
    Route::post('/comments/{id}/flag', [\App\Http\Controllers\Admin\CommentController::class, 'flag'])->name('comments.flag');
    Route::post('/comments/{id}/delete', [\App\Http\Controllers\Admin\CommentController::class, 'delete'])->name('comments.delete');
    Route::post('/comments/{id}/restore', [\App\Http\Controllers\Admin\CommentController::class, 'restore'])->name('comments.restore');
    
    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('/analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');

    // Schedule Management
    Route::get('/schedules',                  [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/create',           [ScheduleController::class, 'create'])->name('schedules.create');
    Route::get('/schedules/{id}/edit',        [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules',                 [ScheduleController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{id}',             [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}',          [ScheduleController::class, 'destroy'])->name('schedules.destroy');
    Route::get('/cinemas/{cinemaId}/studios', [ScheduleController::class, 'studiosByCinema'])->name('cinemas.studios');

    // Event Festival (sessions reuse the schedules table)
    Route::get('/events',                        [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create',                 [EventController::class, 'create'])->name('events.create');
    Route::post('/events',                       [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit',              [EventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}',                   [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{id}',                [EventController::class, 'destroy'])->name('events.destroy');
    Route::get('/events/{id}/sessions',          [EventController::class, 'sessions'])->name('events.sessions');
    Route::get('/events/{id}/sessions/create',   [EventController::class, 'createSession'])->name('events.sessions.create');
    Route::post('/events/{id}/sessions',         [EventController::class, 'storeSession'])->name('events.sessions.store');
    Route::get('/events/{id}/sessions/{sessionId}/edit', [EventController::class, 'editSession'])->name('events.sessions.edit');
    Route::put('/events/{id}/sessions/{sessionId}',      [EventController::class, 'updateSession'])->name('events.sessions.update');
    Route::delete('/events/{id}/sessions/{sessionId}',   [EventController::class, 'destroySession'])->name('events.sessions.destroy');
    Route::post('/events/movies',                [EventController::class, 'storeMovie'])->name('events.movies.store');

    // Cinema Management
    Route::get('/cinemas',          [CinemaController::class, 'index'])->name('cinemas.index');
    Route::get('/cinemas/create',   [CinemaController::class, 'create'])->name('cinemas.create');
    Route::post('/cinemas',         [CinemaController::class, 'store'])->name('cinemas.store');
    Route::delete('/cinemas/{id}',  [CinemaController::class, 'destroy'])->name('cinemas.destroy');

    // Studio Management
    Route::get('/studios',          [StudioController::class, 'index'])->name('studios.index');
    Route::get('/studios/create',   [StudioController::class, 'create'])->name('studios.create');
    Route::get('/studios/{id}/edit',[StudioController::class, 'edit'])->name('studios.edit');
    Route::post('/studios',         [StudioController::class, 'store'])->name('studios.store');
    Route::put('/studios/{id}',     [StudioController::class, 'update'])->name('studios.update');
    Route::delete('/studios/{id}',  [StudioController::class, 'destroy'])->name('studios.destroy');

    // Seat Layout Management
    Route::get('/studios/{studioId}/seats',            [SeatController::class, 'layout'])->name('seats.layout');
    Route::post('/studios/{studioId}/seats/layout',    [SeatController::class, 'saveLayout'])->name('seats.save-layout');
    Route::post('/studios/{studioId}/seats/generate',  [SeatController::class, 'generate'])->name('seats.generate');
    Route::delete('/studios/{studioId}/seats',         [SeatController::class, 'destroyAll'])->name('seats.destroy-all');

    // Seat Type Definitions (dynamic custom seat types)
    Route::get('/studios/{studio}/seat-types',              [SeatTypeController::class, 'index'])->name('seat-types.index');
    Route::post('/studios/{studio}/seat-types',             [SeatTypeController::class, 'store'])->name('seat-types.store');
    Route::put('/studios/{studio}/seat-types/{key}',        [SeatTypeController::class, 'update'])->name('seat-types.update');
    Route::delete('/studios/{studio}/seat-types/{key}',     [SeatTypeController::class, 'destroy'])->name('seat-types.destroy');

    // Order Management
Route::get('/orders',      [AdminOrderController::class, 'index'])->name('orders.index');
Route::get('/orders/export', [AdminOrderController::class, 'export'])->name('orders.export');
Route::get('/orders/{id}', [AdminOrderController::class, 'show'])->name('orders.show');
});

// Manager Routes (own cinema only)
Route::prefix('manager')->name('manager.')->middleware(['admin.auth', 'role:manager', 'cinema.scope', 'no-store'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'manager'])->name('dashboard');
    Route::get('/stats', [ManagerStatsController::class, 'index'])->name('stats.index');
    Route::get('/staff-stats', [StaffStatsController::class, 'index'])->name('staff-stats.index');
    Route::get('/staff-stats/{staff}', [StaffStatsController::class, 'show'])->name('staff-stats.show');

    // Cinema (view + edit own cinema only; no create/delete)
    Route::get('/cinemas', [CinemaController::class, 'index'])->name('cinemas.index');
    Route::get('/cinemas/{cinema}/edit', [CinemaController::class, 'edit'])->name('cinemas.edit');
    Route::put('/cinemas/{cinema}', [CinemaController::class, 'update'])->name('cinemas.update');

    // Studios
    Route::get('/studios', [StudioController::class, 'index'])->name('studios.index');
    Route::get('/studios/create', [StudioController::class, 'create'])->name('studios.create');
    Route::post('/studios', [StudioController::class, 'store'])->name('studios.store');
    Route::get('/studios/{id}/edit', [StudioController::class, 'edit'])->name('studios.edit');
    Route::put('/studios/{id}', [StudioController::class, 'update'])->name('studios.update');
    Route::delete('/studios/{id}', [StudioController::class, 'destroy'])->name('studios.destroy');

    // Seat layout
    Route::get('/studios/{studioId}/seats', [SeatController::class, 'layout'])->name('seats.layout');
    Route::post('/studios/{studioId}/seats/layout', [SeatController::class, 'saveLayout'])->name('seats.save-layout');
    Route::post('/studios/{studioId}/seats/generate', [SeatController::class, 'generate'])->name('seats.generate');
    Route::delete('/studios/{studioId}/seats', [SeatController::class, 'destroyAll'])->name('seats.destroy-all');

    // Seat type definitions
    Route::get('/studios/{studio}/seat-types', [SeatTypeController::class, 'index'])->name('seat-types.index');
    Route::post('/studios/{studio}/seat-types', [SeatTypeController::class, 'store'])->name('seat-types.store');
    Route::put('/studios/{studio}/seat-types/{key}', [SeatTypeController::class, 'update'])->name('seat-types.update');
    Route::delete('/studios/{studio}/seat-types/{key}', [SeatTypeController::class, 'destroy'])->name('seat-types.destroy');

    // Schedules
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/create', [ScheduleController::class, 'create'])->name('schedules.create');
    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{id}', [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');
    Route::get('/cinemas/{cinemaId}/studios', [ScheduleController::class, 'studiosByCinema'])->name('cinemas.studios');

    // Event Festival (own cinema only)
    Route::get('/events',                        [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create',                 [EventController::class, 'create'])->name('events.create');
    Route::post('/events',                       [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit',              [EventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}',                   [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{id}',                [EventController::class, 'destroy'])->name('events.destroy');
    Route::get('/events/{id}/sessions',          [EventController::class, 'sessions'])->name('events.sessions');
    Route::get('/events/{id}/sessions/create',   [EventController::class, 'createSession'])->name('events.sessions.create');
    Route::post('/events/{id}/sessions',         [EventController::class, 'storeSession'])->name('events.sessions.store');
    Route::get('/events/{id}/sessions/{sessionId}/edit',   [EventController::class, 'editSession'])->name('events.sessions.edit');
    Route::put('/events/{id}/sessions/{sessionId}',        [EventController::class, 'updateSession'])->name('events.sessions.update');
    Route::delete('/events/{id}/sessions/{sessionId}',     [EventController::class, 'destroySession'])->name('events.sessions.destroy');
    Route::post('/events/movies',                [EventController::class, 'storeMovie'])->name('events.movies.store');
    // Orders (own cinema only)
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/export', [AdminOrderController::class, 'export'])->name('orders.export');
    Route::get('/orders/{id}', [AdminOrderController::class, 'show'])->name('orders.show');

    // Staff accounts are always created inside the manager's cinema.
    Route::get('/staff', [StaffAccountController::class, 'index'])->name('staff.index');
    Route::get('/staff/create', [StaffAccountController::class, 'create'])->name('staff.create');
    Route::post('/staff', [StaffAccountController::class, 'store'])->name('staff.store');
    Route::get('/staff/{staff}/edit', [StaffAccountController::class, 'edit'])->name('staff.edit');
    Route::put('/staff/{staff}', [StaffAccountController::class, 'update'])->name('staff.update');
    Route::delete('/staff/{staff}', [StaffAccountController::class, 'destroy'])->name('staff.destroy');
});

// Staff Routes (own cinema only)
Route::prefix('staff')->name('staff.')->middleware(['admin.auth', 'role:staff', 'cinema.scope', 'no-store'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'staff'])->name('dashboard');

    // Offline ticket sales (cashier)
    Route::get('/cashier', [CashierController::class, 'index'])->name('cashier.index');
    Route::get('/cashier/seats', [CashierController::class, 'seats'])->name('cashier.seats');
    Route::get('/cashier/seat-data', [CashierController::class, 'seatData'])->name('cashier.seat-data');
    Route::post('/cashier/summary', [CashierController::class, 'summary'])->name('cashier.summary');
    Route::post('/cashier', [CashierController::class, 'store'])->name('cashier.store');
    Route::post('/cashier/status', [CashierController::class, 'status'])->name('cashier.status');

    // Attendance simulation + personal daily stats
    Route::get('/attendance', [\App\Http\Controllers\Staff\AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance/check-in', [\App\Http\Controllers\Staff\AttendanceController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/check-out', [\App\Http\Controllers\Staff\AttendanceController::class, 'checkOut'])->name('attendance.check-out');
    Route::get('/stats', [\App\Http\Controllers\Staff\DailyStatsController::class, 'index'])->name('stats.index');

    // Ticket scanning + printable ticket
    Route::get('/scan-ticket', [StaffTicketScannerController::class, 'index'])->name('tickets.scanner');
    Route::post('/tickets/preview', [StaffTicketScannerController::class, 'preview'])->name('tickets.preview');
    Route::post('/tickets/scan', [StaffTicketScannerController::class, 'scan'])->name('tickets.scan');
    Route::post('/focus/verify', [StaffTicketScannerController::class, 'verifyFocusPassword'])->name('focus.verify');
    Route::get('/tickets/{order}/print', [TicketPrintController::class, 'show'])->name('tickets.print');
});

// Read-only web discovery for regular users.
Route::get('/discover', [PublicPageController::class, 'discover'])
    ->middleware(['admin.auth', 'role:user', 'no-store'])
    ->name('discover');
