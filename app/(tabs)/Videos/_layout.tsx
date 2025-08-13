import { Stack, Tabs } from "expo-router";

export default function VideosLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Videos' }} />
    </Stack>
  );
}