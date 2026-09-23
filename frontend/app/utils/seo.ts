export const SITE_URL = 'https://friendsgofrontend.vercel.app';

export function pageMeta(title: string, description: string, options: { indexable?: boolean; path?: string } = {}) {
  const { indexable = false, path = '/' } = options;
  return [
    { title: `${title} | FriendsGo` },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: `${SITE_URL}${path}` },
    { name: 'robots', content: indexable ? 'index, follow' : 'noindex, nofollow' },
    { property: 'og:site_name', content: 'FriendsGo' },
    { property: 'og:title', content: `${title} | FriendsGo` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${SITE_URL}${path}` },
  ];
}
