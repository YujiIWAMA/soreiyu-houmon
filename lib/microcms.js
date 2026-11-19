// microCMS との通信と、ページ生成の共通処理
// 環境変数（Cloudflare Pages の「変数とシークレット」で登録）:
//   MICROCMS_SERVICE_DOMAIN … microCMSのサービスID（https://〇〇〇〇.microcms.io の〇〇〇〇）
//   MICROCMS_API_KEY        … microCMS の APIキー（GET権限のみ）
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
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }, // microCMSの転送量を節約
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`microCMS error ${res.status}`);
  return res.json();
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');

// microCMS の画像は URL パラメータで縮小・WebP変換できる（転送量の節約）
export function imgUrl(image, width) {
  if (!image || !image.url) return '';
  return `${image.url}?w=${width}&fm=webp&q=80`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
  return d; // 例: 2026/12/01
}

export const first = (v) => (Array.isArray(v) ? v[0] : v) || '';

export const tagHtml = (category) =>
  category ? `<span class="tag${category === '勉強会' ? ' study' : ''}">${esc(category)}</span>` : '';

export const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(id || '');

// 見出し（EN小見出し＋明朝の見出し＋葉っぱの飾り）
export function secHead(en, ja, tag = 'h1') {
  return `<div class="sec-head">
<div class="en">${en}</div>
<${tag}>${esc(ja)}</${tag}>
<svg width="120" height="16" viewBox="0 0 120 16" aria-hidden="true"><line x1="0" y1="8" x2="48" y2="8" stroke="#7B8A6A" stroke-width="1.5"/><path d="M60 15C51 12 51 4 60 1C69 4 69 12 60 15Z" fill="#7B8A6A"/><line x1="72" y1="8" x2="120" y2="8" stroke="#7B8A6A" stroke-width="1.5"/></svg>
</div>`;
}

// ナビ（active: 'top' | 'staff' | 'core' | 'news' | 'values'）
const NAV = [
  ['top', '/', 'トップ'],
  ['staff', '/staff/', 'スタッフ紹介'],
  ['core', '/core.html', '中核となる取り組み'],
  ['news', '/news/', 'お知らせ・勉強会'],
  ['values', '/values.html', 'バリュー'],
];

function header(active) {
  const links = NAV.map(([key, href, label]) =>
    key === active
      ? `<a href="${href}" style="padding:10px 14px;text-decoration:none;color:#A64A50;border-bottom:2px solid #EC8A1E">${label}</a>`
      : `<a href="${href}" style="padding:10px 14px;text-decoration:none;color:#3A3A32">${label}</a>`,
  ).join('\n');
  return `<header style="background:#FBF7EF;border-bottom:1px solid #E6DCC8">
<div style="max-width:1160px;margin:0 auto;padding:14px 24px;box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 32px">
<a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#3A3A32">
<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M3 34C1 16 12 4 28 5C17 9 9 18 9 34Z" fill="#EC8A1E"/><path d="M12 34C12 22 18 14 26 11C25 22 21 31 12 34Z" fill="#FFD04A"/><path d="M17 36C17 24 24 14 37 11C38 25 31 35 17 36Z" fill="#6FA03A"/></svg>
<span style="font-family:'Noto Serif JP',serif;font-weight:700;font-size:20px;letter-spacing:.04em">${SITE_NAME}</span>
</a>
<button class="menu-btn" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="gnav"><span></span><span></span><span></span></button>
<nav id="gnav" class="gnav" aria-label="メインメニュー" style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:15px;font-weight:500">
${links}
</nav>
</div>
</header>`;
}

// フッター（public/index.html のフッターと同じ内容。住所などを変えたら両方直す）
const FOOTER = `<footer style="background:#4F5C41;color:#F3F1E6;padding:64px 0 40px">
<div style="max-width:1080px;margin:0 auto;padding:0 24px;box-sizing:border-box">
<div style="display:flex;flex-wrap:wrap;gap:32px 64px;justify-content:space-between">
<div style="flex:1 1 360px">
<div style="font-family:'Noto Serif JP',serif;font-size:24px;font-weight:700;color:#FFFFFF">${SITE_NAME}</div>
<p style="margin:10px 0 0;font-size:14px;color:#DCE5D5">心を紡ぎ、希（ねがい）を明日へ繋ぐ。</p>
</div>
<div style="flex:1 1 360px;font-size:15px;line-height:2">
<div>所在地：[住所を入れる]</div>
<div>電話：[電話番号]　FAX：[FAX番号]</div>
<div>受付時間：[営業時間を入れる]</div>
<div style="margin-top:16px"><a href="/" style="display:inline-block;min-height:44px;box-sizing:border-box;padding:8px 32px;background:#F3E8DA;border-radius:999px;font-weight:700;text-decoration:none;color:#3A3A32">アクセス・お問い合わせ</a></div>
</div>
</div>
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #6F7D5F;font-size:13px;color:#DCE5D5">© ${SITE_NAME}</div>
</div>
</footer>`;

const MENU_SCRIPT = `<script>
(function(){var b=document.querySelector('.menu-btn'),n=document.getElementById('gnav');if(!b||!n)return;
b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');b.setAttribute('aria-label',o?'メニューを閉じる':'メニューを開く');});
window.addEventListener('resize',function(){if(window.innerWidth>760){n.classList.remove('open');b.setAttribute('aria-expanded','false');}});
})();
</script>`;

export function page({ title, description = '', active = '', body }) {
  const fullTitle = title ? `${title}｜${SITE_NAME}` : SITE_NAME;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<div style="width:100%;background:#FBF7EF">
${header(active)}
<main>
${body}
</main>
${FOOTER}
</div>
${MENU_SCRIPT}
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
      body: `<section class="page"><div class="wrap narrow" style="text-align:center">
<h1 style="font-family:'Noto Serif JP',serif">ただいま表示できません</h1>
<p>しばらくしてから再度お試しください。</p>
<p><a class="btn-outline" href="/">トップへ戻る</a></p></div></section>`,
    }),
    503,
  );
}
