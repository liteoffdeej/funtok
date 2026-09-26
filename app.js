const cfg=window.FUNTOK_CONFIG||{};const ready=cfg.SUPABASE_URL?.startsWith("http")&&cfg.SUPABASE_KEY&&cfg.SUPABASE_KEY!=="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
const sb=ready?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY):null;
const feed=document.getElementById("feed");
const demo=[
 {username:"@funcreator",caption:"Welcome to FunTok! 🎉",video_url:""},
 {username:"@funnyhub",caption:"When your friend says “I'm almost there” 😂",video_url:""},
 {username:"@trendzone",caption:"New trends, new memories. ✨",video_url:""}
];
function show(id){document.getElementById(id).style.display="flex"}function hide(id){document.getElementById(id).style.display="none"}
function render(rows){feed.innerHTML=rows.map((x,i)=>`<section class="card">${x.video_url?`<video src="${esc(x.video_url)}" autoplay muted loop playsinline></video>`:`<div class="fallback">▶</div>`}<div class="shade"></div><div class="info"><div class="user">${esc(x.username||"@user")}</div><div class="caption">${esc(x.caption||"")}</div></div><div class="actions"><button class="act" onclick="like(this)">♡</button><span class="num">0</span><button class="act" onclick="report()">⚑</button><span class="num">Report</span><button class="act" onclick="share()">↗</button></div></section>`).join("")}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function like(b){b.textContent=b.textContent==="♡"?"♥":"♡";b.nextElementSibling.textContent=b.textContent==="♥"?"1":"0"}
function share(){navigator.clipboard?.writeText(location.href);alert("FunTok link copied!")}
function report(){alert("Report received. A real deployment should store reports for moderation.")}
async function load(){if(!sb){render(demo);return}const {data,error}=await sb.from("videos").select("id,caption,video_url,profiles(username)").order("created_at",{ascending:false}).limit(50);if(error){console.error(error);render(demo);return}render((data||[]).map(v=>({username:v.profiles?.username||"@user",caption:v.caption,video_url:v.video_url})))}
document.getElementById("uploadBtn").onclick=()=>{if(!sb)return alert("Add your Supabase settings in config.js first.");show("uploadModal")}
document.getElementById("profileBtn").onclick=async()=>{show("profileModal");if(sb){const {data}=await sb.auth.getUser();document.getElementById("profileText").textContent=data.user?`Signed in as ${data.user.email}`:"Not signed in."}}
document.getElementById("authOpen").onclick=()=>show("authModal")
document.getElementById("signup").onclick=async()=>auth(true)
document.getElementById("login").onclick=async()=>auth(false)
async function auth(signup){if(!sb)return;const email=document.getElementById("email").value,password=document.getElementById("password").value;const r=signup?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});document.getElementById("authMsg").textContent=r.error?r.error.message:"Success! Check your email if confirmation is enabled.";if(!r.error){hide("authModal");}}
document.getElementById("logout").onclick=async()=>{if(sb)await sb.auth.signOut();document.getElementById("profileText").textContent="Not signed in."}
document.getElementById("publish").onclick=async()=>{if(!sb)return;const {data:{user}}=await sb.auth.getUser();if(!user)return alert("Please sign in first.");const f=document.getElementById("videoFile").files[0],caption=document.getElementById("caption").value.trim();if(!f)return alert("Choose a video.");if(f.size>100*1024*1024)return alert("Keep videos under 100 MB for this version.");const path=`${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const up=await sb.storage.from("videos").upload(path,f,{contentType:f.type,upsert:false});if(up.error)return alert(up.error.message);const pub=sb.storage.from("videos").getPublicUrl(path);const ins=await sb.from("videos").insert({user_id:user.id,caption,video_path:path,video_url:pub.data.publicUrl});if(ins.error)return alert(ins.error.message);hide("uploadModal");load()}
load();