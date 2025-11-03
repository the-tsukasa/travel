// ==============================
// user-likes.js
// 功能：ユーザーのいいねしたノート表示・管理
// ==============================

// ===== いいねしたノート一覧を読み込み =====
async function loadLikedNotes() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("未ログインユーザー");
        return;
    }

    try {
        const res = await fetch("http://localhost:8080/api/likes/my", {
            headers: { "Authorization": "Bearer " + token }
        });

        const container = document.getElementById("likes");
        container.innerHTML = "";

        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center;color:gray;">いいねした投稿の取得に失敗しました。</p>`;
            return;
        }

        const likes = await res.json();
        if (likes.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:gray;">いいねした投稿はまだありません。</p>`;
            return;
        }

        likes.forEach(note => {
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
                    <button class="unlike-btn" onclick="removeLike(${note.id})">💔 いいね解除</button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("いいねした投稿読み込みエラー:", err);
        document.getElementById("likes").innerHTML =
            `<p style="text-align:center;color:gray;">いいねした投稿データの取得に失敗しました。</p>`;
    }
}

// ===== いいね登録 =====
async function addLike(noteId) {
    const token = localStorage.getItem("token");
    if (!token) return alert("ログインが必要です。");

    try {
        const res = await fetch(`http://localhost:8080/api/likes/${noteId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("いいねしました！");
            loadLikedNotes();
        } else {
            alert("いいねに失敗しました。");
        }
    } catch (e) {
        console.error("いいね追加エラー:", e);
    }
}

// ===== いいね解除 =====
async function removeLike(noteId) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("いいねを解除しますか？")) return;

    try {
        const res = await fetch(`http://localhost:8080/api/likes/${noteId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("いいねを解除しました。");
            loadLikedNotes();
        } else {
            alert("解除に失敗しました。");
        }
    } catch (e) {
        console.error("いいね解除エラー:", e);
    }
}

// ===== 詳細ページへ移動 =====
function viewNoteDetail(id) {
    window.location.href = `notes-detail.html?id=${id}`;
}

// ===== ページ読み込み時に実行 =====
document.addEventListener("DOMContentLoaded", loadLikedNotes);

