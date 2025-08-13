import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getProjects, createProject } from '@/lib/db';
import { Project } from '@/lib/types';
import { Plus, X, Folder } from 'lucide-react-native';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const router = useRouter();

  const loadProjects = async () => {
    try {
      const allProjects = await getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    try {
      await createProject({
        name: newProjectName.trim(),
        color: selectedColor,
        description: newProjectDescription.trim() || null,
      } as any);

      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateModal(false);
      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => router.push(`/projects/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.projectHeader}>
        <View style={[styles.projectIcon, { backgroundColor: item.color || '#3B82F6' }]}>
          <Folder size={20} color="#FFFFFF" />
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectDate}>
            Created {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      {!!(item as any).description && (
        <Text style={styles.projectDescription} numberOfLines={3}>
          {(item as any).description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Project</Text>
            <TouchableOpacity onPress={handleCreateProject} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder="Project name"
              value={newProjectName}
              onChangeText={setNewProjectName}
              autoFocus
            />
            <TextInput
              style={styles.descInput}
              placeholder="Description (optional)"
              value={newProjectDescription}
              onChangeText={setNewProjectDescription}
              multiline
            />
            
            <Text style={styles.colorLabel}>Choose a color</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#111827',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  projectDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputContainer: {
    padding: 20,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  descInput: {
    fontSize: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#111827',
  },
});


