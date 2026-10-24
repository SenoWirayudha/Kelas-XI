@extends('layouts.admin')

@section('title', 'Scan Tiket')
@section('page-title', 'Scan Tiket')
@section('page-subtitle', 'Scan QR tiket dengan kamera atau input manual kode tiket')

@section('content')
<div class="max-w-4xl mx-auto" x-data="ticketScanner()">
    <div x-show="!focusMode" class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-gray-500">Gunakan Mode Fokus saat pengunjung memindai tiket sendiri.</p>
        <button type="button"
                x-show="isStaff"
                @click="enterFocusMode()"
                aria-label="Mode Fokus"
                class="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
            <i class="fas fa-expand mr-2"></i> Mode Fokus
        </button>
    </div>

    <div class="grid grid-cols-1 gap-6" :class="focusMode ? '' : 'lg:grid-cols-2'">
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <i class="fas fa-camera text-blue-500"></i>
                <span x-text="focusMode ? 'Pindai QR Tiket' : 'Kamera Scanner'"></span>
            </h3>

            <div x-show="!focusMode" class="mb-3 text-xs text-gray-500">
                Kamera tidak aktif otomatis. Tekan Aktifkan Kamera saat akan scan.
            </div>

            <div id="scanner-wrapper"
                 class="rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-300"
                 :class="focusMode ? 'min-h-[52vh]' : ''">
                <div id="scanner-reader" class="w-full min-h-[280px]" :class="focusMode ? 'min-h-[52vh]' : ''"></div>
            </div>

            <div x-show="!focusMode" class="mt-4 flex items-center gap-2">
                <button type="button"
                        @click="startCamera"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                        :disabled="cameraActive || isProcessing">
                    <i class="fas fa-video mr-1"></i> Aktifkan Kamera
                </button>
                <button type="button"
                        @click="stopCamera"
                        class="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition disabled:opacity-50"
                        :disabled="!cameraActive || isProcessing">
                    <i class="fas fa-video-slash mr-1"></i> Matikan Kamera
                </button>
            </div>
            <div x-show="!focusMode"
                 class="mt-2 text-xs"
                 :class="cameraActive ? 'text-green-600' : 'text-gray-500'"
                 x-text="cameraActive ? 'Kamera aktif' : 'Kamera nonaktif'"></div>
            <div x-show="focusMode && cameraNotice"
                 x-text="cameraNotice"
                 class="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800"></div>
        </div>

        <div class="space-y-6" :class="focusMode ? 'mx-auto w-full max-w-xl' : ''">
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-keyboard text-blue-500"></i>
                    <span x-text="focusMode ? 'Input Kode Tiket' : 'Input Manual'"></span>
                </h3>
                <form @submit.prevent="submitManualCode" class="space-y-3">
                    <input type="text"
                           x-model.trim="manualCode"
                           x-ref="manualCodeInput"
                           placeholder="Contoh: MOV-ABC123"
                           autocomplete="off"
                           class="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                           :class="focusMode ? 'py-4 text-lg' : 'text-sm'">
                    <button type="submit"
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                            :class="focusMode ? 'py-3 text-base' : ''"
                            :aria-label="focusMode ? 'Cek Tiket' : 'Validasi Tiket'"
                            :disabled="isProcessing || !manualCode">
                        <i class="fas fa-check-circle mr-1"></i>
                        <span x-text="focusMode ? 'Cek Tiket' : 'Validasi Tiket'"></span>
                    </button>
                </form>
            </div>

            <div x-show="!focusMode && result"
                 x-transition
                 class="rounded-xl shadow p-5 border"
                 :class="isSuccess ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'">
                <div class="flex items-start gap-3">
                    <i class="text-2xl mt-0.5"
                       :class="isSuccess ? 'fas fa-circle-check text-green-600' : 'fas fa-circle-xmark text-red-600'"></i>
                    <div>
                        <p class="font-bold"
                           :class="isSuccess ? 'text-green-800' : 'text-red-800'"
                           x-text="result?.message || '-'"></p>

                        <template x-if="isSuccess && result?.data">
                            <div class="mt-3 text-sm text-gray-700 space-y-1">
                                <p><span class="text-gray-500">Kode Tiket:</span> <span class="font-mono font-semibold" x-text="result.data.ticket_code || '-'"></span></p>
                                <p><span class="text-gray-500">Film:</span> <span class="font-medium" x-text="result.data.movie_title || '-'"></span></p>
                                <p><span class="text-gray-500">Bioskop:</span> <span x-text="result.data.cinema_name || '-'"></span></p>
                                <p><span class="text-gray-500">Kursi:</span> <span class="font-semibold" x-text="(result.data.seat_codes || []).join(', ') || '-'"></span></p>
                            </div>
                        </template>

                        <template x-if="isSuccess && canConfirm">
                            <button type="button"
                                    @click="confirmTicket"
                                    class="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                                    :disabled="isProcessing">
                                <i class="fas fa-check mr-1"></i> Konfirmasi Tiket Masuk
                            </button>
                        </template>

                        <button type="button"
                                x-show="isSuccess && result?.data?.order_id"
                                @click="printTicket"
                                class="mt-2 w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition">
                            <i class="fas fa-print mr-1"></i> Print Tiket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div x-show="focusMode" x-cloak class="fixed right-3 top-3 z-[95]">
        <button type="button"
                @click="openFocusExit()"
                aria-label="Keluar Mode Fokus"
                class="rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur transition"
                :class="focusResult
                    ? 'border-white/30 bg-black/20 text-white/60 hover:text-white'
                    : 'border-gray-300 bg-white/70 text-gray-500 hover:text-gray-800'">
            <i class="fas fa-lock-open mr-1"></i> Keluar Mode Fokus
        </button>
    </div>

    <div x-show="focusMode && focusResult"
         x-cloak
         x-transition.opacity
         class="fixed inset-0 z-[90] flex items-center justify-center p-6"
         :class="focusResultClass()">
        <div class="max-w-2xl text-center">
            <i class="fas text-7xl sm:text-8xl" :class="focusResultIcon()"></i>
            <p class="mt-6 text-3xl font-black tracking-tight sm:text-5xl" x-text="focusResultTitle()"></p>
            <p class="mt-3 text-lg font-medium opacity-90 sm:text-2xl" x-text="focusResult?.message || ''"></p>

            <template x-if="focusResult?.data">
                <div class="mt-6 rounded-2xl bg-black/15 px-5 py-4 text-left text-sm sm:text-base">
                    <p class="font-semibold" x-text="focusResult.data.movie_title || '-'"></p>
                    <p class="mt-1 opacity-90">
                        <span x-text="focusResult.data.cinema_name || '-'"></span>
                        <span class="mx-1">·</span>
                        <span x-text="focusResult.data.studio_name || '-'"></span>
                    </p>
                    <p class="mt-1 font-mono text-lg font-bold sm:text-xl" x-text="(focusResult.data.seat_codes || []).join(', ') || '-'"></p>
                </div>
            </template>

            <p class="mt-8 text-xs uppercase tracking-[0.25em] opacity-60">Kembali siap scan otomatis...</p>
        </div>
    </div>

    <div x-show="focusExitOpen" x-cloak class="fixed inset-0 z-[96] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeFocusExit()"></div>
        <div class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <i class="fas fa-lock text-red-600"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Keluar Mode Fokus</h3>
                    <p class="mt-1 text-sm text-gray-500">Masukkan password akun staff yang sedang login.</p>
                </div>
            </div>

            <form @submit.prevent="verifyFocusExit" class="mt-5 space-y-3">
                <input type="password"
                       x-model="focusPassword"
                       x-ref="focusPassword"
                       autocomplete="current-password"
                       placeholder="Password staff"
                       class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div x-show="focusError" x-text="focusError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"></div>
                <div class="flex justify-end gap-2">
                    <button type="button"
                            @click="closeFocusExit()"
                            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit"
                            class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Konfirmasi Keluar Mode Fokus"
                            :disabled="focusExitProcessing || !focusPassword">
                        <i class="fas fa-spinner fa-spin mr-2" x-show="focusExitProcessing"></i>
                        Keluar
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
<script>
function ticketScanner() {
    return {
        scanner: null,
        scannerReady: false,
        cameraActive: false,
        cameraNotice: '',
        isProcessing: false,
        manualCode: '',
        result: null,
        isSuccess: false,
        canConfirm: false,
        pendingTicketCode: null,
        lastScannedCode: null,
        lastScannedAt: 0,
        isStaff: @json(session('admin_role') === 'staff'),
        focusMode: false,
        focusResult: null,
        focusResultType: '',
        focusResultTimer: null,
        focusExitOpen: false,
        focusPassword: '',
        focusError: '',
        focusExitProcessing: false,
        csrfToken: '{{ csrf_token() }}',
        scanPreviewApiUrl: '{{ route('staff.tickets.preview') }}',
        scanConfirmApiUrl: '{{ route('staff.tickets.scan') }}',
        focusVerifyUrl: '{{ route('staff.focus.verify') }}',
        printUrlTemplate: '{{ route('staff.tickets.print', ['order' => '__ORDER__']) }}',

        init() {
            if (!this.isStaff) {
                window.moviewFocusMode?.setActive(false);
                return;
            }

            if (window.moviewFocusMode?.isActive()) {
                this.focusMode = true;
                this.$nextTick(() => this.startCamera());
            }
        },

        enterFocusMode() {
            if (!this.isStaff || this.focusMode) {
                return;
            }

            this.focusMode = true;
            this.cameraNotice = '';
            this.result = null;
            this.isSuccess = false;
            this.canConfirm = false;
            this.pendingTicketCode = null;
            this.clearFocusResult();
            window.moviewFocusMode?.setActive(true);

            try {
                history.pushState({ focusMode: true }, '', window.location.href);
            } catch (_) {}

            try {
                const request = document.documentElement.requestFullscreen?.();
                if (request && request.catch) request.catch(() => {});
            } catch (_) {}

            this.$nextTick(() => this.startCamera());
        },

        exitFocusMode() {
            this.focusMode = false;
            this.focusExitOpen = false;
            this.focusPassword = '';
            this.focusError = '';
            this.clearFocusResult();
            this.stopCamera();
            window.moviewFocusMode?.setActive(false);

            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    const request = document.exitFullscreen();
                    if (request && request.catch) request.catch(() => {});
                }
            } catch (_) {}
        },

        openFocusExit() {
            this.focusExitOpen = true;
            this.focusPassword = '';
            this.focusError = '';
            this.$nextTick(() => this.$refs.focusPassword?.focus());
        },

        closeFocusExit() {
            if (this.focusExitProcessing) {
                return;
            }
            this.focusExitOpen = false;
            this.focusPassword = '';
            this.focusError = '';
        },

        async verifyFocusExit() {
            if (!this.focusPassword || this.focusExitProcessing) {
                return;
            }

            this.focusExitProcessing = true;
            this.focusError = '';

            try {
                const response = await fetch(this.focusVerifyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ password: this.focusPassword }),
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (_) {
                    payload = { message: 'Respon server tidak valid.' };
                }

                if (response.ok && payload?.success) {
                    this.exitFocusMode();
                    return;
                }

                this.focusError = payload?.message || 'Password salah.';
                this.focusPassword = '';
                this.$nextTick(() => this.$refs.focusPassword?.focus());
            } catch (_) {
                this.focusError = 'Gagal menghubungi server. Coba lagi.';
            } finally {
                this.focusExitProcessing = false;
            }
        },

        async startCamera() {
            if (this.scannerReady || this.cameraActive) {
                return;
            }

            if (!this.scanner) {
                this.scanner = new Html5Qrcode('scanner-reader');
            }

            try {
                await this.scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: 240 },
                    (decodedText) => this.onQrDetected(decodedText)
                );
                this.scannerReady = true;
                this.cameraActive = true;
                this.cameraNotice = '';
            } catch (error) {
                this.cameraActive = false;
                this.cameraNotice = 'Kamera tidak dapat diakses. Gunakan input kode tiket.';
                if (!this.focusMode) {
                    this.showResult(false, { message: this.cameraNotice });
                }
            }
        },

        async stopCamera() {
            try {
                if (this.scanner && this.scannerReady) {
                    await this.scanner.stop();
                }
            } catch (_) {}

            this.scannerReady = false;
            this.cameraActive = false;
        },

        async onQrDetected(decodedText) {
            const code = (decodedText || '').trim();
            if (!code || this.isProcessing) {
                return;
            }

            const now = Date.now();
            if (code === this.lastScannedCode && (now - this.lastScannedAt) < 2500) {
                return;
            }

            this.lastScannedCode = code;
            this.lastScannedAt = now;

            if (this.focusMode) {
                await this.processFocusTicket(code);
                return;
            }

            await this.previewTicket(code, true);
        },

        async submitManualCode() {
            if (!this.manualCode || this.isProcessing) {
                return;
            }

            if (this.focusMode) {
                await this.processFocusTicket(this.manualCode);
                return;
            }

            await this.previewTicket(this.manualCode, false);
        },

        async processFocusTicket(ticketCode) {
            const code = (ticketCode || '').trim();
            if (!code || this.isProcessing) {
                return;
            }

            this.isProcessing = true;
            this.canConfirm = false;
            this.pendingTicketCode = null;

            try {
                const response = await fetch(this.scanConfirmApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ ticket_code: code }),
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (_) {
                    payload = { message: 'Respon server tidak valid.' };
                }

                const success = response.ok && payload?.success;
                await this.stopCamera();

                if (success) {
                    this.showFocusResult('success', payload?.message || 'Tiket valid. Silakan masuk.', payload?.data || null);
                } else if (response.status === 409) {
                    this.showFocusResult('used', payload?.message || 'Tiket sudah dipakai.');
                } else {
                    this.showFocusResult('error', payload?.message || 'Tiket ditolak.');
                }
            } catch (_) {
                await this.stopCamera();
                this.showFocusResult('error', 'Gagal menghubungi server. Coba lagi.');
            } finally {
                this.isProcessing = false;
                this.manualCode = '';
            }
        },

        showFocusResult(type, message, data = null) {
            if (this.focusResultTimer) {
                clearTimeout(this.focusResultTimer);
            }

            this.focusResultType = type;
            this.focusResult = { message, data };

            this.focusResultTimer = setTimeout(() => {
                this.focusResult = null;
                this.focusResultType = '';
                this.focusResultTimer = null;
                this.lastScannedCode = null;
                this.lastScannedAt = 0;

                if (this.focusMode) {
                    this.startCamera();
                }
            }, 5000);
        },

        clearFocusResult() {
            if (this.focusResultTimer) {
                clearTimeout(this.focusResultTimer);
                this.focusResultTimer = null;
            }

            this.focusResult = null;
            this.focusResultType = '';
        },

        focusResultClass() {
            return {
                success: 'bg-green-600 text-white',
                used: 'bg-amber-500 text-white',
                error: 'bg-red-600 text-white',
            }[this.focusResultType] || 'bg-gray-900 text-white';
        },

        focusResultIcon() {
            return {
                success: 'fa-circle-check',
                used: 'fa-clock-rotate-left',
                error: 'fa-circle-xmark',
            }[this.focusResultType] || 'fa-circle-info';
        },

        focusResultTitle() {
            return {
                success: 'TIKET VALID',
                used: 'SUDAH DIPAKAI',
                error: 'TIKET DITOLAK',
            }[this.focusResultType] || 'HASIL SCAN';
        },

        async previewTicket(ticketCode, fromCamera = false) {
            this.isProcessing = true;
            this.canConfirm = false;
            this.pendingTicketCode = null;

            try {
                const response = await fetch(this.scanPreviewApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ ticket_code: ticketCode }),
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (_) {
                    payload = { message: 'Respon server tidak valid.' };
                }

                const success = response.ok && payload?.success;
                this.showResult(success, payload || { message: 'Terjadi kesalahan saat validasi tiket.' });

                if (success) {
                    this.pendingTicketCode = ticketCode;
                    this.canConfirm = true;
                    if (fromCamera) {
                        await this.stopCamera();
                    }
                }
            } catch (error) {
                this.showResult(false, { message: 'Gagal menghubungi server. Coba lagi.' });
            } finally {
                this.isProcessing = false;
                this.manualCode = '';
            }
        },

        async confirmTicket() {
            if (!this.pendingTicketCode || this.isProcessing) {
                return;
            }

            this.isProcessing = true;
            try {
                const response = await fetch(this.scanConfirmApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': this.csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ ticket_code: this.pendingTicketCode }),
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (_) {
                    payload = { message: 'Respon server tidak valid.' };
                }

                const success = response.ok && payload?.success;
                this.showResult(success, payload || { message: 'Terjadi kesalahan saat konfirmasi tiket.' });

                if (success) {
                    this.canConfirm = false;
                    this.pendingTicketCode = null;
                }
            } catch (error) {
                this.showResult(false, { message: 'Gagal menghubungi server. Coba lagi.' });
            } finally {
                this.isProcessing = false;
            }
        },

        showResult(success, payload) {
            this.isSuccess = success;
            this.result = payload;
            this.animateScannerBorder(success);
        },

        printTicket() {
            if (this.focusMode) {
                return;
            }

            const orderId = this.result?.data?.order_id;
            if (!orderId) {
                return;
            }

            window.open(this.printUrlTemplate.replace('__ORDER__', orderId), '_blank');
        },

        animateScannerBorder(success) {
            const wrapper = document.getElementById('scanner-wrapper');
            if (!wrapper) {
                return;
            }

            wrapper.classList.remove('border-gray-200', 'border-green-500', 'border-red-500', 'animate-pulse');
            wrapper.classList.add(success ? 'border-green-500' : 'border-red-500', 'animate-pulse');

            setTimeout(() => {
                wrapper.classList.remove('border-green-500', 'border-red-500', 'animate-pulse');
                wrapper.classList.add('border-gray-200');
            }, 1000);
        }
    }
}
</script>
@endpush
