/* --- Core Configurations and Storage Links Integration Setup --- */
const cfg = window.FUNTOK_CONFIG || {};
const ready = cfg.SUPABASE_URL?.startsWith("http") && cfg.SUPABASE_KEY && cfg.SUPABASE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const sb = ready ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY) : null;

// Core Document References 
const feed = document.getElementById("feed");
const searchView = document.getElementById("search-view");
const inboxView = document.getElementById("inbox-view");
const chatsListScreen = document.getElementById("chats-list-screen");
const activeChatScreen = document.getElementById("active-chat-screen");

// Architecture Context State Machine Control Maps 
let currentUser = JSON.parse(localStorage.getItem("funtok_user")) || { username: "@guest_surfer", avatar: "" };
let localFollowCache = new Set(JSON.parse(localStorage.getItem("funtok_follows")) || []);
let followedCount = localFollowCache.size;
let followersCount = parseInt(localStorage.getItem("funtok_followers_count")) || 142;

// Local Mock Database Configuration Arrays 
let demo = [
 { id: 101, user_id: "u1", username: "@iron_avenger", caption: "Iron-Man assembly sequence is simply unparalleled! 🦾 #marvel #ironman", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 5320, comments_count: 42, has_liked: false },
 { id: 102, user_id: "u2", username: "@heavy_haulers", caption: "Massive custom Truck driving down the open highway! 🚛 #trucklife #wheels", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 1204, comments_count: 19, has_liked: false },
 { id: 103, user_id: "u3", username: "@creative_moments", caption: "New trends, new memories. Live your best life. ✨ #vibes", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 850, comments_count: 8, has_liked: false }
];

// Local Mock Storage for fallback comments structure map
let localCommentsRepo = {
  101: [
    { username: "@tony_stark", avatar: "https://unsplash.com", text: "Brilliant video compilation layout!" },
    { username: "@pepper_p", avatar: "https://unsplash.com", text: "Please share the background rendering settings." }
  ],
  102: [{ username: "@diesel_power", avatar: "https://unsplash.com", text: "Incredible engine architecture specs right there." }],
  103: []
};

let chatThreads = [
  { id: "u1", username: "@iron_avenger", avatar: "https://unsplash.com", messages: [{ text: "Hey! Loved your recent video edit!", time: "10:30 AM", sentByMe: false }] },
  { id: "u2", username: "@heavy_haulers", avatar: "https://unsplash.com", messages: [{ text: "That truck setup is incredible, where was it filmed?", time: "Yesterday", sentByMe: true }] },
  { id: "u3", username: "@creative_moments", avatar: "https://unsplash.com", messages: [{ text: "Thanks for the support! Let's collaborate soon.", time: "Monday", sentByMe: false }] }
];
let activeChatUserId = null;

// Global Helper Logic Control Routines 
function show(id) { document.getElementById(id).style.display = "flex"; }
function hide(id) { document.getElementById(id).style.display = "none"; }
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" }[m])); }

/* --- Global Media Feed Renderer Layout Engine --- */
function render(rows) {
  if (rows.length === 0) {
    feed.innerHTML = `<div class="fallback" style="font-size:16px; color:#aaa; text-align:center; padding-top:100px;">No videos found matching feed criteria...</div>`;
    return;
  }
  
  feed.innerHTML = rows.map((x) => {
    const isFollowing = localFollowCache.has(x.user_id);
    const badgeClass = isFollowing ? "follow-badge following" : "follow-badge";
    const badgeIcon = isFollowing ? "✓" : "＋";
    const displayAvatar = x.avatar || "https://unsplash.com";

    return `
      <section class="card" data-video-id="${x.id}">
        ${x.video_url ? `<video src="${esc(x.video_url)}" autoplay muted loop playsinline></video>` : `<div class="fallback">▶</div>`}
        <div class="shade"></div>
        
        <!-- Creator Info Content Box Block Elements Left Alignment -->
        <div class="info">
          <div class="user">${esc(x.username || "@user")}</div>
          <div class="caption">${esc(x.caption || "")}</div>
        </div>
        
        <!-- Actions Side Column -->
        <div class="actions">
          
          <!-- Avatar Stack Frame -->
          <div class="feed-avatar-container">
            <img class="feed-avatar-img" src="${esc(displayAvatar)}" alt="Creator Overlay">
            <button class="${badgeClass}" onclick="handleFollowToggle('${esc(x.user_id)}', this)">${badgeIcon}</button>
          </div>
          
          <!-- Like Control -->
          <button class="act" onclick="like(this)">${x.has_liked ? '♥' : '♡'}</button>
          <span class="num">${x.likes_count || 0}</span>
          
          <!-- Interactive Comments Overlay Button Trigger -->
          <button class="act" onclick="openCommentsDrawer(${x.id})" title="View Conversations">
            <svg class="custom-icon-svg" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </button>
          <span class="num" id="card-comm-count-${x.id}">${x.comments_count || 0}</span>
          
          <!-- Custom Vector Shield Graphic Icon Layout for dynamic reports custom typed string inputs -->
          <button class="act" onclick="openReportWizard(${x.id})" title="Report Video Post Content">
            <svg class="custom-icon-svg" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
            </svg>
          </button>
          <span class="num">Report</span>
          
          <button class="act" onclick="share()">↗</button>
          <span class="num">Share</span>
        </div>
      </section>
    `;
  }).join("");
}

/* --- Interactive Follow Multi-Toggle Logic Control Engine Routine --- */
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

/* --- Upgraded Interactive Custom Text Query Reporting (Supabase Connected Table Pipeline) --- */
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
    // Pipeline deployment direct into production reports schema table
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
  } else {
    console.log(`Fallback Sandbox Mode: Video ${videoId} reported with message context: "${typedReportText}"`);
  }

  msgPanel.style.color = "#00f2fe";
  msgPanel.textContent = "Success! Your text query statement has been logged.";
  setTimeout(() => { hide("reportModal"); }, 1600);
};

document.getElementById("close-report-btn").onclick = function() { hide("reportModal"); };

/* --- Upgraded Comments Drawer Mechanics System Module (With Supabase Failover) --- */
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
    const { data, error } = await sb.from("comments").select("username, avatar_url, comment_text").eq("video_id", videoId).order("created_at", { ascending: true });
    if (!error && data) {
      commentsList = data.map(c => ({ username: c.username, avatar: c.avatar_url, text: c.comment_text }));
    }
  } else {
    commentsList = localCommentsRepo[videoId] || [];
  }

  if (commentsList.length === 0) {
