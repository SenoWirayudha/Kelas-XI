package com.komputerkit.socialmediaapp.model

data class UserStories(
    val userId: String,
    val userName: String,
    val userProfileImage: String,
    val stories: List<Story>,
    val hasUnviewedStories: Boolean = false
) {
    // Get the most recent story image for the ring display
    val latestStoryImage: String
        get() {
            val latestStory = stories.maxByOrNull { it.timestamp }
            return when {
                latestStory == null -> ""
                // Prioritas 1: Jika imageUrl berisi URL link
                latestStory.imageUrl.isNotEmpty() && (latestStory.imageUrl.startsWith("http://") || latestStory.imageUrl.startsWith("https://")) -> {
                    latestStory.imageUrl
                }
                // Prioritas 2: Jika mainImageUrl ada (biasanya base64 data URI)
                latestStory.mainImageUrl.isNotEmpty() -> {
                    latestStory.mainImageUrl
                }
                // Prioritas 3: Jika storyImageUrl ada (fallback)
                latestStory.storyImageUrl.isNotEmpty() -> {
                    latestStory.storyImageUrl
                }
                // Fallback: kosong
                else -> ""
            }
        }
    
    // Get the first unviewed story or the first story
    val firstStory: Story?
        get() = stories.firstOrNull { !it.viewed } ?: stories.firstOrNull()
}
