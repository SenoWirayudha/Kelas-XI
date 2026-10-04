<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Pagination opt-in: endpoint yang pakai trait ini hanya meng-paginate
 * bila request membawa parameter ?page=. Tanpa ?page=, perilaku lama
 * (kirim seluruh data + tanpa key pagination) dipertahankan 100%.
 */
trait PaginatesList
{
    /**
     * @param  \Illuminate\Database\Query\Builder|object $query  query builder sebelum ->get() (punya toSql/getBindings/forPage/clone)
     * @return array{items: \Illuminate\Support\Collection, pagination: array<int,int>}|null
     */
    protected function paginateList(Request $request, $query, int $defaultPerPage = 20): ?array
    {
        if (!$request->has('page')) {
            return null;
        }

        $perPage = min(max((int) $request->input('per_page', $defaultPerPage), 1), 100);
        $page = max(1, (int) $request->input('page', 1));

        $countQuery = clone $query;
        $countQuery->orders = null;
        $countQuery->unionOrders = null;

        $total = PHP_INT_MAX; // gagal count -> optimistis: berhenti saat halaman kosong
        try {
            $row = DB::selectOne(
                'select count(*) as cnt from (' . $countQuery->toSql() . ') as cnt_src',
                $countQuery->getBindings()
            );
            $total = (int) ($row->cnt ?? 0);
        } catch (\Throwable $e) {
            \Log::warning('paginateList: count gagal - ' . $e->getMessage());
        }

        $items = (clone $query)->forPage($page, $perPage)->get();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ];
    }
}
