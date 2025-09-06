// Flag: JS is running (prevents hidden .reveal content if JS fails)
document.documentElement.classList.add("js");

(function () {
  const root = document.documentElement;
  const PREF_KEY = "ks-theme";
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const stored = localStorage.getItem(PREF_KEY);
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Theme memory */
  function setTheme(mode){ root.setAttribute("data-theme", mode); localStorage.setItem(PREF_KEY, mode); }
  setTheme(stored || (prefersLight ? "light" : "dark"));

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Header UI */
  const nav = document.getElementById("nav");
  const themeBtn = document.getElementById("themeToggle");
  const menuBtn = document.getElementById("menuToggle");
  themeBtn?.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));
  if (menuBtn && nav) menuBtn.addEventListener("click", () => nav.classList.toggle("open"));

  /* Active nav */
  if (nav) {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    [...nav.querySelectorAll("a")].forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href && path && href.includes(path)) a.classList.add("is-active");
    });
  }

  /* Page transitions */
  const overlay = document.createElement("div");
  overlay.className = "page-transition";
  document.body.appendChild(overlay);
  const isSameOrigin = (url) => { try { const u = new URL(url, location.href); return u.origin === location.origin; } catch { return false; } };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const target = (a.getAttribute("target") || "").toLowerCase();
    if (!isSameOrigin(href)) return;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (a.hasAttribute("download")) return;
    if (target && target !== "_self") return;
    e.preventDefault();
    overlay.classList.add("active");
    setTimeout(() => { window.location.href = a.href; }, 300);
  });

  /* Scroll progress bar */
  let bar = document.querySelector(".progress-bar");
  if (!bar) { bar = document.createElement("div"); bar.className = "progress-bar"; document.body.appendChild(bar); }
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? (doc.scrollTop / max) : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(p,0),1)})`;
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive:true });
  window.addEventListener("resize", updateProgress);

  /* Back-to-top */
  const backTop = document.querySelector(".back-to-top");
  const toggleBTT = () => backTop && backTop.classList.toggle("show", window.scrollY > 300);
  window.addEventListener("scroll", toggleBTT, { passive:true }); toggleBTT();

  /* Reveals (manual + auto) */
  const autoTargets = [
    ...document.querySelectorAll(".section .container > *:not(.no-reveal)"),
    ...document.querySelectorAll(".card")
  ];
  const allReveals = new Set(document.querySelectorAll(".reveal"));
  autoTargets.forEach((el, i) => {
    if (!allReveals.has(el)) {
      el.classList.add("reveal");
      if (i % 3 === 1) el.classList.add("delay-1");
      else if (i % 3 === 2) el.classList.add("delay-2");
      allReveals.add(el);
    }
  });
  if (!prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    allReveals.forEach(el => io.observe(el));
  } else {
    allReveals.forEach(el => el.classList.add("in"));
  }

  /* Ripple on buttons */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn, .btn-ico");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* Card tilt (3D) */
  document.querySelectorAll(".card").forEach(card => {
    let raf = null;
    function onMove(ev){
      const r = card.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      const rotY = (x - 0.5) * 6;
      const rotX = (0.5 - y) * 6;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      });
    }
    function onLeave(){ if (raf) cancelAnimationFrame(raf); card.style.transform = ""; }
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("touchstart", () => card.style.transform = "", {passive:true});
  });

  /* Magnetic pull (translation only) — keep on for now */
  document.querySelectorAll("nav .magnetic, .nav .magnetic").forEach(el => {
    let raf = null;
    const strength = 10; // bump to 14/18 for more pull
    function onMove(ev){
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left - r.width/2) / (r.width/2);
      const y = (ev.clientY - r.top - r.height/2) / (r.height/2);
      const tx = Math.max(-1, Math.min(1, x)) * strength;
      const ty = Math.max(-1, Math.min(1, y)) * strength;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `translate(${tx}px, ${ty}px)`; });
    }
    function onLeave(){ if (raf) cancelAnimationFrame(raf); el.style.transform = ""; }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  });

  /* Optional parallax: any element with .parallax */
  const parallaxEls = [...document.querySelectorAll(".parallax")];
  if (parallaxEls.length && !prefersReduced) {
    const onScroll = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el, i) => el.style.transform = `translateY(${(y * (0.06 + i*0.02)).toFixed(1)}px)`);
    };
    window.addEventListener("scroll", onScroll, { passive:true }); onScroll();
  }

  /* Photos page: filters (opt-in chips + photo-grid) */
  const filterWrap = document.querySelector(".photo-filters");
  if (filterWrap) {
    const buttons = [...filterWrap.querySelectorAll(".chip")];
    const imgs = [...document.querySelectorAll(".photo-grid img")];
    buttons.forEach(b => b.addEventListener("click", () => {
      buttons.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const cat = (b.dataset.filter || "all").toLowerCase();
      imgs.forEach(img => {
        const m = cat === "all" || (img.dataset.category || "").toLowerCase() === cat;
        img.style.display = m ? "" : "none";
      });
    }));
  }

  /* Projects page helpers (search/sort/filter) */
  window.initProjectsPage = function () {
    const grid = document.getElementById("grid");
    if (!grid) return;
    const chips = [...document.querySelectorAll(".chip")];
    const search = document.getElementById("search");
    const sort = document.getElementById("sort");
    const empty = document.getElementById("empty");
    let active = "all";
    const cards = () => [...grid.querySelectorAll(".card")];

    function applyFilters() {
      const q = (search?.value || "").trim().toLowerCase();
      let shown = 0;
      cards().forEach(c => {
        const tags = (c.dataset.tags || "").toLowerCase();
        const title = (c.dataset.title || c.querySelector("h2")?.textContent || "").toLowerCase();
        const text = (c.querySelector("p")?.textContent || "").toLowerCase();
        const matchesFilter = active === "all" || tags.split(" ").includes(active);
        const matchesQuery = !q || title.includes(q) || text.includes(q) || tags.includes(q);
        const show = matchesFilter && matchesQuery;
        c.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    function applySort() {
      const visible = cards().filter(c => c.style.display !== "none");
      const mode = sort?.value || "featured";
      const byTitle = (a,b) => (a.dataset.title||"").localeCompare(b.dataset.title||"");
      const byDateDesc = (a,b) => new Date(b.dataset.date) - new Date(a.dataset.date);
      let sorted = visible;
      if (mode === "alpha") sorted = visible.sort(byTitle);
      else if (mode === "recent") sorted = visible.sort(byDateDesc);
      sorted.forEach(c => grid.appendChild(c));
    }

    chips.forEach(chip => chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      active = chip.dataset.filter;
      applyFilters(); applySort();
    }));
    search?.addEventListener("input", () => { applyFilters(); applySort(); });
    sort?.addEventListener("change", applySort);

    applyFilters(); applySort();
  };

  /* Photos page search/sort helpers */
  window.initPhotosPage = function () {
    const grid = document.getElementById("photoGrid");
    if (!grid) return;
    const search = document.getElementById("photoSearch");
    const sort = document.getElementById("photoSort");
    const imgs = [...grid.querySelectorAll("img")];

    imgs.forEach(i => i.addEventListener("click", () => window.open(i.src, "_blank")));

    function filter() {
      const q = (search?.value || "").toLowerCase();
      imgs.forEach(i => {
        const t = (i.dataset.title || "").toLowerCase();
        const tags = (i.dataset.tags || "").toLowerCase();
        i.style.display = (!q || t.includes(q) || tags.includes(q)) ? "" : "none";
      });
    }
    function resort() {
      const mode = sort?.value || "featured";
      const arr = [...imgs];
      arr.sort((a,b) => {
        const da = new Date(a.dataset.date), db = new Date(b.dataset.date);
        if (mode === "new") return db - da;
        if (mode === "old") return da - db;
        return 0;
      });
      arr.forEach(i => grid.appendChild(i));
    }

    search?.addEventListener("input", filter);
    sort?.addEventListener("change", resort);
    filter(); resort();
  };

  /* ---------- Fireworks Easter egg (type KARAN) ---------- */
  (function(){
    let buf = "";
    const secret = "KARAN";

    let canvas = null, ctx = null, raf = null, spawnTimer = 0;
    const particles = [];
    const GRAVITY = 0.08, FRICTION = 0.985;
    const COLORS = ["#ff5252","#ffd754","#7cff6b","#5ad7ff","#b77bff","#ff8ed1"];

    function toast(text){
      let t = document.getElementById("eggToast");
      if(!t){ t = document.createElement("div"); t.id = "eggToast"; t.className = "egg-toast"; document.body.appendChild(t); }
      t.textContent = text; t.classList.add("show");
      setTimeout(()=> t.classList.remove("show"), 1200);
    }

    function toggleFireworks(){
      if (canvas) {
        cancelAnimationFrame(raf); raf = null;
        canvas.remove(); canvas = null; ctx = null;
        particles.length = 0;
        toast("🎆 Fireworks off");
        return;
      }
      canvas = document.createElement("canvas");
      canvas.id = "fx-canvas";
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
      resize();
      window.addEventListener("resize", resize);
      toast("🎆 Fireworks on — type KARAN again");
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function resize(){
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = "100vw"; canvas.style.height = "100vh";
      if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function burst(x,y){
      const count = 90, speedMin = 2.2, speedMax = 5.0;
      const color = COLORS[(Math.random()*COLORS.length)|0];
      for(let i=0;i<count;i++){
        const angle = (i/count)*Math.PI*2 + Math.random()*0.15;
        const speed = speedMin + Math.random()*(speedMax-speedMin);
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:900+Math.random()*600,age:0,color,size:2+Math.random()*1.6,alpha:1});
      }
    }
    function randomBurst(){
      const pad=80; const x=pad+Math.random()*(innerWidth-pad*2); const y=pad+Math.random()*(innerHeight*0.6-pad);
      burst(x,y);
    }

    let last=0;
    function loop(now){
      const dt = now - last; last = now;
      if (!ctx) return;
      ctx.globalCompositeOperation="source-over";
      ctx.fillStyle="rgba(0,0,0,0.18)";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      ctx.globalCompositeOperation="lighter";
      spawnTimer += dt; if (spawnTimer > 380){ randomBurst(); spawnTimer = 0; }

      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.age += dt; if (p.age > p.life){ particles.splice(i,1); continue; }
        p.vx *= FRICTION; p.vy = p.vy*FRICTION + GRAVITY; p.x += p.vx; p.y += p.vy;
        const t = p.age / p.life; p.alpha = 1 - t;
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0,p.alpha);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("keydown",(e)=>{
      const tag = document.activeElement?.tagName;
      if (tag==="INPUT" || tag==="TEXTAREA" || document.activeElement?.isContentEditable) return;
      buf += e.key.toUpperCase();
      if (!secret.startsWith(buf)) buf = e.key.toUpperCase();
      if (buf === secret){ toggleFireworks(); buf = ""; }
    });
    document.querySelector(".logo")?.addEventListener("dblclick", toggleFireworks);
  })();

  // Accessibility: main focus target for skip link
  document.querySelector("main")?.setAttribute("tabindex","-1");
})();
