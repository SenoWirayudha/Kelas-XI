package com.komputerkit.imagefrominternet;

import android.os.Bundle;
import android.widget.ImageView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.squareup.picasso.Picasso;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Inisialisasi ImageView
        ImageView imageViewOnline = findViewById(R.id.imageViewOnline);

        // URL gambar yang akan dimuat
        String imageUrl = "https://s3.amazonaws.com/criterion-production/films/2e4a085f40d596d24e8d171a92bc2567/8BbreVEmhjgBpsnjSy0hb0d2rUp0Ic_small.jpg";

        // Memuat gambar menggunakan Picasso
        Picasso.get()
                .load(imageUrl)
                .placeholder(R.drawable.default_placeholder)
                .error(R.drawable.default_placeholder)
                .into(imageViewOnline);
    }
}