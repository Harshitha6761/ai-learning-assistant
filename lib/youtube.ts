/**
 * YouTube Data API v3 – real search results (title + watch URL).
 * Set YOUTUBE_API_KEY in .env.local (Google Cloud Console, YouTube Data API v3).
 */

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function searchYouTube(
  topic: string,
  maxResults = 8
): Promise<Array<{ title: string; url: string }>> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  const query = `${topic} tutorial education`;
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    key,
    relevanceLanguage: 'en',
    safeSearch: 'moderate',
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string };
    }>;
  };

  const items = data.items ?? [];
  return items
    .filter((i) => i.id?.videoId && i.snippet?.title)
    .map((i) => ({
      title: i.snippet!.title!,
      url: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
    }));
}
