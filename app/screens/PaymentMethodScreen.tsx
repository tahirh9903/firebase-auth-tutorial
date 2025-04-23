import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export interface SavedCard {
  id: string;
  lastFourDigits: string;
  cardHolder: string;
  expiryDate: string;
}

type PaymentMethodScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const PaymentMethodScreen = () => {
  const navigation = useNavigation<PaymentMethodScreenNavigationProp>();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [showCardActions, setShowCardActions] = useState(false);

  const fetchSavedCards = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const cardsRef = collection(db, 'users', user.uid, 'cards');
      const q = query(cardsRef);
      const querySnapshot = await getDocs(q);

      const cards: SavedCard[] = [];
      querySnapshot.forEach((doc) => {
        cards.push({
          id: doc.id,
          ...doc.data(),
        } as SavedCard);
      });

      setSavedCards(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      Alert.alert(
        'Delete Card',
        'Are you sure you want to delete this card?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const cardRef = doc(db, 'users', user.uid, 'cards', cardId);
              await deleteDoc(cardRef);
              await fetchSavedCards();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting card:', error);
      Alert.alert('Error', 'Failed to delete card. Please try again.');
    }
  };

  const handleCardPress = (card: SavedCard) => {
    setSelectedCard(card);
    setShowCardActions(true);
  };

  const handleEditCard = () => {
    if (selectedCard) {
      navigation.navigate('AddCard', { card: selectedCard });
      setShowCardActions(false);
    }
  };

  const handleDeleteCard = () => {
    if (selectedCard) {
      Alert.alert(
        'Remove Card',
        'Are you sure you want to remove this card?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowCardActions(false),
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                  Alert.alert('Error', 'You must be logged in to remove a card');
                  return;
                }

                const cardRef = doc(db, 'users', user.uid, 'cards', selectedCard.id);
                await deleteDoc(cardRef);
                await fetchSavedCards();
                setShowCardActions(false);
                Alert.alert('Success', 'Card removed successfully');
              } catch (error) {
                console.error('Error removing card:', error);
                Alert.alert('Error', 'Failed to remove card. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSavedCards();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#0066FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit & Debit Card</Text>
          {savedCards.map((card) => (
            <TouchableOpacity 
              key={card.id}
              style={styles.paymentOption}
              onPress={() => handleCardPress(card)}
            >
              <Icon name="credit-card" size={24} color="#0066FF" />
              <View style={styles.cardInfo}>
                <Text style={styles.paymentOptionText}>
                  •••• •••• •••• {card.lastFourDigits}
                </Text>
                <Text style={styles.cardSubtext}>
                  {card.cardHolder} • Expires {card.expiryDate}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#0066FF" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.paymentOption}
            onPress={() => navigation.navigate('AddCard', { card: undefined })}
          >
            <Icon name="add-circle-outline" size={24} color="#0066FF" />
            <Text style={styles.paymentOptionText}>Add New Card</Text>
            <Icon name="chevron-right" size={24} color="#0066FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Payment Option</Text>
          <TouchableOpacity style={styles.paymentOption}>
            <MaterialCommunityIcons name="apple" size={24} color="#0066FF" />
            <Text style={styles.paymentOptionText}>Apple Play</Text>
            <Icon name="chevron-right" size={24} color="#0066FF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption}>
            <MaterialCommunityIcons name="paypal" size={24} color="#0066FF" />
            <Text style={styles.paymentOptionText}>Paypal</Text>
            <Icon name="chevron-right" size={24} color="#0066FF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption}>
            <MaterialCommunityIcons name="google-play" size={24} color="#0066FF" />
            <Text style={styles.paymentOptionText}>Google Play</Text>
            <Icon name="chevron-right" size={24} color="#0066FF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showCardActions}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Card Options</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEditCard}
            >
              <Text style={styles.modalButtonText}>Edit Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={handleDeleteCard}
            >
              <Text style={styles.deleteButtonText}>Remove Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCardActions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0066FF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#0066FF',
    marginLeft: 12,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentMethodScreen; 