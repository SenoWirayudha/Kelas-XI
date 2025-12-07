const { db } = require('./firebase-config');

// Sample data
const sampleUsers = [
  {
    id: "john_doe",
    username: "john_doe",
    email: "john.doe@example.com",
    fullName: "John Doe",
    profileImageUrl: "https://i.pravatar.cc/150?u=john_doe",
    bio: "Software Developer | Photography enthusiast 📸 | Coffee lover ☕",
    followers: ["sarah_wilson", "mike_chen", "emma_garcia"],
    following: ["sarah_wilson", "mike_chen", "david_kim"],
    isVerified: true,
    createdAt: Date.now() - (86400000 * 30) // 30 days ago
  },
  {
    id: "sarah_wilson",
    username: "sarah_wilson",
    email: "sarah.wilson@example.com",
    fullName: "Sarah Wilson",
    profileImageUrl: "https://i.pravatar.cc/150?u=sarah_wilson",
    bio: "UI/UX Designer | Digital artist 🎨 | Creating beautiful experiences",
    followers: ["john_doe", "mike_chen", "david_kim"],
    following: ["john_doe", "emma_garcia"],
    isVerified: true,
    createdAt: Date.now() - (86400000 * 25) // 25 days ago
  },
  {
    id: "mike_chen",
    username: "mike_chen",
    email: "mike.chen@example.com",
    fullName: "Mike Chen",
    profileImageUrl: "https://i.pravatar.cc/150?u=mike_chen",
    bio: "Adventure seeker 🏔️ | Travel blogger | Living life one hike at a time",
    followers: ["john_doe", "sarah_wilson", "emma_garcia", "david_kim"],
    following: ["john_doe", "sarah_wilson"],
    isVerified: false,
    createdAt: Date.now() - (86400000 * 20) // 20 days ago
  },
  {
    id: "emma_garcia",
    username: "emma_garcia",
    email: "emma.garcia@example.com",
    fullName: "Emma Garcia",
    profileImageUrl: "https://i.pravatar.cc/150?u=emma_garcia",
    bio: "Chef & Food blogger 👩‍🍳 | Sharing recipes & culinary adventures",
    followers: ["mike_chen", "david_kim"],
    following: ["john_doe", "sarah_wilson", "mike_chen"],
    isVerified: true,
    createdAt: Date.now() - (86400000 * 15) // 15 days ago
  },
  {
    id: "david_kim",
    username: "david_kim",
    email: "david.kim@example.com",
    fullName: "David Kim",
    profileImageUrl: "https://i.pravatar.cc/150?u=david_kim",
    bio: "Book lover 📚 | Writer | Sharing stories and literary thoughts",
    followers: ["sarah_wilson", "emma_garcia"],
    following: ["john_doe", "mike_chen", "emma_garcia"],
    isVerified: false,
    createdAt: Date.now() - (86400000 * 10) // 10 days ago
  }
];

const samplePosts = [
  {
    id: "post1",
    userId: "john_doe",
    userName: "John Doe",
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    postImageUrl: "https://picsum.photos/600/400?random=1",
    description: "Beautiful sunset at the beach! 🌅 #sunset #beach #photography",
    likes: 42,
    commentsCount: 2,
    timestamp: Date.now() - 3600000, // 1 hour ago
    likedBy: ["sarah_wilson", "mike_chen", "emma_garcia"],
    hashtags: ["#sunset", "#beach", "#photography"]
  },
  {
    id: "post2",
    userId: "sarah_wilson",
    userName: "Sarah Wilson",
    userProfileImage: "https://i.pravatar.cc/150?u=sarah_wilson",
    postImageUrl: "https://picsum.photos/600/400?random=2",
    description: "Amazing coffee art this morning ☕️ Starting the day right! #coffee #art #morning",
    likes: 27,
    commentsCount: 1,
    timestamp: Date.now() - 7200000, // 2 hours ago
    likedBy: ["john_doe", "mike_chen"],
    hashtags: ["#coffee", "#art", "#morning"]
  },
  {
    id: "post3",
    userId: "mike_chen",
    userName: "Mike Chen",
    userProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    postImageUrl: "https://picsum.photos/600/400?random=3",
    description: "Weekend hiking adventure 🥾 Nature is the best therapy #hiking #nature #weekend",
    likes: 63,
    commentsCount: 2,
    timestamp: Date.now() - 10800000, // 3 hours ago
    likedBy: ["john_doe", "sarah_wilson", "emma_garcia", "david_kim"],
    hashtags: ["#hiking", "#nature", "#weekend"]
  },
  {
    id: "post4",
    userId: "emma_garcia",
    userName: "Emma Garcia",
    userProfileImage: "https://i.pravatar.cc/150?u=emma_garcia",
    postImageUrl: "https://picsum.photos/600/400?random=4",
    description: "Homemade pasta for dinner tonight 🍝 Cooking is my passion! #cooking #pasta #homemade",
    likes: 35,
    commentsCount: 2,
    timestamp: Date.now() - 14400000, // 4 hours ago
    likedBy: ["john_doe", "sarah_wilson", "david_kim"],
    hashtags: ["#cooking", "#pasta", "#homemade"]
  },
  {
    id: "post5",
    userId: "david_kim",
    userName: "David Kim",
    userProfileImage: "https://i.pravatar.cc/150?u=david_kim",
    postImageUrl: "https://picsum.photos/600/400?random=5",
    description: "New book recommendation 📚 This one kept me up all night! #reading #books #literature",
    likes: 28,
    commentsCount: 1,
    timestamp: Date.now() - 18000000, // 5 hours ago
    likedBy: ["sarah_wilson", "emma_garcia"],
    hashtags: ["#reading", "#books", "#literature"]
  },
  {
    id: "post6",
    userId: "john_doe",
    userName: "John Doe",
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    postImageUrl: "https://picsum.photos/600/400?random=6",
    description: "Late night coding session 💻 Building something amazing! #coding #tech #developer",
    likes: 54,
    commentsCount: 3,
    timestamp: Date.now() - 21600000, // 6 hours ago
    likedBy: ["sarah_wilson", "mike_chen", "emma_garcia", "david_kim"],
    hashtags: ["#coding", "#tech", "#developer"]
  }
];

const sampleStories = [
  // John Doe - 3 stories  
  {
    id: "story1",
    userId: "john_doe",
    userName: "John Doe",
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    imageUrl: "https://picsum.photos/400/600?random=11",
    storyImageUrl: "https://picsum.photos/400/600?random=11", // backward compatibility
    text: "Good morning everyone! ☀️",
    timestamp: Date.now() - 1800000, // 30 minutes ago
    isViewed: false
  },
  {
    id: "story1b",
    userId: "john_doe",
    userName: "John Doe", 
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    imageUrl: "https://picsum.photos/400/600?random=16",
    storyImageUrl: "https://picsum.photos/400/600?random=16",
    text: "Working on something cool! 💻",
    timestamp: Date.now() - 1500000, // 25 minutes ago
    isViewed: false
  },
  {
    id: "story1c",
    userId: "john_doe",
    userName: "John Doe",
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe", 
    imageUrl: "https://picsum.photos/400/600?random=17",
    storyImageUrl: "https://picsum.photos/400/600?random=17",
    text: "Almost done! 🚀",
    timestamp: Date.now() - 1200000, // 20 minutes ago
    isViewed: false
  },
  // Sarah Wilson - 1 story (single story test)
  {
    id: "story2",
    userId: "sarah_wilson",
    userName: "Sarah Wilson",
    userProfileImage: "https://i.pravatar.cc/150?u=sarah_wilson",
    imageUrl: "https://picsum.photos/400/600?random=12",
    storyImageUrl: "https://picsum.photos/400/600?random=12",
    text: "Coffee time! ☕",
    timestamp: Date.now() - 3600000, // 1 hour ago
    isViewed: true
  },
  // Mike Chen - 2 stories
  {
    id: "story3",
    userId: "mike_chen",
    userName: "Mike Chen",
    userProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    imageUrl: "https://picsum.photos/400/600?random=13",
    storyImageUrl: "https://picsum.photos/400/600?random=13",
    text: "At the gym! 💪",
    timestamp: Date.now() - 5400000, // 1.5 hours ago
    isViewed: false
  },
  {
    id: "story3b",
    userId: "mike_chen",
    userName: "Mike Chen",
    userProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    imageUrl: "https://picsum.photos/400/600?random=18",
    storyImageUrl: "https://picsum.photos/400/600?random=18", 
    text: "Post-workout meal! 🍎",
    timestamp: Date.now() - 5100000, // 1.4 hours ago
    isViewed: false
  },
  // Emma Garcia - 1 story
  {
    id: "story4",
    userId: "emma_garcia",
    userName: "Emma Garcia",
    userProfileImage: "https://i.pravatar.cc/150?u=emma_garcia",
    imageUrl: "https://picsum.photos/400/600?random=14",
    storyImageUrl: "https://picsum.photos/400/600?random=14",
    text: "Beautiful sunset today! 🌅",
    timestamp: Date.now() - 7200000, // 2 hours ago
    isViewed: true
  },
  // David Kim - 1 story
  {
    id: "story5",
    userId: "david_kim",
    userName: "David Kim",
    userProfileImage: "https://i.pravatar.cc/150?u=david_kim",
    imageUrl: "https://picsum.photos/400/600?random=15",
    storyImageUrl: "https://picsum.photos/400/600?random=15",
    text: "Workout complete! 💪",
    timestamp: Date.now() - 9000000, // 2.5 hours ago
    isViewed: false
  }
];

const sampleNotifications = [
  {
    id: "notif1",
    userId: "john_doe",
    type: "like",
    message: "Sarah Wilson liked your post",
    timestamp: Date.now() - 1800000, // 30 minutes ago
    isRead: false,
    fromUserId: "sarah_wilson",
    fromUserName: "Sarah Wilson",
    fromUserProfileImage: "https://i.pravatar.cc/150?u=sarah_wilson",
    postId: "post1",
    postImageUrl: "https://picsum.photos/600/400?random=1"
  },
  {
    id: "notif2",
    userId: "sarah_wilson",
    type: "comment",
    message: "Mike Chen commented on your post",
    timestamp: Date.now() - 3600000, // 1 hour ago
    isRead: true,
    fromUserId: "mike_chen",
    fromUserName: "Mike Chen",
    fromUserProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    postId: "post2",
    postImageUrl: "https://picsum.photos/600/400?random=2"
  },
  {
    id: "notif3",
    userId: "mike_chen",
    type: "follow",
    message: "Emma Garcia started following you",
    timestamp: Date.now() - 5400000, // 1.5 hours ago
    isRead: false,
    fromUserId: "emma_garcia",
    fromUserName: "Emma Garcia",
    fromUserProfileImage: "https://i.pravatar.cc/150?u=emma_garcia",
    postId: null,
    postImageUrl: null
  },
  {
    id: "notif4",
    userId: "emma_garcia",
    type: "mention",
    message: "David Kim mentioned you in a comment",
    timestamp: Date.now() - 7200000, // 2 hours ago
    isRead: true,
    fromUserId: "david_kim",
    fromUserName: "David Kim",
    fromUserProfileImage: "https://i.pravatar.cc/150?u=david_kim",
    postId: "post4",
    postImageUrl: "https://picsum.photos/600/400?random=4"
  },
  {
    id: "notif5",
    userId: "david_kim",
    type: "like",
    message: "John Doe liked your post",
    timestamp: Date.now() - 9000000, // 2.5 hours ago
    isRead: false,
    fromUserId: "john_doe",
    fromUserName: "John Doe",
    fromUserProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    postId: "post5",
    postImageUrl: "https://picsum.photos/600/400?random=5"
  }
];

const sampleComments = [
  {
    id: "comment1",
    postId: "post1",
    userId: "sarah_wilson",
    userName: "sarah_wilson",
    userProfileImage: "https://i.pravatar.cc/150?u=sarah_wilson",
    text: "Wow! What a beautiful sunset 😍",
    timestamp: Date.now() - 3000000, // 50 minutes ago
    likedBy: ["john_doe", "mike_chen"]
  },
  {
    id: "comment2",
    postId: "post1",
    userId: "mike_chen",
    userName: "mike_chen",
    userProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    text: "Amazing shot! Where was this taken?",
    timestamp: Date.now() - 2700000, // 45 minutes ago
    likedBy: ["john_doe"]
  },
  {
    id: "comment3",
    postId: "post2",
    userId: "john_doe",
    userName: "john_doe",
    userProfileImage: "https://i.pravatar.cc/150?u=john_doe",
    text: "That latte art is incredible! ☕️",
    timestamp: Date.now() - 6600000, // 1 hour 50 minutes ago
    likedBy: ["sarah_wilson", "emma_garcia"]
  },
  {
    id: "comment4",
    postId: "post3",
    userId: "emma_garcia",
    userName: "emma_garcia",
    userProfileImage: "https://i.pravatar.cc/150?u=emma_garcia",
    text: "Love hiking! Which trail is this? 🥾",
    timestamp: Date.now() - 9000000, // 2 hours 30 minutes ago
    likedBy: ["mike_chen", "david_kim"]
  },
  {
    id: "comment5",
    postId: "post3",
    userId: "david_kim",
    userName: "david_kim",
    userProfileImage: "https://i.pravatar.cc/150?u=david_kim",
    text: "Nature therapy is the best therapy! 🌲",
    timestamp: Date.now() - 8400000, // 2 hours 20 minutes ago
    likedBy: ["mike_chen"]
  },
  {
    id: "comment6",
    postId: "post4",
    userId: "sarah_wilson",
    userName: "sarah_wilson",
    userProfileImage: "https://i.pravatar.cc/150?u=sarah_wilson",
    text: "That looks delicious! Recipe please? 🍝",
    timestamp: Date.now() - 13200000, // 3 hours 40 minutes ago
    likedBy: ["emma_garcia", "john_doe"]
  },
  {
    id: "comment7",
    postId: "post5",
    userId: "emma_garcia",
    userName: "emma_garcia",
    userProfileImage: "https://i.pravatar.cc/150?u=emma_garcia",
    text: "Adding this to my reading list! 📚",
    timestamp: Date.now() - 16200000, // 4 hours 30 minutes ago
    likedBy: ["david_kim"]
  },
  {
    id: "comment8",
    postId: "post6",
    userId: "mike_chen",
    userName: "mike_chen",
    userProfileImage: "https://i.pravatar.cc/150?u=mike_chen",
    text: "What are you building? Looks exciting! 💻",
    timestamp: Date.now() - 20400000, // 5 hours 40 minutes ago
    likedBy: ["john_doe", "sarah_wilson"]
  }
];

module.exports = {
  sampleUsers,
  samplePosts,
  sampleStories,
  sampleNotifications,
  sampleComments
};
