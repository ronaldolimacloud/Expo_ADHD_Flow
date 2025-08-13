import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { createItem, searchItemsWithFilters, markItemDone, updateItem } from '@/lib/db';
import { Item } from '@/lib/types';
import { Plus, CheckCircle2, Circle, X, Edit3 } from 'lucide-react-native';

export default function TodoScreen() {
  const [tasks, setTasks] = useState<Item[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueText, setDueText] = useState(''); // YYYY-MM-DD or quick chips
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const load = async () => {
    const rows = await searchItemsWithFilters({ type: 'Task' });
    setTasks(rows.filter(t => t.status !== 'done'));
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function parseDateOnly(input: string): Date | null {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function toISODateMidnight(d: Date): string {
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    return local.toISOString();
  }

  const quickSet = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueText(`${yyyy}-${mm}-${dd}`);
  };

  const createTask = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Missing title', 'Please enter a task title');
        return;
      }
      let remindAt: string | undefined = undefined;
      if (dueText.trim().length > 0) {
        const parsed = parseDateOnly(dueText.trim());
        if (!parsed) {
          Alert.alert('Invalid date', 'Use YYYY-MM-DD (e.g., 2025-08-12)');
          return;
        }
        remindAt = toISODateMidnight(parsed);
      }
      await createItem({
        type: 'Task',
        projectId: null,
        title: title.trim(),
        body: body.trim() || undefined,
        tags: [],
        status: 'inbox',
        source: 'text',
        remindAt,
      });
      setTitle('');
      setBody('');
      setDueText('');
      setShowCreate(false);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const toggleDone = async (task: Item) => {
    if (task.status !== 'done') {
      await markItemDone(task.id);
    } else {
      await updateItem(task.id, { status: 'inbox' });
    }
    await load();
  };

  const todayStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  }, []);

  const toDateOnlyTime = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  };

  const overdue = tasks.filter(t => {
    const ts = toDateOnlyTime(t.remindAt || undefined);
    return ts !== null && ts < todayStart;
  });
  const today = tasks.filter(t => {
    const ts = toDateOnlyTime(t.remindAt || undefined);
    return ts !== null && ts === todayStart;
  });
  const upcoming = tasks.filter(t => {
    const ts = toDateOnlyTime(t.remindAt || undefined);
    return ts !== null && ts > todayStart;
  });
  const noDate = tasks.filter(t => !t.remindAt);

  const formatShort = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderTask = ({ item }: { item: Item }) => {
    const ts = toDateOnlyTime(item.remindAt || undefined);
    const isOverdue = ts !== null && ts < todayStart;
    const isToday = ts !== null && ts === todayStart;
    return (
      <View style={styles.taskCard}>
        <TouchableOpacity style={styles.statusBtn} onPress={() => toggleDone(item)}>
          {item.status === 'done' ? (
            <CheckCircle2 size={22} color="#10B981" />
          ) : (
            <Circle size={22} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.taskTitle, item.status === 'done' && styles.taskTitleDone]}>{item.title}</Text>
            {item.remindAt ? (
              <Text style={[styles.duePill, isOverdue ? styles.dueOverdue : isToday ? styles.dueToday : styles.dueUpcoming]}>
                {isToday ? 'Today' : formatShort(item.remindAt)}
              </Text>
            ) : null}
          </View>
          {item.body ? <Text style={styles.taskBody} numberOfLines={2}>{item.body}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>To Do</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[
          { key: 'Overdue', data: overdue },
          { key: 'Today', data: today },
          { key: 'Upcoming', data: upcoming },
          { key: 'No date', data: noDate },
        ]}
        keyExtractor={(section) => section.key}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {overdue.length > 0 && (
              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Overdue</Text>
                {overdue.map(t => (<View key={t.id}>{renderTask({ item: t })}</View>))}
              </View>
            )}
            {today.length > 0 && (
              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Today</Text>
                {today.map(t => (<View key={t.id}>{renderTask({ item: t })}</View>))}
              </View>
            )}
            {upcoming.length > 0 && (
              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {upcoming.map(t => (<View key={t.id}>{renderTask({ item: t })}</View>))}
              </View>
            )}
            {noDate.length > 0 && (
              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>No date</Text>
                {noDate.map(t => (<View key={t.id}>{renderTask({ item: t })}</View>))}
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={createTask} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TextInput
              style={styles.inputTitle}
              placeholder="Task title"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={styles.inputBody}
              placeholder="Notes (optional)"
              value={body}
              onChangeText={setBody}
              multiline
            />
            <View style={styles.dueRow}>
              <Text style={styles.dueLabel}>Due date</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.dueInput, { flex: 1, justifyContent: 'center' }]} onPress={openDatePicker}>
                  <Text style={{ color: dueText ? '#111827' : '#9CA3AF', fontSize: 16 }}>
                    {dueText ? dueText : 'Pick a date'}
                  </Text>
                </Pressable>
                {dueText ? (
                  <TouchableOpacity style={styles.clearButton} onPress={() => setDueText('')}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickChip} onPress={() => quickSet(0)}><Text style={styles.quickChipText}>Today</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickChip} onPress={() => quickSet(1)}><Text style={styles.quickChipText}>Tomorrow</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickChip} onPress={() => quickSet(7)}><Text style={styles.quickChipText}>Next week</Text></TouchableOpacity>
              </View>
            </View>
            {showDatePicker && (
              Platform.OS === 'android' ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event: any, date?: Date) => {
                    // On Android, event.type is 'set' or 'dismissed'
                    if (event?.type === 'set' && date) {
                      setSelectedDate(date);
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const dd = String(date.getDate()).padStart(2, '0');
                      setDueText(`${yyyy}-${mm}-${dd}`);
                    }
                    setShowDatePicker(false);
                  }}
                />
              ) : (
                <Modal
                  transparent
                  animationType="slide"
                  visible
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.iosModalBackdrop}>
                    <View style={styles.iosModalCard}>
                      <View style={styles.iosModalHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.iosCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const d = selectedDate;
                            const yyyy = d.getFullYear();
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            setDueText(`${yyyy}-${mm}-${dd}`);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.iosDone}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="spinner"
                        onChange={(event: any, date?: Date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              )
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 32, fontWeight: '700', color: '#111827' },
  addButton: { backgroundColor: '#111827', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  statusBtn: { width: 28, alignItems: 'center', marginTop: 2 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  taskTitleDone: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  taskBody: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  duePill: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, color: '#111827' },
  dueOverdue: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  dueToday: { backgroundColor: '#E0E7FF', color: '#3730A3' },
  dueUpcoming: { backgroundColor: '#ECFDF5', color: '#065F46' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  modalBody: { padding: 20, gap: 12 },
  inputTitle: { fontSize: 18, fontWeight: '600', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  inputBody: { fontSize: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB', minHeight: 120, textAlignVertical: 'top' },
  dueRow: { marginTop: 4 },
  dueLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  dueInput: { fontSize: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, backgroundColor: '#FFFFFF' },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  quickChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  pickButton: { backgroundColor: '#111827', paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickButtonText: { color: '#FFFFFF', fontWeight: '600' },
  clearButton: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { color: '#374151', fontWeight: '600' },
  iosModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  iosModalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20 },
  iosModalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  iosCancel: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  iosDone: { color: '#111827', fontSize: 16, fontWeight: '700' },
});


