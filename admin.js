/* =====================================================================
   Admin panel — sign in with Firebase Auth, list memories from Firestore,
   delete them. Uses the same Firebase project as script.js.
   ===================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC_bdhmhyMOA80ghkBl6_hkNFVclcQp1is",
  authDomain: "reminiscence-2211d.firebaseapp.com",
  projectId: "reminiscence-2211d",
  storageBucket: "reminiscence-2211d.firebasestorage.app",
  messagingSenderId: "193218772628",
  appId: "1:193218772628:web:ce2557f83b0fd486c73e81",
};

const COLLECTION_NAME = "memories";

const { initializeApp } = await import(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
);
const authModule = await import(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"
);
const fsModule = await import(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"
);

const app = initializeApp(FIREBASE_CONFIG);
const auth = authModule.getAuth(app);
const db = fsModule.getFirestore(app);

/* ---------- DOM refs ---------- */
const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const adminUserEmail = document.getElementById("adminUserEmail");
const adminUserUid = document.getElementById("adminUserUid");
const signOutBtn = document.getElementById("signOutBtn");
const adminList = document.getElementById("adminList");
const adminCount = document.getElementById("adminCount");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

/* ---------- Auth state ---------- */
let unsubscribeMemories = null;

authModule.onAuthStateChanged(auth, (user) => {
  if (user) {
    adminLogin.classList.remove("open");
    adminDashboard.classList.add("open");
    adminUserEmail.textContent = user.email || "";
    adminUserUid.textContent = user.uid;
    adminUserUid.title = "Your Firebase Auth UID (click to copy) — paste this into request.auth.uid in your Firestore rules";
    if (!unsubscribeMemories) {
      unsubscribeMemories = watchMemories();
    }
  } else {
    adminDashboard.classList.remove("open");
    adminLogin.classList.add("open");
    if (unsubscribeMemories) {
      unsubscribeMemories();
      unsubscribeMemories = null;
    }
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  loginSubmitBtn.disabled = true;
  loginStatus.textContent = "Signing in...";
  loginStatus.classList.remove("error");
  try {
    await authModule.signInWithEmailAndPassword(auth, email, password);
    loginStatus.textContent = "";
    loginForm.reset();
  } catch (err) {
    console.error(err);
    loginStatus.textContent = "Sign in failed. Check your email and password.";
    loginStatus.classList.add("error");
  } finally {
    loginSubmitBtn.disabled = false;
  }
});

signOutBtn.addEventListener("click", () => {
  authModule.signOut(auth);
});

adminUserUid.addEventListener("click", async () => {
  const uid = adminUserUid.textContent;
  if (!uid) return;
  try {
    await navigator.clipboard.writeText(uid);
    const original = adminUserUid.textContent;
    adminUserUid.textContent = "Copied!";
    setTimeout(() => {
      adminUserUid.textContent = original;
    }, 1000);
  } catch (err) {
    console.warn("Clipboard copy failed:", err);
  }
});

/* ---------- Memories list ---------- */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr || "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function watchMemories() {
  const q = fsModule.query(
    fsModule.collection(db, COLLECTION_NAME),
    fsModule.orderBy("createdAt", "desc"),
  );
  return fsModule.onSnapshot(q, (snapshot) => {
    const memories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderList(memories);
  });
}

function renderList(memories) {
  adminCount.textContent = memories.length
    ? `${memories.length} ${memories.length === 1 ? "memory" : "memories"}`
    : "";

  if (memories.length === 0) {
    adminList.innerHTML = `<p class="admin-empty">No memories yet ♡</p>`;
    return;
  }

  adminList.innerHTML = "";
  memories.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-photo">
        <img src="${item.imageUrl || ""}" alt="" loading="lazy" />
      </div>
      <div class="admin-row-info">
        <p class="admin-row-caption">${(item.caption || "").replace(/\n/g, " ")}</p>
        <p class="admin-row-meta">
          <span class="admin-row-mood">${item.mood || ""}</span>
          <span class="admin-row-date">${formatDate(item.date)}</span>
        </p>
      </div>
      <button class="admin-row-delete" data-id="${item.id}" title="Delete this memory">
        Delete
      </button>
    `;
    adminList.appendChild(row);
  });
}

/* ---------- Delete flow (with confirm modal) ---------- */
let pendingDeleteId = null;

adminList.addEventListener("click", (e) => {
  const btn = e.target.closest(".admin-row-delete");
  if (!btn) return;
  pendingDeleteId = btn.dataset.id;
  confirmOverlay.classList.add("open");
});

confirmCancelBtn.addEventListener("click", () => {
  pendingDeleteId = null;
  confirmOverlay.classList.remove("open");
});
confirmOverlay.addEventListener("click", (e) => {
  if (e.target === confirmOverlay) {
    pendingDeleteId = null;
    confirmOverlay.classList.remove("open");
  }
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  confirmDeleteBtn.disabled = true;
  try {
    await fsModule.deleteDoc(fsModule.doc(db, COLLECTION_NAME, pendingDeleteId));
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Couldn't delete that memory. Check the console for details.");
  } finally {
    confirmDeleteBtn.disabled = false;
    pendingDeleteId = null;
    confirmOverlay.classList.remove("open");
  }
});
