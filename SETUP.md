# それいゆHP：microCMS ＋ Cloudflare Pages 設定手順

## 全体のしくみ

- **変わらない部分**（トップ・理念・取り組み・バリューなど）：`public/` のHTMLで固定。先方は触れない
- **変わる部分**（スタッフ・お知らせ／勉強会）：先方が microCMS の管理画面で更新
- 表示するときに Cloudflare が microCMS からデータを取ってページを組み立てる（Pages Functions）
- **再ビルドやWebhookは不要**。先方が「公開」を押すと、約1分でサイトに反映される

```
public/            固定ページ（index.html、CSS、画像など）
functions/
  staff/index.js     /staff/           スタッフ一覧
  staff/[slug].js    /staff/sato       スタッフ個人ページ（名刺QRの飛び先）
  news/index.js      /news/            お知らせ・勉強会一覧（?category=勉強会 で絞り込み）
  news/[id].js       /news/xxxx        お知らせ詳細
  api/news.js        /api/news?limit=3 トップの「最新のお知らせ」用JSON
lib/microcms.js    共通処理（microCMS通信、ページの枠、キャッシュ秒数など）
```

---

## 1. microCMS の準備

1. https://microcms.io で登録 → **Hobby（無料）プラン**でサービスを作成
   - サービスID（例：`soleil`）→ 管理画面のURLは `https://soleil.microcms.io`
   - 可能ならステーションのメールアドレスで登録する（持ち主をステーションにするため）

### API①　スタッフ

- API名：`スタッフ`　エンドポイント：**`staff`**　型：**リスト形式**

| フィールドID | 表示名 | 種類 | 備考 |
|---|---|---|---|
| `name` | 名前 | テキストフィールド | 必須 |
| `kana` | ふりがな | テキストフィールド | 任意 |
| `role` | 職種 | セレクトフィールド | 看護師／理学療法士／作業療法士／事務 など。必須 |
| `photo` | 写真 | 画像 | 任意（未登録なら丸い色ブロック） |
| `message` | ひとこと | テキストエリア | 改行がそのまま反映される |
| `qualifications` | 資格 | テキストフィールド | 任意 |
| `hobby` | 趣味・好きなこと | テキストフィールド | 任意 |
| `order` | 表示順 | 数字 | 小さい順に並ぶ（1, 2, 3…） |

**重要：コンテンツID ＝ 個人ページのURL**
- スタッフを追加するとき、コンテンツIDを `sato` のようなローマ字に変更する（編集画面の「コンテンツID」）
- → 個人ページは `https://（ドメイン）/staff/sato` になる。**名刺QRはこのURLで作る**
- 名刺を刷った後はIDを変えない
- 退職などでスタッフを削除・非公開にした場合、そのURLは**自動でスタッフ一覧へ転送**される（配った名刺のQRもリンク切れにならない）

### API②　お知らせ

- API名：`お知らせ`　エンドポイント：**`news`**　型：**リスト形式**

| フィールドID | 表示名 | 種類 | 備考 |
|---|---|---|---|
| `title` | タイトル | テキストフィールド | 必須 |
| `date` | 日付 | 日時 | 必須。新しい順に並ぶ |
| `category` | 種類 | セレクトフィールド | 選択肢は **`お知らせ`** と **`勉強会`**（この表記のまま） |
| `body` | 本文 | リッチエディタ | 太字・リンク・画像も入れられる |
| `thumbnail` | 画像 | 画像 | 任意 |

※ フィールドIDは上の表と完全に同じにしてください（コードがこの名前で読みにいくため）。

### APIキー

- 「サービス設定 → APIキー」で、**GETだけ許可**されたキーを使う（POST/PUT/DELETEはオフ）
- このキーはブラウザには出さず、Cloudflare の環境変数にだけ入れる

### 先方をメンバーに招待

- 「サービス設定 → メンバー」から管理者さんを招待（Hobbyは3人まで）

---

## 2. GitHub → Cloudflare Pages

1. このフォルダをGitHubにpush（`.dev.vars` は `.gitignore` 済み）
2. Cloudflare → Workers & Pages → 作成 → Pages → Gitに接続 → リポジトリを選択
3. ビルド設定
   - フレームワーク：なし
   - ビルドコマンド：**空欄**
   - ビルド出力ディレクトリ：**`public`**
4. 設定 → 環境変数（本番）に追加
   - `MICROCMS_SERVICE_DOMAIN` = `soleil`（サービスID）
   - `MICROCMS_API_KEY` = APIキー（「暗号化」にする）
5. 再デプロイ → `/staff/` と `/news/` が表示されれば完了
6. 独自ドメインを使う場合は「カスタムドメイン」から追加（ドメインはステーション名義で取得）

---

## 3. デザイン・固定ページ

- トップ（`public/index.html`）は既存デザインを移植済み。お知らせ欄だけ microCMS から最新3件を自動表示
- バナー画像は **`public/images/banner.png`** に置く
- 「中核となる取り組み」「バリュー」は **`public/core.html`、`public/values.html`** として置く
  - その際、ページ内のリンクを `index.html`→`/`、`staff.html`→`/staff/`、`news.html`→`/news/` に直し、`<style>`2つを `<link rel="stylesheet" href="/assets/style.css">` に置き換える
- スタッフ・お知らせページのヘッダー／フッターは `lib/microcms.js` で作っている。**住所・電話などフッターを変えたら、index.html と lib/microcms.js の両方を直す**
- 共通スタイルは `public/assets/style.css`

---

## 4. ローカルで確認したいとき

```bash
cp .dev.vars.example .dev.vars   # 値を入れる
npx wrangler pages dev
# → http://localhost:8788
```

---

## 運用メモ

- **反映時間**：公開してから最大約1分（`lib/microcms.js` の `CACHE_SECONDS`）
- **転送量**：Hobbyプランは月20GBまで。超えるとその月はAPIが止まる。写真は表示時に自動で縮小・WebP化し、Cloudflareでキャッシュしているので、この規模のサイトならまず届かない。先方は写真をそのままアップしてOK
- **microCMSが止まったとき**：スタッフ・お知らせページは「ただいま表示できません」になるが、トップなど固定ページは影響なし
