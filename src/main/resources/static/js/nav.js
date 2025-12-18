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

        const dropdownData = window.createUserDropdownHTML(user);
        navCta.innerHTML = dropdownData.html;
        window.setupDropdownOutsideClick(dropdownData.wrapperId);
    } catch {
        navCta.innerHTML = `
      <a href="/login.html" class="btn-outline">ログイン</a>
      <a href="/register.html" class="btn">登録</a>`;
    }
});

// 生成用户下拉菜单HTML的辅助函数（全局函数）
window.createUserDropdownHTML = function(user) {
    // 优先显示真实姓名（firstName + lastName）
    let name = "ユーザー";
    if (user.firstName || user.lastName) {
        const nameParts = [];
        if (user.firstName) nameParts.push(user.firstName);
        if (user.lastName) nameParts.push(user.lastName);
        name = nameParts.join(" ");
    } else if (user.username) {
        name = user.username;
    }

    // 处理头像URL
    let avatarUrl = user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    if (avatarUrl && avatarUrl.startsWith('/')) {
        avatarUrl = 'http://localhost:8080' + avatarUrl;
    }

    const wrapperId = 'userbar-wrapper-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    return {
        html: `
      <div class="userbar-wrapper" id="${wrapperId}">
        <button class="userbar-toggle" onclick="toggleUserDropdown('${wrapperId}')" aria-label="用户菜单">
          <img src="${avatarUrl}" alt="${name}" class="userbar-avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/616/616408.png'">
          <span class="userbar-username">${name}</span>
          <svg class="userbar-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="userbar-dropdown" id="${wrapperId}-dropdown" style="display: none;">
          <div class="userbar-dropdown-header">
            <img src="${avatarUrl}" alt="${name}" class="userbar-dropdown-avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/616/616408.png'">
            <div class="userbar-dropdown-info">
              <div class="userbar-dropdown-name">${name}</div>
              <div class="userbar-dropdown-email">マイページ</div>
            </div>
          </div>
          <div class="userbar-dropdown-divider"></div>
          <a href="/user.html" class="userbar-dropdown-item" onclick="closeUserDropdown('${wrapperId}')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
              <path d="M8 9C4.667 9 2 10.567 2 12.5V16H14V12.5C14 10.567 11.333 9 8 9Z" fill="currentColor"/>
            </svg>
            マイページ
          </a>
          <a href="/profile-edit.html" class="userbar-dropdown-item" onclick="closeUserDropdown('${wrapperId}')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.3333 2.00001C11.5083 1.82501 11.7164 1.68726 11.9448 1.59466C12.1732 1.50207 12.4174 1.45654 12.6637 1.46068C12.9099 1.46482 13.1529 1.51856 13.3779 1.61846C13.6029 1.71836 13.8055 1.86223 13.9742 2.04084C14.1428 2.21945 14.2741 2.42924 14.3606 2.65776C14.4472 2.88628 14.4871 3.12901 14.478 3.37267C14.4689 3.61633 14.4109 3.85595 14.3075 4.07834C14.2041 4.30074 14.0575 4.50151 13.8767 4.66834L13.3333 5.20668L10.7933 2.66668L11.3333 2.00001ZM9.66667 3.73334L12.2067 6.27334L5.5 13H3V10.5L9.66667 3.73334Z" fill="currentColor"/>
            </svg>
            プロフィール編集
          </a>
          <div class="userbar-dropdown-divider"></div>
          <button class="userbar-dropdown-item logout" onclick="logout(); closeUserDropdown('${wrapperId}');">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ログアウト
          </button>
        </div>
      </div>`,
        wrapperId: wrapperId
    };
};

window.setupDropdownOutsideClick = function(wrapperId) {
    setTimeout(() => {
        document.addEventListener('click', function(event) {
            const wrapper = document.getElementById(wrapperId);
            if (wrapper && !wrapper.contains(event.target)) {
                window.closeUserDropdown(wrapperId);
            }
        }, { once: true });
    }, 0);
};

window.toggleUserDropdown = function(wrapperId) {
    const dropdown = document.getElementById(wrapperId + '-dropdown');
    const chevron = document.querySelector(`#${wrapperId} .userbar-chevron`);
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
        if (chevron) chevron.classList.add('open');
    } else {
        dropdown.style.display = 'none';
        if (chevron) chevron.classList.remove('open');
    }
};

window.closeUserDropdown = function(wrapperId) {
    const dropdown = document.getElementById(wrapperId + '-dropdown');
    const chevron = document.querySelector(`#${wrapperId} .userbar-chevron`);
    if (dropdown) dropdown.style.display = 'none';
    if (chevron) chevron.classList.remove('open');
};

window.logout = function() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    location.reload();
};

// ===== 現在ページのリンクを自動で強調表示 =====
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.split("/").pop(); // 現在のファイル名
    document.querySelectorAll(".nav-links a").forEach(a => {
        if (a.getAttribute("href") === path) {
            a.classList.add("active");
        }
    });
});
