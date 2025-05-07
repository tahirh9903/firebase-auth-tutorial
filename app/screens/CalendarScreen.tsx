import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

const CalendarScreen = () => {
  const { isDarkMode, textSize } = useAccessibility();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444444' : '#ddd';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const selectedDateColor = isDarkMode ? '#0066cc' : '#50cebb';
  const todayColor = isDarkMode ? '#004d99' : '#3daa8c';

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDate.getDate();
      const isToday = day === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && { backgroundColor: selectedDateColor },
            isToday && !isSelected && { backgroundColor: todayColor },
          ]}
          onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
        >
          <Text
            style={[
              styles.dayText,
              { color: isSelected ? '#fff' : textColor },
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const changeMonth = (increment: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + increment, 1));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Calendar</Text>
        </View>

        <View style={[styles.calendarContainer, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={[styles.monthButton, { color: textColor }]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: textColor }]}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={[styles.monthButton, { color: textColor }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekDay, { color: secondaryTextColor }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        <View style={[styles.eventsContainer, { backgroundColor: cardBackgroundColor }]}>
          <Text style={[styles.eventsTitle, { color: textColor }]}>Events</Text>
          <Text style={[styles.noEvents, { color: secondaryTextColor }]}>
            No events scheduled for this date
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendarContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    fontSize: 24,
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
  },
  eventsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noEvents: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CalendarScreen; 