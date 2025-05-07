import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { healthTips, HealthTip } from '../data/healthTips';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'sleep', name: 'Sleep', icon: '🌙' },
  { id: 'diet', name: 'Diet', icon: '🥗' },
  { id: 'exercise', name: 'Exercise', icon: '🏃‍♂️' },
  { id: 'hygiene', name: 'Hygiene', icon: '🧼' },
  { id: 'mental', name: 'Mental', icon: '🧘‍♀️' },
];

export default function HealthTips() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredTips = selectedCategory === 'all'
    ? healthTips
    : healthTips.filter(tip => tip.category === selectedCategory);

  const renderTip = (tip: HealthTip) => {
    const isExpanded = expandedTip === tip.id;
    return (
      <TouchableOpacity
        key={tip.id}
        style={styles.tipCard}
        onPress={() => setExpandedTip(isExpanded ? null : tip.id)}
      >
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>{tip.icon}</Text>
          <Text style={styles.tipTitle}>{tip.title}</Text>
        </View>
        {isExpanded && (
          <Text style={styles.tipDescription}>{tip.description}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <Text style={styles.sectionSubtitle}>Discover ways to improve your well-being</Text>
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

      <ScrollView 
        style={styles.tipsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tipsContent}
      >
        {filteredTips.map(renderTip)}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#002B5B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: '#002B5B',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  tipsContainer: {
    flex: 1,
  },
  tipsContent: {
    paddingBottom: 20,
  },
  tipCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002B5B',
    flex: 1,
  },
  tipDescription: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    lineHeight: 22,
  },
}); 