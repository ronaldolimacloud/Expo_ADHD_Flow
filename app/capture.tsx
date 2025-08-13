import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createItem, getProjects } from '@/lib/db';
import { Project, ItemType } from '@/lib/types';
import { X, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function CaptureScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<ItemType>('Idea');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [energy, setEnergy] = useState<'low' | 'med' | 'high' | undefined>(undefined);
  const [timeEstimate, setTimeEstimate] = useState<number | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Auto-detect URLs and set type to Link
    if (body.trim()) {
      const urlRegex = /^https?:\/\/[^\s]+$/;
      if (urlRegex.test(body.trim()) && title.trim() === '') {
        setType('Link');
        setTitle('Link');
      }
    }
  }, [body, title]);

  const loadProjects = async () => {
    try {
      const allProjects = await getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const source = body.includes('http') ? 'paste' : 'text';

      await createItem({
        type,
        projectId: selectedProjectId,
        title: title.trim(),
        body: body.trim() || undefined,
        tags: tagArray,
        status: 'inbox',
        energy,
        timeEstimateMin: timeEstimate,
        source,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error creating item:', error);
      Alert.alert('Error', 'Failed to create item');
    }
  };

  const typeButtons = [
    { type: 'Idea' as ItemType, color: '#111827' },
    { type: 'Task' as ItemType, color: '#111827' },
    { type: 'Note' as ItemType, color: '#111827' },
    { type: 'Link' as ItemType, color: '#111827' },
  ];

  const energyOptions = [
    { value: 'low' as const, label: 'Low', color: '#9CA3AF' },
    { value: 'med' as const, label: 'Med', color: '#6B7280' },
    { value: 'high' as const, label: 'High', color: '#111827' },
  ];

  const timeOptions = [5, 15, 30, 60, 120];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Capture</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type</Text>
          <View style={styles.typeSelector}>
            {typeButtons.map((typeButton) => (
              <TouchableOpacity
                key={typeButton.type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === typeButton.type ? typeButton.color : '#F3F4F6',
                  },
                ]}
                onPress={() => setType(typeButton.type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === typeButton.type ? '#FFFFFF' : '#374151' },
                  ]}
                >
                  {typeButton.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Enter title..."
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="Enter description or paste URL..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="work, urgent, idea..."
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Project</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.projectSelector}>
              <TouchableOpacity
                style={[
                  styles.projectButton,
                  { backgroundColor: selectedProjectId === null ? '#3B82F6' : '#F3F4F6' },
                ]}
                onPress={() => setSelectedProjectId(null)}
              >
                <Text
                  style={[
                    styles.projectButtonText,
                    { color: selectedProjectId === null ? '#FFFFFF' : '#374151' },
                  ]}
                >
                  Inbox
                </Text>
              </TouchableOpacity>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectButton,
                    {
                      backgroundColor:
                        selectedProjectId === project.id
                          ? project.color || '#3B82F6'
                          : '#F3F4F6',
                    },
                  ]}
                  onPress={() => setSelectedProjectId(project.id)}
                >
                  <Text
                    style={[
                      styles.projectButtonText,
                      {
                        color:
                          selectedProjectId === project.id ? '#FFFFFF' : '#374151',
                      },
                    ]}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Energy Level</Text>
          <View style={styles.energySelector}>
            {energyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.energyButton,
                  {
                    backgroundColor: energy === option.value ? option.color : '#F3F4F6',
                  },
                ]}
                onPress={() => setEnergy(energy === option.value ? undefined : option.value)}
              >
                <Text
                  style={[
                    styles.energyButtonText,
                    { color: energy === option.value ? '#FFFFFF' : '#374151' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Time Estimate (minutes)</Text>
          <View style={styles.timeSelector}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: timeEstimate === time ? '#3B82F6' : '#F3F4F6',
                  },
                ]}
                onPress={() => setTimeEstimate(timeEstimate === time ? undefined : time)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    { color: timeEstimate === time ? '#FFFFFF' : '#374151' },
                  ]}
                >
                  {time}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  bodyInput: {
    fontSize: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  input: {
    fontSize: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  projectSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  projectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  projectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  energySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  energyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  energyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});