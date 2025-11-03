// ==============================
// user-favorites.js
// 功能：ユーザーのお気に入りノート表示・管理
// ==============================

// ===== お気に入り一覧を読み込み =====
async function loadFavoriteNotes() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("未ログインユーザー");
        return;
    }

    try {
        const res = await fetch("http://localhost:8080/api/favorites/my", {
            headers: { "Authorization": "Bearer " + token }
        });

        const container = document.getElementById("favorites");
        container.innerHTML = "";

        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center;color:gray;">お気に入りの取得に失敗しました。</p>`;
            return;
        }

        const favorites = await res.json();
        if (favorites.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:gray;">お気に入りはまだありません。</p>`;
            return;
        }

        favorites.forEach(note => {
            const card = document.createElement("div");
            card.className = "card";
            const content = note.content || "";
            const shortContent = content.length > 80 ? content.slice(0, 80) + '…' : content;
            card.innerHTML = `
                <img src="${note.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${note.title || ''}">
                <div class="card-body">
                    <h3>${note.title || '無題'}</h3>
                    <p>${shortContent}</p>
                    <div class="read-btn" onclick="viewNoteDetail(${note.id})">read<br>more</div>
                    <button class="unfavorite-btn" onclick="removeFavorite(${note.id})">💔 解除</button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("お気に入り読み込みエラー:", err);
        document.getElementById("favorites").innerHTML =
            `<p style="text-align:center;color:gray;">お気に入りデータの取得に失敗しました。</p>`;
    }
}

// ===== お気に入り登録 =====
async function addFavorite(noteId) {
    const token = localStorage.getItem("token");
    if (!token) return alert("ログインが必要です。");

    try {
        const res = await fetch(`http://localhost:8080/api/favorites/${noteId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("お気に入りに追加しました！");
            loadFavoriteNotes();
        } else {
            alert("追加に失敗しました。");
        }
    } catch (e) {
        console.error("お気に入り追加エラー:", e);
    }
}

// ===== お気に入り解除 =====
async function removeFavorite(noteId) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("お気に入りを解除しますか？")) return;

    try {
        const res = await fetch(`http://localhost:8080/api/favorites/${noteId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("お気に入りを解除しました。");
            loadFavoriteNotes();
        } else {
            alert("解除に失敗しました。");
        }
    } catch (e) {
        console.error("お気に入り解除エラー:", e);
    }
}

// ===== 詳細ページへ移動 =====
function viewNoteDetail(id) {
    window.location.href = `notes-detail.html?id=${id}`;
}

// ===== ページ読み込み時に実行 =====
document.addEventListener("DOMContentLoaded", loadFavoriteNotes);
