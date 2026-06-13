import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@services/api/client';

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
}

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  selectedCityId?: string;
}

export default function CityPickerModal({ visible, onClose, onSelect, selectedCityId }: CityPickerModalProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && cities.length === 0) {
      fetchCities();
    }
  }, [visible]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/geography/cities');
      if (response && response.data) {
        setCities(response.data);
      }
    } catch (e) {
      console.warn('Failed to fetch cities:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select City</Text>
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
              data={cities}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.cityItem,
                    selectedCityId === item.id && styles.cityItemSelected
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.cityInfo}>
                    <Text style={[
                      styles.cityName,
                      selectedCityId === item.id && styles.cityTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[
                      styles.cityState,
                      selectedCityId === item.id && styles.cityTextSelected
                    ]}>
                      {item.state}, {item.country}
                    </Text>
                  </View>
                  {selectedCityId === item.id && (
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
  cityItem: {
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
  cityItemSelected: {
    borderColor: '#6A8D73',
    backgroundColor: '#EAF0EB',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F3E32',
  },
  cityState: {
    fontSize: 14,
    color: '#7F8D82',
    marginTop: 4,
  },
  cityTextSelected: {
    color: '#1F2A21',
  },
});
