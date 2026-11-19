// microCMS との通信と、ページ生成の共通処理
// 環境変数（Cloudflare Pages の設定画面で登録）:
//   MICROCMS_SERVICE_DOMAIN … 例: soleil （https://soleil.microcms.io の soleil 部分）
//   MICROCMS_API_KEY        … microCMS の「APIキー」（GET権限のみのキーを使う）
//   MICROCMS_BASE_URL       … （任意）ローカルテスト用の差し替え先

const SITE_NAME = 'それいゆ訪問看護ステーション';
const CACHE_SECONDS = 60; // 先方が更新してから最大この秒数で反映

function apiBase(env) {
  return env.MICROCMS_BASE_URL || `https://${env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1`;
}

export async function cms(env, path, params = {}) {
  const url = new URL(`${apiBase(env)}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { 'X-MICROCMS-API-KEY': env.MICROCMS_API_KEY },
    // Cloudflare 側でキャッシュし、microCMS の転送量を節約する
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`microCMS error ${res.status}`);
  return res.json();
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 改行を <br> に（テキストエリア用）
export const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');

// microCMS の画像は URL パラメータで縮小・WebP変換できる（転送量の節約）
export function imgUrl(image, width) {
  if (!image || !image.url) return '';
  return `${image.url}?w=${width}&fm=webp&q=80`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// セレクトフィールドは配列で返るので先頭を取る
export const first = (v) => (Array.isArray(v) ? v[0] : v) || '';

export const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(id || '');

export function page({ title, description = '', body }) {
  const fullTitle = title ? `${title}｜${SITE_NAME}` : SITE_NAME;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<header class="site-header">
  <a class="logo" href="/">${SITE_NAME}</a>
  <nav>
    <a href="/">トップ</a>
    <a href="/staff/">スタッフ紹介</a>
    <a href="/news/">お知らせ・勉強会</a>
  </nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">© ${SITE_NAME}</footer>
</body>
</html>`;
}

export function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_SECONDS}`,
    },
  });
}

export function errorPage() {
  return html(
    page({
      title: '表示できません',
      body: `<section class="container"><h1>ただいま表示できません</h1>
<p>しばらくしてから再度お試しください。</p><p><a href="/">トップへ戻る</a></p></section>`,
    }),
    503,
  );
}
