// /staff/<コンテンツID> … スタッフ個人ページ（名刺QRの飛び先）
// 退職などで削除・非公開になったスタッフのURLは、スタッフ一覧へ転送する
import { cms, esc, nl2br, imgUrl, first, isSafeId, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env, params, request }) {
  const toList = () => Response.redirect(new URL('/staff/', request.url).toString(), 302);
  if (!isSafeId(params.slug)) return toList();

  try {
    const s = await cms(env, `staff/${params.slug}`);
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
        description: `${first(s.role)} ${s.name}｜スタッフ紹介`,
        active: 'staff',
        body: `<section class="page">
<div class="wrap narrow">
<div class="staff-profile">
${s.photo ? `<img class="photo" src="${imgUrl(s.photo, 600)}" alt="${esc(s.name)}" width="260" height="260">` : ''}
<div class="info">
${first(s.role) ? `<span class="role">${esc(first(s.role))}</span>` : ''}
<h1>${esc(s.name)}</h1>
${s.kana ? `<div class="kana">${esc(s.kana)}</div>` : ''}
<div class="bar"></div>
${s.message ? `<div class="message">${nl2br(s.message)}</div>` : ''}
${rows ? `<dl>${rows}</dl>` : ''}
</div>
</div>
<div class="back"><a class="btn-outline" href="/staff/">スタッフ一覧へ</a></div>
</div>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
