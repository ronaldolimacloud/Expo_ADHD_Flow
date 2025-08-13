import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { addYouTubeFavorite, isYouTubeFavorite, listYouTubeFavorites, removeYouTubeFavorite } from '@/lib/db';
import { YouTubeVideo } from '@/lib/types';

type SearchResult = YouTubeVideo & { favorited?: boolean };

async function searchYouTube(query: string, apiKey?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const key = apiKey || (Constants.expoConfig?.extra as any)?.YOUTUBE_API_KEY || (Constants.manifest2 as any)?.extra?.YOUTUBE_API_KEY;
  if (!key) throw new Error('Missing YouTube API key in app config (app.json -> expo.extra.YOUTUBE_API_KEY)');

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('maxResults', '25');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('key', key);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) throw new Error('YouTube search failed');
  const searchData = await searchRes.json();
  const items = (searchData.items || []) as any[];

  const videos: SearchResult[] = items.map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channelTitle: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
    publishedAt: it.snippet.publishedAt,
  }));

  // Mark favorites
  const favs = await listYouTubeFavorites();
  const favSet = new Set(favs.map((f) => f.id));
  return videos.map((v) => ({ ...v, favorited: favSet.has(v.id) }));
}

export default function Youtube() {
  const router = useRouter();
  const [tab, setTab] = useState<'favorites' | 'search'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [favorites, setFavorites] = useState<YouTubeVideo[]>([]);

  async function loadFavorites() {
    const data = await listYouTubeFavorites();
    setFavorites(data);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function onSearch(text?: string) {
    const q = text ?? query;
    setLoading(true);
    try {
      const res = await searchYouTube(q);
      setResults(res);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(video: YouTubeVideo) {
    const favored = await isYouTubeFavorite(video.id);
    if (favored) {
      await removeYouTubeFavorite(video.id);
    } else {
      await addYouTubeFavorite(video);
    }
    await onSearch();
    await loadFavorites();
  }

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => router.push((`/Videos/watch/${item.id}?title=${encodeURIComponent(item.title)}` as any))}
      style={{ flexDirection: 'row', padding: 12, marginHorizontal: 12, marginVertical: 6, backgroundColor: '#111827', borderRadius: 12 }}
    >
      <Image source={{ uri: item.thumbnail }} style={{ width: 120, height: 68, borderRadius: 8, backgroundColor: '#222' }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={2} style={{ color: 'white', fontWeight: '600' }}>{item.title}</Text>
        <Text style={{ color: '#9CA3AF', marginTop: 4 }}>{item.channelTitle}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ padding: 6, alignSelf: 'center' }}>
        <Text style={{ fontSize: 18 }}>{item.favorited ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFav = ({ item }: { item: YouTubeVideo }) => (
    <TouchableOpacity
      onPress={() => router.push((`/Videos/watch/${item.id}?title=${encodeURIComponent(item.title)}` as any))}
      style={{ flexDirection: 'row', padding: 12, marginHorizontal: 12, marginVertical: 6, backgroundColor: '#111827', borderRadius: 12 }}
    >
      <Image source={{ uri: item.thumbnail }} style={{ width: 120, height: 68, borderRadius: 8, backgroundColor: '#222' }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={2} style={{ color: 'white', fontWeight: '600' }}>{item.title}</Text>
        <Text style={{ color: '#9CA3AF', marginTop: 4 }}>{item.channelTitle}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ padding: 6, alignSelf: 'center' }}>
        <Text style={{ fontSize: 18 }}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
      {/* Header */}
      <View style={{ paddingTop: 24, paddingHorizontal: 16, paddingBottom: 8 }}>
        
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <TouchableOpacity onPress={() => setTab('favorites')} style={{ marginRight: 16 }}>
            <Text style={{ color: tab === 'favorites' ? 'white' : '#9CA3AF', fontWeight: '600' }}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('search')}>
            <Text style={{ color: tab === 'search' ? 'white' : '#9CA3AF', fontWeight: '600' }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'search' && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <TextInput
              placeholder="Search YouTube..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => onSearch()}
              style={{ color: 'white' }}
            />
          </View>
        </View>
      )}

      {tab === 'search' ? (
        loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : results.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#9CA3AF' }}>Enter a search term above to find YouTube videos.</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(i) => i.id}
          renderItem={renderFav}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
              <Text style={{ color: '#9CA3AF' }}>No favorites yet.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}