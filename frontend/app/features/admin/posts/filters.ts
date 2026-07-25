import type { AdminPost } from './types';

export type PostSort = 'all' | 'recent' | 'oldest';

export function filterAdminPosts(posts: AdminPost[], searchQuery: string, sort: PostSort): AdminPost[] {
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? posts.filter((post) => post.author.username.toLowerCase().includes(query) || post.author.name.toLowerCase().includes(query))
    : [...posts];

  if (sort === 'recent') return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sort === 'oldest') return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return filtered;
}
