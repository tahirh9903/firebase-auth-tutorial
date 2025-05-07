import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { healthTips, HealthTip } from '../data/healthTips';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const categories = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'sleep', name: 'Sleep', icon: '🌙' },
  { id: 'diet', name: 'Diet', icon: '🥗' },
  { id: 'exercise', name: 'Exercise', icon: '🏃‍♂️' },
  { id: 'hygiene', name: 'Hygiene', icon: '🧼' },
  { id: 'mental', name: 'Mental', icon: '🧘‍♀️' },
];

interface HealthTipsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HealthTipsModal({ visible, onClose }: HealthTipsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [modalAnim] = useState(new Animated.Value(0));
  const [contentAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(modalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const filteredTips = selectedCategory === 'all'
    ? healthTips
    : healthTips.filter(tip => tip.category === selectedCategory);

  const renderTip = (tip: HealthTip) => {
    const isExpanded = expandedTip === tip.id;
    return (
      <Animated.View
        key={tip.id}
        style={[
          styles.tipCard,
          {
            transform: [{
              scale: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
              })
            }],
            opacity: contentAnim
          }
        ]}
      >
        <TouchableOpacity
          style={styles.tipContent}
          onPress={() => setExpandedTip(isExpanded ? null : tip.id)}
        >
          <View style={styles.tipHeader}>
            <View style={styles.tipIconContainer}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
            </View>
            <View style={styles.tipTitleContainer}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#002B5B" 
            />
          </View>
          {isExpanded && (
            <Animated.View
              style={[
                styles.tipDescriptionContainer,
                {
                  opacity: contentAnim,
                  transform: [{
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[
        styles.modalOverlay,
        {
          opacity: modalAnim,
        }
      ]}>
        <Pressable style={styles.closeArea} onPress={onClose} />
        <Animated.View style={[
          styles.modalContent,
          {
            transform: [
              { translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0]
              })}
            ]
          }
        ]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Health Tips</Text>
              <Text style={styles.subtitle}>Your daily wellness guide</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#002B5B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Divider line below category bar */}
          <View style={styles.divider} />

          <ScrollView 
            style={styles.tipsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tipsContent}
          >
            {filteredTips.map(renderTip)}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    padding: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#002B5B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 8,
    marginRight: 6,
    justifyContent: 'center',
    height: 28,
  },
  selectedCategory: {
    backgroundColor: '#002B5B',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  tipsContainer: {
    // flex: 1,
  },
  tipsContent: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tipContent: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipTitleContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002B5B',
    marginRight: 8,
  },
  tipDescriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginBottom: 4,
    marginTop: 0,
  },
}); 