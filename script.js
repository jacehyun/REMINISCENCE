/* =====================================================================
   CONFIG — paste your own Firebase and Cloudinary credentials below.
   ===================================================================== */

// 1) Firebase project config (Firebase console > Project settings > General > Your apps)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC_bdhmhyMOA80ghkBl6_hkNFVclcQp1is",
  authDomain: "reminiscence-2211d.firebaseapp.com",
  projectId: "reminiscence-2211d",
  storageBucket: "reminiscence-2211d.firebasestorage.app",
  messagingSenderId: "193218772628",
  appId: "1:193218772628:web:ce2557f83b0fd486c73e81",
};

// 2) Cloudinary config (Cloudinary console > Settings > Upload > add an UNSIGNED upload preset)
const CLOUDINARY_CONFIG = {
  cloudName: "kcs4veww",
  uploadPreset: "memories-unsigned",
};

// Firestore collection name where memories are stored
const COLLECTION_NAME = "memories";

/* =====================================================================
   End of config. Nothing below this line needs to be edited to run
   the app once the values above are filled in.
   ===================================================================== */

const isPlaceholder = (v) => typeof v === "string" && v.startsWith("YOUR_");
const firebaseReady = !Object.values(FIREBASE_CONFIG).some(isPlaceholder);
const cloudinaryReady = !Object.values(CLOUDINARY_CONFIG).some(isPlaceholder);

const configBanner = document.getElementById("configBanner");
if (!firebaseReady || !cloudinaryReady) {
  const missing = [];
  if (!firebaseReady) missing.push("Firebase");
  if (!cloudinaryReady) missing.push("Cloudinary");
  configBanner.innerHTML = `<div class="config-banner">Demo mode — ${missing.join(" & ")} not configured yet. Fill in <code>FIREBASE_CONFIG</code>${!cloudinaryReady ? " / <code>CLOUDINARY_CONFIG</code>" : ""} near the top of the &lt;script&gt; to save real memories. Showing sample data for now.</div>`;
}

/* ---------- Seed data (used only when Firebase isn't configured) ---------- */
let memories = [
  {
    id: "s1",
    caption: "on my way to\nsomething better.",
    mood: "nostalgic",
    imageUrl:
      "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=600&q=80",
    date: "2025-08-28",
  },
  {
    id: "s2",
    caption: "small steps\nstill count.",
    mood: "calm",
    imageUrl:
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80",
    date: "2025-08-30",
  },
  {
    id: "s3",
    caption: "another beautiful\nday in this crazy world",
    mood: "happy",
    imageUrl:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80",
    date: "2025-09-07",
  },
  {
    id: "s4",
    caption: "met this cutie\ntoday!",
    mood: "happy",
    imageUrl:
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80",
    date: "2025-09-05",
  },
  {
    id: "s5",
    caption: "new places,\nsame grateful heart.",
    mood: "excited",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    date: "2025-08-29",
  },
];

let filtered = [...memories];
let centerIndex = 0;
let activeMood = "all";
let searchTerm = "";
const DOT_THRESHOLD = 8; // above this many photos, dots become unwieldy — show a counter instead

const carouselEl = document.getElementById("carousel");
const dotsEl = document.getElementById("dots");

function getCardSpacing() {
  return window.matchMedia("(max-width: 720px)").matches ? 120 : 190;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function applyFilters() {
  filtered = memories.filter((m) => {
    const moodMatch = activeMood === "all" || m.mood === activeMood;
    const searchMatch =
      !searchTerm || m.caption.toLowerCase().includes(searchTerm.toLowerCase());
    return moodMatch && searchMatch;
  });
  if (centerIndex >= filtered.length) centerIndex = 0;
  buildCarousel();
  if (viewMode === "grid") buildGrid();
}

let cardEls = [];

// Builds the DOM once for the current filtered list. Called only when
// the underlying list changes (mood/search/new memory) — not on every
// navigation — so the cards created here can be reused and just have
// their position updated afterward.
function buildCarousel() {
  carouselEl.innerHTML = "";
  dotsEl.innerHTML = "";
  cardEls = [];

  if (filtered.length === 0) {
    carouselEl.innerHTML = `<p style="font-family:'Caveat',cursive;font-size:22px;color:var(--text-muted);">No memories here yet ♡</p>`;
    return;
  }

  filtered.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "polaroid";
    card.innerHTML = `
      <div class="photo"><img src="${item.imageUrl}" alt="memory photo" loading="lazy"></div>
      <p class="caption"><span>${item.caption.replace(/\n/g, "<br>")}</span><span class="heart">♡</span></p>
      <p class="date">${formatDate(item.date)}</p>
    `;
    card.addEventListener("click", () => {
      centerIndex = idx;
      positionCarousel();
    });
    carouselEl.appendChild(card);
    cardEls.push(card);
  });

  if (filtered.length <= DOT_THRESHOLD) {
    filtered.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.addEventListener("click", () => {
        centerIndex = i;
        positionCarousel();
      });
      dotsEl.appendChild(dot);
    });
  } else {
    const counter = document.createElement("span");
    counter.className = "dots-counter";
    dotsEl.appendChild(counter);
  }

  positionCarousel();
}

// Only updates the transform/opacity on the *existing* cards. Because
// the same DOM nodes stay put between navigations, the CSS transition
// already defined on .polaroid makes them glide into place — giving
// the carousel a smooth scrolling feel instead of popping.
function positionCarousel() {
  if (!cardEls.length) return;
  const n = filtered.length;

  cardEls.forEach((card, idx) => {
    let offset = idx - centerIndex;
    if (offset > n / 2) offset -= n;
    if (offset < -n / 2) offset += n;

    const visible = Math.abs(offset) <= 2;
    const translateX = offset * getCardSpacing();
    const scale = 1 - Math.abs(offset) * 0.12;
    const jitter = (((idx * 47) % 11) - 5) * 0.55; // small per-card tilt so they don't sit at a mechanically identical angle
    const rotate = offset * 2.2 + jitter;
    const opacity = visible ? Math.max(1 - Math.abs(offset) * 0.28, 0.25) : 0;
    const zIndex = 10 - Math.abs(offset);

    card.style.transform = `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`;
    card.style.opacity = opacity;
    card.style.zIndex = zIndex;
    card.style.pointerEvents = visible ? "auto" : "none";
    card.classList.toggle("center", offset === 0);
  });

  if (n <= DOT_THRESHOLD) {
    const dots = dotsEl.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === centerIndex);
    });
  } else {
    const counter = dotsEl.querySelector(".dots-counter");
    if (counter) counter.textContent = `${centerIndex + 1} / ${n}`;
  }
}

document.getElementById("prevBtn").addEventListener("click", () => {
  if (!filtered.length) return;
  centerIndex = (centerIndex - 1 + filtered.length) % filtered.length;
  positionCarousel();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  if (!filtered.length) return;
  centerIndex = (centerIndex + 1) % filtered.length;
  positionCarousel();
});
window.addEventListener("resize", () => {
  positionCarousel();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") document.getElementById("prevBtn").click();
  if (e.key === "ArrowRight") document.getElementById("nextBtn").click();
});

document.getElementById("moodTabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  activeMood = btn.dataset.mood;
  centerIndex = 0;
  applyFilters();
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  centerIndex = 0;
  applyFilters();
});

/* ---------- View All grid ---------- */
let viewMode = "carousel";
const galleryGridEl = document.getElementById("galleryGrid");
const viewToggleBtn = document.getElementById("viewToggleBtn");
const carouselAreaEl = document.querySelector(".carousel-area");

function buildGrid() {
  galleryGridEl.innerHTML = "";

  if (filtered.length === 0) {
    galleryGridEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-family:'Caveat',cursive;font-size:22px;color:var(--text-muted);">No memories here yet ♡</p>`;
    return;
  }

  filtered.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "polaroid grid-item";
    const tilt = (((idx * 53) % 9) - 4) * 0.9;
    card.style.setProperty("--tilt", `${tilt}deg`);
    card.innerHTML = `
      <div class="photo"><img src="${item.imageUrl}" alt="memory photo" loading="lazy"></div>
      <p class="caption"><span>${item.caption.replace(/\n/g, "<br>")}</span><span class="heart">♡</span></p>
      <p class="date">${formatDate(item.date)}</p>
    `;
    card.addEventListener("click", () => {
      centerIndex = idx;
      setViewMode("carousel");
    });
    galleryGridEl.appendChild(card);
  });
}

function setViewMode(mode) {
  viewMode = mode;
  const isGrid = mode === "grid";
  galleryGridEl.classList.toggle("open", isGrid);
  carouselAreaEl.style.display = isGrid ? "none" : "flex";
  dotsEl.style.display = isGrid ? "none" : "flex";
  viewToggleBtn.classList.toggle("active", isGrid);
  viewToggleBtn.title = isGrid ? "Go back to carousel" : "View all the polaroids";
  if (isGrid) {
    buildGrid();
  } else {
    positionCarousel();
  }
}

viewToggleBtn.addEventListener("click", () => {
  setViewMode(viewMode === "grid" ? "carousel" : "grid");
});

/* ---------- Modal open/close ---------- */
const modalOverlay = document.getElementById("modalOverlay");
const memoryForm = document.getElementById("memoryForm");
const modalStatus = document.getElementById("modalStatus");
const submitBtn = document.getElementById("submitBtn");

/* ---------- Photo drop preview ---------- */
const photoInput = document.getElementById("photoInput");
const photoDrop = document.getElementById("photoDrop");
const photoPreview = document.getElementById("photoPreview");

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    photoDrop.classList.remove("has-image");
    photoPreview.src = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    photoPreview.src = reader.result;
    photoDrop.classList.add("has-image");
  };
  reader.readAsDataURL(file);
});

function resetPhotoDrop() {
  photoDrop.classList.remove("has-image");
  photoPreview.src = "";
}

/* ---------- Mood pills ---------- */
const moodPillsEl = document.getElementById("moodPills");
let selectedMood = "happy";

moodPillsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".mood-pill");
  if (!btn) return;
  moodPillsEl
    .querySelectorAll(".mood-pill")
    .forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  selectedMood = btn.dataset.mood;
});

function resetMoodPills() {
  selectedMood = "happy";
  moodPillsEl.querySelectorAll(".mood-pill").forEach((p) => {
    p.classList.toggle("active", p.dataset.mood === "happy");
  });
}

document.getElementById("addMemoryBtn").addEventListener("click", () => {
  modalOverlay.classList.add("open");
  modalStatus.textContent = "";
});
document.getElementById("cancelBtn").addEventListener("click", () => {
  modalOverlay.classList.remove("open");
  memoryForm.reset();
  resetPhotoDrop();
  resetMoodPills();
});
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("open");
});

/* ---------- Background music ---------- */
const bgAudio = document.getElementById("bgAudio");
const musicToggle = document.getElementById("musicToggle");
const iconPlay = musicToggle.querySelector(".icon-play");
const iconPause = musicToggle.querySelector(".icon-pause");

bgAudio.volume = 0.28;

musicToggle.addEventListener("click", () => {
  if (bgAudio.paused) {
    bgAudio.play().catch((err) => console.warn("Playback blocked:", err));
  } else {
    bgAudio.pause();
  }
});

bgAudio.addEventListener("play", () => {
  musicToggle.classList.add("playing");
  musicToggle.setAttribute("aria-pressed", "true");
  musicToggle.title = "Pause background music";
  musicToggle.setAttribute("aria-label", "Pause background music");
  iconPlay.style.display = "none";
  iconPause.style.display = "block";
});
bgAudio.addEventListener("pause", () => {
  musicToggle.classList.remove("playing");
  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.title = "Play background music";
  musicToggle.setAttribute("aria-label", "Play background music");
  iconPlay.style.display = "block";
  iconPause.style.display = "none";
});

// Browsers block audio with sound from starting until the page has had a
// user gesture. We still try to start it right away — if that's blocked,
// it quietly falls back to starting on the visitor's first natural
// click/key/touch anywhere on the page, no prompt shown either way.
function tryAutoplayMusic() {
  const playPromise = bgAudio.play();
  if (playPromise === undefined) return;
  playPromise.catch(() => {
    const startOnInteraction = () => {
      bgAudio.play().catch(() => {});
    };
    document.addEventListener("click", startOnInteraction, { once: true });
    document.addEventListener("keydown", startOnInteraction, { once: true });
    document.addEventListener("touchstart", startOnInteraction, {
      once: true,
    });
  });
}
tryAutoplayMusic();

/* ---------- Cloudinary upload ---------- */
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
}

/* ---------- Firebase (only wired up if configured) ---------- */
let db = null;
let addDocFn, collectionFn, onSnapshotFn, queryFn, orderByFn, serverTimestampFn;

// Resolves once real memory data is ready to show (first Firestore snapshot,
// or immediately in demo mode / if Firebase fails to init), so the page
// loader can wait for it instead of dissolving over the seed placeholders.
let resolveDataReady;
const dataReadyPromise = new Promise((resolve) => {
  resolveDataReady = resolve;
});

if (firebaseReady) {
  // Wrapped in an async IIFE (instead of a top-level await) so a slow or
  // blocked CDN request here can't hold up the rest of the script — the
  // carousel, page loader, etc. all run immediately with the seed data,
  // and swap in live data once/if this resolves.
  (async () => {
    try {
      const { initializeApp } =
        await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js");
      const fs =
        await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
      collectionFn = fs.collection;
      addDocFn = fs.addDoc;
      onSnapshotFn = fs.onSnapshot;
      queryFn = fs.query;
      orderByFn = fs.orderBy;
      serverTimestampFn = fs.serverTimestamp;

      const app = initializeApp(FIREBASE_CONFIG);
      db = fs.getFirestore(app);

      const q = queryFn(
        collectionFn(db, COLLECTION_NAME),
        orderByFn("createdAt", "desc"),
      );
      let firstSnapshot = true;
      onSnapshotFn(q, (snapshot) => {
        memories = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            caption: d.caption || "",
            mood: d.mood || "happy",
            imageUrl: d.imageUrl || "",
            date: d.date || "",
          };
        });
        applyFilters();
        if (firstSnapshot) {
          firstSnapshot = false;
          resolveDataReady();
        }
      });
    } catch (err) {
      console.error("Firebase init failed:", err);
      resolveDataReady(); // fall back to seed data rather than hang the loader
    }
  })();
} else {
  resolveDataReady(); // demo mode — seed data is already all there is
}

/* ---------- Submit new memory ---------- */
memoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = photoInput.files[0];
  const caption = document.getElementById("captionInput").value.trim();
  const mood = selectedMood;
  if (!file || !caption) return;

  submitBtn.disabled = true;
  modalStatus.textContent = "Uploading photo...";

  try {
    let imageUrl;
    if (cloudinaryReady) {
      imageUrl = await uploadToCloudinary(file);
    } else {
      // Fallback preview only — not persisted, since Cloudinary isn't configured yet
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (firebaseReady && db) {
      modalStatus.textContent = "Saving to your wall...";
      await addDocFn(collectionFn(db, COLLECTION_NAME), {
        caption,
        mood,
        imageUrl,
        date: today,
        createdAt: serverTimestampFn(),
      });
    } else {
      // Demo mode: just add it to the in-memory list
      memories.unshift({
        id: "local-" + Date.now(),
        caption,
        mood,
        imageUrl,
        date: today,
      });
      applyFilters();
    }

    modalStatus.textContent = "Memory added ♡";
    setTimeout(() => {
      modalOverlay.classList.remove("open");
      memoryForm.reset();
      resetPhotoDrop();
      resetMoodPills();
      modalStatus.textContent = "";
      submitBtn.disabled = false;
    }, 700);
  } catch (err) {
    console.error(err);
    modalStatus.textContent = "Something went wrong. Please try again.";
    submitBtn.disabled = false;
  }
});

applyFilters();

/* ---------- Page loader ---------- */
const pageLoader = document.getElementById("pageLoader");
const minLoaderTime = new Promise((resolve) => setTimeout(resolve, 1000));
const pageReady = new Promise((resolve) => {
  if (document.readyState === "complete") resolve();
  else window.addEventListener("load", () => resolve(), { once: true });
});
// Cap how long we'll wait on Firestore — a slow or blocked connection
// shouldn't leave the loader on screen forever.
const dataReady = Promise.race([
  dataReadyPromise,
  new Promise((resolve) => setTimeout(resolve, 5000)),
]);
Promise.all([minLoaderTime, pageReady, dataReady]).then(() => {
  // Rewind-power style transition — a soft green ripple blooms outward
  // from center while the title/text gently shimmer before dissolving,
  // like a memory surfacing. No click required.
  pageLoader.classList.add("transitioning");
  setTimeout(() => {
    pageLoader.classList.add("hide");
    setTimeout(() => pageLoader.remove(), 800);
  }, 950);
});
