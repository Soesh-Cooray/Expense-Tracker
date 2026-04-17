import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Button, Avatar, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../store/Authstore';

const Sidebar = ({ navigation, activeRoute }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";

  const menuItems = [
    { label: 'Dashboard', icon: 'view-dashboard', route: 'dashboard' },
    { label: 'Expenses', icon: 'credit-card', route: 'expenses' },
    { label: 'Income', icon: 'plus-circle', route: 'income' },
    { label: 'AI Analysis', icon: 'brain', route: 'analysis' },
    { label: 'Budgets', icon: 'chart-pie', route: 'budgets' },
    { label: 'Goals', icon: 'target', route: 'savingsGoal' },
    { label: 'Settings', icon: 'cog', route: 'settings' },
  ];

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'login' }],
    });
  };

  const handleNavigation = (route) => {
    navigation.navigate(route);
  };

  return (
    <View style={[styles.container, { width: isExpanded ? 280 : 80 }]}>
      {/* Hamburger Button */}
      <View style={styles.hamburgerSection}>
        <IconButton
          icon={isExpanded ? 'chevron-left' : 'menu'}
          size={24}
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.hamburger}
        />
      </View>

      {/* Logo Section */}
      {isExpanded && (
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.logoLabel}>SmartExpense</Text>
        </View>
      )}

      {/* Navigation Menu */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <View key={index}>
            <Button
              icon={({ color, size }) => (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={size}
                  color={activeRoute === item.route ? '#177AD5' : '#999'}
                />
              )}
              mode={activeRoute === item.route ? 'contained-tonal' : 'text'}
              style={[
                styles.menuItem,
                activeRoute === item.route && styles.menuItemActive,
                !isExpanded && styles.menuItemCollapsed,
              ]}
              labelStyle={[
                styles.menuLabel,
                activeRoute === item.route && styles.menuLabelActive,
              ]}
              onPress={() => handleNavigation(item.route)}
            >
              {isExpanded && item.label}
            </Button>
          </View>
        ))}
      </ScrollView>

      {/* User Profile Section */}
      {isExpanded && (
        <View style={styles.profileSection}>
          <Divider />
          <View style={styles.userProfile}>
            <Avatar.Text
              size={40}
              label={userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          <Button
            mode="outlined"
            style={styles.logoutButton}
            labelStyle={styles.logoutLabel}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingVertical: 20,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    height: '100%',
    transition: 'width 0.3s ease',
  },
  hamburgerSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  hamburger: {
    margin: 0,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#177AD5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    justifyContent: 'flex-start',
    marginVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  menuItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: '#e3f2fd',
  },
  menuLabel: {
    fontSize: 14,
    marginLeft: 10,
    color: '#666',
  },
  menuLabelActive: {
    color: '#177AD5',
    fontWeight: '600',
  },
  profileSection: {
    paddingTop: 20,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  avatar: {
    backgroundColor: '#177AD5',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  logoutButton: {
    marginTop: 15,
    borderColor: '#e0e0e0',
  },
  logoutLabel: {
    fontSize: 13,
    color: '#666',
  },
});

export default Sidebar;
