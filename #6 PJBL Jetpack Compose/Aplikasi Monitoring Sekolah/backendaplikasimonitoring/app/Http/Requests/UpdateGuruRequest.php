<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGuruRequest extends FormRequest
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
        $guruId = $this->route('guru')->id;
        return [
            'kode_guru' => 'sometimes|required|string|unique:gurus,kode_guru,' . $guruId,
            'nama_guru' => 'sometimes|required|string|max:255',
            'telepon' => 'nullable|string|max:20'
        ];
    }
}
