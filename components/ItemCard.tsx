import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteItem, moveItemToProject, markItemDone, pinItem, getProjects } from '@/lib/db';
import { Item, Project, ItemType, Status } from '@/lib/types';
import { Lightbulb, SquareCheck as CheckSquare, FileText, Link, Folder } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ItemCardProps {
  item: Item;
  projects: Project[];
  onUpdate?: () => void;
  onTagPress?: (tag: string) => void;
  hideHeader?: boolean; // hide type/status/icon row
  hideProject?: boolean; // hide project chip/footer
  hideMeta?: boolean; // hide date/time footer
  onPress?: () => void; // tap action
}

export default function ItemCard({ item, projects, onUpdate, onTagPress, hideHeader, hideProject, hideMeta, onPress }: ItemCardProps) {
  const router = useRouter();

  const handleLongPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (!onUpdate) return;
    
    Alert.alert(
      'Item Actions',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move to Project', onPress: showMoveToProjectOptions },
        { text: 'Mark Done', onPress: handleMarkDone },
        { text: 'Pin', onPress: handlePin },
        { text: 'Delete', onPress: handleDelete, style: 'destructive' },
      ]
    );
  };

  const showMoveToProjectOptions = async () => {
    try {
      const allProjects = await getProjects();
      const options = [
        { text: 'Cancel', style: 'cancel' as const },
        { text: 'Inbox', onPress: () => handleMoveToProject(null) },
        ...allProjects.map(project => ({
          text: project.name,
          onPress: () => handleMoveToProject(project.id),
        })),
      ];
      
      Alert.alert('Move to Project', 'Select a project', options);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleMoveToProject = async (projectId: string | null) => {
    try {
      await moveItemToProject(item.id, projectId);
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      onUpdate?.();
    } catch (error) {
      console.error('Error moving item:', error);
      Alert.alert('Error', 'Failed to move item');
    }
  };

  const handleMarkDone = async () => {
    try {
      await markItemDone(item.id);
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      onUpdate?.();
    } catch (error) {
      console.error('Error marking item done:', error);
      Alert.alert('Error', 'Failed to mark item done');
    }
  };

  const handlePin = async () => {
    try {
      await pinItem(item.id);
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      onUpdate?.();
    } catch (error) {
      console.error('Error pinning item:', error);
      Alert.alert('Error', 'Failed to pin item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await deleteItem(item.id);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'Idea': return '#F59E0B';
      case 'Task': return '#3B82F6';
      case 'Note': return '#10B981';
      case 'Link': return '#8B5CF6';
      case 'Project': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'Idea': return Lightbulb;
      case 'Task': return CheckSquare;
      case 'Note': return FileText;
      case 'Link': return Link;
      case 'Project': return Folder;
      default: return FileText;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'inbox': return '#6B7280';
      case 'active': return '#3B82F6';
      case 'done': return '#10B981';
      default: return '#6B7280';
    }
  };

  const project = projects.find(p => p.id === item.projectId);
  const IconComponent = getTypeIcon(item.type);

  // Check if this is a YouTube link
  const youtubeLink = item.links?.find(link => link.kind === 'youtube');

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={handleLongPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {item.priority === 1 && <View style={styles.pinnedIndicator} />}
      {!hideHeader && (
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) }]}>
            <IconComponent size={16} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.itemType}>{item.type}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {youtubeLink && (
        <View style={styles.youtubeContainer}>
          <Text style={styles.youtubeTitle} numberOfLines={1}>
            🎥 {youtubeLink.title}
          </Text>
        </View>
      )}

      {item.body && (
        <Text style={styles.body} numberOfLines={3}>
          {item.body}
        </Text>
      )}

      <View style={styles.footer}>
        {!hideProject && project && (
          <View style={styles.projectContainer}>
            <View style={[styles.projectDot, { backgroundColor: project.color || '#3B82F6' }]} />
            <Text style={styles.projectName}>{project.name}</Text>
          </View>
        )}
        
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.tag}
                onPress={() => onTagPress?.(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      {!hideMeta && (
        <View style={styles.metaFooter}>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.timeEstimateMin && (
            <Text style={styles.timeEstimate}>{item.timeEstimateMin}m</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  pinnedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  youtubeContainer: {
    backgroundColor: '#FEF3F2',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  youtubeTitle: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  footer: {
    marginBottom: 8,
  },
  projectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  projectName: {
    fontSize: 13,
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timeEstimate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});