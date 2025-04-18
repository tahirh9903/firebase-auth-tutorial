import React from 'react';
import { TextInput, TextInputProps, Platform } from 'react-native';

const WebTextInput: React.FC<TextInputProps> = ({
  onChangeText,
  value,
  style,
  placeholder,
  placeholderTextColor,
  secureTextEntry,
  keyboardType,
  maxLength,
  autoComplete,
  ...props
}) => {
  if (Platform.OS === 'web') {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (keyboardType === 'numeric' && !/^\d*$/.test(newValue.replace(/\s/g, ''))) {
        return; // Only allow digits and spaces for numeric keyboard
      }
      if (maxLength && newValue.length > maxLength) {
        return; // Respect maxLength
      }
      onChangeText?.(newValue);
    };

    return (
      <input
        type={secureTextEntry ? 'password' : 'text'}
        onChange={handleChange}
        value={value || ''}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete === 'off' ? 'off' : undefined}
        style={{
          backgroundColor: '#F5F6FA',
          padding: 16,
          borderRadius: 12,
          fontSize: 16,
          color: '#000000',
          border: 'none',
          outline: 'none',
          width: '100%',
          cursor: 'text',
          ...(style as any),
        }}
      />
    );
  }

  return (
    <TextInput
      onChangeText={onChangeText}
      value={value}
      style={style}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoComplete={autoComplete}
      {...props}
    />
  );
};

export default WebTextInput; 