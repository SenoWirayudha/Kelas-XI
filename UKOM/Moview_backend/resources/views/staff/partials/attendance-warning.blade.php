@if(empty($attendanceToday?->jam_masuk))
    <div class="mb-2 flex flex-shrink-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-200">
        <i class="fas fa-triangle-exclamation"></i>
        <span>Anda belum absen masuk hari ini.</span>
        <a href="{{ route('staff.attendance.index') }}" class="font-semibold underline decoration-yellow-400/40 underline-offset-2 hover:text-white">
            Absen sekarang
        </a>
    </div>
@endif
