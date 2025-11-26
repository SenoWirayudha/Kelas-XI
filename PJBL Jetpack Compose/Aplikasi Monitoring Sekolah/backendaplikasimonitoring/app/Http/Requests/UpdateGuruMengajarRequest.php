<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGuruMengajarRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'guru_pengganti_id' => 'nullable|exists:gurus,id',
            'status' => 'sometimes|required|in:masuk,tidak_masuk,izin',
            'status_guru_pengganti' => 'nullable|in:masuk,tidak_masuk,izin',
            'keterangan' => 'nullable|string'
        ];
    }
}
