// /news/<コンテンツID> … お知らせ詳細
import { cms, esc, fmtDate, imgUrl, first, isSafeId, page, html, errorPage } from '../../lib/microcms.js';

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
        body: `<article class="container news-detail">
  <p class="meta"><time>${fmtDate(n.date)}</time><span class="tag">${esc(first(n.category))}</span></p>
  <h1>${esc(n.title)}</h1>
  ${n.thumbnail ? `<img class="thumb" src="${imgUrl(n.thumbnail, 1000)}" alt="">` : ''}
  <div class="body">${n.body || ''}</div>
</article>
<p class="container back"><a href="/news/">← お知らせ一覧へ</a></p>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
