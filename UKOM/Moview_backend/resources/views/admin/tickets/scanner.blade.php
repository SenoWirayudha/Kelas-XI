@extends('layouts.admin')

@section('title', 'Scan Tiket')
@section('page-title', 'Scan Tiket')
@section('page-subtitle', 'Scan QR tiket dengan kamera atau input manual kode tiket')

@section('content')
<div class="max-w-4xl mx-auto" x-data="ticketScanner()">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <i class="fas fa-camera text-blue-500"></i>
                Kamera Scanner
            </h3>

            <div class="mb-3 text-xs text-gray-500">
                Kamera tidak aktif otomatis. Tekan Aktifkan Kamera saat akan scan.
            </div>

            <div id="scanner-wrapper" class="rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-300">
                <div id="scanner-reader" class="w-full min-h-[280px]"></div>
            </div>

            <div class="mt-4 flex items-center gap-2">
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
            <div class="mt-2 text-xs" :class="cameraActive ? 'text-green-600' : 'text-gray-500'" x-text="cameraActive ? 'Kamera aktif' : 'Kamera nonaktif'"></div>
        </div>

        <div class="space-y-6">
            <div class="bg-white rounded-xl shadow p-5">
                <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-keyboard text-blue-500"></i>
                    Input Manual
                </h3>
                <form @submit.prevent="submitManualCode" class="space-y-3">
                    <input type="text"
                           x-model.trim="manualCode"
                           placeholder="Contoh: MOV-ABC123"
                           class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <button type="submit"
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                            :disabled="isProcessing || !manualCode">
                        <i class="fas fa-check-circle mr-1"></i> Validasi Tiket
                    </button>
                </form>
            </div>

            <div x-show="result"
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
                    </div>
                </div>
            </div>
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
        isProcessing: false,
        manualCode: '',
        result: null,
        isSuccess: false,
        canConfirm: false,
        pendingTicketCode: null,
        lastScannedCode: null,
        lastScannedAt: 0,
        csrfToken: '{{ csrf_token() }}',
        scanPreviewApiUrl: '{{ url('/api/tickets/scan/preview') }}',
        scanConfirmApiUrl: '{{ url('/api/tickets/scan') }}',

        init() {},

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
            } catch (error) {
                this.cameraActive = false;
                this.showResult(false, { message: 'Kamera tidak dapat diakses. Gunakan input manual.' });
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
            await this.previewTicket(code, true);
        },

        async submitManualCode() {
            if (!this.manualCode || this.isProcessing) {
                return;
            }
            await this.previewTicket(this.manualCode, false);
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
