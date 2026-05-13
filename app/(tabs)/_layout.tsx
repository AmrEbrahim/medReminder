import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  readonly name: IoniconName;
  readonly outlineName: IoniconName;
  readonly focused: boolean;
}

function TabIcon({ name, outlineName, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? name : outlineName}
        size={22}
        color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
      />
    </View>
  );
}

const renderHomeIcon = ({ focused }: { focused: boolean }) =>
  <TabIcon name="home" outlineName="home-outline" focused={focused} />;

const renderMedIcon = ({ focused }: { focused: boolean }) =>
  <TabIcon name="medical" outlineName="medical-outline" focused={focused} />;

const renderReportsIcon = ({ focused }: { focused: boolean }) =>
  <TabIcon name="bar-chart" outlineName="bar-chart-outline" focused={focused} />;

const renderSettingsIcon = ({ focused }: { focused: boolean }) =>
  <TabIcon name="settings" outlineName="settings-outline" focused={focused} />;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: renderHomeIcon }}
      />
      <Tabs.Screen
        name="medications"
        options={{ title: 'Medications', tabBarIcon: renderMedIcon }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Reports', tabBarIcon: renderReportsIcon }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: renderSettingsIcon }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  label: { fontSize: 11, fontWeight: '600' },
  iconWrap: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconWrapActive: { backgroundColor: Colors.primaryLight },
});
