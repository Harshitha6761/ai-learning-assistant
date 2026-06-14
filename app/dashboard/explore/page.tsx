'use client';

import { useState } from 'react';

interface Video { title: string; url: string }
interface Website { title: string; url: string }

export default function ExplorePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setVideos([]);
    setWebsites([]);
    try {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos ?? []);
        setWebsites(data.websites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Explore topic</h1>
      <p className="text-slate-600 text-sm">Get relevant YouTube videos and websites for a topic.</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          placeholder="e.g. Newton's laws of motion"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Explore'}
        </button>
      </form>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium text-slate-700 mb-2">YouTube videos</h2>
          <ul className="space-y-2">
            {videos.map((v, i) => (
              <li key={i}>
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline block truncate">
                  {v.title || v.url}
                </a>
              </li>
            ))}
            {!loading && videos.length === 0 && topic && <li className="text-slate-500 text-sm">No videos found.</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-medium text-slate-700 mb-2">Websites</h2>
          <ul className="space-y-2">
            {websites.map((w, i) => (
              <li key={i}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline block truncate">
                  {w.title || w.url}
                </a>
              </li>
            ))}
            {!loading && websites.length === 0 && topic && <li className="text-slate-500 text-sm">No websites found.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
