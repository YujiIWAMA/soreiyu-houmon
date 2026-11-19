// /news/<コンテンツID> … お知らせ詳細
import { cms, esc, fmtDate, imgUrl, first, tagHtml, isSafeId, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env, params, request }) {
  const toList = () => Response.redirect(new URL('/news/', request.url).toString(), 302);
  if (!isSafeId(params.id)) return toList();

  try {
    const n = await cms(env, `news/${params.id}`);
    if (!n) return toList();

    // 本文はmicroCMSのリッチエディタが出力したHTML（編集者はステーション職員のみ）
    return html(
      page({
        title: n.title,
        active: 'news',
        body: `<section class="page">
<div class="wrap narrow">
<article class="article">
<p class="meta"><time>${fmtDate(n.date)}</time>${tagHtml(first(n.category))}</p>
<h1>${esc(n.title)}</h1>
${n.thumbnail ? `<img class="thumb" src="${imgUrl(n.thumbnail, 1000)}" alt="">` : ''}
<div class="body">${n.body || ''}</div>
</article>
<div class="back"><a class="btn-outline" href="/news/">お知らせ一覧へ</a></div>
</div>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
