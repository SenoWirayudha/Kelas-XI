package com.komputerkit.recycleviewcardview;

import android.os.Bundle;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    RecyclerView recyclerView;
    SiswaAdapter adapter;
    List<Siswa> siswaList;

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
        load();
        isiData();
    }

    public void load(){
        recyclerView = findViewById(R.id.rcvSiswa);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
    }

    public void isiData(){
        siswaList = new ArrayList<Siswa>();
        siswaList.add(new Siswa("Hideko", "Jepang"));
        siswaList.add(new Siswa("Nora", "Korea"));
        siswaList.add(new Siswa("Siti", "Surabaya"));
        siswaList.add(new Siswa("Sore", "Jakarta"));
        siswaList.add(new Siswa("Jonathan", "Kroasia"));
        siswaList.add(new Siswa("Nicki Minaj", "Yogyakarta"));
        siswaList.add(new Siswa("Jessie J", "Demak"));

        adapter = new SiswaAdapter(this, siswaList);
        recyclerView.setAdapter(adapter);
    }

    public void btnTambah(View view) {
        // Menambahkan data baru ke dalam list
        siswaList.add(new Siswa("Moko", "Jakarta"));

        // Memberitahu adapter bahwa ada perubahan data
        adapter.notifyDataSetChanged();

        // Optional: scroll ke item yang baru ditambahkan
        recyclerView.scrollToPosition(siswaList.size() - 1);
    }
}