# 美術 prompt 範本（2026-11-16）

分工：**GPT 畫元件**（建築、人物、裝飾），**Gemini 寫地形程式**（單一 HTML 樣本，Claude 再移植進 App）。
角度一律 **2:1 等角（斜 45 度）**、光從左上；元件表一律 **3×3、純洋紅 #FF00FF 背景**（程式自動切開去背）。
已產出：`docs/art/gpt-buildings-1.png`（定調圖）、`gpt-buildings-2.png`、`gpt-characters-1.png`；Gemini 樣本在 `docs/prototypes/`（v2 風格已採用）。

---

## GPT ① 建築元件表（第一張＝定調圖）
```
Create a game asset sheet for a cozy, original isometric building game set in biblical times.

LAYOUT: one square image, a 3x3 grid of 9 separate objects. Each object is centered in its own cell with generous empty space around it. Objects must NOT touch each other or the image edges.
BACKGROUND: solid flat pure magenta #FF00FF everywhere. No gradient, no texture, no floor, no ground patch, no cast shadow on the background.

VIEW: strict 2:1 isometric (dimetric) projection, the same camera angle for all 9 objects. Light comes from the upper-left, so the left-facing sides are lit and the right-facing sides are darker.
SCALE: all objects drawn at the same scale, as if placed on the same game map.
STYLE: cute, clean, original illustration; soft flat colors with gentle shading (light, mid and shadow tones); slightly rounded, chunky shapes; small simple details; warm and friendly. Not pixel art, no thick black outlines, no text, no labels, no people.
PALETTE: white stone #F4EBDD, mud brick #D9B98C, wood #C98B55, red clay tile #E86F51, teal roof #3BB3BD, tent cloth #FFFFFF, gold #E8B84A, greenery #9CCB45 / #4E8F48.

THE 9 OBJECTS (row by row):
1. The Tabernacle ... 9. The Ark of the Covenant（清單依需要替換）
```

## GPT ② 之後每一張（附上定調圖）
```
Using EXACTLY the same style, camera angle, lighting, scale and palette as the attached image, create another 3x3 asset sheet on solid pure magenta #FF00FF background, same layout rules (9 separate objects, not touching, no floor, no shadows on background, no text).
The 9 objects: [下一批 9 個]
```

## GPT ③ 人物（已完成第一張）
```
Using the same style, lighting and palette as the attached image, create a 3x3 character sheet on solid pure magenta #FF00FF background (no floor, no shadows on the background, no text).
Cute chibi characters in ancient biblical-era clothing (simple robes, sashes, headscarves, sandals): very big round head, small body, about 2.5 heads tall, soft rounded shapes — NOT blocky like Minecraft or Roblox.
Same 2:1 isometric camera angle as the buildings, drawn at a scale that fits next to the buildings (a character is about one-third the height of the small house).
Row 1: a young man — walking pose facing down-right; walking pose facing up-right (seen from behind); standing idle facing down-right.
Row 2: a young woman — the same three poses.
Row 3: an elderly bearded shepherd with a staff — walking down-right; walking up-right; and a small white sheep facing down-right.
```

## GPT ④ 裝飾表（待做）
```
Using EXACTLY the same style, camera angle, lighting, scale and palette as the attached image, create a 3x3 nature asset sheet on solid pure magenta #FF00FF background. Same rules: 9 separate objects, not touching each other or the edges, no floor, no shadows on the background, no text.
Plants and rocks of the ancient Middle East, cute and rounded, soft flat shading:
1. A large olive tree with a twisted trunk.
2. A tall cedar of Lebanon.
3. A date palm tree.
4. A fig tree with broad leaves.
5. A small cluster of three bushes with tiny white and pink flowers.
6. A patch of golden wheat.
7. A group of three desert rocks in warm sandstone colors.
8. A small reed clump for a riverbank.
9. A big round "tree of life" with a few golden fruits, slightly larger and more special than the other trees.
```

## Gemini 第三版（在 v2 的同一個對話裡貼；待做）
```
這版的風格很好，請保留現在的軟陶外觀，再加入／修正以下幾點，只輸出完整 HTML：
1. 每個元件可以各自調整「顯示比例」（底部卡片上加 ＋／－ 按鈕，存進狀態 JSON），因為高的物件（豎琴、約櫃）不能只照佔地寬度放大。預設：豎琴、日晷 0.6；約櫃、祭壇 0.75；其他 1.0。人物大約是小房子高度的三分之一。
2. 把第一版的擴張方式加回來：按「擴張」時，在園子邊緣的沙漠上用發光虛線標出 3 塊形狀隨機的候選地（圓潤有機的形狀，不是方格），點其中一塊，它在 1.5 秒內變綠（顏色漸變＋小草小花冒出來）接到園子上；如果碰到河，河會延伸過去。園子的形狀因此每次都不一樣。
3. 支援手機：改用 Pointer Events，單指拖曳畫面、雙指縮放、點一下放置；拖動已放置的建築也要能用手指。
4. 園子裡加 1～2 處較高的圓潤台地（軟陶質感、柔和的懸崖），建築只能整棟放在同一層上。
5. 加回：動畫開關、畫面上下邊緣輕微移軸模糊與四角暗角、落葉、鳥影、沙漠細沙、河水流動光點。
6. 上傳裝飾表後，第 9 格（生命樹）放在園子中央當生命樹，其餘樹、花、石頭隨機散布，不要壓到河和建築。
```

## 世界地圖（待做，之後寫）
- 地圖裝飾元件表（GPT）：雪山（黑門山、亞拉臘山）、紅岩山（西奈山）、香柏樹林、棕櫚綠洲、金字塔、巴比倫塔廟、城牆小城、帆船、鯨魚。角度要配合世界地圖（北朝上、從正上方稍斜），prompt 屆時再寫。
