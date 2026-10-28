@props([
    'name' => 'value',
    'options' => [],
    'selected' => '',
    'placeholder' => 'Cari...',
    'valueKey' => 'id',
    'labelKey' => 'label',
    'emptyText' => 'Tidak ada hasil',
])

@php
    // Accept either a collection of models/DTOs or a ready-made array.
    $optionData = collect($options)->map(function ($o) use ($valueKey, $labelKey) {
        $value = is_array($o) ? ($o[$valueKey] ?? null) : data_get($o, $valueKey);
        $label = is_array($o) ? ($o[$labelKey] ?? '') : data_get($o, $labelKey);

        return ['value' => (string) $value, 'label' => (string) $label];
    })->sortBy('label')->values()->all();
@endphp

<div x-data="moviewSingleSelect({
        options: {{ \Illuminate\Support\Js::from($optionData) }},
        selected: {{ \Illuminate\Support\Js::from((string) $selected) }},
        placeholder: {{ \Illuminate\Support\Js::from($placeholder) }},
        emptyText: {{ \Illuminate\Support\Js::from($emptyText) }}
     })"
     class="relative">
    <input type="hidden" name="{{ $name }}" :value="selected">

    <button type="button"
            @click="open = !open; if (open) $nextTick(() => $refs.search.focus())"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500">
        <span class="truncate" :class="selectedLabel() ? 'text-gray-800' : 'text-gray-400'"
              x-text="selectedLabel() || placeholder"></span>
        <i class="fas fa-chevron-down text-gray-400 text-xs transition-transform" :class="open ? 'rotate-180' : ''"></i>
    </button>

    <div x-show="open" x-cloak x-transition @click.outside="open = false"
         class="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <div class="p-2 border-b border-gray-200 bg-gray-50 relative">
            <i class="fas fa-search text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm"></i>
            <input type="text" x-ref="search" x-model="query"
                   class="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Cari...">
        </div>
        <div class="max-h-56 overflow-y-auto p-1">
            <template x-for="option in filtered()" :key="option.value">
                <button type="button" @click="select(option.value)"
                        class="w-full flex items-center px-3 py-1.5 rounded hover:bg-blue-50 text-sm text-left"
                        :class="selected === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'">
                    <span x-text="option.label"></span>
                </button>
            </template>
            <p x-show="filtered().length === 0" class="text-sm text-gray-400 text-center py-2" x-text="emptyText"></p>
        </div>
    </div>
</div>

@once
@push('scripts')
<script>
function moviewSingleSelect(cfg) {
    return {
        options: cfg.options || [],
        selected: cfg.selected || '',
        placeholder: cfg.placeholder || '',
        emptyText: cfg.emptyText || 'Tidak ada hasil',
        open: false,
        query: '',

        selectedLabel() {
            const found = this.options.find(o => o.value === this.selected);
            return found ? found.label : '';
        },
        filtered() {
            const q = (this.query || '').trim().toLowerCase();
            if (!q) return this.options;
            return this.options.filter(o => o.label.toLowerCase().includes(q));
        },
        select(value) {
            this.selected = value;
            this.open = false;
            this.query = '';
        },
    };
}
</script>
@endpush
@endonce
