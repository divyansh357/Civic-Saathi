import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@services/api/client';

export interface Department {
  id: string;
  name: string;
  categoryType: string;
}

interface DepartmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (department: Department) => void;
  selectedDepartmentId?: string;
}

export default function DepartmentPickerModal({ visible, onClose, onSelect, selectedDepartmentId }: DepartmentPickerModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && departments.length === 0) {
      fetchDepartments();
    }
  }, [visible]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ content: Department[] }>('/departments');
      if (response && response.content) {
        setDepartments(response.content);
      } else if (Array.isArray(response)) {
        setDepartments(response);
      }
    } catch (e) {
      console.warn('Failed to fetch departments:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Department</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#2F3E32" />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6A8D73" />
            </View>
          ) : (
            <FlatList
              data={departments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#7F8D82', marginTop: 20 }}>
                  No departments found.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.deptItem,
                    selectedDepartmentId === item.id && styles.deptItemSelected
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.deptInfo}>
                    <Text style={[
                      styles.deptName,
                      selectedDepartmentId === item.id && styles.deptTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[
                      styles.deptCategory,
                      selectedDepartmentId === item.id && styles.deptTextSelected
                    ]}>
                      Category: {item.categoryType}
                    </Text>
                  </View>
                  {selectedDepartmentId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#6A8D73" />
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F3F4F1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E1',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F3E32',
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  deptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deptItemSelected: {
    borderColor: '#6A8D73',
    backgroundColor: '#EAF0EB',
  },
  deptInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F3E32',
  },
  deptCategory: {
    fontSize: 14,
    color: '#7F8D82',
    marginTop: 4,
  },
  deptTextSelected: {
    color: '#1F2A21',
  },
});
