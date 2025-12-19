// ==============================
// user-likes.js
// 功能：ユーザーのいいねしたノート表示・管理
// ==============================

// ===== いいねしたノート一覧を読み込み =====
async function loadLikedNotes() {
    if (!TokenUtil.hasToken()) {
        const container = document.getElementById("likes");
        if (container) {
            container.innerHTML = `<p style="text-align:center;color:gray;">ログインが必要です。</p>`;
        }
        return;
    }

    try {
        const res = await ApiUtil.get("/api/likes/my");

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
    if (!TokenUtil.hasToken()) {
        if (confirm("ログインが必要です。ログインページに移動しますか？")) {
            window.location.href = '/login.html';
        }
        return;
    }

    try {
        const res = await ApiUtil.post(`/api/likes/${noteId}`, {});

        if (res.ok) {
            alert("いいねしました！");
            loadLikedNotes();
        } else {
            const errorData = await res.json().catch(() => ({}));
            alert(errorData.message || "いいねに失敗しました。");
        }
    } catch (e) {
        if (e.message === 'AUTHENTICATION_FAILED' || 
            e.message === 'TOKEN_EXPIRED' || 
            e.message === 'NOT_AUTHENTICATED') {
            return;
        }
        console.error("いいね追加エラー:", e);
        alert("いいねに失敗しました。");
    }
}

// ===== いいね解除 =====
async function removeLike(noteId) {
    if (!TokenUtil.hasToken()) return;

    if (!confirm("いいねを解除しますか？")) return;

    try {
        const res = await ApiUtil.delete(`/api/likes/${noteId}`);

        if (res.ok) {
            alert("いいねを解除しました。");
            loadLikedNotes();
        } else {
            const errorData = await res.json().catch(() => ({}));
            alert(errorData.message || "解除に失敗しました。");
        }
    } catch (e) {
        if (e.message === 'AUTHENTICATION_FAILED' || 
            e.message === 'TOKEN_EXPIRED' || 
            e.message === 'NOT_AUTHENTICATED') {
            return;
        }
        console.error("いいね解除エラー:", e);
        alert("解除に失敗しました。");
    }
}

// ===== 詳細ページへ移動 =====
function viewNoteDetail(id) {
    window.location.href = `notes-detail.html?id=${id}`;
}

// ===== ページ読み込み時に実行 =====
document.addEventListener("DOMContentLoaded", loadLikedNotes);

