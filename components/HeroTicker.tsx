'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { db } from '@/lib/firebase'; // adjust if needed

type LiveWireTopic = {
  text?: string;
  updatedAt?: Timestamp;
  active?: boolean;
  priority?: number;
};

export default function HeroTicker() {
  const [items, setItems] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helpful: verify the project you're connected to
  useEffect(() => {
    const app = getApp();
    console.log('[HeroTicker] projectId:', app.options.projectId);
    // @ts-ignore – internal at runtime
    console.log('[HeroTicker] databaseId:', db._databaseId?.database || '(default)');
  }, []);

  useEffect(() => {
    const colRef = collection(db, 'live_wire_topics');

    // No orderBy/where => no composite index needed
    const unsub = onSnapshot(
      colRef,
      (snap: QuerySnapshot<DocumentData>) => {
        setLoading(false);

        const topics: LiveWireTopic[] = snap.docs.map(d => d.data() as LiveWireTopic);

        // Client-side filter & sort to avoid Firestore indexes:
        // 1) keep active (default true if missing)
        // 2) sort by priority (asc; missing goes last)
        // 3) then by updatedAt (desc)
        const sorted = topics
          .filter(t => t.active !== false)
          .sort((a, b) => {
            const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
            const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;

            const ta = a.updatedAt?.toMillis?.() ?? 0;
            const tb = b.updatedAt?.toMillis?.() ?? 0;
            return tb - ta; // newest first
          })
          .map(t => (t.text ?? '').toString().trim())
          .filter(Boolean);

        // Fallback: if no text fields, show IDs instead
        const finalList =
          sorted.length > 0
            ? sorted
            : snap.docs.map(d => d.id);

        setItems(finalList);
        setErr(null);
      },
      (e) => {
        console.error('[HeroTicker] onSnapshot error:', e);
        setLoading(false);
        setErr(e?.message || 'Permission denied or network error');
        setItems([]);
      }
    );

    return () => unsub();
  }, []);

  const feed = useMemo(() => {
    if (err) return ['⚠️ ' + err];
    if (loading) return ['loading…'];
    if (items.length === 0) return ['No topics yet'];
    return items;
  }, [items, err, loading]);

  return (
    <div className="absolute top-0 inset-x-0 z-30">
      <div className="relative overflow-hidden h-10 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="flex will-change-transform animate-ticker pt-2">
          {/* Strip A */}
          <ul className="flex items-center gap-8 px-4 whitespace-nowrap shrink-0">
            {feed.map((text, i) => (
              <li key={`a-${i}`} className="text-xs md:text-sm text-white/100">
                {text}
              </li>
            ))}
          </ul>
          {/* Strip B (duplicate for seamless loop) */}
          <ul aria-hidden="true" className="flex items-center gap-8 px-4 whitespace-nowrap shrink-0">
            {feed.map((text, i) => (
              <li key={`b-${i}`} className="text-xs md:text-sm text-white/90">
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          width: max-content;
          animation: ticker 28s linear infinite;
        }
      `}</style>
    </div>
  );
}
