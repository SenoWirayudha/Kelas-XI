<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJadwalRequest extends FormRequest
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
            'guru_id' => 'sometimes|required|exists:gurus,id',
            'mapel_id' => 'sometimes|required|exists:mapels,id',
            'tahun_ajaran_id' => 'sometimes|required|exists:tahun_ajarans,id',
            'kelas_id' => 'sometimes|required|exists:kelas,id',
            'jam_ke' => 'sometimes|required|string|max:50',
            'hari' => 'sometimes|required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'
        ];
    }
}
