// components/SettingsListItem.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SettingsListItemProps {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  iconColor: string;
  label: string;
  onPress?: () => void;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ icon, iconColor, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <FontAwesome5 name={icon} size={16} color="white" />
      </View>
      <Text style={styles.label}>{label}</Text>
      <FontAwesome5 name="chevron-right" size={16} color="#BDBDBD" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 17,
  },
});

export default SettingsListItem;