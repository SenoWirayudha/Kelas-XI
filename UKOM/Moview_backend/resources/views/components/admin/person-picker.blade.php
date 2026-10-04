@props([
    'name' => 'person_id',
    'placeholder' => 'Cari nama orang...',
    'addUrl' => null,
    'takenIds' => [],
])

@php
    $listId = 'person-picker-' . \Illuminate\Support\Str::random(8);
    $initial = null;
    $oldId = old($name);
    if ($oldId !== null && $oldId !== '') {
        $initial = \App\Models\Person::find($oldId);
    }
    $taken = collect($takenIds)->map(fn ($v) => (int) $v)->values()->all();
@endphp

<div
    x-data="moviewPersonPicker({
        url: {{ \Illuminate\Support\Js::from(route('admin.persons.list')) }},
        name: {{ \Illuminate\Support\Js::from($name) }},
        listId: {{ \Illuminate\Support\Js::from($listId) }},
        placeholder: {{ \Illuminate\Support\Js::from($placeholder) }},
        addUrl: {{ $addUrl ? \Illuminate\Support\Js::from($addUrl) : 'null' }},
        takenIds: {{ \Illuminate\Support\Js::from($taken) }},
        initial: {{ $initial ? \Illuminate\Support\Js::from(['id' => (int) $initial->id, 'name' => $initial->full_name, 'role' => $initial->primary_role ?? '']) : 'null' }}
    })"
    class="relative"
    @click.outside="open = false"
>
    <input type="text"
           x-ref="input"
           x-model="query"
           @input.debounce.300ms="search()"
           @focus="open = true; if (!results.length && !loading && !error) search()"
           @blur="open = false; restoreQuery()"
           @keydown.down.prevent="onArrow(1)"
           @keydown.up.prevent="onArrow(-1)"
           @keydown.enter="onEnter($event)"
           @keydown.escape="open = false"
           role="combobox"
           :aria-expanded="open ? 'true' : 'false'"
           aria-controls="{{ $listId }}-listbox"
           aria-autocomplete="list"
           :aria-activedescendant="open && highlight >= 0 ? listId + '-opt-' + highlight : null"
           autocomplete="off"
           :placeholder="selected ? '' : placeholder"
           class="w-full px-4 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">

    <button type="button"
            x-show="query.length > 0"
            x-cloak
            @click="clear()"
            class="text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Bersihkan pencarian">
        <i class="fas fa-times"></i>
    </button>

    <input type="hidden" :name="name" :value="selected ? selected.id : ''">

    <div x-show="open"
         x-cloak
         x-transition.opacity.duration.150ms
         class="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <div x-show="loading" class="px-4 py-3 text-sm text-gray-500 flex items-center">
            <i class="fas fa-spinner fa-spin mr-2"></i> Mencari...
        </div>

        <div x-show="!loading && error" class="px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>Gagal memuat data orang.</span>
            <button type="button" @mousedown.prevent @click="search()" class="underline text-red-700">Coba lagi</button>
        </div>

        <ul x-show="!loading && !error"
            role="listbox"
            :id="listId + '-listbox'"
            :aria-label="placeholder"
            class="max-h-60 overflow-y-auto py-1">
            <template x-for="(item, i) in results" :key="item.id">
                <li role="option"
                    :id="listId + '-opt-' + i"
                    :aria-selected="highlight === i ? 'true' : 'false'"
                    @mousemove="highlight = i"
                    @mousedown.prevent="pick(item)"
                    class="px-4 py-2 cursor-pointer flex items-center justify-between"
                    :class="highlight === i ? 'bg-blue-50' : ''">
                    <span class="flex items-center min-w-0">
                        <i class="fas fa-user text-gray-400 mr-2 flex-shrink-0"></i>
                        <span class="text-sm text-gray-800 truncate" x-text="item.name"></span>
                    </span>
                    <span class="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <span x-show="item.taken"
                              class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">Sudah di film ini</span>
                        <span class="text-xs text-gray-400 whitespace-nowrap" x-text="item.role"></span>
                    </span>
                </li>
            </template>
            <li x-show="results.length === 0"
                class="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan</li>
        </ul>

        <div x-show="addUrl" class="border-t border-gray-200 bg-gray-50 px-4 py-2 text-right">
            <a :href="addUrl" class="text-xs text-blue-600 hover:underline">
                <i class="fas fa-plus mr-1"></i>Tambah person baru
            </a>
        </div>
    </div>
</div>

<script>
function moviewPersonPicker(cfg) {
    return {
        url: cfg.url,
        name: cfg.name,
        listId: cfg.listId,
        placeholder: cfg.placeholder || 'Cari nama orang...',
        addUrl: cfg.addUrl || null,
        takenIds: cfg.takenIds || [],
        selected: cfg.initial ? { ...cfg.initial, taken: (cfg.takenIds || []).includes(cfg.initial.id) } : null,
        query: cfg.initial ? cfg.initial.name : '',
        results: [],
        open: false,
        loading: false,
        error: false,
        highlight: -1,
        ctrl: null,
        async search() {
            if (this.ctrl) this.ctrl.abort();
            this.ctrl = new AbortController();
            this.loading = true;
            this.error = false;
            try {
                const res = await fetch(this.url + '?search=' + encodeURIComponent(this.query.trim()), {
                    signal: this.ctrl.signal,
                    headers: { 'Accept': 'application/json' },
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('Bad payload');
                this.results = data.map(p => ({
                    id: p.id,
                    name: p.full_name,
                    role: p.primary_role || '',
                    taken: this.takenIds.includes(p.id),
                }));
                this.highlight = this.results.length > 0 ? 0 : -1;
                this.loading = false;
            } catch (e) {
                if (e && e.name === 'AbortError') return;
                this.results = [];
                this.highlight = -1;
                this.error = true;
                this.loading = false;
            }
        },
        onArrow(step) {
            if (!this.open) {
                this.open = true;
                if (!this.results.length && !this.loading && !this.error) this.search();
                return;
            }
            if (!this.results.length) return;
            let next = this.highlight + step;
            if (next < 0) next = this.results.length - 1;
            if (next >= this.results.length) next = 0;
            this.highlight = next;
        },
        onEnter(e) {
            if (this.open && this.highlight >= 0 && this.results[this.highlight]) {
                e.preventDefault();
                this.pick(this.results[this.highlight]);
            }
        },
        pick(item) {
            this.selected = item;
            this.query = item.name;
            this.open = false;
            this.error = false;
        },
        clear() {
            this.selected = null;
            this.query = '';
            this.results = [];
            this.highlight = -1;
            this.error = false;
            this.$refs.input && this.$refs.input.focus();
            this.search();
        },
        restoreQuery() {
            if (this.selected && this.query.trim() !== this.selected.name) {
                this.query = this.selected.name;
            }
        },
    };
}
</script>
