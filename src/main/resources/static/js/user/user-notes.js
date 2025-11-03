// ==============================
// user-notes.js
// 功能：用户主页（マイページ）笔记查看
// ==============================

// ===== 用户信息加载 =====
async function loadUserInfo() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:8080/api/user/me", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById("username").innerText = data.username || "ユーザー";
            document.getElementById("userinfo").innerText = `ID: ${data.id || "---"} ｜ 所在地：日本`;
            if (data.avatarUrl) {
                document.getElementById("avatar").src = data.avatarUrl;
            }
        }
    } catch (e) {
        console.error("ユーザー情報の取得に失敗しました:", e);
    }
}

// ===== 用户笔记加载 =====
async function loadUserNotes() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:8080/api/notes/my", {
            headers: { "Authorization": "Bearer " + token }
        });

        const container = document.getElementById("notes");
        container.innerHTML = "";

        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center;color:gray;">ノートを取得できませんでした。</p>`;
            return;
        }

        const notes = await res.json();
        if (notes.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:gray;">まだ投稿がありません。</p>`;
            return;
        }

        // ==== 动态生成卡片 ====
        notes.forEach(n => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${n.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${n.title}">
                <div class="card-body">
                    <h3>${n.title}</h3>
                    <p>${n.content.length > 80 ? n.content.slice(0, 80) + '…' : n.content}</p>
                    <div class="read-btn" onclick="viewNoteDetail(${n.id})">read<br>more</div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("ノート取得エラー:", err);
        document.getElementById("notes").innerHTML =
            `<p style="text-align:center;color:gray;">ノートの読み込みに失敗しました。</p>`;
    }
}

// ===== 查看笔记详情 =====
function viewNoteDetail(id) {
    window.location.href = `notes-detail.html?id=${id}`;
}

// ===== Tabs 切换 =====
function showTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.card-container').forEach(c => c.style.display = 'none');
    document.querySelector(`.tab[onclick="showTab('${id}')"]`).classList.add('active');
    document.getElementById(id).style.display = 'grid';
}

// ===== 登出 =====
function logout() {
    localStorage.removeItem("token");
    location.href = "login.html";
}

// ===== 页面加载时执行 =====
document.addEventListener("DOMContentLoaded", () => {
    loadUserInfo();
    loadUserNotes();
});
