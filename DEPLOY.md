# WeekTrack — 部署到网页 & 添加到 iPhone 桌面

## 一、选择部署方案（三选一）

---

### 方案 A：Vercel（推荐，最简单）

**步骤：**

1. 打开 [vercel.com](https://vercel.com) → 注册/登录（用 GitHub 账号）
2. 点击 **"Add New Project"**
3. 在 GitHub 里新建一个仓库，把项目文件全部上传：
   ```
   2026-ToDoReminder/
   ├── index.html
   ├── manifest.json
   ├── sw.js
   ├── css/style.css
   ├── js/app.js
   └── icons/
       ├── icon-192.png
       ├── icon-512.png
       └── apple-touch-icon.png
   ```
4. 在 Vercel 里 Import 这个仓库，**Framework Preset** 选 `Other`，根目录留空，点击 **Deploy**
5. 部署完成后获得网址，如：`https://weektrack-xxx.vercel.app`

---

### 方案 B：Netlify（拖拽部署，最快）

**步骤：**

1. 打开 [app.netlify.com](https://app.netlify.com) → 注册/登录
2. 找到页面底部的 **"Deploy manually"** 区域
3. 把整个项目文件夹直接**拖拽**到那个区域
4. 等待约 10 秒，自动获得网址，如：`https://weektrack-abc123.netlify.app`

> 不需要 GitHub，最快方式。

---

### 方案 C：GitHub Pages（免费，适合长期托管）

**步骤：**

1. 在 GitHub 新建一个仓库，如 `weektrack`
2. 把所有项目文件上传到 `main` 分支根目录
3. 进入仓库 **Settings → Pages**
4. Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`
5. 保存后等约 1 分钟，获得网址：`https://你的用户名.github.io/weektrack`

---

## 二、添加到 iPhone 桌面（关键步骤）

部署完成拿到网址后：

1. **用 iPhone 的 Safari 浏览器**打开网址
   > ⚠️ 必须用 Safari，Chrome/Firefox 不支持添加到桌面

2. 点击底部工具栏中间的 **分享按钮**（方块+向上箭头图标）

3. 在弹出的菜单中下滑，找到并点击 **「添加到主屏幕」**

4. 名称默认是 `WeekTrack`，点击右上角 **「添加」**

5. 回到桌面，就能看到 WeekTrack 图标 —— 点击后全屏打开，和原生 App 体验一样！

---

## 三、已启用的 PWA 特性

| 特性 | 状态 | 说明 |
|------|------|------|
| 添加到桌面 | ✅ | `manifest.json` + `apple-touch-icon` |
| 全屏启动 | ✅ | `display: standalone`，无浏览器地址栏 |
| 状态栏适配 | ✅ | `apple-mobile-web-app-status-bar-style: default` |
| 离线访问 | ✅ | Service Worker 缓存核心资源 |
| 数据本地存储 | ✅ | LocalStorage，断网也能记录 |
| 启动图标 | ✅ | 512×512 PNG，iOS 自动裁圆角 |

---

## 四、更新应用

每次修改代码后：
- **Vercel / GitHub Pages**：push 代码到 GitHub，自动重新部署
- **Netlify**：重新拖拽文件夹到 Netlify 即可更新

已安装到桌面的 App 会在下次联网打开时自动获取新版本（Service Worker 自动更新）。

---

*文档版本：V1 | 更新日期：2026-02-25*
