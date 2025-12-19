/**
 * ================================
 *  notes-my.js
 *  TravelGo - マイノート管理ページ
 * ================================
 */

/**
 * @typedef {Object} Note
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {boolean} isApproved
 * @property {number} likesCount
 * @property {number} favoritesCount
 * @property {string} createdAt
 * @property {string} [imageUrl]
 * @property {string} [location]
 */

let currentUser = null;
let notesToDelete = null;

/**
 * ログイン状態確認
 * @returns {boolean}
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('ログインしてください');
        window.location.href = '/login.html';
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = {
            id: payload.sub,
            username: payload.username,
            role: payload.role
        };
        return true;
    } catch (e) {
        console.error('トークン解析エラー:', e);
        localStorage.removeItem('token');
        alert('ログイン期限が切れました。再度ログインしてください。');
        window.location.href = '/login.html';
        return false;
    }
}

/**
 * ユーザー情報表示
 */
function displayUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = `ようこそ、${currentUser.username}さん`;
        document.getElementById('userRole').textContent = `役割：${currentUser.role}`;
        document.getElementById('userInfo').classList.remove('hidden');
    }
}

/**
 * ノートを読み込む
 */
async function loadMyNotes() {
    try {
        const container = document.getElementById('notesContainer');
        container.innerHTML = '<div class="loading">ノートを読み込み中...</div>';

        const response = await fetch('/api/notes/my', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('読み込み失敗');
        }

        /** @type {Note[]} */
        const notes = await response.json();
        displayMyNotes(notes);
        updateStats(notes);

    } catch (error) {
        console.error('ノート読み込みエラー:', error);
        document.getElementById('notesContainer').innerHTML =
            '<div class="error">ノートの読み込みに失敗しました。後でもう一度お試しください。</div>';
    }
}

/**
 * ノート一覧表示
 * @param {Note[]} notes
 */
function displayMyNotes(notes) {
    const container = document.getElementById('notesContainer');

    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div class="no-notes">
                <h3>まだノートがありません</h3>
                <p>あなたの初めての旅行ノートを投稿してみましょう！</p>
                <a href="/notes-create.html" class="nav-btn" style="margin-top: 20px;">ノートを投稿</a>
            </div>
        `;
        return;
    }

    const notesHtml = notes.map(note => `
        <div class="note-card">
            <div class="note-header">
                <div>
                    <div class="note-title">${escapeHtml(note.title)}</div>
                </div>
                <div class="note-status ${note.isApproved ? 'status-approved' : 'status-pending'}">
                    ${note.isApproved ? '公開済み' : '審査中'}
                </div>
            </div>
            ${note.imageUrl ? `<img src="${note.imageUrl}" alt="ノート画像" class="note-image">` : ''}
            <div class="note-content">${escapeHtml(note.content)}</div>
            ${note.location ? `<div style="color: #667eea; font-size: 0.9rem; margin-bottom: 15px;">📍 ${escapeHtml(note.location)}</div>` : ''}
            <div class="note-meta">
                <div>
                    <span>❤️ ${note.likesCount || 0}</span>
                    <span style="margin-left: 15px;">⭐ ${note.favoritesCount || 0}</span>
                </div>
                <div>${new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="note-actions">
                <button class="action-btn btn-edit" onclick="editNote(${note.id})">編集</button>
                <button class="action-btn btn-delete" onclick="showDeleteModal(${note.id})">削除</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = notesHtml;
}

/**
 * 統計情報更新
 * @param {Note[]} notes
 */
function updateStats(notes) {
    const totalNotes = notes.length;
    const approvedNotes = notes.filter(n => n.isApproved).length;
    const pendingNotes = notes.filter(n => !n.isApproved).length;
    const totalLikes = notes.reduce((sum, n) => sum + (n.likesCount || 0), 0);

    document.getElementById('totalNotes').textContent = String(totalNotes);
    document.getElementById('approvedNotes').textContent = String(approvedNotes);
    document.getElementById('pendingNotes').textContent = String(pendingNotes);
    document.getElementById('totalLikes').textContent = String(totalLikes);
}


/**
 * 編集
 * @param {number} noteId
 */
function editNote(noteId) {
    window.location.href = `/notes-create.html?edit=${noteId}`;
}

/**
 * 削除確認モーダル表示
 * @param {number} noteId
 */
function showDeleteModal(noteId) {
    notesToDelete = noteId;
    document.getElementById('deleteModal').style.display = 'block';
}

/**
 * モーダル閉じる
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    notesToDelete = null;
}

/**
 * 削除確定
 */
async function confirmDelete() {
    if (!notesToDelete) return;

    try {
        const response = await fetch(`/api/notes/${notesToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('削除失敗');
        }

        closeDeleteModal();
        await loadMyNotes();
        alert('ノートを削除しました');

    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。後でもう一度お試しください。');
    }
}

/**
 * ログアウト（現在未使用）
 */
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

/**
 * HTMLエスケープ
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * ページ初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
    if (checkAuth()) {
        displayUserInfo();
        await loadMyNotes();
    }

    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.querySelector('.close').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeDeleteModal();
    });

    // 管理者ボタン制御
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.role === "ADMIN") {
                document.getElementById("adminButton").style.display = "inline-block";
            }
        } catch (error) {
            console.error("トークン解析エラー:", error);
        }
    }
});
