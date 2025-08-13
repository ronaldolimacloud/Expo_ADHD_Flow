import { Tabs } from "expo-router";
import { Lightbulb } from "lucide-react-native";

export default function IdeasLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color, size }) => (
            // Using Lightbulb icon from lucide-react-native
            // You may need to import this at the top: import { Lightbulb } from 'lucide-react-native';
            <Lightbulb color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="loucura" 
      options={{ 
        title: 'Loucura',
        tabBarIcon: ({ color, size }) => (
          <Lightbulb color={color} size={size} />
        ),
      }} /> 
    </Tabs>
  );
}