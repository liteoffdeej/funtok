/* --- Core Configurations & Supabase Client Setup --- */
const cfg = window.FUNTOK_CONFIG || {};
const isConfigured = cfg.SUPABASE_URL && cfg.SUPABASE_URL.startsWith("http") && cfg.SUPABASE_KEY && cfg.SUPABASE_KEY !== "your-anon-public-key";
const sb = isConfigured ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY) : null;

// Core DOM Elements
const feed = document.getElementById("feed");
const searchView = document.getElementById("search-view");
const inboxView = document.getElementById("inbox-view");
const profileView = document.getElementById("profile-view");
const chatsListScreen = document.getElementById("chats-list-screen");
const activeChatScreen = document.getElementById("active-chat-screen");

// State
let currentUser = JSON.parse(localStorage.getItem("funtok_user")) || { 
  username: "@guest_surfer", 
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" 
};
let localFollowCache = new Set(JSON.parse(localStorage.getItem("funtok_follows")) || []);
let followersCount = parseInt(localStorage.getItem("funtok_followers_count")) || 142;

// Initial Video Feed Data
let demo = [
  { 
    id: 101, 
    user_id: "u1", 
    username: "@iron_avenger", 
    caption: "Iron-Man assembly sequence is simply unparalleled! 🦾 #marvel #ironman", 
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80", 
    sound_title: "Iron Man Theme - Marvel Studios",
    likes_count: 5320, 
    comments_count: 2, 
    has_liked: false 
  },
  { 
    id: 102, 
    user_id: "u2", 
    username: "@heavy_haulers", 
    caption: "Massive custom Truck driving down the open highway! 🚛 #trucklife #wheels", 
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", 
    sound_title: "Highway Vibe Sounds - Original Audio",
    likes_count: 1204, 
    comments_count: 1, 
    has_liked: false 
  },
  { 
    id: 103, 
    user_id: "u3", 
    username: "@creative_moments", 
    caption: "New trends, new memories. Live your best life. ✨ #vibes", 
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", 
    sound_title: "Chillout Beats - FunTok Music",
    likes_count: 850, 
    comments_count: 0, 
    has_liked: false 
  }
];

// Fallback Local Comments Cache
let localCommentsRepo = {
  101: [
    { username: "@tony_stark", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", text: "Brilliant video compilation layout!" },
    { username: "@pepper_p", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", text: "Please share the background rendering settings." }
  ],
  102: [{ username: "@diesel_power", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", text: "Incredible engine architecture specs right there." }],
  103: []
};

// Messaging Data
let chatThreads = [
  { id: "u1", username: "@iron_avenger", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80", messages: [{ text: "Hey! Loved your recent video edit!", time: "10:30 AM", sentByMe: false }] },
  { id: "u2", username: "@heavy_haulers", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", messages: [{ text: "That truck setup is incredible, where was it filmed?", time: "Yesterday", sentByMe: true }] },
  { id: "u3", username: "@creative_moments", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", messages: [{ text: "Thanks for the support! Let's collaborate soon.", time: "Monday", sentByMe: false }] }
];
let activeChatUserId = null;

// Utility Functions
function show(id) { document.getElementById(id).style.display = "flex"; }
function hide(id) { document.getElementById(id).style.display = "none"; }
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }

/* --- Navigation & View Switching --- */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const page = btn.getAttribute("data-page");
    feed.style.display = "none";
    searchView.style.display = "none";
    inboxView.style.display = "none";
    profileView.style.display = "none";

    if (page === "home" || page === "trending") {
      feed.style.display = "flex";
      render(demo);
    } else if (page === "search") {
      searchView.style.display = "block";
      executeVideoSearch();
    } else if (page === "inbox") {
      inboxView.style.display = "block";
      renderChatsList();
    } else if (page === "profile") {
      profileView.style.display = "block";
      updateProfileStats();
    }
  });
});

/* --- Video Feed Rendering Engine --- */
function render(rows) {
  if (rows.length === 0) {
    feed.innerHTML = `<div class="fallback" style="font-size:16px; color:#aaa; text-align:center; padding-top:100px;">No videos found matching feed criteria...</div>`;
    return;
  }
  
  feed.innerHTML = rows.map((x) => {
    const isFollowing = localFollowCache.has(x.user_id);
    const badgeClass = isFollowing ? "follow-badge following" : "follow-badge";
    const badgeIcon = isFollowing ? "✓" : "＋";
    const displayAvatar = x.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

    return `
      <section class="card" data-video-id="${x.id}">
        ${x.video_url ? `<video src="${esc(x.video_url)}" autoplay muted loop playsinline onclick="togglePlay(this)"></video>` : `<div class="fallback">▶</div>`}
        <div class="shade"></div>
        
        <div class="info">
          <div class="user">${esc(x.username || "@user")}</div>
          <div class="caption">${esc(x.caption || "")}</div>
          <div class="music-track">🎵 <span>${esc(x.sound_title || "Original Sound")}</span></div>
        </div>
        
        <div class="actions">
          <div class="feed-avatar-container" onclick="openDirectChat('${esc(x.user_id)}')">
            <img class="feed-avatar-img" src="${esc(displayAvatar)}" alt="Creator Overlay">
            <button class="${badgeClass}" onclick="event.stopPropagation(); handleFollowToggle('${esc(x.user_id)}', this)">${badgeIcon}</button>
          </div>
          
          <button class="act ${x.has_liked ? 'liked' : ''}" onclick="like(${x.id}, this)">
            ${x.has_liked ? '♥' : '♡'}
          </button>
          <span class="num" id="like-count-${x.id}">${x.likes_count || 0}</span>
          
          <button class="act" onclick="openCommentsDrawer(${x.id})" title="View Conversations">
            <svg class="custom-icon-svg" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </button>
          <span class="num" id="card-comm-count-${x.id}">${x.comments_count || 0}</span>
          
          <button class="act" onclick="openReportWizard(${x.id})" title="Report Video Post Content">
            <svg class="custom-icon-svg" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
            </svg>
          </button>
          <span class="num">Report</span>
          
          <button class="act" onclick="shareVideo(${x.id})">↗</button>
          <span class="num">Share</span>

          <div class="disc-wrapper">
            <img class="disc-art" src="${esc(displayAvatar)}" alt="Sound Disc">
          </div>
        </div>
      </section>
    `;
  }).join("");
}

function togglePlay(videoElem) {
  if (videoElem.paused) {
    videoElem.play();
  } else {
    videoElem.pause();
  }
}

function handleFollowToggle(creatorId, btnElement) {
  if (localFollowCache.has(creatorId)) {
    localFollowCache.delete(creatorId);
    btnElement.className = "follow-badge";
    btnElement.textContent = "＋";
  } else {
    localFollowCache.add(creatorId);
    btnElement.className = "follow-badge following";
    btnElement.textContent = "✓";
  }
  localStorage.setItem("funtok_follows", JSON.stringify(Array.from(localFollowCache)));
  updateProfileStats();
}

function like(videoId, btnElement) {
  const item = demo.find(v => v.id === videoId);
  if (!item) return;

  item.has_liked = !item.has_liked;
  item.likes_count += item.has_liked ? 1 : -1;
  
  btnElement.classList.toggle("liked", item.has_liked);
  btnElement.innerHTML = item.has_liked ? '♥' : '♡';
  const countElem = document.getElementById(`like-count-${videoId}`);
  if (countElem) countElem.textContent = item.likes_count;
}

function shareVideo(videoId) {
  if (navigator.share) {
    navigator.share({ title: "FunTok Video", url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Video link copied to clipboard!");
  }
}

/* --- Report Submissions --- */
function openReportWizard(videoId) {
  document.getElementById("reported-video-id").value = videoId;
  document.getElementById("custom-report-text").value = ""; 
  document.getElementById("reportMsg").textContent = "";
  show("reportModal");
}

document.getElementById("submit-report-btn").onclick = async function() {
  const videoId = parseInt(document.getElementById("reported-video-id").value);
  const typedReportText = document.getElementById("custom-report-text").value.trim();
  const msgPanel = document.getElementById("reportMsg");

  if (!typedReportText) {
    msgPanel.style.color = "#ff4d4d";
    msgPanel.textContent = "Error: Please type out a specific concern before sending.";
    return;
  }

  if (sb) {
    const { error } = await sb.from("reports").insert([
      { 
        video_id: videoId, 
        report_reason: typedReportText,
        submitted_by: currentUser?.username || "@anonymous"
      }
    ]);
    if (error) {
      console.error("Supabase Save Error:", error);
      msgPanel.style.color = "#ff4d4d";
      msgPanel.textContent = "Database communication failure. Please try again.";
      return;
    }
  }

  msgPanel.style.color = "#00f2fe";
  msgPanel.textContent = "Success! Your text query statement has been logged.";
  setTimeout(() => { hide("reportModal"); }, 1600);
};

document.getElementById("close-report-btn").onclick = function() { hide("reportModal"); };

/* --- Comments System --- */
async function openCommentsDrawer(videoId) {
  document.getElementById("comments-video-id").value = videoId;
  document.getElementById("new-comment-input-field").value = "";
  
  show("commentsModal");
  await refreshCommentsStreamDisplay(videoId);
}

async function refreshCommentsStreamDisplay(videoId) {
  const container = document.getElementById("comments-stream-container");
  let commentsList = [];

  if (sb) {
    const { data, error } = await sb.from("comments").select("username, avatar_url, comment_text").eq("video_id", videoId);
    if (!error && data) {
      commentsList = data.map(c => ({ username: c.username, avatar: c.avatar_url, text: c.comment_text }));
    }
  } else {
    commentsList = localCommentsRepo[videoId] || [];
  }

  if (commentsList.length === 0) {
    container.innerHTML = `<div style="color: #888; text-align: center; padding: 20px;">No comments yet. Be the first!</div>`;
    return;
  }

  container.innerHTML = commentsList.map(c => `
    <div class="comment-item">
      <img src="${esc(c.avatar || currentUser.avatar)}" class="comment-avatar" alt="User">
      <div class="comment-content">
        <div class="comment-user">${esc(c.username)}</div>
        <div class="comment-text">${esc(c.text)}</div>
      </div>
    </div>
  `).join("");
}

async function submitNewComment() {
  const videoId = parseInt(document.getElementById("comments-video-id").value);
  const inputField = document.getElementById("new-comment-input-field");
  const text = inputField.value.trim();

  if (!text) return;

  const newComment = { username: currentUser.username, avatar: currentUser.avatar, text: text };

  if (sb) {
    await sb.from("comments").insert([{ video_id: videoId, username: currentUser.username, avatar_url: currentUser.avatar, comment_text: text }]);
  } else {
    if (!localCommentsRepo[videoId]) localCommentsRepo[videoId] = [];
    localCommentsRepo[videoId].push(newComment);
  }

  const targetItem = demo.find(v => v.id === videoId);
  if (targetItem) {
    targetItem.comments_count = (targetItem.comments_count || 0) + 1;
    const countElem = document.getElementById(`card-comm-count-${videoId}`);
    if (countElem) countElem.textContent = targetItem.comments_count;
  }

  inputField.value = "";
  await refreshCommentsStreamDisplay(videoId);
}

/* --- Messaging Engine --- */
function renderChatsList() {
  chatsListScreen.style.display = "flex";
  activeChatScreen.style.display = "none";

  chatsListScreen.innerHTML = chatThreads.map(chat => {
    const lastMsg = chat.messages[chat.messages.length - 1] || { text: "No messages yet", time: "" };
    return `
      <div class="chat-row" onclick="openActiveChat('${chat.id}')">
        <img src="${esc(chat.avatar)}" class="chat-row-avatar" alt="Avatar">
        <div class="chat-row-details">
          <div class="chat-row-meta">
            <span class="chat-row-username">${esc(chat.username)}</span>
            <span class="chat-row-time">${esc(lastMsg.time)}</span>
          </div>
          <div class="chat-row-snippet">${esc(lastMsg.text)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function openDirectChat(userId) {
  let thread = chatThreads.find(c => c.id === userId);
  if (!thread) {
    const videoUser = demo.find(v => v.user_id === userId);
    thread = {
      id: userId,
      username: videoUser ? videoUser.username : "@user",
      avatar: videoUser ? videoUser.avatar : currentUser.avatar,
      messages: []
    };
    chatThreads.push(thread);
  }
  
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-page="inbox"]').classList.add("active");
  feed.style.display = "none";
  searchView.style.display = "none";
  profileView.style.display = "none";
  inboxView.style.display = "block";

  openActiveChat(userId);
}

function openActiveChat(userId) {
  activeChatUserId = userId;
  const thread = chatThreads.find(c => c.id === userId);
  if (!thread) return;

  chatsListScreen.style.display = "none";
  activeChatScreen.style.display = "flex";
  document.getElementById("chat-header-username").textContent = thread.username;

  renderMessagesStream();
}

function renderMessagesStream() {
  const thread = chatThreads.find(c => c.id === activeChatUserId);
  if (!thread) return;

  const stream = document.getElementById("chat-conversation-stream");
  stream.innerHTML = thread.messages.map(m => `
    <div class="bubble ${m.sentByMe ? 'sent' : 'received'}">
      ${esc(m.text)}
      <span class="bubble-time">${esc(m.time)}</span>
    </div>
  `).join("");

  stream.scrollTop = stream.scrollHeight;
}

function sendLiveChatMessage() {
  const input = document.getElementById("chat-reply-input");
  const text = input.value.trim();
  if (!text || !activeChatUserId) return;

  const thread = chatThreads.find(c => c.id === activeChatUserId);
  if (!thread) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  thread.messages.push({ text: text, time: timeStr, sentByMe: true });
  input.value = "";
  renderMessagesStream();
}

function backToChatsList() {
  activeChatUserId = null;
  renderChatsList();
}

/* --- Search Engine --- */
function executeVideoSearch() {
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  const grid = document.getElementById("search-results-grid");

  const filtered = demo.filter(v => 
    v.caption.toLowerCase().includes(query) || 
    v.username.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">No video results found matching "${esc(query)}"</div>`;
    return;
  }

  grid.innerHTML = filtered.map(v => `
    <div class="search-grid-item" onclick="playSearchResult(${v.id})">
      <video src="${esc(v.video_url)}" muted></video>
    </div>
  `).join("");
}

function playSearchResult(videoId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-page="home"]').classList.add("active");
  searchView.style.display = "none";
  feed.style.display = "flex";
  
  const target = demo.filter(v => v.id === videoId);
  render(target.length ? target : demo);
}

/* --- Profile Management --- */
function saveUserProfileSettings() {
  const newUsername = document.getElementById("update-username-field").value.trim();
  const newAvatar = document.getElementById("update-avatar-field").value.trim();

  if (newUsername) currentUser.username = newUsername.startsWith("@") ? newUsername : `@${newUsername}`;
  if (newAvatar) currentUser.avatar = newAvatar;

  localStorage.setItem("funtok_user", JSON.stringify(currentUser));
  updateProfileStats();
  hide("profileModal");
}

function updateProfileStats() {
  document.getElementById("profile-username-display").textContent = currentUser.username;
  document.getElementById("profile-avatar-display").src = currentUser.avatar;
  document.getElementById("profile-following-count").textContent = localFollowCache.size;
  document.getElementById("profile-followers-count").textContent = followersCount;
}

/* --- Video Upload Engine (File Selection & URL Upload) --- */
async function submitNewUploadedVideo() {
  const caption = document.getElementById("upload-caption").value.trim();
  const fileInput = document.getElementById("upload-video-file");
  const videoUrlInput = document.getElementById("upload-video-url").value.trim();
  const file = fileInput.files[0];

  if (!caption) {
    alert("Please write a caption for your video.");
    return;
  }

  if (!file && !videoUrlInput) {
    alert("Please select a video file from your device or paste a valid video URL.");
    return;
  }

  let finalVideoUrl = "";

  if (file) {
    if (sb) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await sb.storage.from("videos").upload(fileName, file);

      if (error) {
        console.error("Supabase storage upload error:", error);
        finalVideoUrl = URL.createObjectURL(file);
      } else {
        const { data: publicUrlData } = sb.storage.from("videos").getPublicUrl(fileName);
        finalVideoUrl = publicUrlData.publicUrl;
      }
    } else {
      finalVideoUrl = URL.createObjectURL(file);
    }
  } else {
    finalVideoUrl = videoUrlInput;
  }

  const newPost = {
    id: Date.now(),
    user_id: "me",
    username: currentUser.username,
    caption: caption,
    video_url: finalVideoUrl,
    avatar: currentUser.avatar,
    sound_title: "Original Sound - " + currentUser.username,
    likes_count: 0,
    comments_count: 0,
    has_liked: false
  };

  demo.unshift(newPost);

  document.getElementById("upload-caption").value = "";
  fileInput.value = "";
  document.getElementById("upload-video-url").value = "";
  hide("uploadModal");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-page="home"]').classList.add("active");
  searchView.style.display = "none";
  inboxView.style.display = "none";
  profileView.style.display = "none";
  feed.style.display = "flex";
  render(demo);
}

// Initial Run
render(demo);
