import type { APIContext } from 'astro';
import { allPosts, bookShelves, url } from '../lib/site';
export async function GET(context: APIContext) {
 const [posts, books] = await Promise.all([allPosts(), bookShelves()]);
 const paths = ['', 'notes/', 'books/', 'about/', ...books.map(b => `books/${b.id}/`), ...posts.map(p => `posts/${p.id}/`)];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(url(p), context.site!).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
