window.addEventListener("DOMContentLoaded", async () => {
    const navCta = document.querySelector(".nav-cta");
    const token = localStorage.getItem("token");

    if (!token) {
        navCta.innerHTML = `
      <a href="/login.html" class="btn-outline">ログイン</a>
      <a href="/register.html" class="btn">登録</a>`;
        return;
    }

    try {
        const res = await fetch("http://localhost:8080/api/user/me", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error();
        const user = await res.json();
        const name = user.username || localStorage.getItem("username") || "ユーザー";

        navCta.innerHTML = `
      <div class="userbar">
        <span class="userbar-username">👤 ${name}</span>
        <span class="divider"></span>
        <a href="/user.html">マイページ</a>
        <span class="divider"></span>
        <button onclick="logout()">ログアウト</button>
      </div>`;
    } catch {
        navCta.innerHTML = `
      <a href="/login.html" class="btn-outline">ログイン</a>
      <a href="/register.html" class="btn">登録</a>`;
    }
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    location.reload();
}
// ===== 現在ページのリンクを自動で強調表示 =====
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.split("/").pop(); // 現在のファイル名
    document.querySelectorAll(".nav-links a").forEach(a => {
        if (a.getAttribute("href") === path) {
            a.classList.add("active");
        }
    });
});
