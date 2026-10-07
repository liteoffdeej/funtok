// app.js - Full implementation

// Sample local video feed data fallback
const defaultPosts = [
  {
    id: 1,
    username: "fun_creator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    caption: "Welcome to FunTok! Check out this feed feature 🎉 #funtok #viral",
    music: "Original Sound - fun_creator",
    likes: 120,
    comments: [],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isLiked: false,
    isFollowed: false
  }
];

let posts = [...defaultPosts];

// Render feed cards into the DOM
function renderFeed() {
  const feedContainer = document.getElementById("feed") || document.querySelector(".feed-container") || document.body;
  
  // If a dedicated feed container exists, clear it
  const target = document.getElementById("feed") || feedContainer;
  target.innerHTML = "";

  posts.forEach((post, index) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <video src="${post.videoUrl}" loop playsinline onclick="togglePlay(this)"></video>
      <div class="side-bar">
        <div class="avatar-container" onclick="toggleFollow(${index})">
          <img src="${post.avatar}" class="avatar" alt="${post.username}">
          <span class="follow-badge">${post.isFollowed ? '✓' : '+'}</span>
        </div>
        <button onclick="toggleLike(${index})">
          <span class="icon">${post.isLiked ? '❤️' : '🤍'}</span>
          <span class="count">${post.likes}</span>
        </button>
        <button onclick="openComments(${index})">
          <span class="icon">💬</span>
          <span class="count">${post.comments.length}</span>
        </button>
        <button onclick="reportPost(${index})">
          <span class="icon">🚨</span>
        </button>
        <div class="disc-container">
          <div class="disc spinning">🎵</div>
        </div>
      </div>
      <div class="video-info">
        <h3>@${post.username}</h3>
        <p>${post.caption}</p>
        <p class="music-track">🎵 ${post.music}</p>
      </div>
    `;
    target.appendChild(card);
  });
}

// Toggle Play/Pause on Video Click
function togglePlay(video) {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

// Action Handlers
function toggleLike(index) {
  posts[index].isLiked = !posts[index].isLiked;
  posts[index].likes += posts[index].isLiked ? 1 : -1;
  renderFeed();
}

function toggleFollow(index) {
  posts[index].isFollowed = !posts[index].isFollowed;
  renderFeed();
}

function openComments(index) {
  const commentText = prompt("Leave a comment:");
  if (commentText) {
    posts[index].comments.push(commentText);
    alert("Comment added!");
    renderFeed();
  }
}

function reportPost(index) {
  alert(`Report submitted for post by @${posts[index].username}.`);
}

// File Upload Handler
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const newPost = {
    id: Date.now(),
    username: "you",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
    caption: "My new uploaded video!",
    music: "Original Sound - you",
    likes: 0,
    comments: [],
    videoUrl: URL.createObjectURL(file),
    isLiked: false,
    isFollowed: false
  };

  posts.unshift(newPost);
  renderFeed();
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  renderFeed();
  
  const uploadInput = document.getElementById("video-upload-input");
  if (uploadInput) {
    uploadInput.addEventListener("change", handleFileUpload);
  }
});
