import type { APIContext } from 'astro';
import { allPosts, url } from '../lib/site';
export async function GET(context: APIContext) {
 const paths = ['', 'posts/', 'lab/', 'about/', ...(await allPosts()).map(p => `posts/${p.id}/`)];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(url(p), context.site!).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
