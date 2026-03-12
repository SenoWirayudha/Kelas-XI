<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
        ])->orderBy('created_at', 'desc');

        // Optional filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Optional search by order code
        if ($request->filled('search')) {
            $query->where('order_code', 'like', '%' . $request->search . '%');
        }

        $orders = $query->paginate(25)->withQueryString();

        return view('admin.orders.index', compact('orders'));
    }

    public function show($id)
    {
        $order = Order::with([
            'schedule.movie',
            'schedule.studio.cinema',
            'orderSeats.seat',
            'payment',
            'tickets',
        ])->findOrFail($id);

        return view('admin.orders.show', compact('order'));
    }
}
