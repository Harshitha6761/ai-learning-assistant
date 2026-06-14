import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { exploreTopic, getExploreWebsites } from '@/lib/ai/provider';
import { searchYouTube } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const allowed = ['admin', 'teacher'];
  if (!allowed.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden – teachers only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const topic = body?.topic?.trim();
    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    let videos: Array<{ title: string; url: string }>;
    let websites: Array<{ title: string; url: string }>;
    if (process.env.YOUTUBE_API_KEY) {
      [videos, websites] = await Promise.all([searchYouTube(topic), getExploreWebsites(topic)]);
    } else {
      const result = await exploreTopic(topic);
      videos = result.videos;
      websites = result.websites;
    }

    return NextResponse.json({ videos, websites });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Explore failed' }, { status: 500 });
  }
}
