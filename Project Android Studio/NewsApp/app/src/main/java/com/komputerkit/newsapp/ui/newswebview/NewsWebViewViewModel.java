package com.komputerkit.newsapp.ui.newswebview;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

public class NewsWebViewViewModel extends ViewModel {

    private final MutableLiveData<String> mUrl;
    private final MutableLiveData<String> mTitle;
    private final MutableLiveData<Boolean> mLoading;
    private final MutableLiveData<Boolean> mError;

    public NewsWebViewViewModel() {
        mUrl = new MutableLiveData<>();
        mTitle = new MutableLiveData<>();
        mLoading = new MutableLiveData<>();
        mError = new MutableLiveData<>();
        
        // Default values
        mLoading.setValue(false);
        mError.setValue(false);
    }

    public LiveData<String> getUrl() {
        return mUrl;
    }

    public LiveData<String> getTitle() {
        return mTitle;
    }

    public LiveData<Boolean> getLoading() {
        return mLoading;
    }

    public LiveData<Boolean> getError() {
        return mError;
    }

    public void setUrl(String url) {
        mUrl.setValue(url);
    }

    public void setTitle(String title) {
        mTitle.setValue(title);
    }

    public void setLoading(boolean loading) {
        mLoading.setValue(loading);
    }

    public void setError(boolean error) {
        mError.setValue(error);
    }

    public void loadNewsSource(String newsSource) {
        String url;
        String title;
        
        switch (newsSource) {
            case "BBC":
                url = "https://www.bbc.com/news";
                title = "BBC News";
                break;
            case "Al Jazeera":
                url = "https://www.aljazeera.com";
                title = "Al Jazeera";
                break;
            case "CNN":
                url = "https://edition.cnn.com";
                title = "CNN";
                break;
            case "Fox News":
                url = "https://www.foxnews.com";
                title = "Fox News";
                break;
            case "Sky News":
                url = "https://news.sky.com";
                title = "Sky News";
                break;
            case "New York Times":
                url = "https://www.nytimes.com";
                title = "New York Times";
                break;
            default:
                url = "https://www.bbc.com/news";
                title = "News";
                break;
        }
        
        setUrl(url);
        setTitle(title);
        setError(false);
    }
}