import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MoodLog {
  id: string;
  userId: string;
  date: string;
  mood: string;
  symptoms: string[];
  note: string;
  createdAt: string;
}

interface MoodHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  moodLogs: MoodLog[];
  onEditMoodLog: (log: MoodLog) => void;
  onDeleteMoodLog: (logId: string) => void;
}

const moods = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '🤒', label: 'Sick', value: 'sick' },
  { emoji: '❤️', label: 'Loved', value: 'loved' },
  { emoji: '🤕', label: 'In Pain', value: 'in pain' },
];

const symptoms = [
  { emoji: '🤕', label: 'Headache', value: 'headache' },
  { emoji: '🤢', label: 'Nausea', value: 'nausea' },
  { emoji: '😫', label: 'Pain', value: 'pain' },
  { emoji: '😰', label: 'Anxiety', value: 'anxiety' },
  { emoji: '😪', label: 'Drowsy', value: 'drowsy' },
  { emoji: '🤧', label: 'Cold', value: 'cold' },
  { emoji: '😬', label: 'Jaw Pain', value: 'jaw pain' },
  { emoji: '🩹', label: 'Rash', value: 'rash' },
  { emoji: '😕', label: 'Confusion', value: 'confusion' },
];

const extraMoodEmojiMap: { [key: string]: string } = {
  excited: '😃',
  grateful: '🙏',
  relaxed: '😌',
  stressed: '😣',
  bored: '🥱',
  anxious: '😰',
  proud: '😎',
  embarrassed: '😳',
  surprised: '😮',
  hopeful: '🤞',
  // Add more as needed
};

const extraSymptomEmojiMap: { [key: string]: string } = {
  cough: '🤧',
  fever: '🌡️',
  dizzy: '😵',
  sore: '🤒',
  // Add more as needed
};

const formatDateForDisplay = (dateString: string) => {
  try {
    // First try to parse the date string directly
    const date = new Date(dateString);
    
    // If the date is valid, format it
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // If direct parsing fails, try parsing YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
    return 'Invalid Date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const MoodHistoryModal: React.FC<MoodHistoryModalProps> = ({
  visible,
  onClose,
  moodLogs,
  onEditMoodLog,
  onDeleteMoodLog,
}) => {
  const renderMoodLog = (log: MoodLog) => {
    const mood = moods.find(m => m.value === log.mood);
    const formattedDate = formatDateForDisplay(log.createdAt);
    const moodLabel = mood?.label || (log.mood ? log.mood.charAt(0).toUpperCase() + log.mood.slice(1) : 'Unknown');
    // Mood emoji logic
    let moodEmoji = mood?.emoji;
    if (!moodEmoji) {
      // Try to extract emoji from mood value
      const emojiMatch = log.mood && log.mood.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu);
      if (emojiMatch) {
        moodEmoji = emojiMatch[0];
      } else if (log.mood && extraMoodEmojiMap[log.mood.toLowerCase()]) {
        moodEmoji = extraMoodEmojiMap[log.mood.toLowerCase()];
      } else {
        moodEmoji = '';
      }
    }
    
    return (
      <View key={log.id} style={styles.moodLogCard}>
        <View style={styles.moodLogHeader}>
          <View style={styles.moodLogTitleContainer}>
            <Text style={styles.moodLogEmoji}>{moodEmoji}</Text>
            <Text style={styles.moodLogTitle}>{moodLabel}</Text>
          </View>
          <View style={styles.moodLogActions}>
            <TouchableOpacity
              onPress={() => onEditMoodLog(log)}
              style={[styles.moodLogActionButton, styles.editButton]}
            >
              <Icon name="pencil" size={16} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteMoodLog(log.id)}
              style={[styles.moodLogActionButton, styles.moodLogDeleteButton]}
            >
              <Icon name="trash" size={16} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
        
        {log.symptoms.length > 0 && (
          <View style={styles.symptomsList}>
            {log.symptoms.map((symptom, index) => {
              // Normalize for matching: lowercase and replace underscores with spaces
              const normalizedSymptom = symptom.toLowerCase().replace(/_/g, ' ');
              const symptomData = symptoms.find(s => s.value.toLowerCase() === normalizedSymptom);
              // Symptom emoji logic
              let symptomEmoji = symptomData?.emoji;
              if (!symptomEmoji) {
                const emojiMatch = symptom && symptom.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu);
                if (emojiMatch) {
                  symptomEmoji = emojiMatch[0];
                } else if (extraSymptomEmojiMap[normalizedSymptom]) {
                  symptomEmoji = extraSymptomEmojiMap[normalizedSymptom];
                } else {
                  symptomEmoji = '';
                }
              }
              return (
                <View key={index} style={styles.symptomTag}>
                  <Text style={styles.symptomEmoji}>{symptomEmoji}</Text>
                  <Text style={styles.symptomText}>{symptomData?.label || normalizedSymptom.charAt(0).toUpperCase() + normalizedSymptom.slice(1)}</Text>
                </View>
              );
            })}
          </View>
        )}
        
        {log.note && (
          <Text style={styles.moodLogNote}>{log.note}</Text>
        )}
        
        <Text style={styles.moodLogDate}>
          {formattedDate}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mood History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#002B5B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.moodLogsContainer}>
            {moodLogs.length > 0 ? (
              [...moodLogs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(renderMoodLog)
            ) : (
              <View style={styles.noMoodLogsContainer}>
                <Icon name="mood" size={40} color="#666" />
                <Text style={styles.noMoodLogsText}>No mood logs yet</Text>
                <Text style={styles.noMoodLogsSubtext}>Start tracking your mood by logging how you feel</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#002B5B',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  moodLogsContainer: {
    flex: 1,
  },
  moodLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLogTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodLogEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  moodLogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002B5B',
  },
  moodLogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moodLogActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  moodLogDeleteButton: {
    backgroundColor: '#FFEBEE',
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  symptomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  symptomEmoji: {
    fontSize: 14,
  },
  symptomText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  moodLogNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  moodLogDate: {
    fontSize: 12,
    color: '#999',
  },
  noMoodLogsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  noMoodLogsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noMoodLogsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default MoodHistoryModal; 