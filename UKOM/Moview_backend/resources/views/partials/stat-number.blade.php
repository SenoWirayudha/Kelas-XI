@php
    $raw = (float) ($value ?? 0);
    $abs = abs($raw);
    $prefix = $prefix ?? '';
    $suffix = $suffix ?? '';
    $extraClass = $class ?? '';
    $decimals = (int) ($decimals ?? 0);

    $shortNumber = function (float $number): string {
        $formatted = number_format($number, 1, ',', '.');
        return rtrim(rtrim($formatted, '0'), ',');
    };

    if ($abs >= 1000000000) {
        $compactValue = $shortNumber($raw / 1000000000) . ' M';
    } elseif ($abs >= 1000000) {
        $compactValue = $shortNumber($raw / 1000000) . ' jt';
    } elseif ($abs >= 1000) {
        $compactValue = $shortNumber($raw / 1000) . ' rb';
    } else {
        $compactValue = number_format($raw, 0, ',', '.');
    }

    $fullValue = $prefix . number_format($raw, $decimals, ',', '.') . $suffix;
    $compactText = $prefix . $compactValue . $suffix;
@endphp

<span class="stat-number-wrap">
    <span class="stat-number {{ $extraClass }}"
          data-stat-number
          data-full="{{ $fullValue }}"
          data-compact="{{ $compactText }}"
          tabindex="0"
          role="button"
          aria-label="{{ $fullValue }}"
          title="{{ $fullValue }}">
        <span class="stat-number-text">{{ $fullValue }}</span>
    </span>
</span>
