@props([
    'name' => 'ids[]',
    'options' => collect(),
    'selected' => [],
    'placeholder' => 'Search and select...',
    'addUrl' => null,
    'addLabel' => 'Add new',
    'addPlaceholder' => 'Type the name and press Add...',
    'addButtonText' => 'Add',
])

@php
    $optionData = $options
        ->map(fn ($o) => ['id' => (int) $o->id, 'name' => $o->name])
        ->sortBy('name')
        ->values()
        ->all();
    $selectedIds = collect($selected)->map(fn ($v) => (int) $v)->all();
@endphp

<div
    x-data="moviewMultiSelect({
        name: {{ \Illuminate\Support\Js::from($name) }},
        options: {{ \Illuminate\Support\Js::from($optionData) }},
        selected: {{ \Illuminate\Support\Js::from($selectedIds) }},
        placeholder: {{ \Illuminate\Support\Js::from($placeholder) }},
        addUrl: {{ $addUrl ? \Illuminate\Support\Js::from($addUrl) : 'null' }},
        addLabel: {{ \Illuminate\Support\Js::from($addLabel) }},
        addPlaceholder: {{ \Illuminate\Support\Js::from($addPlaceholder) }},
        addButtonText: {{ \Illuminate\Support\Js::from($addButtonText) }}
    })"
    class="relative"
>
    <button type="button"
            @click="open = !open"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white">
        <span class="flex items-center min-w-0">
            <i class="fas fa-check-square text-blue-500 mr-2"></i>
            <span x-text="selected.length" class="font-semibold text-gray-800"></span>
            <span class="text-gray-600 ml-1">selected</span>
            <span x-show="selected.length > 0" class="text-gray-400 text-xs ml-2 truncate">
                <span x-text="selectedPreview()"></span>
            </span>
        </span>
        <i class="fas fa-chevron-down text-gray-400 transition-transform" :class="open ? 'rotate-180' : ''"></i>
    </button>

    <template x-for="id in selected" :key="id">
        <input type="hidden" :name="name" :value="id">
    </template>

    <div x-show="open"
         x-transition
         @click.outside="open = false"
         x-cloak
         class="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <div class="p-2 border-b border-gray-200 bg-gray-50">
            <div class="relative">
                <i class="fas fa-search text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm"></i>
                <input type="text"
                       x-model="query"
                       class="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       :placeholder="placeholder">
                <button type="button" x-show="query.length > 0" @click="query = ''"
                        class="text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <div class="max-h-56 overflow-y-auto p-2">
            <template x-for="opt in filteredOptions" :key="opt.id">
                <label class="flex items-center space-x-2 px-3 py-1.5 rounded hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox"
                           :value="opt.id"
                           :checked="selected.includes(opt.id)"
                           @change="toggle(opt.id)"
                           class="rounded text-blue-600 focus:ring-2 focus:ring-blue-500">
                    <span class="text-sm text-gray-700" x-text="opt.name"></span>
                </label>
            </template>
            <p x-show="filteredOptions.length === 0 && query.length === 0 && !adding" class="text-sm text-gray-400 text-center py-2">
                No options yet — add one below.
            </p>
            <p x-show="filteredOptions.length === 0 && query.length > 0" class="text-sm text-gray-400 text-center py-2">
                No results found
            </p>
        </div>

        <div class="p-2 border-t border-gray-200 bg-gray-50">
            <div class="flex justify-between items-center mb-2">
                <button type="button" @click="selectAllVisible()" class="text-xs text-blue-600 hover:underline">
                    Select all (<span x-text="filteredOptions.length"></span>)
                </button>
                <button type="button" @click="selected = []" class="text-xs text-red-500 hover:underline">Clear</button>
            </div>

            <template x-if="addUrl">
                <div>
                    <button type="button" 
                            @click="adding = true; $nextTick(() => $refs.addInput && $refs.addInput.focus())"
                            x-show="!adding"
                            class="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 text-left">
                        <i class="fas fa-plus mr-1"></i>
                        <span x-text="addLabel"></span>
                    </button>
                    <div x-show="adding" class="space-y-2">
                        <div class="flex space-x-2">
                            <input type="text"
                                   x-model="newName"
                                   :placeholder="addPlaceholder"
                                   x-ref="addInput"
                                   @keydown.enter.prevent="addNew()"
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <button type="button" @click="addNew()" :disabled="saving" 
                                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                <i class="fas fa-spinner fa-spin mr-1" x-show="saving"></i>
                                <span x-text="addButtonText"></span>
                            </button>
                        </div>
                        <p x-show="errorMsg" class="text-xs text-red-600" x-text="errorMsg"></p>
                    </div>
                </div>
            </template>
        </div>
    </div>
</div>

<script>
function moviewMultiSelect(cfg) {
    return {
        name: cfg.name,
        options: cfg.options || [],
        selected: cfg.selected || [],
        query: '',
        open: false,
        placeholder: cfg.placeholder || 'Search...',
        addUrl: cfg.addUrl || null,
        addLabel: cfg.addLabel || 'Add new',
        addPlaceholder: cfg.addPlaceholder || 'Type the name and press Add...',
        addButtonText: cfg.addButtonText || 'Add',
        adding: false,
        newName: '',
        saving: false,
        errorMsg: '',
        get filteredOptions() {
            const q = this.query.trim().toLowerCase();
            if (!q) return this.options;
            return this.options.filter(o => o.name.toLowerCase().includes(q));
        },
        toggle(id) {
            const idx = this.selected.indexOf(id);
            if (idx >= 0) {
                this.selected.splice(idx, 1);
            } else {
                this.selected.push(id);
            }
        },
        selectedPreview() {
            return this.options
                .filter(o => this.selected.includes(o.id))
                .map(o => o.name)
                .slice(0, 3)
                .join(', ');
        },
        selectAllVisible() {
            this.filteredOptions.forEach(o => {
                if (!this.selected.includes(o.id)) this.selected.push(o.id);
            });
        },
        async addNew() {
            const name = this.newName.trim();
            if (!name || !this.addUrl) return;
            this.saving = true;
            this.errorMsg = '';

            // Client-side dedup guard (case-insensitive) — pick existing, skip POST.
            const existing = this.options.find(o => o.name.trim().toLowerCase() === name.toLowerCase());
            if (existing) {
                if (!this.selected.includes(existing.id)) {
                    this.selected.push(existing.id);
                }
                this.newName = '';
                this.adding = false;
                this.saving = false;
                if (window.showToast) {
                    window.showToast('"' + existing.name + '" sudah ada — otomatis dipilih.', 'info');
                }
                return;
            }

            const token = document.querySelector('input[name="_token"]')?.value || '';
            try {
                const formData = new FormData();
                formData.append('name', name);
                const res = await fetch(this.addUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'Accept': 'application/json',
                    },
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    this.errorMsg = data.errors?.name?.[0] || (data.message || 'Failed to add.');
                    return;
                }
                if (!this.options.some(o => o.id === data.id)) {
                    this.options.push({ id: data.id, name: data.name });
                    this.options.sort((a, b) => a.name.localeCompare(b.name));
                }
                if (!this.selected.includes(data.id)) {
                    this.selected.push(data.id);
                }
                this.newName = '';
                this.adding = false;
            } catch (e) {
                this.errorMsg = 'Network error. Try again.';
            } finally {
                this.saving = false;
            }
        }
    };
}
</script>