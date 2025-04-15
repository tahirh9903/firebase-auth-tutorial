import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { User } from '@firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface HomeScreenProps {
  user: User | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user }) => {
  const [userData, setUserData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          console.log('Fetching user profile for uid:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('User doc exists:', userDoc.exists());
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('Fetched user data:', data);
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        console.log('No user object available');
      }
    };

    fetchUserProfile();
  }, [user]);

  const generateWeekDays = () => {
    const days = [];
    const currentDate = new Date();
    const firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      days.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: date.getDate(),
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  const recommendedDoctors = [
    {
      id: 1,
      name: 'Dr. Olivia Turner, M.D.',
      specialty: 'Dermato-Endocrinology',
      rating: 5,
      consultations: 60,
      image: 'https://example.com/placeholder1.jpg',
    },
    {
      id: 2,
      name: 'Dr. Alexander Bennett, Ph.D.',
      specialty: 'Dermato-Genetics',
      rating: 4.5,
      consultations: 40,
      image: 'https://example.com/placeholder2.jpg',
    },
    {
      id: 3,
      name: 'Dr. Sophia Martinez, Ph.D.',
      specialty: 'Cosmetic Bioengineering',
      rating: 5,
      consultations: 150,
      image: 'https://example.com/placeholder3.jpg',
    },
    {
      id: 4,
      name: 'Dr. Michael Davidson, M.D.',
      specialty: 'Nano-Dermatology',
      rating: 4.8,
      consultations: 90,
      image: 'https://example.com/placeholder4.jpg',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userInfoContainer}>
            <Image
              source={{ 
                uri: userData?.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
              }}
              style={styles.profileImage}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.greeting}>Hi, Welcome Back</Text>
              <Text style={styles.userName}>{userData?.fullName || 'Guest'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications-none" size={24} color="#0066FF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="settings" size={24} color="#0066FF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="medical-services" size={24} color="#0066FF" />
            <Text style={styles.actionText}>Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="favorite-border" size={24} color="#0066FF" />
            <Text style={styles.actionText}>Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="search" size={24} color="#0066FF" />
            <Text style={styles.actionText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayItem,
                day.date.getDate() === selectedDate.getDate() && styles.selectedDay,
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text style={[
                styles.dayName,
                day.date.getDate() === selectedDate.getDate() && styles.selectedDayText,
              ]}>
                {day.dayNumber}
              </Text>
              <Text style={[
                styles.dayNumber,
                day.date.getDate() === selectedDate.getDate() && styles.selectedDayText,
              ]}>
                {day.dayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.appointments}>
        <Text style={styles.timeSlot}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - Today</Text>
        <View style={styles.appointmentCard}>
          <Text style={styles.appointmentTime}>10 AM</Text>
          <View style={styles.appointmentDetails}>
            <Text style={styles.doctorName}>Dr. Olivia Turner, M.D.</Text>
            <Text style={styles.appointmentType}>
              Treatment and prevention of skin and photodermatitis
            </Text>
          </View>
          <View style={styles.appointmentActions}>
            <TouchableOpacity>
              <Icon name="videocam" size={20} color="#0066FF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name="chat" size={20} color="#0066FF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.doctorsList}>
        {recommendedDoctors.map((doctor) => (
          <TouchableOpacity key={doctor.id} style={styles.doctorCard}>
            <Image
              source={{ uri: doctor.image }}
              style={styles.doctorImage}
              defaultSource={{ uri: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
              <View style={styles.doctorStats}>
                <View style={styles.rating}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{doctor.rating}</Text>
                </View>
                <View style={styles.consultations}>
                  <Icon name="people" size={16} color="#666" />
                  <Text style={styles.consultationsText}>{doctor.consultations}</Text>
                </View>
              </View>
            </View>
            <View style={styles.doctorActions}>
              <TouchableOpacity>
                <Icon name="help-outline" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Icon name="favorite-border" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userTextContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  calendar: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dayItem: {
    width: 45,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  selectedDay: {
    backgroundColor: '#0066FF',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dayNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  appointments: {
    padding: 20,
  },
  timeSlot: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  appointmentCard: {
    backgroundColor: '#F0F5FF',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  appointmentDetails: {
    flex: 1,
    marginHorizontal: 10,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
  },
  doctorsList: {
    padding: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  doctorStats: {
    flexDirection: 'row',
    marginTop: 5,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    marginLeft: 5,
    color: '#666',
  },
  consultations: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultationsText: {
    marginLeft: 5,
    color: '#666',
  },
  doctorActions: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
});

export default HomeScreen;