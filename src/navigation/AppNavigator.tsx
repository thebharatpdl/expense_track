// import React from 'react'
// import { StyleSheet, Text, View } from 'react-native'
// import { NavigationContainer } from '@react-navigation/native'
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
// import { createStackNavigator } from '@react-navigation/stack'
// import HomeScreen from '../screens/HomeScreen'
// import AddExpenseScreen from '../screens/AddExpenseScreen'
// import EditExpenseScreen from '../screens/EditExpenseScreen'
// import SummaryScreen from '../screens/SummaryScreen'
// import BudgetSettingsScreen from '../screens/BudgetSettingsScreen'
// import { colors } from '../theme/colors'

// const Tab = createBottomTabNavigator()
// const Stack = createStackNavigator()

// const HomeStack = () => (
//   <Stack.Navigator>
//     <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
//     <Stack.Screen
//       name="EditExpense"
//       component={EditExpenseScreen}
//       options={{ title: 'Edit Expense', headerTintColor: colors.primary, headerBackTitle: 'Back' }}
//     />
//     <Stack.Screen
//       name="BudgetSettings"
//       component={BudgetSettingsScreen}
//       options={{ title: 'Budget Settings', headerTintColor: colors.primary, headerBackTitle: 'Back' }}
//     />
//   </Stack.Navigator>
// )

// export const AppNavigator = () => (
//   <NavigationContainer>
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: colors.card,
//           borderTopWidth: 0.5,
//           borderTopColor: colors.border,
//           height: 64,
//           paddingBottom: 8,
//         },
//         tabBarActiveTintColor: colors.primary,
//         tabBarInactiveTintColor: colors.subtext,
//       }}
//     >
//       <Tab.Screen
//         name="HomeTab"
//         component={HomeStack}
//         options={{
//           tabBarLabel: 'Home',
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
//         }}
//       />
//       <Tab.Screen
//         name="AddTab"
//         component={AddExpenseScreen}
//         options={{
//           tabBarLabel: '',
//           tabBarIcon: () => (
//             <View style={styles.fab}>
//               <Text style={styles.fabPlus}>+</Text>
//             </View>
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="SummaryTab"
//         component={SummaryScreen}
//         options={{
//           tabBarLabel: 'Summary',
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
//         }}
//       />
//     </Tab.Navigator>
//   </NavigationContainer>
// )

// const styles = StyleSheet.create({
//   fab: {
//     width: 52, height: 52, borderRadius: 26,
//     backgroundColor: colors.primary,
//     alignItems: 'center', justifyContent: 'center',
//     marginBottom: 20,
//   },
//   fabPlus: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
// })