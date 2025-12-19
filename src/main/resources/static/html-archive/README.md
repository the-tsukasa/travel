# HTML 文件封存目录

## 📦 说明

此目录包含项目早期的 HTML 静态页面文件，这些文件已被 React 单页应用（SPA）替代。

## 🚀 迁移状态

- ✅ **已完成**：所有功能已迁移到 React 应用
- ✅ **已封存**：旧的 HTML 文件已移动到本目录
- ✅ **已更新**：所有路由现在由 `ReactController` 处理，返回 React 应用

## 📁 文件列表

### HTML 页面
- `admin.html` → React 路由: `/admin`
- `login.html` → React 路由: `/login`
- `register.html` → React 路由: `/register`
- `spot.html` → React 路由: `/spot`
- `notes.html` → React 路由: `/notes`
- `notes-admin.html` → React 路由: `/notes-admin`
- `notes-create.html` → React 路由: `/notes-create`
- `notes-detail.html` → React 路由: `/notes-detail/:id`
- `notes-my.html` → React 路由: `/notes-my`
- `profile-edit.html` → React 路由: `/profile-edit`
- `user.html` → React 路由: `/user`

### 相关资源
- `css/` - 旧的 CSS 样式文件
- `js/` - 旧的 JavaScript 文件

## 🔄 路由映射

旧的 HTML 文件路径会自动重定向到对应的 React 路由：

| 旧路径 | React 路由 |
|--------|-----------|
| `/spot.html` | `/spot` |
| `/login.html` | `/login` |
| `/register.html` | `/register` |
| `/admin.html` | `/admin` |
| `/notes-admin.html` | `/notes-admin` |
| `/notes-create.html` | `/notes-create` |
| `/notes-detail.html` | `/notes-detail/:id` |
| `/notes-my.html` | `/notes-my` |
| `/notes.html` | `/notes` |
| `/profile-edit.html` | `/profile-edit` |
| `/user.html` | `/user` |

## ⚠️ 注意事项

1. **不要删除此目录**：保留这些文件作为历史参考
2. **不再使用**：这些文件不再被 Spring Boot 提供访问
3. **React 优先**：所有前端路由现在由 React Router 处理

## 📅 封存日期

2025-12-20

