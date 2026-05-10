import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiPost } from '@services/api/client';

const CATEGORIES = [
  { id: 'ROADS', label: '🛣️ Roads', desc: 'Potholes, damage, cave-ins' },
  { id: 'WATER', label: '💧 Water', desc: 'Supply, leaks, quality' },
  { id: 'SANITATION', label: '🗑️ Sanitation', desc: 'Garbage, sewage, drains' },
  { id: 'ELECTRICITY', label: '⚡ Electricity', desc: 'Street lights, outages' },
  { id: 'PARKS', label: '🌳 Parks', desc: 'Maintenance, equipment' },
  { id: 'OTHER', label: '📌 Other', desc: 'Miscellaneous issues' },
];

const PRIORITIES = [
  { id: 'CRITICAL', label: '🔴 Critical', color: '#f87171' },
  { id: 'HIGH', label: '🟠 High', color: '#fb923c' },
  { id: 'MEDIUM', label: '🟡 Medium', color: '#fbbf24' },
  { id: 'LOW', label: '🔵 Low', color: '#60a5fa' },
];

interface NewComplaintScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function NewComplaintScreen({ onBack, onSuccess }: NewComplaintScreenProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length >= 5 && category !== '' && description.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit || !accessToken) return;
    setSubmitting(true);
    try {
      await apiPost(
        '/complaints',
        { title: title.trim(), description: description.trim(), category, priority, address: address.trim() },
        accessToken
      );
      Alert.alert('Success', 'Your complaint has been submitted successfully!', [
        { text: 'OK', onPress: onSuccess }
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Issue Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the issue"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.hint}>{title.length}/100 characters</Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryCard, category === cat.id && styles.categoryCardActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.label.split(' ')[0]}</Text>
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                  {cat.label.split(' ').slice(1).join(' ')}
                </Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.priorityBtn, priority === p.id && { backgroundColor: `${p.color}20`, borderColor: p.color }]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[styles.priorityText, priority === p.id && { color: p.color }]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue in detail. Include any relevant information that would help resolve it faster."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.hint}>{description.length}/1000 characters</Text>
        </View>

        {/* Address */}
        <View style={styles.field}>
          <Text style={styles.label}>Location / Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address or landmark"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit Complaint</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Your complaint will be reviewed and assigned to the relevant department within 24 hours.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#0F172A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  required: { color: '#f87171' },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'right' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0F172A',
  },
  textarea: { height: 120, paddingTop: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  categoryCardActive: { borderColor: '#0F766E', backgroundColor: '#F0FDF9' },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  categoryLabelActive: { color: '#0F766E' },
  categoryDesc: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  submitBtn: {
    backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  disclaimer: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
