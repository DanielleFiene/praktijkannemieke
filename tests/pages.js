/**
 * Alle publieke pagina's (zelfde slugs als productie-URL's).
 * path: URL-pad t.o.v. baseURL (met trailing slash).
 */
const PAGES = [
  { slug: 'home', path: '/', title: 'HOME' },
  { slug: 'access-bars', path: '/access-bars/', title: 'Access Bars' },
  { slug: 'shambhala-reiki', path: '/shambhala-reiki/', title: 'Shambhala Reiki' },
  { slug: 'vlindermassage', path: '/vlindermassage/', title: 'Vlindermassage' },
  { slug: 'magnesiumpakking', path: '/magnesiumpakking/', title: 'Magnesiumpakking' },
  {
    slug: 'ondersteunende-middelen-2',
    path: '/ondersteunende-middelen-2/',
    title: 'Ondersteunende middelen',
  },
  { slug: 'tarieven', path: '/tarieven/', title: 'Tarieven' },
  { slug: 'over-annemieke', path: '/over-annemieke/', title: 'Over Annemieke' },
  { slug: 'neem-contact-op', path: '/neem-contact-op/', title: 'Neem contact op' },
  { slug: 'privacyverklaring', path: '/privacyverklaring/', title: 'Privacyverklaring' },
];

module.exports = { PAGES };
