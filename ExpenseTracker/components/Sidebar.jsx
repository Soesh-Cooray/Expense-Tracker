import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Button, Avatar, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import useAuthStore from '../store/Authstore';

const Sidebar = ({ navigation, activeRoute }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const userInitial = userName.charAt(0).toUpperCase();

  const menuItems = [
    { label: 'Dashboard', icon: 'view-dashboard', route: 'dashboard', iconLibrary: 'mci' },
    { label: 'Expenses', icon: 'minus-circle', route: 'expenses', iconLibrary: 'mci' },
    { label: 'Income', icon: 'plus-circle', route: 'income', iconLibrary: 'mci' },
    { label: 'Budgets', icon: 'pie-chart', route: 'budgets', iconLibrary: 'antdesign' },
    { label: 'Goals', icon: 'piggy-bank', route: 'savingsGoal', iconLibrary: 'mci' },
    { label: 'Settings', icon: 'cog', route: 'settings', iconLibrary: 'mci' },
  ];

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'login' }],
    });
  };

  return (
    <View style={[styles.container, { width: 80 }]}>
      {/* Navigation Menu */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <View key={index}>
            <Button
              icon={({ color, size }) => {
                const IconComponent = item.iconLibrary === 'antdesign' ? AntDesign : MaterialCommunityIcons;
                return (
                  <IconComponent
                    name={item.icon}
                    size={20}
                    color={activeRoute === item.route ? '#177AD5' : '#999'}
                  />
                );
              }}
              mode={activeRoute === item.route ? 'contained-tonal' : 'text'}
              style={[
                styles.menuItem,
                activeRoute === item.route && styles.menuItemActive,
                styles.menuItemCollapsed,
              ]}
              labelStyle={styles.menuLabel}
              onPress={() => navigation.navigate(item.route)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Account Section */}
      <View style={styles.accountSection}>
        <Divider />
        <View style={styles.accountContainer}>
          <Avatar.Text
            size={40}
            label={userInitial}
            style={styles.avatar}
          />
        </View>
        <IconButton
          icon="logout"
          size={24}
          iconColor="#999"
          onPress={handleLogout}
          style={styles.logoutIcon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingVertical: 20,
    paddingHorizontal: 0,
    justifyContent: 'space-between',
    height: '100%',
  },
  menuContainer: {
    flex: 1,
    marginTop: 40,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 45,
  },
  menuItemCollapsed: {
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  menuItemActive: {
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
  },
  menuLabel: {
    fontSize: 14,
    marginLeft: 0,
    color: '#666',
  },
  accountSection: {
    paddingTop: 20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  accountContainer: {
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#177AD5',
  },
  logoutIcon: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default Sidebar;
