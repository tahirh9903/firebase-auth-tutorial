import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getFirestore 
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import MoodHistoryModal from '../components/MoodHistoryModal';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  userId: string;
  timeSlot?: string;
  category?: string;
  taskType?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  doctorNPI?: string;
  createdAt?: any; // Firebase Timestamp
  type?: string;
  status?: string;
  taskCategory?: string;
}

interface MoodLog {
  id: string;
  userId: string;
  date: string;
  mood: string;
  symptoms: string[];
  note: string;
  createdAt: string;
}

type CalendarScreenRouteProp = RouteProp<{
  Calendar: {
    editMode?: boolean;
    eventToEdit?: Event;
    selectedDoctor?: any;
  };
}, 'Calendar'>;

interface CalendarScreenProps {
  route?: CalendarScreenRouteProp;
}

const TASK_CATEGORIES = [
  {
    id: 'exercise',
    title: 'Exercise',
    icon: 'fitness-outline',
    color: '#4CAF50',
    description: 'Workout, yoga, or any physical activity'
  },
  {
    id: 'medicine',
    title: 'Medicine',
    icon: 'medical-outline',
    color: '#2196F3',
    description: 'Medications and supplements'
  },
  {
    id: 'appointment',
    title: 'Appointment',
    icon: 'calendar-outline',
    color: '#9C27B0',
    description: 'General appointments and meetings'
  },
  {
    id: 'meal',
    title: 'Meal Planning',
    icon: 'restaurant-outline',
    color: '#FF9800',
    description: 'Meals, diet, and nutrition'
  },
  {
    id: 'therapy',
    title: 'Therapy',
    icon: 'heart-outline',
    color: '#E91E63',
    description: 'Mental health and therapy sessions'
  },
  {
    id: 'lab',
    title: 'Lab Test',
    icon: 'flask-outline',
    color: '#00BCD4',
    description: 'Laboratory tests and diagnostics'
  },
  {
    id: 'other',
    title: 'Other',
    icon: 'ellipsis-horizontal-outline',
    color: '#607D8B',
    description: 'Other health-related tasks'
  }
];

const moods = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😢', label: 'Crying', value: 'crying' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😫', label: 'Exhausted', value: 'exhausted' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😨', label: 'Scared', value: 'scared' },
  { emoji: '🤒', label: 'Sick', value: 'sick' },
  { emoji: '🤕', label: 'In Pain', value: 'in_pain' },
  { emoji: '😎', label: 'Confident', value: 'confident' },
  { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
  { emoji: '😇', label: 'Grateful', value: 'grateful' },
  { emoji: '🥳', label: 'Excited', value: 'excited' },
  { emoji: '😌', label: 'Relaxed', value: 'relaxed' },
  { emoji: '😤', label: 'Stressed', value: 'stressed' }
];

const moodTips = {
  happy: [
    "Keep spreading the joy! Take a moment to reflect on what made you feel this way.",
    "Your positive energy is contagious! Share your happiness with others.",
    "This is a great time to set new goals and build on your momentum.",
    "Celebrate this moment of joy and create a memory to look back on.",
    "Use this positive energy to inspire and uplift those around you."
  ],
  loved: [
    "Cherish these feelings of love and connection.",
    "Take a moment to express your gratitude to those who make you feel loved.",
    "Remember that you deserve to feel loved and valued.",
    "Share your love with others - it will only grow stronger.",
    "Let this feeling of love guide your actions and decisions today."
  ],
  peaceful: [
    "Savor this moment of tranquility and inner peace.",
    "Use this peaceful state to practice mindfulness and meditation.",
    "Let this calm energy guide your interactions with others.",
    "Take time to appreciate the simple things that bring you peace.",
    "Share your peaceful energy with those around you."
  ],
  neutral: [
    "Take this moment of calm to practice mindfulness and self-reflection.",
    "Balance is beautiful. Use this stable state to plan your next steps.",
    "Sometimes being neutral is exactly what we need to process and grow.",
    "Use this balanced state to make clear, rational decisions.",
    "Appreciate the stability this neutral state provides."
  ],
  sad: [
    "It's okay to not be okay. Take deep breaths and reach out to someone you trust.",
    "Remember that this feeling is temporary. You've overcome difficult times before.",
    "Be gentle with yourself. Consider doing something that usually brings you comfort.",
    "Allow yourself to feel this emotion without judgment.",
    "Consider journaling to process your feelings."
  ],
  crying: [
    "Tears can be healing. Let them flow and release your emotions.",
    "Remember that crying is a natural and healthy response.",
    "Be kind to yourself during this emotional moment.",
    "Consider reaching out to a trusted friend or family member.",
    "After crying, try to do something gentle and comforting for yourself."
  ],
  tired: [
    "Your body is asking for rest. Listen to it and take care of yourself.",
    "Remember that rest is not a waste of time, it's an investment in your wellbeing.",
    "Try to identify what's draining your energy and make small adjustments.",
    "Consider taking a short nap or doing some gentle stretching.",
    "Stay hydrated and try to get some fresh air."
  ],
  exhausted: [
    "Your body needs significant rest. Prioritize sleep and recovery.",
    "Consider taking a complete break from demanding activities.",
    "Stay hydrated and eat nourishing foods to rebuild your energy.",
    "Try to identify the source of your exhaustion and make necessary changes.",
    "Remember that it's okay to ask for help when you're exhausted."
  ],
  angry: [
    "Take a moment to breathe. Your feelings are valid, but you're in control.",
    "Channel this energy into something productive or physical exercise.",
    "Remember that anger often masks other emotions. What's really bothering you?",
    "Try to identify the root cause of your anger.",
    "Consider writing down your feelings to process them."
  ],
  frustrated: [
    "Take a step back and breathe. Frustration is temporary.",
    "Try to break down the problem into smaller, manageable parts.",
    "Remember that it's okay to ask for help when you're stuck.",
    "Consider taking a short break to clear your mind.",
    "Channel your frustration into finding solutions."
  ],
  anxious: [
    "Take slow, deep breaths. You are safe in this moment.",
    "Try grounding techniques like naming things you can see, hear, and feel.",
    "Remember that anxiety is temporary and will pass.",
    "Consider doing some gentle exercise to release tension.",
    "Practice self-compassion - it's okay to feel anxious."
  ],
  scared: [
    "You are safe. Take deep breaths and focus on the present moment.",
    "Remember that fear is a natural response, but you are stronger than it.",
    "Try to identify what's making you feel scared and address it directly.",
    "Consider reaching out to someone you trust for support.",
    "Practice self-soothing techniques that work for you."
  ],
  sick: [
    "Your body needs extra care right now. Rest and recovery are your top priorities.",
    "Remember that healing takes time. Be patient with yourself.",
    "Focus on small comforts and stay hydrated. You'll feel better soon.",
    "Listen to your body and give it what it needs.",
    "Consider reaching out to a healthcare provider if needed."
  ],
  in_pain: [
    "Be gentle with yourself. Pain is your body's way of asking for attention.",
    "Try to find a comfortable position and practice deep breathing.",
    "Remember that pain is temporary and will pass.",
    "Consider using heat or cold therapy for relief.",
    "Don't hesitate to seek medical attention if needed."
  ],
  confident: [
    "Harness this confidence to tackle new challenges.",
    "Remember this feeling of strength for when you need it later.",
    "Use your confidence to inspire and support others.",
    "Take on tasks that you've been putting off.",
    "Celebrate your achievements and capabilities."
  ],
  thoughtful: [
    "Use this contemplative state to gain new insights.",
    "Consider journaling your thoughts and ideas.",
    "Take time to reflect on your goals and aspirations.",
    "Share your thoughts with someone you trust.",
    "Use this mental clarity to make important decisions."
  ],
  grateful: [
    "Take a moment to express your gratitude to others.",
    "Write down three things you're grateful for today.",
    "Share your appreciation with someone who has helped you.",
    "Use this feeling of gratitude to spread positivity.",
    "Remember to be grateful for the small things too."
  ],
  excited: [
    "Channel this excitement into productive energy.",
    "Share your enthusiasm with others.",
    "Use this energy to start new projects or hobbies.",
    "Take time to plan and prepare for what excites you.",
    "Remember to stay grounded while enjoying your excitement."
  ],
  relaxed: [
    "Savor this feeling of relaxation and peace.",
    "Use this calm state to practice mindfulness.",
    "Take time to enjoy simple pleasures.",
    "Share your relaxed energy with others.",
    "Remember this feeling for when you need to find calm later."
  ],
  stressed: [
    "Take deep breaths and focus on one thing at a time.",
    "Try to identify the sources of your stress.",
    "Consider doing some gentle exercise to release tension.",
    "Remember to take breaks and practice self-care.",
    "Don't hesitate to ask for help when feeling overwhelmed."
  ]
};

const symptomTips = {
  headache: [
    "Try to rest in a quiet, dark room and stay hydrated.",
    "Consider using a cold or warm compress on your forehead.",
    "Take deep breaths and practice gentle neck stretches.",
    "Avoid screen time and bright lights.",
    "Try massaging your temples gently."
  ],
  nausea: [
    "Stay hydrated with small sips of water or ginger tea.",
    "Try eating small, bland meals throughout the day.",
    "Avoid strong smells and take deep breaths of fresh air.",
    "Consider using acupressure on your wrist.",
    "Try sipping on peppermint tea."
  ],
  pain: [
    "Try gentle stretching or light movement if possible.",
    "Consider using heat or cold therapy for relief.",
    "Practice deep breathing to help manage the discomfort.",
    "Take over-the-counter pain relievers if appropriate.",
    "Try to identify the source of pain and avoid aggravating movements."
  ],
  anxiety: [
    "Take slow, deep breaths and focus on the present moment.",
    "Try grounding techniques like naming things you can see, hear, and feel.",
    "Remember that this feeling will pass. You're stronger than you think.",
    "Consider doing some gentle exercise to release tension.",
    "Practice progressive muscle relaxation."
  ],
  drowsy: [
    "Listen to your body and rest when needed.",
    "Stay hydrated and try to get some fresh air.",
    "Consider taking a short, 20-minute power nap if possible.",
    "Avoid caffeine and heavy meals.",
    "Try some light stretching to increase alertness."
  ],
  cold: [
    "Rest and stay hydrated with warm fluids.",
    "Use a humidifier to help with congestion.",
    "Try steam inhalation with essential oils like eucalyptus.",
    "Get plenty of rest and sleep.",
    "Consider taking over-the-counter cold medicine if appropriate."
  ],
  fever: [
    "Rest and stay hydrated with cool fluids.",
    "Use a cool compress on your forehead.",
    "Take fever-reducing medication if appropriate.",
    "Monitor your temperature regularly.",
    "Seek medical attention if fever persists or is very high."
  ],
  shortness_of_breath: [
    "Sit upright and try to relax your shoulders.",
    "Take slow, deep breaths through your nose.",
    "Avoid strenuous activity.",
    "Consider using a fan for air circulation.",
    "Seek immediate medical attention if severe."
  ],
  dizziness: [
    "Sit or lie down until the feeling passes.",
    "Stay hydrated and avoid sudden movements.",
    "Try focusing on a stationary object.",
    "Avoid driving or operating machinery.",
    "Seek medical attention if persistent or severe."
  ],
  vomiting: [
    "Stay hydrated with small sips of water or clear fluids.",
    "Avoid solid foods until symptoms improve.",
    "Rest and avoid sudden movements.",
    "Try ginger tea or crackers when ready to eat.",
    "Seek medical attention if persistent or severe."
  ],
  stomach_pain: [
    "Try gentle abdominal massage.",
    "Stay hydrated with clear fluids.",
    "Avoid spicy or fatty foods.",
    "Consider using a heating pad.",
    "Seek medical attention if severe or persistent."
  ],
  muscle_aches: [
    "Try gentle stretching and movement.",
    "Use heat or cold therapy.",
    "Consider over-the-counter pain relievers.",
    "Stay hydrated and rest when needed.",
    "Try a warm bath with Epsom salts."
  ],
  fatigue: [
    "Prioritize rest and sleep.",
    "Stay hydrated and eat nourishing foods.",
    "Try gentle exercise to boost energy.",
    "Take short breaks throughout the day.",
    "Consider if you need to adjust your sleep schedule."
  ],
  insomnia: [
    "Establish a regular sleep schedule.",
    "Create a relaxing bedtime routine.",
    "Avoid screens before bed.",
    "Keep your bedroom cool and dark.",
    "Consider relaxation techniques like meditation."
  ],
  chest_pain: [
    "Sit upright and try to relax.",
    "Take slow, deep breaths.",
    "Avoid strenuous activity.",
    "Consider if it's related to anxiety or stress.",
    "Seek immediate medical attention if severe or persistent."
  ],
  cough: [
    "Stay hydrated with warm fluids.",
    "Try honey in warm water or tea.",
    "Use a humidifier in your room.",
    "Avoid irritants like smoke.",
    "Consider over-the-counter cough medicine if appropriate."
  ],
  runny_nose: [
    "Stay hydrated to thin mucus.",
    "Use a humidifier to add moisture to the air.",
    "Try saline nasal spray.",
    "Consider over-the-counter decongestants.",
    "Avoid irritants and allergens."
  ],
  confusion: [
    "Find a quiet, safe place to rest.",
    "Stay hydrated and eat if possible.",
    "Try to focus on one thing at a time.",
    "Avoid making important decisions.",
    "Seek medical attention if severe or persistent."
  ],
  rash: [
    "Keep the area clean and dry.",
    "Avoid scratching the affected area.",
    "Use gentle, fragrance-free products.",
    "Consider over-the-counter anti-itch cream.",
    "Seek medical attention if severe or spreading."
  ],
  jaw_pain: [
    "Try gentle jaw stretches.",
    "Apply heat or cold therapy.",
    "Avoid hard or chewy foods.",
    "Practice stress reduction techniques.",
    "Consider seeing a dentist if persistent."
  ]
};

const symptoms = [
  { emoji: '🤕', label: 'Headache', value: 'headache' },
  { emoji: '🤢', label: 'Nausea', value: 'nausea' },
  { emoji: '😫', label: 'Pain', value: 'pain' },
  { emoji: '😰', label: 'Anxiety', value: 'anxiety' },
  { emoji: '😪', label: 'Drowsy', value: 'drowsy' },
  { emoji: '🤧', label: 'Cold', value: 'cold' },
  { emoji: '🤒', label: 'Fever', value: 'fever' },
  { emoji: '😮‍💨', label: 'Shortness of Breath', value: 'shortness_of_breath' },
  { emoji: '😵', label: 'Dizziness', value: 'dizziness' },
  { emoji: '🤮', label: 'Vomiting', value: 'vomiting' },
  { emoji: '😖', label: 'Stomach Pain', value: 'stomach_pain' },
  { emoji: '😣', label: 'Muscle Aches', value: 'muscle_aches' },
  { emoji: '😫', label: 'Fatigue', value: 'fatigue' },
  { emoji: '😴', label: 'Insomnia', value: 'insomnia' },
  { emoji: '😤', label: 'Chest Pain', value: 'chest_pain' },
  { emoji: '😷', label: 'Cough', value: 'cough' },
  { emoji: '🤧', label: 'Runny Nose', value: 'runny_nose' },
  { emoji: '😵‍💫', label: 'Confusion', value: 'confusion' },
  { emoji: '😳', label: 'Rash', value: 'rash' },
  { emoji: '😬', label: 'Jaw Pain', value: 'jaw_pain' }
];

const LEVEL_BADGES = [
  { key: 'level1', label: 'Level 1', emoji: '🥉', description: 'Reached Level 1' },
  { key: 'level2', label: 'Level 2', emoji: '🥈', description: 'Reached Level 2' },
  { key: 'level3', label: 'Level 3', emoji: '🥇', description: 'Reached Level 3' },
  { key: 'level4', label: 'Level 4', emoji: '🏅', description: 'Reached Level 4' },
  { key: 'level5', label: 'Level 5', emoji: '🏆', description: 'Reached Level 5' },
  { key: 'level6', label: 'Level 6', emoji: '👑', description: 'Reached Level 6' },
  { key: 'level7', label: 'Level 7', emoji: '🌟', description: 'Reached Level 7' },
  { key: 'level8', label: 'Level 8', emoji: '💎', description: 'Reached Level 8' },
  { key: 'level9', label: 'Level 9', emoji: '🚀', description: 'Reached Level 9' },
  { key: 'level10', label: 'Level 10', emoji: '🦄', description: 'Reached Level 10' },
];

function getStreak(moodLogs: MoodLog[]): number {
  if (!moodLogs.length) return 0;
  // Sort logs by date descending
  const sorted = [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

function getXP(moodLogs: MoodLog[]): number {
  return moodLogs.length * 10;
}

function getLevel(xp: number): number {
  return Math.floor(xp / 50) + 1;
}

function getXPProgress(xp: number): number {
  return xp % 50;
}

function getBadges(moodLogs: MoodLog[], level: number): string[] {
  const badges: string[] = [];
  // Level badges
  for (let i = 1; i <= level; i++) {
    badges.push(`level${i}`);
  }
  return badges;
}

function getPositiveMoodRatio(moodLogs: MoodLog[]): number {
  const positiveMoods = ['happy', 'loved', 'peaceful', 'confident', 'grateful', 'excited', 'relaxed'];
  if (!moodLogs.length) return 0;
  const count = moodLogs.filter(log => positiveMoods.includes(log.mood)).length;
  return count / moodLogs.length;
}

const MoodQuestTracker = ({ moodLogs }: { moodLogs: MoodLog[] }) => {
  const xp = getXP(moodLogs);
  const level = getLevel(xp);
  const xpProgress = getXPProgress(xp);
  const streak = getStreak(moodLogs);
  const badges = getBadges(moodLogs, level);
  const positiveRatio = getPositiveMoodRatio(moodLogs);

  // Simple avatar state
  let avatar = '🙂';
  if (positiveRatio > 0.7) avatar = '😃';
  else if (positiveRatio > 0.4) avatar = '😌';
  else avatar = '😐';

  // Only show level badges for levels reached
  const visibleLevelBadges = LEVEL_BADGES.filter(badge => badges.includes(badge.key));

  return (
    <View style={styles.questContainer}>
      <View style={styles.questAvatarRow}>
        <Text style={styles.questAvatar}>{avatar}</Text>
        <View style={styles.questStats}>
          <Text style={styles.questStatText}>Level {level}</Text>
          <Text style={styles.questStatText}>XP: {xp} / {level * 50}</Text>
          <Text style={styles.questStatText}>Streak: {streak} days</Text>
        </View>
      </View>
      {/* Progress Bar */}
      <View style={styles.questProgressBarBg}>
        <View style={[styles.questProgressBarFill, { width: `${(xpProgress / 50) * 100}%` }]} />
      </View>
      {/* Badges */}
      <Text style={styles.questBadgesTitle}>Badges</Text>
      <View style={styles.questBadgesGrid}>
        {visibleLevelBadges.map(badge => (
          <View
            key={badge.key}
            style={[styles.questBadge, styles.questBadgeEarned]}
          >
            <Text style={styles.questBadgeEmoji}>{badge.emoji}</Text>
            <Text style={styles.questBadgeLabel}>{badge.label}</Text>
            <Text style={styles.questBadgeDesc}>{badge.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({ route }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<{ [date: string]: Event[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tempTimeSlot, setTempTimeSlot] = useState<string | null>(null);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [moodNote, setMoodNote] = useState('');
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [editingMoodLog, setEditingMoodLog] = useState<MoodLog | null>(null);
  const [showMoodHistory, setShowMoodHistory] = useState(false);

  const navigation = useNavigation();

  // Get Firestore instance directly
  const firestore = getFirestore(app);

  // Generate time slots from 9am to 5pm with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      // Format time with leading zeros and consistent AM/PM format
      const timeString = `${formattedHour.toString().padStart(2, '0')}:00 ${ampm}`;
      slots.push(timeString);
      if (hour !== 17) {
        slots.push(`${formattedHour.toString().padStart(2, '0')}:30 ${ampm}`);
      }
    }
    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    const auth = getAuth();
    setCurrentUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
      fetchMoodLogs();
    }
  }, [currentUser]);

  // Handle edit mode from route params
  useEffect(() => {
    if (route?.params?.editMode && route?.params?.eventToEdit) {
      const event = route.params.eventToEdit;
      setSelectedDate(event.date);
      setEventTitle(event.title);
      setEventDescription(event.description);
      setSelectedTimeSlot(event.timeSlot || null);
      setIsEditMode(true);
      setEditingEvent(event);
      setModalVisible(true);
    }
  }, [route?.params]);

  // Handle selected doctor from route params
  useEffect(() => {
    if (route?.params?.selectedDoctor) {
      setSelectedDoctor(route.params.selectedDoctor);
      // If a doctor is selected, open the time slots modal
      setShowTimeSlots(true);
    }
  }, [route?.params]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(firestore, 'events');
      const q = query(
        eventsRef, 
        where('userId', '==', currentUser?.uid),
        where('category', '==', 'events') // Only fetch regular calendar events
      );
      const snapshot = await getDocs(q);

      const fetchedEvents: { [date: string]: Event[] } = {};
      
      // Process each event
      for (const docSnapshot of snapshot.docs) {
        const eventData = docSnapshot.data();
        const eventId = docSnapshot.id;
        
        // Verify the event still exists
        const eventRef = doc(firestore, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const event: Event = {
            id: eventId,
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            userId: eventData.userId,
            timeSlot: eventData.timeSlot,
            doctorId: eventData.doctorId,
            doctorName: eventData.doctorName,
            doctorSpecialty: eventData.doctorSpecialty,
            doctorHospital: eventData.doctorHospital,
            doctorNPI: eventData.doctorNPI
          };
          
          // Group events by date
          if (!fetchedEvents[event.date]) {
            fetchedEvents[event.date] = [];
          }
          fetchedEvents[event.date].push(event);
        }
      }

      console.log('Fetched calendar events:', fetchedEvents);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    }
  };

  const fetchMoodLogs = async () => {
    try {
      const moodLogsRef = collection(firestore, 'moodLogs');
      const q = query(
        moodLogsRef,
        where('userId', '==', currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      
      const logs: MoodLog[] = [];
      snapshot.docs.forEach(doc => {
        const log = { id: doc.id, ...doc.data() } as MoodLog;
        logs.push(log);
      });
      
      setMoodLogs(logs);
    } catch (error) {
      console.error('Error fetching mood logs:', error);
    }
  };

  const handleDayPress = async (day: { dateString: string }) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
    
    // Fetch fresh events for the selected date
    try {
      const eventsRef = collection(firestore, 'events');
      const q = query(
        eventsRef,
        where('userId', '==', currentUser?.uid),
        where('date', '==', day.dateString)
      );
      const snapshot = await getDocs(q);
      
      const validEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setSelectedEvents(validEvents);
    } catch (error) {
      console.error('Error fetching events for day:', error);
      setSelectedEvents([]);
    }
    
    // Show the time slots modal
    setShowTimeSlots(true);
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      // First try to parse the date string directly
      const date = new Date(dateString);
      
      // If the date is valid, format it
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM d, yyyy');
      }
      
      // If direct parsing fails, try parsing YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          return format(parsedDate, 'MMM d, yyyy');
        }
      }
      
      return 'Invalid Date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleTimeSlotSelect = async (timeSlot: string) => {
    setTempTimeSlot(timeSlot);
    setShowCategoryModal(true);
    setShowTimeSlots(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = TASK_CATEGORIES.find(cat => cat.id === categoryId);
    if (category && tempTimeSlot) {
      handleAddEvent(tempTimeSlot, category);
    }
    setShowCategoryModal(false);
  };

  const handleAddEvent = async (timeSlot: string, category: typeof TASK_CATEGORIES[0]) => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to add events');
        return;
      }

      if (!timeSlot) {
        Alert.alert('Error', 'Please select a time slot');
        return;
      }

      const formattedTimeSlot = timeSlot.replace(/^(\d):/, '0$1:');
      const eventData: Partial<Event> = {
        title: `${category.title} at ${formattedTimeSlot}`,
        description: eventDescription || `Scheduled for ${formatDateForDisplay(selectedDate)}`,
        date: selectedDate,
        timeSlot: formattedTimeSlot,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        type: 'calendar_event',
        // Only set category as upcoming_appointments if it's a doctor appointment
        category: (category.id === 'appointment' && selectedDoctor) ? 'upcoming_appointments' : 'events',
        taskType: category.id,
        taskCategory: category.title,
        status: 'pending'
      };

      // If this is a doctor appointment and we have selected doctor info
      if (category.id === 'appointment' && selectedDoctor) {
        eventData.doctorId = selectedDoctor.id;
        eventData.doctorName = selectedDoctor.name;
        eventData.doctorSpecialty = selectedDoctor.specialty;
        eventData.doctorHospital = selectedDoctor.hospital;
        eventData.doctorNPI = selectedDoctor.npi;
      }

      const eventsRef = collection(firestore, 'events');
      await addDoc(eventsRef, eventData);
      
      setModalVisible(false);
      setShowTimeSlots(false);
      setSelectedTimeSlot(null);
      setSelectedDoctor(null);
      setEventTitle('');
      setEventDescription('');
      setSelectedCategory(null);
      setTempTimeSlot(null);
      
      await fetchEvents();
      
      const successMessage = category.id === 'appointment' 
        ? (selectedDoctor ? 'Doctor appointment' : 'Appointment task')
        : `${category.title} task`;
      Alert.alert('Success', `${successMessage} added successfully`);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to schedule task. Please try again.');
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark dates with events
    Object.keys(events).forEach((date) => {
      if (events[date] && events[date].length > 0) {
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: events[date].length > 1 ? '#E8F5E9' : '#F5F5F5',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#50cebb'
            },
            text: {
              color: '#333333',
              fontWeight: 'bold'
            }
          }
        };
      }
    });

    // Add selected date marking
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#0066FF',
        selectedTextColor: '#FFFFFF'
      };
    }

    return marked;
  };

  // Update the modal title to show when scheduling with a doctor
  const getModalTitle = () => {
    if (selectedDoctor) {
      return `Schedule with ${selectedDoctor.name}`;
    }
    return isEditMode ? 'Edit Event' : `Add Event for ${selectedDate}`;
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!eventId) {
      console.error('No event ID provided');
      return;
    }

    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete the appointment "${eventTitle}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const eventRef = doc(firestore, 'events', eventId);
              await deleteDoc(eventRef);
              console.log('Successfully deleted from Firestore');

              setEvents(prevEvents => {
                const newEvents = { ...prevEvents };
                Object.keys(newEvents).forEach(date => {
                  newEvents[date] = newEvents[date].filter(event => event.id !== eventId);
                  if (newEvents[date].length === 0) {
                    delete newEvents[date];
                  }
                });
                return newEvents;
              });

              setSelectedEvents(prev => prev.filter(event => event.id !== eventId));
              setModalVisible(false);
              
              Alert.alert('Success', 'Appointment deleted successfully');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete appointment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getEventColor = (taskType: string): string => {
    const colorMap: { [key: string]: string } = {
      medicine: '#2196F3',
      appointment: '#9C27B0',
      therapy: '#E91E63',
      lab: '#00BCD4',
      exercise: '#4CAF50',
      meal: '#FF9800',
      other: '#607D8B'
    };
    return colorMap[taskType] || '#607D8B';
  };

  const renderEventItem = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.timeContainer}>
        <Text style={styles.appointmentTime}>{event.timeSlot}</Text>
        <View style={[styles.timeIndicator, { backgroundColor: getEventColor(event.taskType || '') }]} />
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            {event.taskType === 'medicine' && (
              <Icon name="medical-outline" size={20} color="#2196F3" style={styles.eventIcon} />
            )}
            {event.taskType === 'appointment' && (
              <Icon name="calendar-outline" size={20} color="#9C27B0" style={styles.eventIcon} />
            )}
            {event.taskType === 'therapy' && (
              <Icon name="heart-outline" size={20} color="#E91E63" style={styles.eventIcon} />
            )}
            {event.taskType === 'lab' && (
              <Icon name="flask-outline" size={20} color="#00BCD4" style={styles.eventIcon} />
            )}
            {event.taskType === 'exercise' && (
              <Icon name="fitness-outline" size={20} color="#4CAF50" style={styles.eventIcon} />
            )}
            {event.taskType === 'meal' && (
              <Icon name="restaurant-outline" size={20} color="#FF9800" style={styles.eventIcon} />
            )}
            {event.taskType === 'other' && (
              <Icon name="ellipsis-horizontal-outline" size={20} color="#607D8B" style={styles.eventIcon} />
            )}
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity
              onPress={() => handleDeleteEvent(event.id, event.title)}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Icon name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.eventDescription}>{event.description}</Text>
        <View style={styles.eventMetadata}>
          <View style={styles.metadataItem}>
            <Icon name="time-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>{event.timeSlot}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Icon name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metadataText}>
              {format(new Date(event.date + 'T00:00:00'), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood);
  };

  const handleSymptomSelect = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSaveMood = async () => {
    if (!selectedMood) return;

    try {
      const moodData = {
        userId: currentUser?.uid,
        date: selectedDate,
        mood: selectedMood,
        symptoms: selectedSymptoms,
        note: moodNote,
        createdAt: new Date().toISOString(),
      };

      if (editingMoodLog) {
        await updateDoc(doc(firestore, 'moodLogs', editingMoodLog.id), moodData);
      } else {
        await addDoc(collection(firestore, 'moodLogs'), moodData);
      }

      setShowMoodTracker(false);
      setSelectedMood(null);
      setSelectedSymptoms([]);
      setMoodNote('');
      setEditingMoodLog(null);
      await fetchMoodLogs();
      Alert.alert('Success', `Mood log ${editingMoodLog ? 'updated' : 'saved'} successfully!`);
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save mood log. Please try again.');
    }
  };

  const handleDeleteMoodLog = async (logId: string) => {
    Alert.alert(
      'Delete Mood Log',
      'Are you sure you want to delete this mood log?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'moodLogs', logId));
              await fetchMoodLogs();
              Alert.alert('Success', 'Mood log deleted successfully');
            } catch (error) {
              console.error('Error deleting mood log:', error);
              Alert.alert('Error', 'Failed to delete mood log');
            }
          }
        }
      ]
    );
  };

  const handleEditMoodLog = (log: MoodLog) => {
    setEditingMoodLog(log);
    setSelectedMood(log.mood);
    setSelectedSymptoms(log.symptoms);
    setMoodNote(log.note);
    setShowMoodTracker(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Schedule Tasks</Text>
          </View>

          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType="custom"
            theme={{
              todayTextColor: '#0066FF',
              selectedDayBackgroundColor: '#0066FF',
              selectedDayTextColor: '#FFFFFF',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14
            }}
          />

          {/* Event Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Appointments for {formatDateForDisplay(selectedDate)}</Text>
                    <ScrollView style={styles.eventsContainer}>
                      {selectedEvents.map(renderEventItem)}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Time Slots Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showTimeSlots}
            onRequestClose={() => setShowTimeSlots(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowTimeSlots(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Time</Text>
                    {selectedDoctor && (
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{selectedDoctor.name}</Text>
                        <Text style={styles.doctorSpecialty}>
                          {selectedDoctor.specialty}
                          {selectedDoctor.subSpecialty ? ` (${selectedDoctor.subSpecialty})` : ''}
                        </Text>
                        {selectedDoctor.hospital && (
                          <Text style={styles.doctorHospital}>
                            <Icon name="business-outline" size={14} color="#7f8c8d" /> {selectedDoctor.hospital}
                          </Text>
                        )}
                      </View>
                    )}
                    <Text style={styles.modalSubtitle}>
                      {selectedDate ? formatDateForDisplay(selectedDate) : 'Select a date'}
                    </Text>
                    <ScrollView style={styles.timeSlotsContainer}>
                      {timeSlots.map((slot, index) => {
                        const formattedSlot = slot.replace(/^(\d):/, '0$1:');
                        const isSlotTaken = selectedEvents.some(event => event.timeSlot === formattedSlot);
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlotItem,
                              selectedTimeSlot === formattedSlot && styles.selectedTimeSlot,
                              isSlotTaken && styles.takenTimeSlot
                            ]}
                            onPress={() => {
                              if (!isSlotTaken) {
                                handleTimeSlotSelect(formattedSlot);
                              }
                            }}
                            disabled={isSlotTaken}
                          >
                            <Text style={[
                              styles.timeSlotText,
                              selectedTimeSlot === formattedSlot && styles.selectedTimeSlotText,
                              isSlotTaken && styles.takenTimeSlotText
                            ]}>
                              {formattedSlot}
                            </Text>
                            {isSlotTaken && (
                              <Text style={styles.takenSlotIndicator}>Taken</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowTimeSlots(false)}
                    >
                      <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Category Selection Modal */}
          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.categoryModal}>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>Select Task Type</Text>
                <ScrollView>
                  <View style={styles.categoryGrid}>
                    {TASK_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          selectedCategory === category.id && styles.selectedCategoryItem
                        ]}
                        onPress={() => {
                          setSelectedCategory(category.id);
                          handleAddEvent(selectedTimeSlot || 'All Day', category);
                        }}
                      >
                        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                          <Icon name={category.icon} size={24} color="#FFFFFF" />
                        </View>
                        <Text style={styles.categoryItemTitle}>{category.title}</Text>
                        <Text style={styles.categoryDescription}>{category.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowCategoryModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      if (selectedCategory && tempTimeSlot) {
                        const category = TASK_CATEGORIES.find(cat => cat.id === selectedCategory);
                        if (category) {
                          handleAddEvent(tempTimeSlot, category);
                        }
                      }
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={styles.buttonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Mood Tracker Section */}
          <View style={styles.moodTrackerSection}>
            <TouchableOpacity 
              style={styles.moodTrackerButton}
              onPress={() => setShowMoodTracker(true)}
            >
              <View style={styles.moodTrackerContent}>
                <Text style={styles.moodTrackerEmoji}>😐</Text>
                <View style={styles.moodTrackerTextContainer}>
                  <Text style={styles.moodTrackerTitle}>How are you feeling today?</Text>
                  <Text style={styles.moodTrackerSubtitle}>Log your mood and symptoms!</Text>
                </View>
                <Icon name="add-circle-outline" size={24} color="#002B5B" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.moodHistoryButton}
              onPress={() => setShowMoodHistory(true)}
            >
              <View style={styles.moodHistoryButtonContent}>
                <View style={styles.moodHistoryButtonLeft}>
                  <Icon name="time" size={24} color="#002B5B" />
                  <View style={styles.moodHistoryButtonTextContainer}>
                    <Text style={styles.moodHistoryButtonTitle}>Mood History</Text>
                    <Text style={styles.moodHistoryButtonSubtitle}>
                      {moodLogs.length} entries
                    </Text>
                  </View>
                </View>
                <Icon name="calendar-outline" size={24} color="#002B5B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Mood Quest Tracker Section */}
          <View style={styles.questSection}>
            <Text style={styles.questTitle}>🎮 Mood Quest Tracker</Text>
            <MoodQuestTracker moodLogs={moodLogs} />
          </View>

          {/* Mood History Modal */}
          <MoodHistoryModal
            visible={showMoodHistory}
            onClose={() => setShowMoodHistory(false)}
            moodLogs={moodLogs}
            onEditMoodLog={handleEditMoodLog}
            onDeleteMoodLog={handleDeleteMoodLog}
          />
        </ScrollView>

        {/* Mood Tracker Modal (remains outside ScrollView) */}
        <Modal
          visible={showMoodTracker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMoodTracker(false)}
        >
          <View style={styles.moodTrackerModalOverlay}>
            <View style={styles.moodTrackerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Your Mood</Text>
                <TouchableOpacity 
                  onPress={() => setShowMoodTracker(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#002B5B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <Text style={styles.sectionTitle}>How are you feeling?</Text>
                <View style={styles.moodsContainer}>
                  {moods.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodButton,
                        selectedMood === mood.value && styles.selectedMoodButton
                      ]}
                      onPress={() => handleMoodSelect(mood.value)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[
                        styles.moodLabel,
                        selectedMood === mood.value && styles.selectedMoodLabel
                      ]}>
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Any symptoms?</Text>
                <View style={styles.symptomsContainer}>
                  {symptoms.map((symptom) => (
                    <TouchableOpacity
                      key={symptom.value}
                      style={[
                        styles.symptomButton,
                        selectedSymptoms.includes(symptom.value) && styles.selectedSymptomButton
                      ]}
                      onPress={() => handleSymptomSelect(symptom.value)}
                    >
                      <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                      <Text style={[
                        styles.symptomLabel,
                        selectedSymptoms.includes(symptom.value) && styles.selectedSymptomLabel
                      ]}>
                        {symptom.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Add a note (optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="How are you feeling today?"
                  value={moodNote}
                  onChangeText={setMoodNote}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {selectedMood && (
                  <View style={styles.moodTipContainer}>
                    <Text style={styles.moodTipTitle}>Mood Tip</Text>
                    <View style={styles.moodTipContent}>
                      <Text style={styles.moodTipText}>
                        {moodTips[selectedMood as keyof typeof moodTips][
                          Math.floor(Math.random() * moodTips[selectedMood as keyof typeof moodTips].length)
                        ]}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedSymptoms.length > 0 && (
                  <View style={styles.moodTipContainer}>
                    <Text style={styles.moodTipTitle}>Symptom Tips</Text>
                    {selectedSymptoms.map((symptom) => (
                      <View key={symptom} style={[styles.moodTipContent, { marginBottom: 12 }]}>
                        <Text style={styles.symptomTipHeader}>
                          {symptoms.find(s => s.value === symptom)?.emoji} {symptoms.find(s => s.value === symptom)?.label}
                        </Text>
                        <Text style={styles.moodTipText}>
                          {symptomTips[symptom as keyof typeof symptomTips][
                            Math.floor(Math.random() * symptomTips[symptom as keyof typeof symptomTips].length)
                          ]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !selectedMood && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveMood}
                  disabled={!selectedMood}
                >
                  <Text style={styles.saveButtonText}>Save Mood Log</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  timeSlotsContainer: {
    marginVertical: 10,
  },
  timeSlotItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedTimeSlot: {
    backgroundColor: '#50cebb',
    borderColor: '#50cebb',
  },
  timeSlotText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsContainer: {
    flex: 1,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#50cebb',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#50cebb',
    fontWeight: '500',
  },
  timeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  eventDetails: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#50cebb',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  doctorInfo: {
    backgroundColor: '#f0f5ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  doctorHospital: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  timeSlotLabel: {
    fontSize: 16,
    color: '#50cebb',
    marginBottom: 15,
    fontWeight: '500',
  },
  takenTimeSlot: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    opacity: 0.7,
  },
  takenTimeSlotText: {
    color: '#721c24',
  },
  takenSlotIndicator: {
    fontSize: 12,
    color: '#721c24',
    marginLeft: 8,
  },
  categoryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  categoryContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCategoryItem: {
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  moodTrackerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  moodTrackerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  moodTrackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodTrackerEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  moodTrackerTextContainer: {
    flex: 1,
  },
  moodTrackerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002B5B',
    marginBottom: 4,
  },
  moodTrackerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  moodTrackerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
    marginBottom: 10,
    marginTop: 18,
  },
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  moodButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
  },
  selectedMoodButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedMoodLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  symptomButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
  },
  selectedSymptomButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  symptomEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  symptomLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedSymptomLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    color: '#333',
    marginBottom: 32,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  moodTrackerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  moodHistoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodHistoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodHistoryButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodHistoryButtonTextContainer: {
    marginLeft: 12,
  },
  moodHistoryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002B5B',
    marginBottom: 2,
  },
  moodHistoryButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  moodTipContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  moodTipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  moodTipContent: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moodTipText: {
    fontSize: 17,
    color: '#333',
    lineHeight: 26,
  },
  symptomTipHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  questSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FAFAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B0BEC5',
    maxWidth: 340,
    alignSelf: 'center',
    width: '92%',
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 8,
    textAlign: 'center',
  },
  questContainer: {
    alignItems: 'center',
  },
  questAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questAvatar: {
    fontSize: 36,
    marginRight: 12,
  },
  questStats: {
    alignItems: 'flex-start',
  },
  questStatText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginBottom: 1,
  },
  questProgressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginVertical: 8,
    overflow: 'hidden',
  },
  questProgressBarFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 6,
  },
  questBadgesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  questBadgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
  },
  questBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 6,
    width: 64,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  questBadgeEarned: {
    backgroundColor: '#FFFBEA',
    borderColor: '#FFD600',
  },
  questBadgeLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E9ECEF',
    opacity: 0.5,
  },
  questBadgeEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  questBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    marginBottom: 1,
    textAlign: 'center',
  },
  questBadgeDesc: {
    fontSize: 9,
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default CalendarScreen;