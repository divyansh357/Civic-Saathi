import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '@store/index';
import { apiPost } from '@services/api/client';
import { Complaint } from '@/types';

interface FeedbackScreenProps {
  complaint: Complaint;
  onBack: () => void;
  onSuccess: () => void;
}

export default function FeedbackScreen({ complaint, onBack, onSuccess }: FeedbackScreenProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!accessToken || !user) return;

    setSubmitting(true);
    try {
      await apiPost(
        '/feedback',
        {
          complaintId: complaint.id,
          rating,
          comment: comment.trim() || undefined,
          isSatisfied: rating >= 3,
        },
        accessToken
      );
      Alert.alert('Thank You!', 'Your feedback has been submitted.', [
        { text: 'OK', onPress: onSuccess }
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Rate Resolution</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Complaint summary */}
        <View style={styles.complaintCard}>
          <Text style={styles.complaintLabel}>Complaint</Text>
          <Text style={styles.complaintTitle}>{complaint.title}</Text>
          <View style={styles.resolvedBadge}>
            <Text style={styles.resolvedText}>✅ {complaint.status}</Text>
          </View>
        </View>

        {/* Star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How satisfied are you with the resolution?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  {star <= rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 ? 'Very Dissatisfied' :
               rating === 2 ? 'Dissatisfied' :
               rating === 3 ? 'Neutral' :
               rating === 4 ? 'Satisfied' : 'Very Satisfied'}
            </Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Tell us more about your experience..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.hint}>{comment.length}/500</Text>
        </View>

        <Pressable
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit Feedback</Text>
          )}
        </Pressable>
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

  complaintCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  complaintLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  complaintTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  resolvedBadge: { alignSelf: 'flex-start', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  resolvedText: { fontSize: 12, fontWeight: '600', color: '#065F46' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 12 },

  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 40, color: '#CBD5E1' },
  starActive: { color: '#F59E0B' },
  ratingLabel: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#F59E0B' },

  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0F172A',
  },
  textarea: { height: 100, paddingTop: 12 },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'right' },

  submitBtn: {
    backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
