import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  parseTagValue: false,
});

// Substack wraps RSS fields in CDATA but stores HTML entities (e.g. &#8217;)
// as literal text inside, so XML parsing does not decode them. Handle the
// numeric + common named entities that actually show up in post metadata.
function decodeEntities(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Subtitles on older posts were cached by Substack's RSS feed with trailing
// periods even after being edited off the live article. New posts are
// authored without them, so stripping here is safe and future-proof.
function stripTrailingPeriod(value) {
  return value.replace(/[.\s]+$/u, '').trimEnd();
}

export async function getPosts() {
  try {
    const response = await fetch('https://aviralwrites.substack.com/feed', {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed feed request: ${response.status}`);
    }

    const xml = await response.text();
    const feed = parser.parse(xml);
    const rawItems = feed?.rss?.channel?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items
      .filter(Boolean)
      .map((item) => {
        const rawCategories = item.category ?? [];
        const categories = Array.isArray(rawCategories)
          ? rawCategories.filter(Boolean).map((c) => decodeEntities(String(c)))
          : rawCategories
            ? [decodeEntities(String(rawCategories))]
            : [];

        const rawContentSnippet =
          item.description ||
          item['content:encoded'] ||
          item.content ||
          '';

        const cleanedExcerpt = decodeEntities(rawContentSnippet)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200);

        return {
          title: decodeEntities(String(item.title || '')),
          date: item.pubDate || '',
          link: item.link || '',
          excerpt: stripTrailingPeriod(cleanedExcerpt),
          author: decodeEntities(String(item['dc:creator'] || item.creator || '')),
          categories,
        };
      })
      .filter((item) => item.title && item.link);
  } catch (error) {
    console.error('Failed to fetch RSS feed:', error);
    return [];
  }
}
