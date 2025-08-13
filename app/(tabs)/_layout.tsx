import { Tabs } from 'expo-router';
import { Folder, Lightbulb, CheckSquare } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 6,
          paddingBottom: 8,
          height: 90,
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="projects/index"
        options={{
          title: 'projects',
          tabBarIcon: ({ size, color }) => <Folder size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ideas/ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ size, color }) => <Lightbulb size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To Do',
          tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}


