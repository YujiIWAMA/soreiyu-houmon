// /api/news?limit=3 … トップページの「最新のお知らせ」欄用（JSON）
import { cms, fmtDate, first } from '../../lib/microcms.js';

export async function onRequestGet({ env, request }) {
  const limit = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('limit') || '3', 10) || 3, 1), 10);
  try {
    const data = await cms(env, 'news', { limit, orders: '-date', fields: 'id,title,date,category' });
    const items = (data?.contents || []).map((n) => ({
      id: n.id,
      title: n.title,
      date: fmtDate(n.date),
      category: first(n.category),
      url: `/news/${n.id}`,
    }));
    return Response.json({ items }, { headers: { 'cache-control': 'public, max-age=60' } });
  } catch (e) {
    console.error(e);
    return Response.json({ items: [] }, { status: 503 });
  }
}
