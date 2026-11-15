# 漢威牧區管理（clc-smallgroup-dx）

小組／牧區管理 App。掛在 DX 底下：`https://clc-dx04.pages.dev/sg/`（由 DX 開一頁、上方 DX Header、下方框住本站）。
架構與決定：見 Claude 專案文件《漢威牧區管理-架構》。開發規則：《通用開發準則》《DX 架構子站開發準則》。

## 目前狀態：靜態預覽（假資料）
- 還沒有接 Firebase。登入頁用「預覽身分」（區長／小組長／組員）進入；App 列上的 🧪 按鈕可以隨時切換身分。正式版會拿掉。
- 資料存在瀏覽器 localStorage（`sg_mockdb_v2`）。後台 → 資料 → 重設假資料，可回到初始狀態。
- 人名、電話、Email、生日、貼文都是虛構的；小組名稱、年度紀錄的合計數字、牧養手冊來自 Darren 的 Excel。

## 頁面
| 頁面 | 誰看得到 | 內容 |
|---|---|---|
| `login.html` | 所有人 | Google 登入／Email＋密碼（靜態階段用預覽身分） |
| `index.html` 首頁 | 所有人 | Hello＋今日經文、今日任務、本週點名（小組長以上）、壽星、小組旅程、近期活動、動態牆 |
| `care.html` 牧養 | 小組長以上 | 每週點名、新朋友、小組基金（只記收支）、安德烈探訪、年度大總表、會議記錄、活動行事曆、牧養手冊 |
| `fellowship.html` 團契 | 所有人 | 代禱事項、QT 分享、見證、宣教旅程地圖、壽星 |
| `members.html` 名冊 | 小組長以上 | 照 SR 通訊錄；可依服事篩選（服事團隊）；個人頁「資料｜課程｜關懷」 |
| `me.html` 我的 | 所有人（只有本人） | 每日紀錄月曆、經文卡冊、徽章、收到的禮物、我的資料 |
| `intakes.html`、`join.html` | 小組長以上／新朋友 | 照 SR 的新朋友名單與登記表（一般字級） |
| `admin-settings.html` 後台 | 區長 | 小組與聚會時間、每日經文、任務與獎勵開關、選項、資料匯出／匯入 |

## 程式
| 檔案 | 用途 |
|---|---|
| `js/sg-shell.js`、`css/sg-app.css` | Header（DX 標準）、App 列（預覽身分、齒輪：深淺色／後台／登出）、導覽、共用工具 |
| `js/sg-feed.js` | 動態牆、按讚、留言、為你禱告、發文、每日任務、經文卡、送禮 |
| `js/sg-home.js`、`sg-care.js`、`sg-fellow.js`、`sg-me.js`、`sg-admin.js` | 各頁 |
| `js/sg-data.js`、`sg-roster.js`、`sg-export.js`、`css/sg-roster.css` | 名冊，由 SR 的 `sr-*` 改寫 |
| `js/sg-mockdb.js`、`sg-mock-data.js`、`sg-seed-static.js` | 假資料庫、初始假資料、固定資料（年度紀錄、手冊、經文、旅程） |

## 搬家手冊（接上 Firebase 後補完）
1. GitHub：Settings → Transfer，或對方複製本 repo（`clc-smallgroup-<名字>`）。
2. Firebase：建立專案 → 啟用 Google 登入 → 授權網域加上部署網址 → 發布 repo 裡的 `firestore.rules` → 把設定填進 `clc-site.json`。
3. Cloudflare Pages：連接 repo，建置指令留空，輸出目錄 `/`。
4. 資料：舊站後台「匯出全部資料」→ 新站後台「匯入」。
