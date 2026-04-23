import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, IconButton } from 'react-native-paper';
import { PieChart } from "react-native-gifted-charts";
import { useNavigation } from 'expo-router';
import useAuthStore from '../store/Authstore';
import Sidebar from '../components/Sidebar';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const userName = user?.name || "User"; 
  const userImageUrl = user?.imageUrl || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const totalBalance = "LKR 45,000";
  const [activeRoute] = useState('dashboard');
  
  // Data for the Savings Progress chart
  const pieData = [
    { value: 70, color: '#177AD5', text: 'Saved' },
    { value: 30, color: '#ED6665', text: 'Goal' }
  ];

  return (
    <View style={styles.wrapper}>
      <Sidebar navigation={navigation} activeRoute={activeRoute} />
      <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Title style={styles.nameText}>{userName} 👋</Title>
        </View>
        {userImageUrl ? (
          <Avatar.Image size={50} source={{ uri: userImageUrl }} />
        ) : (
          <Avatar.Text size={50} label={userInitial} />
        )}
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Paragraph style={styles.cardLabel}>Total Available Balance</Paragraph>
          <Text style={styles.balanceText}>{totalBalance}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.stat}>
              <IconButton icon="arrow-up" iconColor="green" size={20} />
              <Text style={styles.incomeText}>+12,500</Text>
            </View>
            <View style={styles.stat}>
              <IconButton icon="arrow-down" iconColor="red" size={20} />
              <Text style={styles.expenseText}>-5,200</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Savings Goal Progress (Your Core Entity) */}
      <Title style={styles.sectionTitle}>Your Savings Progress</Title>
      <Card style={styles.chartCard}>
        <Card.Content style={styles.chartContent}>
          <PieChart
            donut
            showText
            textColor="black"
            radius={80}
            textSize={12}
            data={pieData}
            centerLabelComponent={() => {
              return <Text style={{fontSize: 16}}>70%</Text>;
            }}
          />
          <View style={styles.chartLegend}>
            <Paragraph>Target: LKR 100,000</Paragraph>
            <Paragraph>Current: LKR 70,000</Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Savings')}
              style={styles.actionButton}
            >
              Update Goal
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
         <Button icon="plus" mode="contained" style={styles.fab} onPress={() => {}}>
           Add Transaction
         </Button>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 ,marginTop: 50  },
  welcomeText: { fontSize: 16, color: '#666' },
  nameText: { fontSize: 24, fontWeight: 'bold' },
  summaryCard: { backgroundColor: '#6200ee', borderRadius: 15, elevation: 4 },
  cardLabel: { color: '#fff', opacity: 0.8 },
  balanceText: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)', marginTop: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  incomeText: { color: '#4CAF50', fontWeight: 'bold' },
  expenseText: { color: '#FF5252', fontWeight: 'bold' },
  sectionTitle: { marginTop: 25, marginBottom: 10, fontSize: 18 },
  chartCard: { borderRadius: 15, marginBottom: 20 },
  chartContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  chartLegend: { marginLeft: 10 },
  actionButton: { marginTop: 10 },
  quickActions: { marginVertical: 20, alignItems: 'center' },
  fab: { width: '80%', borderRadius: 10 }
});

export default DashboardScreen;