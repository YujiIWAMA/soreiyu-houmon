// /staff/<コンテンツID> … スタッフ個人ページ（名刺QRの飛び先）
// 退職などで削除・非公開になったスタッフのURLは、スタッフ一覧へ転送する
import { cms, esc, nl2br, imgUrl, first, isSafeId, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env, params, request }) {
  const slug = params.slug;
  const toList = () => Response.redirect(new URL('/staff/', request.url).toString(), 302);
  if (!isSafeId(slug)) return toList();

  try {
    const s = await cms(env, `staff/${slug}`);
    if (!s) return toList();

    const rows = [
      ['資格', s.qualifications],
      ['趣味・好きなこと', s.hobby],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${nl2br(v)}</dd>`)
      .join('');

    return html(
      page({
        title: s.name,
        description: `${first(s.role)} ${s.name}`,
        body: `<section class="container staff-detail">
  ${s.photo ? `<img class="photo" src="${imgUrl(s.photo, 600)}" alt="${esc(s.name)}" width="300" height="300">` : ''}
  <div class="info">
    <p class="role">${esc(first(s.role))}</p>
    <h1>${esc(s.name)}${s.kana ? `<small>${esc(s.kana)}</small>` : ''}</h1>
    ${s.message ? `<div class="message">${nl2br(s.message)}</div>` : ''}
    ${rows ? `<dl>${rows}</dl>` : ''}
  </div>
</section>
<p class="container back"><a href="/staff/">← スタッフ一覧へ</a></p>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
