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
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { getProject, getItems, getProjects, createItem, updateProject, deleteProject } from '@/lib/db';
import { Project, Item } from '@/lib/types';
import ItemCard from '@/components/ItemCard';
import { ArrowLeft, Folder, Trash2, Pencil } from 'lucide-react-native';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const router = useRouter();

  const loadData = async () => {
    if (!id) return;

    try {
      const [projectData, projectItems, allProjects] = await Promise.all([
        getProject(id),
        getItems(undefined, id),
        getProjects(),
      ]);
      
      setProject(projectData);
      setItems(projectItems);
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const openRename = () => {
    if (!project) return;
    setRenameText(project.name);
    setRenameOpen(true);
  };

  const saveRename = async () => {
    if (!project) return;
    const name = renameText.trim();
    if (!name) {
      Alert.alert('Missing name', 'Please enter a project name');
      return;
    }
    await updateProject(project.id, { name });
    setRenameOpen(false);
    await loadData();
  };

  const confirmDeleteProject = () => {
    if (!project) return;
    Alert.alert(
      'Delete Project',
      'Do you want to delete this project? You can keep notes (they will go to Inbox) or delete everything.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete, keep notes',
          onPress: async () => {
            await deleteProject(project.id, { deleteItems: false });
            router.back();
          },
        },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            await deleteProject(project.id, { deleteItems: true });
            router.back();
          },
        },
      ]
    );
  };

  const handleCreateNote = async () => {
    try {
      if (!project) return;
      if (!newNoteTitle.trim()) {
        Alert.alert('Missing title', 'Please enter a title for your note');
        return;
      }
      await createItem({
        type: 'Note',
        projectId: project.id,
        title: newNoteTitle.trim(),
        body: newNoteBody.trim() || undefined,
        tags: [],
        status: 'inbox',
        source: 'text',
      });
      setNewNoteTitle('');
      setNewNoteBody('');
      setShowCreateModal(false);
      await loadData();
    } catch (e: any) {
      console.error('Failed to create note:', e);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Single flat list of notes without headers/icons/date/meta
  const projectNotes = items.filter(item => item.type === 'Note');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.projectHeader}>
          <View style={[styles.projectIcon, { backgroundColor: project.color || '#3B82F6' }]}>
            <Folder size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={openRename} accessibilityLabel="Rename Project">
            <Pencil size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={confirmDeleteProject} accessibilityLabel="Delete Project">
            <Trash2 size={18} color="#DC2626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.addButtonText}>New Note</Text>
          </TouchableOpacity>
        </View>
      </View>

      {projectNotes.length === 0 ? (
        <View style={[styles.emptyState, { paddingHorizontal: 16 }]}>
          <Text style={styles.emptyText}>No notes in this project yet</Text>
          <Text style={styles.emptySubtext}>Tap “New Note” to add your first note</Text>
        </View>
      ) : (
        <FlatList
          data={projectNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              projects={projects}
              onUpdate={loadData}
              hideHeader
              hideProject
              hideMeta
              onPress={() => router.push(`/ideas/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Note</Text>
            <TouchableOpacity onPress={handleCreateNote} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputTitle}
              placeholder="Note title"
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              autoFocus
            />
            <TextInput
              style={styles.inputBody}
              placeholder="Note body (optional)"
              value={newNoteBody}
              onChangeText={setNewNoteBody}
              multiline
            />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={renameOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRenameOpen(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rename Project</Text>
            <TouchableOpacity onPress={saveRename} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputTitle}
              placeholder="Project name"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
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
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  projectIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeButton: { paddingHorizontal: 8, paddingVertical: 4 },
  closeButtonText: { color: '#6B7280', fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  inputContainer: { padding: 20, gap: 12 },
  inputTitle: { fontSize: 18, fontWeight: '600', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  inputBody: { fontSize: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', minHeight: 120, textAlignVertical: 'top' },
});