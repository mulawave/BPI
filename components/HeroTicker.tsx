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
import { getFirebaseDb } from '@/lib/firebase';
import { api } from '@/client/trpc';

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
  const [db, setDb] = useState<ReturnType<typeof getFirebaseDb> | null>(null);

  const {
    data: firebaseConfig,
    isLoading: configLoading,
    error: configError,
  } = api.config.getFirebaseConfig.useQuery(undefined, {
    retry: 1,
  });

  // Helpful: verify the project you're connected to
  useEffect(() => {
    try {
      const app = getApp();
      console.log('[HeroTicker] projectId:', app.options.projectId);
    } catch (e) {
      console.warn('[HeroTicker] Firebase app not initialized yet', e);
    }
  }, []);

  // Initialize Firebase once config is available
  useEffect(() => {
    if (configError) {
      setErr(configError.message || 'Failed to load Firebase config');
      setLoading(false);
      return;
    }

    if (!firebaseConfig) return;

    if (firebaseConfig.missing?.length) {
      setErr(`Firebase config incomplete: ${firebaseConfig.missing.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const firestore = getFirebaseDb(firebaseConfig.config as any);
      setDb(firestore);
      setErr(null);
    } catch (e: any) {
      console.error('[HeroTicker] Firebase init error:', e);
      setErr(e?.message || 'Failed to initialize Firebase');
      setLoading(false);
    }
  }, [firebaseConfig, configError]);

  useEffect(() => {
    if (!db) return;

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
  }, [db]);

  const feed = useMemo(() => {
    if (err) return ['⚠️ ' + err];
    if (loading || configLoading || !db) return ['loading…'];
    if (items.length === 0) return ['No topics yet'];
    return items;
  }, [items, err, loading, configLoading, db]);

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
