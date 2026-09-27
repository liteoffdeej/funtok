const cfg = window.FUNTOK_CONFIG || {};
const ready = cfg.SUPABASE_URL?.startsWith("http") && cfg.SUPABASE_KEY && cfg.SUPABASE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const sb = ready ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY) : null;
const feed = document.getElementById("feed");
const searchView = document.getElementById("search-view");

const demo = [
 { username: "@funcreator", caption: "Welcome to FunTok! 🎉", video_url: "", likes_count: 0, has_liked: false },
 { username: "@funnyhub", caption: "When your friend says “I'm almost there” 😂", video_url: "", likes_count: 0, has_liked: false },
 { username: "@trendzone", caption: "New trends, new memories. ✨", video_url: "", likes_count: 0, has_liked: false }
];

// Cache map tracking user follow states locally to prevent unnecessary database queries
let localFollowCache = new Set();

function show(id) { document.getElementById(id).style.display = "flex" }
function hide(id) { document.getElementById(id).style.display = "none" }

function esc(s) { 
  return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" }[m])); 
}

// Global Feed Rendering Engine (Enhanced with follow and database-backed like buttons)
function render(rows) {
  feed.innerHTML = rows.map((x) => {
    // Generate follow button UI state depending on session cache tracking matches
    const isFollowing = localFollowCache.has(x.user_id);
    const btnText = isFollowing ? "Following" : "Follow";
    const btnStyle = isFollowing ? "background:#333;" : "background:#ff2d7a;";
    
    // Hide follow button overlay layers completely if it belongs to your own user session
    const hideSelfFollow = (sb && sb.auth.getUser() && x.user_id === sb.auth.user()?.id) ? "display:none;" : "";

    return `
      <section class="card" data-video-id="${x.id}">
        ${x.video_url ? `<video src="${esc(x.video_url)}" autoplay muted loop playsinline></video>` : `<div class="fallback">▶</div>`}
        <div class="shade"></div>
        <div class="info">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div class="user">${esc(x.username || "@user")}</div>
            ${sb && x.user_id ? `<button class="follow-toggle-btn" style="padding:4px 10px; border:0; color:#fff; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer; ${btnStyle} ${hideSelfFollow}" onclick="handleFollowToggle('${x.user_id}', this)">${btnText}</button>` : ''}
          </div>
          <div class="caption">${esc(x.caption || "")}</div>
        </div>
        <div class="actions">
          <button class="act" onclick="like(this)">${x.has_liked ? '♥' : '♡'}</button>
          <span class="num">${x.likes_count || 0}</span>
          <button class="act" onclick="report()">⚑</button>
          <span class="num">Report</span>
          <button class="act" onclick="share()">↗</button>
        </div>
      </section>
    `;
  }).join("");
}

// Database-backed Live Liking Flow Logic Engine
async function like(b) {
  if (!sb) {
    b.textContent = b.textContent === "♡" ? "♥" : "♡";
    b.nextElementSibling.textContent = b.textContent === "♥" ? "1" : "0";
    return;
  }

  const currentSessionUser = sb.auth.user();
  if (!currentSessionUser) {
    alert("Please sign into your creator account to like videos!");
    return;
  }

  const cardElement = b.closest('.card');
  const videoId = cardElement ? cardElement.getAttribute('data-video-id') : null;
  if (!videoId) return;

  const countSpan = b.nextElementSibling;

  if (b.textContent === "♡") {
    // Like Action: Insert into public.likes table
    const { error } = await sb.from('likes').insert([{ user_id: currentSessionUser.id, video_id: videoId }]);
    if (!error) {
      b.textContent = "♥";
      countSpan.textContent = parseInt(countSpan.textContent || 0) + 1;
    } else {
      console.error("Error liking video:", error.message);
    }
  } else {
    // Unlike Action: Delete row record from public.likes table
    const { error } = await sb.from('likes').delete().eq('user_id', currentSessionUser.id).eq('video_id', videoId);
    if (!error) {
      b.textContent = "♡";
      countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || 0) - 1);
    } else {
      console.error("Error unliking video:", error.message);
    }
  }
}

function share() { navigator.clipboard?.writeText(location.href); alert("FunTok link copied!") }
function report() { alert("Report received. Thank you for making FunTok safe!") }

// Fetching feeds from live servers and syncing relation + like caches simultaneously
async function load() {
  if (!sb) {
    render(demo);
    return;
  }
  
  // Sync your following relationships list first to calculate button labels correctly during loop render cycles
  const currentSessionUser = sb.auth.user();
  if (currentSessionUser) {
    const { data: followRecords } = await sb.from("follows").select("following_id").eq("follower_id", currentSessionUser.id);
    localFollowCache = new Set((followRecords || []).map(f => f.following_id));
  }

  const { data, error } = await sb.from("videos").select("id,caption,video_url,user_id,profiles(username)").order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error(error);
    render(demo);
    return;
  }
  
  // Transform data and pull real-time like counts
  const processedVideos = await Promise.all((data || []).map(async v => {
    // Query total row count for this video inside the likes table
    const { count } = await sb.from('likes').select('*', { count: 'exact', head: true }).eq('video_id', v.id);
    
    // Check if the current user has liked this specific video layout card
    let userHasLiked = false;
    if (currentSessionUser) {
      const { data: existingLike } = await sb.from('likes').select('video_id').eq('user_id', currentSessionUser.id).eq('video_id', v.id).maybeSingle();
      if (existingLike) userHasLiked = true;
    }

    return {
      id: v.id,
      user_id: v.user_id,
      username: v.profiles?.username || "@user",
      caption: v.caption,
      video_url: v.video_url,
      likes_count: count || 0,
      has_liked: userHasLiked
    };
  }));

  render(processedVideos);
}

// Navigation Tab Router Logic Control Engine
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = (e) => {
    const targetPage = btn.getAttribute("data-page");
    if (!targetPage) return; // Ignore buttons like the Upload Plus button

    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (targetPage === "search") {
      feed.style.display = "none";
      searchView.style.display = "block";
    } else {
      searchView.style.display = "none";
      feed.style.display = "block";
      if (targetPage === "home" || targetPage === "trending") {
        load(); // Refresh live system contents
      }
    }
  }
});

// Advanced Video Keyword Search Architecture Lookup
async function executeVideoSearch() {
  const queryText = document.getElementById('search-input').value.trim();
  const resultsGrid = document.getElementById('search-results-grid');
  
  if (!queryText) {
    resultsGrid.innerHTML = '<p class="search-notice" style="color:#666; grid-column:span 2; text-align:center; margin-top:40px;">Type a phrase above to scan database archives...</p>';
    return;
  }
  
  resultsGrid.innerHTML = '<p style="color:#aaa; grid-column:span 2; text-align:center; margin-top:40px;">Searching database feeds...</p>';
  
  const { data: matchedVideos, error } = await sb
    .from('videos')
    .select('*, profiles(username)')
    .ilike('caption', `%${queryText}%`);
    
  if (error || !matchedVideos || matchedVideos.length === 0) {
    resultsGrid.innerHTML = '<p style="color:#ff2d7a; grid-column:span 2; text-align:center; margin-top:40px;">No matching video feeds found.</p>';
    return;
  }
  
  resultsGrid.innerHTML = '';
  
  // Resolve like configurations for search results items
  const processedSearchVideos = await Promise.all((matchedVideos || []).map(async vid => {
    const { count } = await sb.from('likes').select('*', { count: 'exact', head: true }).eq('video_id', vid.id);
    const currentSessionUser = sb.auth.user();
    let userHasLiked = false;
    if (currentSessionUser) {
      const { data: existingLike } = await sb.from('likes').select('video_id').eq('user_id', currentSessionUser.id).eq('video_id', vid.id).maybeSingle();
      if (existingLike) userHasLiked = true;
    }
    return { ...vid, likes_count: count || 0, has_liked: userHasLiked };
  }));

  processedSearchVideos.forEach(vid => {
    const gridItem = document.createElement('div');
    gridItem.style.cssText = "background:#121214; border-radius:12px; overflow:hidden; position:relative; height:200px; cursor:pointer; border:1px solid #222;";
    gridItem.innerHTML = `
      <video src="${vid.video_url}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
      <div style="position:absolute; inset:0; background:linear-gradient(transparent 50%, rgba(0,0,0,0.9)); padding:8px; display:flex; flex-direction:column; justify-content:flex-end;">
        <span style="font-size:11px; color:#ff2d7a; font-weight:800;">@${vid.profiles?.username || 'user'}</span>
        <span style="font-size:12px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${vid.caption}</span>
      </div>
    `;
    gridItem.onclick = () => {
      // Direct Navigation Jumper: Switch tabs back to feed window view pane and isolate selected match card index context
      searchView.style.display = "none";
      feed.style.display = "block";
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      document.querySelector('nav button[data-page="home"]').classList.add("active");
      render([{ 
        id: vid.id, 
        user_id: vid.user_id, 
