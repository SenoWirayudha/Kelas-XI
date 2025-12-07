package com.komputerkit.newsapp.ui.newswebview;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.komputerkit.newsapp.R;

public class NewsWebViewFragment extends Fragment {

    private NewsWebViewViewModel newsWebViewViewModel;
    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private TextView errorText;
    private Button retryButton;
    
    private String currentUrl;
    private String newsSource;

    public static NewsWebViewFragment newInstance(String newsSource) {
        NewsWebViewFragment fragment = new NewsWebViewFragment();
        Bundle args = new Bundle();
        args.putString("news_source", newsSource);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            newsSource = getArguments().getString("news_source", "BBC");
        }
    }

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        newsWebViewViewModel = new ViewModelProvider(this).get(NewsWebViewViewModel.class);

        View root = inflater.inflate(R.layout.fragment_news_webview, container, false);
        
        initViews(root);
        setupWebView();
        setupObservers();
        setupClickListeners();
        
        // Load the news source
        if (newsSource != null) {
            newsWebViewViewModel.loadNewsSource(newsSource);
        }

        return root;
    }

    private void initViews(View root) {
        webView = root.findViewById(R.id.webView);
        progressBar = root.findViewById(R.id.progressBar);
        errorLayout = root.findViewById(R.id.errorLayout);
        errorText = root.findViewById(R.id.errorText);
        retryButton = root.findViewById(R.id.retryButton);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(true);
        webSettings.setDefaultTextEncodingName("utf-8");

        // Set WebViewClient to handle page navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                newsWebViewViewModel.setLoading(true);
                showError(false);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                newsWebViewViewModel.setLoading(false);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                newsWebViewViewModel.setLoading(false);
                newsWebViewViewModel.setError(true);
                showError(true);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Handle URL loading within the WebView
                view.loadUrl(url);
                return true;
            }
        });

        // Set WebChromeClient to handle progress updates
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
                
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedTitle(WebView view, String title) {
                super.onReceivedTitle(view, title);
                // You can update the action bar title here if needed
            }
        });
    }

    private void setupObservers() {
        newsWebViewViewModel.getUrl().observe(getViewLifecycleOwner(), url -> {
            if (url != null && !url.isEmpty()) {
                currentUrl = url;
                loadUrl(url);
            }
        });

        newsWebViewViewModel.getLoading().observe(getViewLifecycleOwner(), loading -> {
            if (loading != null) {
                progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
            }
        });

        newsWebViewViewModel.getError().observe(getViewLifecycleOwner(), error -> {
            if (error != null) {
                showError(error);
            }
        });
    }

    private void setupClickListeners() {
        retryButton.setOnClickListener(v -> {
            if (currentUrl != null) {
                loadUrl(currentUrl);
            }
        });
    }

    private void loadUrl(String url) {
        showError(false);
        webView.loadUrl(url);
    }

    private void showError(boolean show) {
        if (show) {
            webView.setVisibility(View.GONE);
            errorLayout.setVisibility(View.VISIBLE);
        } else {
            webView.setVisibility(View.VISIBLE);
            errorLayout.setVisibility(View.GONE);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (webView != null) {
            webView.destroy();
        }
    }

    // Handle back button press for WebView navigation
    public boolean onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return false;
    }
}