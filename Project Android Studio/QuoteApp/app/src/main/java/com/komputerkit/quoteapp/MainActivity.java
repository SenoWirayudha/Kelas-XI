package com.komputerkit.quoteapp;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private TextView textViewQuote;
    private TextView textViewAuthor;
    private Button buttonShare;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        
        // Initialize views
        textViewQuote = findViewById(R.id.textViewQuote);
        textViewAuthor = findViewById(R.id.textViewAuthor);
        buttonShare = findViewById(R.id.buttonShare);
        
        // Set click listener for share button
        buttonShare.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                shareQuote();
            }
        });
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }
    
    private void shareQuote() {
        // Get the quote and author text
        String quote = textViewQuote.getText().toString();
        String author = textViewAuthor.getText().toString();
        
        // Combine quote and author
        String shareText = quote + "\n\n" + author;
        
        // Create implicit intent with ACTION_SEND
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, shareText);
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Quote from Quote App");
        
        // Start chooser to let user select app to share with
        Intent chooser = Intent.createChooser(shareIntent, "Share Quote");
        if (shareIntent.resolveActivity(getPackageManager()) != null) {
            startActivity(chooser);
        }
    }
}