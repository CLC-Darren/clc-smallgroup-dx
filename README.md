# 漢威牧區管理（clc-smallgroup-dx）

小組／牧區管理 App。掛在 DX 底下：`https://clc-dx04.pages.dev/sg/`（由 DX 開一頁、上方 DX Header、下方框住本站）。
架構與決定：見 Claude 專案文件《漢威牧區管理-架構》。開發規則：《通用開發準則》《DX 架構子站開發準則》。

## 目前狀態：靜態預覽（假資料）
- 沒有登入、沒有 Firebase；一律以「區長」身分顯示。
- 資料存在瀏覽器 localStorage（`sg_mockdb_v1`），「更多 → 重設假資料」可回到初始狀態。
- 人名、電話、Email、生日都是虛構的。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` 總覽、`members.html` 名冊、`care.html` 牧養、`fellowship.html` 團契、`more.html` 更多 | 五個分頁 |
| `js/sg-shell.js`、`css/sg-app.css` | 導覽列（手機底部、電腦左側）、深淺色 |
| `js/sg-data.js`、`js/sg-roster.js`、`js/sg-export.js`、`css/sg-roster.css` | 名冊，由 SR 的 `sr-*` 改寫 |
| `js/sg-mockdb.js`、`js/sg-mock-data.js` | 假資料庫與初始假資料（接 Firebase 時移除） |
| `clc-site.json` | 站名、key、Firebase 設定（目前 null） |

## 搬家手冊（接上 Firebase 後補完）
1. GitHub：Settings → Transfer，或對方複製本 repo（`clc-smallgroup-<名字>`）。
2. Firebase：建立專案 → 啟用 Google 登入 → 授權網域加上部署網址 → 發布 repo 裡的 `firestore.rules` → 把設定填進 `clc-site.json`。
3. Cloudflare Pages：連接 repo，建置指令留空，輸出目錄 `/`。
4. 資料：舊站後台「匯出全部資料」→ 新站後台「匯入」。
