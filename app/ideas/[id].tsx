import React, { useCallback, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { getItem, searchItemsWithFilters, createItem, updateItem, deleteItem } from '@/lib/db';
import { Item } from '@/lib/types';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react-native';

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [idea, setIdea] = useState<Item | null>(null);
  const [notes, setNotes] = useState<Item[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const load = async () => {
    if (!id) return;
    const item = await getItem(id);
    if (item) {
      setIdea(item);
      setTitle(item.title);
      setBody(item.body || '');
    }
    const children = await searchItemsWithFilters({ parentId: id as string, type: 'Note' });
    setNotes(children);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id])
  );

  const handleSave = async () => {
    if (!idea) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title');
      return;
    }
    await updateItem(idea.id, { title: title.trim(), body: body.trim() || undefined });
    setIsEditing(false);
    await load();
  };

  const handleDelete = async () => {
    if (!idea) return;
    Alert.alert('Delete Idea', 'Delete this idea and its notes?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        // delete children notes first
        for (const note of notes) {
          await deleteItem(note.id);
        }
        await deleteItem(idea.id);
        router.back();
      }}
    ]);
  };

  const addNote = async () => {
    if (!newNoteText.trim() || !id) return;
    await createItem({
      type: 'Note',
      projectId: null,
      parentId: id as string,
      title: newNoteText.trim().slice(0, 60),
      body: newNoteText.trim(),
      tags: [],
      status: 'inbox',
      source: 'text',
    });
    setNewNoteText('');
    setShowAddNote(false);
    await load();
  };

  if (!idea) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const renderNote = ({ item }: { item: Item }) => (
    <View style={styles.noteCard}>
      <Text style={styles.noteText}>{item.body || item.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => (isEditing ? handleSave() : setIsEditing(true))}>
            <Save size={20} color={isEditing ? '#111827' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Trash2 size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          <>
            <TextInput
              style={styles.inputTitle}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
            />
            <TextInput
              style={styles.inputBody}
              value={body}
              onChangeText={setBody}
              placeholder="Description"
              multiline
              textAlignVertical="top"
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>{idea.title}</Text>
            {idea.body ? <Text style={styles.body}>{idea.body}</Text> : null}
          </>
        )}

        <View style={styles.notesHeader}>
          <Text style={styles.notesTitle}>Notes</Text>
          <TouchableOpacity style={styles.addNoteBtn} onPress={() => setShowAddNote(true)}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addNoteText}>Add note</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={showAddNote} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Note</Text>
            <TouchableOpacity style={styles.saveButton} onPress={addNote}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              placeholder="Write your note..."
              value={newNoteText}
              onChangeText={setNewNoteText}
              multiline
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  body: { fontSize: 16, color: '#374151', lineHeight: 22 },
  inputTitle: { fontSize: 20, fontWeight: '600', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#FFFFFF' },
  inputBody: { fontSize: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#FFFFFF', minHeight: 120 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  notesTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addNoteText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { paddingVertical: 8 },
  noteCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  noteText: { fontSize: 15, color: '#374151', lineHeight: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6B7280' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  modalBody: { padding: 20 },
  modalInput: { fontSize: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', minHeight: 160, textAlignVertical: 'top' },
});


