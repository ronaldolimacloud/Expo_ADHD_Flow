import { Stack } from "expo-router";
import { Text } from "react-native";

export default function VideosLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Videos',
          headerStyle: { backgroundColor: '#000000' },
          headerShown: true,
          headerTitle: () => (
            <Text style={{ fontSize: 22, textAlign: 'center', fontWeight: '700', color: 'white', }}>
              ❤️ YouTube
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="watch/[id]"
        options={{
          title: 'Watch',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#ffffff',
        }}
      />
    </Stack>
  );
}