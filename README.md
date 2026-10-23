# 12 Axes

英文政治价值观自测网站，黄色主视觉，原创 72 题，浏览器本地计分，无需登录、无广告，提供访客同意后启用的 Google Analytics 和 Microsoft Clarity。

线上地址：https://12axespoliticaltest.online

## 本地运行

需要 Node.js 20+，无第三方运行依赖。

```sh
npm run dev
```

开发服务器：http://localhost:4173

## 构建

```sh
npm run build
```

静态产物位于 `dist/`。首页、测试入口、12 轴介绍、计分方法、关于、隐私、条款和存储政策均生成独立 HTML，带 canonical、robots 和 sitemap。答题及结果需要 JavaScript。

## 功能

- 36 题快速版 / 72 题完整版，每种均覆盖全部 12 轴。
- 五档回答、上一题、键盘作答、保存和恢复进度。
- 雷达图、双向比例、逐轴说明、PNG 下载、打印/PDF、可选链接分享。
- 答案和最近结果仅保存在浏览器 localStorage；页脚可清除。
- 分享链接的 URL fragment 编码 12 个得分与版本，不含逐题答案；任何持有链接的人均可查看，不能撤销。
- 不发送答题结果到服务器，不匹配政党或公众人物，不声称科学测量。

## 文件

- `src/content.js`：原创维度、题库和题目方向。
- `src/scoring.js`：选题、计分与分享链接解析。
- `src/app.js`：答题状态、路由、存储、分享和页面行为。
- `src/views.js`：页面文案、静态内容和SEO元信息。
- `src/chart.js`：SVG 雷达图和 PNG 导出。
- `src/styles.css`：参考站布局与响应式黄色视觉样式。
- `src/quiz.css`：答题卡片、分段进度与自动前进控件。
- `src/analytics.js`：GA4 页面浏览统计、Clarity 公共页面录制及统计偏好。
- `src/analytics.css`：统计偏好面板样式。
- `public/fonts/`：自托管 Sora 与 Poppins 字体及 SIL OFL 授权。
- `public/portraits/`：公共领域肖像和出处说明，仅作示例卡插图。
- `scripts/build.mjs`：语法编译检查和静态页面生成。
- `research.md`：Google 前十结果调研、参考网站拆解、实现建议。

## 部署

Cloudflare Pages 项目 `12axes-lashreel` 已连接 `atsince/12axes` 的 `main` 分支。推送提交后自动构建：

- Build command: `npm run build`
- Output directory: `dist`
- Custom domain: `12axespoliticaltest.online`
- DNS: 根域 `@` CNAME → `12axes-lashreel.pages.dev`（由 Pages 自定义域名流程配置）
- Pages `_redirects` 仅保留路径重定向；按域名匹配的跳转应在 Cloudflare Redirect Rules 配置。

仓库不包含 Cloudflare 或 GitHub 凭据。

## 访问统计

- GA4 衡量 ID：`G-7PPSG0RGJ2`，媒体资源 `560470776`，后台：https://analytics.google.com/analytics/web/#/a350593005p560470776/reports/intelligenthome
- Clarity 项目：`z24zihjej1`，后台：https://clarity.microsoft.com/projects/view/z24zihjej1/gettingstarted
- 仅在 `12axespoliticaltest.online` 和 `www.12axespoliticaltest.online` 加载统计；本地和 Pages 预览域名不采集。
- 访客选择 Allow analytics 后才加载脚本，页脚 Analytics preferences 可以撤回。选择保存在 `12axes.analytics-consent.v1`；清理答题数据不会改变统计选择。
- GA4 手动记录页面浏览；切换题目和重复渲染不增加页面浏览数。GA 后台的增强型衡量已关闭，避免自动采集表单、出站链接和重复页面浏览。不要开启广告或 Google Signals。
- Clarity 不加载于 `/test`、`/results`，也不在带查询参数或结果片段的初始页面加载。公共页面与答题/结果页面之间使用整页导航隔离录制脚本。
- 不设置用户身份，不发送答案和得分；GA 页面地址只保留已知路由，去除查询参数和 fragment，外部来源只保留 origin。
- 统计 ID 是公开客户端标识，配置随代码构建，不需要服务器密钥。

## 计分与限制

每项回答取 +2、+1、0、−1、−2，再乘以题目方向。每轴第一极得分为 `round(50 + 25 × 平均方向化回答)`，第二极为100减第一极。雷达图绘制第一极得分，面积不代表表现优劣。

这是独立原创教育问卷，未经独立科学验证。与其他名为12axes的网站没有关联，得分不可直接互换。

原创代码与题库使用 MIT License；字体遵循各自的 SIL OFL，公共领域肖像来源见对应 credits.txt。不包含其他测试网站保留版权的题库、资料或人物向量。
