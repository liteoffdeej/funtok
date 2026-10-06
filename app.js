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
let currentUser = JSON.parse(localStorage.getItem("funtok_user")) || null;
let localFollowCache = new Set(JSON.parse(localStorage.getItem("funtok_follows")) || []);
let followedCount = localFollowCache.size;
let followersCount = parseInt(localStorage.getItem("funtok_followers_count")) || 142;

// Local Mock Database Configuration Arrays 
let demo = [
 { id: 101, user_id: "u1", username: "@iron_avenger", caption: "Iron-Man assembly sequence is simply unparalleled! 🦾 #marvel #ironman", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 5320, has_liked: false },
 { id: 102, user_id: "u2", username: "@heavy_haulers", caption: "Massive custom Truck driving down the open highway! 🚛 #trucklife #wheels", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 1204, has_liked: false },
 { id: 103, user_id: "u3", username: "@creative_moments", caption: "New trends, new memories. Live your best life. ✨ #vibes", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 850, has_liked: false }
];

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

/* --- Global Media Feed Renderer Layout Engine (Replicates Screenshot Format) --- */
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
        
        <!-- TikTok Actions Bar Replicated on the Outside Right Side Margin -->
        <div class="actions">
          
          <!-- Avatar Stack Frame Containing Floating Custom Cyan Trigger Action Item -->
          <div class="feed-avatar-container">
            <img class="feed-avatar-img" src="${esc(displayAvatar)}" alt="Creator Overlay Profile Badge">
            <button class="${badgeClass}" onclick="handleFollowToggle('${esc(x.user_id)}', this)">${badgeIcon}</button>
          </div>
          
          <button class="act" onclick="like(this)">${x.has_liked ? '♥' : '♡'}</button>
          <span class="num">${x.likes_count || 0}</span>
          
          <!-- Custom Vector Shield Graphic Icon Layout Replacement Segment -->
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

/* --- Interactive Custom Written Text Content Query Reporting System --- */
function openReportWizard(videoId) {
  document.getElementById("reported-video-id").value = videoId;
  document.getElementById("custom-report-text").value = ""; 
  document.getElementById("reportMsg").textContent = "";
  show("reportModal");
}

document.getElementById("submit-report-btn").onclick = function() {
  const videoId = document.getElementById("reported-video-id").value;
  const typedReportText = document.getElementById("custom-report-text").value.trim();
  const msgPanel = document.getElementById("reportMsg");

  if (!typedReportText) {
    msgPanel.style.color = "#ff4d4d";
    msgPanel.textContent = "Error: Please type out a specific concern before sending.";
    return;
  }

  // System output logger confirmation 
  console.log(`Report submitted for Video ID ${videoId}. Context: "${typedReportText}"`);

  msgPanel.style.color = "#00f2fe";
  msgPanel.textContent = "Success! Your text query statement has been processed.";
  
  setTimeout(() => { hide("reportModal"); }, 1600);
};

document.getElementById("close-report-btn").onclick = function() {
  hide("reportModal");
};

/* --- Global Media Sync and Integration Subsystems Engines --- */
async function load() {
  updateProfileStats();
  if (!sb) {
    render(demo);
    return;
  }
  const { data, error } = await sb.from("videos").select("id,caption,video_url,user_id,profiles(username,avatar_url)").order("created_at", { ascending: false });
  if (!error && data) {
    let rows = data.map(v => ({
      id: v.id,
      user_id: v.user_id,
      username: v.profiles?.username || "@user",
      caption: v.caption,
      video_url: v.video_url,
      avatar: v.profiles?.avatar_url || "",
      likes_count: 0,
      has_liked: false
    }));
    render(rows);
  } else {
    render(demo);
  }
}

async function like(b) {
  const cardElement = b.closest('.card');
  const videoId = parseInt(cardElement?.getAttribute('data-video-id'));
  const countSpan = b.nextElementSibling;

  if (!sb) {
    let match = demo.find(v => v.id === videoId);
    if (!match) return;
    if (b.textContent === "♡") {
      b.textContent = "♥";
      match.has_liked = true;
      match.likes_count++;
    } else {
      b.textContent = "♡";
      match.has_liked = false;
      match.likes_count = Math.max(0, match.likes_count - 1);
    }
    countSpan.textContent = match.likes_count;
    return;
  }
  
  const user = sb.auth.user ? sb.auth.user() : null;
  if (!user) { alert("Please log in to like videos!"); return; }
  if (b.textContent === "♡") {
    const { error } = await sb.from('likes').insert([{ user_id: user.id, video_id: videoId }]);
    if (!error) { b.textContent = "♥"; countSpan.textContent = parseInt(countSpan.textContent) + 1; }
  } else {
    const { error } = await sb.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId);
    if (!error) { b.textContent = "♡"; countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1); }
  }
}

function share() { navigator.clipboard?.writeText(location.href); alert("FunTok video link shared!"); }

/* --- Sidebar Navigation Route Controller Interceptor Engine --- */
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = (e) => {
    const targetPage = btn.getAttribute("data-page");
    if (!targetPage) return;

    feed.style.display = "none";
    searchView.style.display = "none";
    inboxView.style.display = "none";

    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (targetPage === "home" || targetPage === "trending") {
      feed.style.display = "flex";
      load();
    } else if (targetPage === "search") {
      searchView.style.display = "block";
      executeVideoSearch();
