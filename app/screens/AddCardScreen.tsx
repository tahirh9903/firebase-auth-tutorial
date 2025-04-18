import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { encrypt } from '../utils/encryption';
import WebTextInput from '../components/WebTextInput';

const AddCardScreen = () => {
  const navigation = useNavigation();
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (text: string) => {
    // Remove any non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Split into groups of 4 and join with spaces
    const groups = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    
    return groups.join(' ');
  };

  const formatExpiryDate = (text: string) => {
    // Remove any non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // If the input is being deleted, return the cleaned text
    if (cleaned.length < expiryDate.length) {
      return cleaned;
    }
    
    // Format as MM/YY
    if (cleaned.length >= 2) {
      let month = cleaned.substring(0, 2);
      const year = cleaned.substring(2, 4);
      
      // Validate month
      if (parseInt(month) > 12) {
        month = '12';
      } else if (parseInt(month) === 0) {
        month = '01';
      }
      
      if (year) {
        return month + '/' + year;
      }
      return month;
    }
    return cleaned;
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned);
  };

  const saveCard = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'You must be logged in to save a card');
        return;
      }

      if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      // Basic validation
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'Invalid card number');
        return;
      }

      if (cvv.length < 3) {
        Alert.alert('Error', 'Invalid CVV');
        return;
      }

      const [month, year] = expiryDate.split('/');
      if (!month || !year || parseInt(month) > 12) {
        Alert.alert('Error', 'Invalid expiry date');
        return;
      }

      // Encrypt sensitive data
      const encryptedCardNumber = await encrypt(cardNumber.replace(/\s/g, ''));
      const encryptedCvv = await encrypt(cvv);

      const cardData = {
        lastFourDigits: cardNumber.slice(-4),
        cardHolder: cardHolder,
        expiryDate: expiryDate,
        encryptedCardNumber,
        encryptedCvv,
        createdAt: new Date().toISOString(),
      };

      const cardsRef = collection(db, 'users', user.uid, 'cards');
      await setDoc(doc(cardsRef), cardData);

      Alert.alert('Success', 'Card saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#0066FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Card</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainContent}>
          <View style={styles.cardPreview}>
            <Text style={styles.cardNumber}>
              {cardNumber || '000 000 000 00'}
            </Text>
            <View style={styles.cardDetails}>
              <View>
                <Text style={styles.cardLabel}>Card Holder Name</Text>
                <Text style={styles.cardValue}>{cardHolder || 'John Doe'}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>Expiry Date</Text>
                <Text style={styles.cardValue}>{expiryDate || '04/28'}</Text>
              </View>
              <Icon name="credit-card" size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Holder Name</Text>
              <WebTextInput
                style={styles.textInput}
                value={cardHolder}
                onChangeText={setCardHolder}
                placeholder="John Doe"
                placeholderTextColor="#A0A0A0"
                autoComplete="off"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <WebTextInput
                style={styles.textInput}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                maxLength={19}
                autoComplete="off"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <WebTextInput
                  style={styles.textInput}
                  value={expiryDate}
                  onChangeText={(text) => {
                    const formatted = formatExpiryDate(text);
                    if (formatted.length <= 5) { // MM/YY format
                      setExpiryDate(formatted);
                    }
                  }}
                  placeholder="MM/YY"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  autoComplete="off"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <WebTextInput
                  style={styles.textInput}
                  value={cvv}
                  onChangeText={handleCvvChange}
                  placeholder="000"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoComplete="off"
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={saveCard}>
              <Text style={styles.saveButtonText}>Save Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? {
      height: '100vh',
    } : {}) as ViewStyle,
  },
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollViewContent: {
    flexGrow: 1,
  } as ViewStyle,
  mainContent: {
    flex: 1,
    paddingBottom: 24,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  } as ViewStyle,
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 8,
  } as ViewStyle,
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  } as TextStyle,
  cardPreview: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 24,
    margin: 16,
  } as ViewStyle,
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  } as TextStyle,
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  } as ViewStyle,
  cardLabel: {
    color: '#FFFFFF80',
    fontSize: 12,
    marginBottom: 4,
  } as TextStyle,
  cardValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  form: {
    padding: 16,
  } as ViewStyle,
  inputGroup: {
    marginBottom: 20,
  } as ViewStyle,
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  } as TextStyle,
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
  } as ViewStyle,
  textInput: {
    fontSize: 16,
    color: '#000000',
  } as TextStyle,
  row: {
    flexDirection: 'row',
  } as ViewStyle,
  saveButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  } as ViewStyle,
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
});

export default AddCardScreen; 