package com.komputerkit.counter;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    // Menyimpan nilai hitungan
    int count = 0;

    // Menampilkan hasil ke layar
    TextView tvHasil;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Hubungkan TextView dari layout ke kode
        tvHasil = findViewById(R.id.tvHasil);

        // Tampilkan nilai awal (0)
        tvHasil.setText(String.valueOf(count));
    }

    // Saat tombol naik ditekan
    public void btnUP(View view) {
        count++; // Tambah 1
        tvHasil.setText(String.valueOf(count)); // Tampilkan hasil baru
    }

    // Saat tombol turun ditekan
    public void btnDown(View view) {
        count--; // Kurang 1
        tvHasil.setText(String.valueOf(count)); // Tampilkan hasil baru
    }
}
