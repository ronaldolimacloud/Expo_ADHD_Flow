import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { createItem, searchItemsWithFilters, updateItem } from '@/lib/db';
import { Item } from '@/lib/types';
import { Lightbulb, Plus, X } from 'lucide-react-native';

export default function IdeasScreen() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Item[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaBody, setNewIdeaBody] = useState('');

  const loadIdeas = async () => {
    const rows = await searchItemsWithFilters({ type: 'Idea', parentId: null });
    setIdeas(rows);
  };

  useFocusEffect(
    useCallback(() => {
      loadIdeas();
    }, [])
  );

  const handleCreateIdea = async () => {
    try {
      if (!newIdeaTitle.trim()) {
        Alert.alert('Missing title', 'Please enter a title for your idea');
        return;
      }
      await createItem({
        type: 'Idea',
        projectId: null,
        title: newIdeaTitle.trim(),
        body: newIdeaBody.trim() || undefined,
        tags: [],
        status: 'inbox',
        source: 'text',
      });
      setNewIdeaTitle('');
      setNewIdeaBody('');
      setShowCreateModal(false);
      await loadIdeas();
    } catch (e: any) {
      console.error('Failed to create idea:', e);
      Alert.alert('Error', 'Failed to create idea. Please try again.');
    }
  };

  const renderIdea = ({ item }: { item: Item }) => (
    <TouchableOpacity style={styles.ideaCard} onPress={() => router.push(`/ideas/${item.id}`)}>
      <View style={styles.ideaHeader}>
        <View style={styles.ideaIcon}><Lightbulb size={18} color="#FFFFFF" /></View>
        <Text style={styles.ideaTitle}>{item.title}</Text>
      </View>
      {!!item.body && <Text style={styles.ideaBody} numberOfLines={2}>{item.body}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ideas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={ideas}
        keyExtractor={(item) => item.id}
        renderItem={renderIdea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Idea</Text>
            <TouchableOpacity onPress={handleCreateIdea} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputTitle}
              placeholder="Idea title"
              value={newIdeaTitle}
              onChangeText={setNewIdeaTitle}
              autoFocus
            />
            <TextInput
              style={styles.inputBody}
              placeholder="Short description (optional)"
              value={newIdeaBody}
              onChangeText={setNewIdeaBody}
              multiline
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  title: { fontSize: 32, fontWeight: '700', color: '#111827' },
  addButton: { backgroundColor: '#111827', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  ideaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  ideaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ideaIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  ideaTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  ideaBody: { fontSize: 14, color: '#6B7280' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  inputContainer: { padding: 20, gap: 12 },
  inputTitle: { fontSize: 18, fontWeight: '600', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  inputBody: { fontSize: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', minHeight: 120, textAlignVertical: 'top' },
});


