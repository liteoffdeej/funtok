const cfg = window.FUNTOK_CONFIG || {};
const ready = cfg.SUPABASE_URL?.startsWith("http") && cfg.SUPABASE_KEY && cfg.SUPABASE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const sb = ready ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY) : null;

// Core DOM Element Targets
const feed = document.getElementById("feed");
const searchView = document.getElementById("search-view");
const inboxView = document.getElementById("inbox-view");
const chatsListScreen = document.getElementById("chats-list-screen");
const activeChatScreen = document.getElementById("active-chat-screen");

// Comprehensive App Core State (LocalStorage Fallbacks for local sandboxing)
let currentUser = JSON.parse(localStorage.getItem("funtok_user")) || null;
let localFollowCache = new Set(JSON.parse(localStorage.getItem("funtok_follows")) || []);
let followedCount = localFollowCache.size;
let followersCount = parseInt(localStorage.getItem("funtok_followers_count")) || 142;

// Mock Media Database Content (Includes Profile Pictures and Identifiers for Interactions)
let demo = [
 { id: 101, user_id: "u1", username: "@iron_avenger", caption: "Iron-Man assembly sequence is simply unparalleled! 🦾 #marvel #ironman", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 5320, has_liked: false },
 { id: 102, user_id: "u2", username: "@heavy_haulers", caption: "Massive custom Truck driving down the open highway! 🚛 #trucklife #wheels", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 1204, has_liked: false },
 { id: 103, user_id: "u3", username: "@creative_moments", caption: "New trends, new memories. Live your best life. ✨ #vibes", video_url: "https://w3schools.com", avatar: "https://unsplash.com", likes_count: 850, has_liked: false }
];

// WhatsApp Section Live Messaging Database Model
let chatThreads = [
  { id: "u1", username: "@iron_avenger", avatar: "https://unsplash.com", messages: [{ text: "Hey! Loved your recent video edit!", time: "10:30 AM", sentByMe: false }] },
  { id: "u2", username: "@heavy_haulers", avatar: "https://unsplash.com", messages: [{ text: "That truck setup is incredible, where was it filmed?", time: "Yesterday", sentByMe: true }] },
  { id: "u3", username: "@creative_moments", avatar: "https://unsplash.com", messages: [{ text: "Thanks for the support! Let's collaborate soon.", time: "Monday", sentByMe: false }] }
];
let activeChatUserId = null;

function show(id) { document.getElementById(id).style.display = "flex"; }
function hide(id) { document.getElementById(id).style.display = "none"; }

function esc(s) { 
  return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" }[m])); 
}

// Global View Feed Renderer Engine (Refined to mimic modern TikTok layouts perfectly)
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
        <div class="info">
          <div class="user">${esc(x.username || "@user")}</div>
          <div class="caption">${esc(x.caption || "")}</div>
        </div>
        <div class="actions">
          <!-- TikTok Avatar Container Box with Interactive Floating Follow Trigger Badge -->
          <div class="feed-avatar-container">
            <img class="feed-avatar-img" src="${esc(displayAvatar)}" alt="Creator Profile">
            <button class="${badgeClass}" onclick="handleFollowToggle('${esc(x.user_id)}', this)">${badgeIcon}</button>
          </div>
          
          <button class="act" onclick="like(this)">${x.has_liked ? '♥' : '♡'}</button>
          <span class="num">${x.likes_count || 0}</span>
          
          <button class="act" onclick="openReportWizard(${x.id})">⚑</button>
          <span class="num" style="margin-bottom:8px; font-size:11px; color:#aaa;">Report</span>
          
          <button class="act" onclick="share()">↗</button>
          <span class="num" style="font-size:11px; color:#aaa;">Share</span>
        </div>
      </section>
    `;
  }).join("");
}

// Interactive Follow Toggle Logic Flow Engine
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

// Database-backed/LocalStorage Liking Framework Integration
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
  // Supabase implementation fallback
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

function share() { navigator.clipboard?.writeText(location.href); alert("FunTok link copied!") }

// Advanced Content Control Reporting Wizard Setup
function openReportWizard(videoId) {
  document.getElementById("reported-video-id").value = videoId;
  document.getElementById("reportMsg").textContent = "";
  show("reportModal");
}

document.getElementById("submit-report-btn").onclick = function() {
  const videoId = document.getElementById("reported-video-id").value;
  const reason = document.querySelector('input[name="reportReason"]:checked').value;
  document.getElementById("reportMsg").style.color = "#00a884";
  document.getElementById("reportMsg").textContent = `Success! Video reported for: ${reason}.`;
  setTimeout(() => { hide("reportModal"); }, 1500);
};

// Application Global Loading and Sync Router Setup
async function load() {
  updateProfileStats();
  if (!sb) {
    render(demo);
    return;
  }
  // Supabase live database sync algorithm
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

// Navigation Tab Router Logic Control Engine (Cleaned to fix responsive touch zones)
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = (e) => {
    const targetPage = btn.getAttribute("data-page");
    if (!targetPage) return;

    // Reset visibility of all functional layers
    feed.style.display = "none";
    searchView.style.display = "none";
    inboxView.style.display = "none";

    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (targetPage === "home" || targetPage === "trending") {
      feed.style.display = "block";
      load();
    } else if (targetPage === "search") {
      searchView.style.display = "block";
      executeVideoSearch();
    } else if (targetPage === "inbox") {
      inboxView.style.display = "block";
      renderWhatsAppChatsList();
    } else if (targetPage === "profile") {
      feed.style.display = "block";
      showProfileSettings();
    }
  }
});

// Explicit header overlay click triggers
document.getElementById("searchBtn").onclick = () => {
  const sNav = document.getElementById("navSearchBtn");
  if(sNav) sNav.click();
};
document.getElementById("profileBtn").onclick = () => { showProfileSettings(); };
document.getElementById("uploadBtn").onclick = () => { show("uploadModal"); };

// Advanced Professional Interactive Search Panel Logic Control Framework
async function executeVideoSearch() {
  const queryText = document.getElementById('search-input').value.trim().toLowerCase();
  const resultsGrid = document.getElementById('search-results-grid');
  
  if (!queryText) {
