import React from "react";
import { Tabs } from "expo-router";
import { RoleGate } from "../../src/components/RoleGate";
export default function Layout() {
  return (
    <RoleGate role="teacher">
      <Tabs
        screenOptions={{ headerShown: false, tabBarActiveTintColor: "#137A63" }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="upload" options={{ title: "Upload" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </RoleGate>
  );
}
