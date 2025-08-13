import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useCallback, useRef, useState } from 'react';

export default function WatchVideo() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  const onChangeState = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0C', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Missing video id</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0C', paddingVertical: 12 }}>
      {!!title && (
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, paddingHorizontal: 16, marginBottom: 12 }} numberOfLines={2}>
          {decodeURIComponent(title)}
        </Text>
      )}
      <View style={{ aspectRatio: 16 / 9 }}>
        {!ready && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <YoutubePlayer
          height={230}
          play={playing}
          videoId={String(id)}
          onChangeState={onChangeState}
          onReady={() => setReady(true)}
        />
      </View>
    </View>
  );
}


