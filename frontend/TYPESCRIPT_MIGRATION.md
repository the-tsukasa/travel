# TypeScript 迁移指南

## ✅ 已完成的工作

### 1. 配置和类型定义
- ✅ 安装 TypeScript 和相关依赖（需要运行 `npm install`）
- ✅ 创建 `tsconfig.json` 和 `tsconfig.node.json`
- ✅ 创建类型定义文件 `src/types/index.ts`
- ✅ 更新 `vite.config.js` → `vite.config.ts`
- ✅ 更新 `index.html` 入口文件引用

### 2. 工具函数和服务
- ✅ `src/utils/auth.js` → `src/utils/auth.ts`
- ✅ `src/utils/locationMapper.js` → `src/utils/locationMapper.ts`
- ✅ `src/services/api.js` → `src/services/api.ts`

### 3. 入口文件
- ✅ `src/main.jsx` → `src/main.tsx`
- ✅ `src/App.jsx` → `src/App.tsx`

### 4. 组件文件
- ✅ `src/components/common/ScrollToTop.jsx` → `.tsx`
- ✅ `src/components/common/SearchAndSort.jsx` → `.tsx`
- ✅ `src/components/common/SpotCard.jsx` → `.tsx`
- ✅ `src/components/common/WeatherWidget.jsx` → `.tsx`
- ✅ `src/components/layout/NavBar.jsx` → `.tsx`
- ✅ `src/components/layout/Footer.jsx` → `.tsx`
- ✅ 更新导出文件 `index.js` → `index.ts`

## 📋 待迁移的文件

### 组件文件
- [ ] `src/components/notes/NoteCard.jsx` → `NoteCard.tsx`
- [ ] `src/components/travel/TravelPackage.jsx` → `TravelPackage.tsx`
- [ ] `src/features/map/Map.jsx` → `Map.tsx`
- [ ] `src/features/map/Hotspot.jsx` → `Hotspot.tsx`

### 页面文件（Pages）
- [ ] `src/pages/Home.jsx` → `Home.tsx`
- [ ] `src/pages/Login.jsx` → `Login.tsx`
- [ ] `src/pages/Register.jsx` → `Register.tsx`
- [ ] `src/pages/Notes.jsx` → `Notes.tsx`
- [ ] `src/pages/NotesDetail.jsx` → `NotesDetail.tsx`
- [ ] `src/pages/NotesCreate.jsx` → `NotesCreate.tsx`
- [ ] `src/pages/NotesMy.jsx` → `NotesMy.tsx`
- [ ] `src/pages/NotesAdmin.jsx` → `NotesAdmin.tsx`
- [ ] `src/pages/Spot.jsx` → `Spot.tsx`
- [ ] `src/pages/SpotDetail.jsx` → `SpotDetail.tsx`
- [ ] `src/pages/User.jsx` → `User.tsx`
- [ ] `src/pages/ProfileEdit.jsx` → `ProfileEdit.tsx`
- [ ] `src/pages/Admin.jsx` → `Admin.tsx`
- [ ] `src/pages/UsersAdmin.jsx` → `UsersAdmin.tsx`
- [ ] `src/pages/Notifications.jsx` → `Notifications.tsx`
- [ ] `src/pages/StatisticsReport.jsx` → `StatisticsReport.tsx`

### 其他文件
- [ ] `src/constants/index.js` → `index.ts`
- [ ] `src/components/notes/index.js` → `index.ts`
- [ ] `src/components/travel/index.js` → `index.ts`
- [ ] `src/features/map/index.js` → `index.ts`

## 🚀 下一步操作

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 逐步迁移剩余文件

对于每个 `.jsx` 或 `.js` 文件，迁移步骤：

1. **重命名文件**：`.jsx` → `.tsx` 或 `.js` → `.ts`

2. **添加类型注解**：
   - 为组件 props 添加接口定义
   - 为 state 添加类型
   - 为函数参数和返回值添加类型
   - 使用 `import type` 导入类型

3. **示例迁移模式**：

```typescript
// 之前 (JSX)
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState('')
  // ...
}

// 之后 (TSX)
interface MyComponentProps {
  prop1: string
  prop2?: number
}

const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>('')
  // ...
}
```

4. **使用已定义的类型**：
   - 从 `src/types/index.ts` 导入类型
   - 使用 `UserDTO`, `NotesDTO`, `Spot`, `NotificationDTO` 等

### 3. 修复类型错误

运行 TypeScript 检查：
```bash
npm run build
# 或使用 IDE 的类型检查功能
```

常见问题：
- 使用 `as` 进行类型断言（谨慎使用）
- 使用可选链 `?.` 和空值合并 `??`
- 为可能为 `null` 的值添加类型检查

### 4. 测试验证

确保所有功能正常工作：
```bash
npm run dev
```

## 📝 类型定义说明

所有类型定义在 `src/types/index.ts` 中，包括：

- **枚举**：`NoteStatus`
- **DTO 类型**：`UserDTO`, `NotesDTO`, `Spot`, `NotificationDTO`
- **请求类型**：`LoginRequest`, `RegisterRequest`, `CreateNotesRequest`, `UpdateProfileRequest`
- **响应类型**：`ApiResponse`, `PageResponse`, `ActionResponse`
- **工具类型**：`AuthStatus`, `TokenPayload`, `LocationCoordinates`

## 💡 提示

1. **渐进式迁移**：可以同时保留 `.jsx` 和 `.tsx` 文件，TypeScript 可以逐步引入
2. **类型安全**：优先使用已定义的类型，避免使用 `any`
3. **IDE 支持**：使用 VS Code 或 WebStorm 等 IDE 可以获得更好的类型提示
4. **错误处理**：使用 `try-catch` 时，错误类型为 `unknown`，需要类型断言

## 🔧 配置说明

- `tsconfig.json`：主 TypeScript 配置
- `tsconfig.node.json`：Node.js 环境配置（用于 vite.config.ts）
- `vite.config.ts`：Vite 构建配置（支持 TypeScript）

## ✨ 优势

迁移完成后，你将获得：
- ✅ 编译时类型检查
- ✅ 更好的 IDE 自动补全
- ✅ 更安全的代码重构
- ✅ 自文档化的代码
- ✅ 减少运行时错误
