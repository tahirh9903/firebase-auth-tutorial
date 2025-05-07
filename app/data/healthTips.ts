export interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: 'sleep' | 'diet' | 'exercise' | 'hygiene' | 'mental';
  icon: string;
}

export const healthTips: HealthTip[] = [
  {
    id: '1',
    title: 'Quality Sleep',
    description: 'Aim for 7-9 hours of sleep each night. Maintain a consistent sleep schedule and create a relaxing bedtime routine.',
    category: 'sleep',
    icon: '🌙'
  },
  {
    id: '2',
    title: 'Balanced Diet',
    description: 'Include a variety of fruits, vegetables, whole grains, and lean proteins in your daily meals.',
    category: 'diet',
    icon: '🥗'
  },
  {
    id: '3',
    title: 'Daily Exercise',
    description: 'Get at least 30 minutes of moderate exercise daily. Walking, swimming, or cycling are great options.',
    category: 'exercise',
    icon: '🏃‍♂️'
  },
  {
    id: '4',
    title: 'Hand Hygiene',
    description: 'Wash your hands frequently with soap and water for at least 20 seconds to prevent the spread of germs.',
    category: 'hygiene',
    icon: '🧼'
  },
  {
    id: '5',
    title: 'Stress Management',
    description: 'Practice mindfulness or meditation for 10-15 minutes daily to reduce stress and improve mental well-being.',
    category: 'mental',
    icon: '🧘‍♀️'
  },
  {
    id: '6',
    title: 'Screen Time',
    description: 'Limit screen time before bed to improve sleep quality. Try reading a book instead.',
    category: 'sleep',
    icon: '📱'
  },
  {
    id: '7',
    title: 'Hydration',
    description: 'Drink at least 8 glasses of water daily to maintain proper hydration and support bodily functions.',
    category: 'diet',
    icon: '💧'
  },
  {
    id: '8',
    title: 'Strength Training',
    description: 'Include strength training exercises 2-3 times per week to build muscle and improve bone health.',
    category: 'exercise',
    icon: '💪'
  },
  {
    id: '9',
    title: 'Oral Health',
    description: 'Brush your teeth twice daily and floss regularly to maintain good oral hygiene.',
    category: 'hygiene',
    icon: '🦷'
  },
  {
    id: '10',
    title: 'Social Connection',
    description: 'Maintain regular social connections with friends and family to support mental health.',
    category: 'mental',
    icon: '👥'
  }
]; 