import React from "react";
import { Tabs } from "expo-router";
import { Keyboard, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoleGate } from "../../src/components/RoleGate";
import { useColors } from "../../src/components/ui";
import { SocialIcon } from "../../src/components/SocialIcon";
const mainTabs = [
  { name: "index", title: "Home", icon: "home" },
  { name: "explore", title: "Library", icon: "book" },
  { name: "saved", title: "Saved", icon: "saved" },
  { name: "me", title: "Menu", icon: "menu" },
] as const;
export default function Layout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <RoleGate role="student">
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.bg },
        }}
        tabBar={({ state, navigation }) => {
          const route = state.routes[state.index]?.name ?? "index";
          const selected =
            route === "index" || route === "lessons"
              ? "index"
              : route === "saved"
                ? "saved"
                : route === "me" || route === "planner"
                  ? "me"
                  : "explore";
          return (
            <View
              style={{
                backgroundColor: c.card,
                borderTopWidth: 1,
                borderTopColor: c.border,
                paddingBottom: Math.max(insets.bottom, 10),
                paddingTop: 8,
              }}
            >
              <View
                style={{
                  width: "100%",
                  maxWidth: 656,
                  alignSelf: "center",
                  flexDirection: "row",
                  height: 56,
                }}
              >
                {mainTabs.map((tab) => {
                  const active = tab.name === selected;
                  const color = active ? c.accent : c.muted;
                  return (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityLabel={tab.title}
                      accessibilityState={{ selected: active }}
                      aria-selected={active}
                      key={tab.name}
                      onPress={() => {
                        Keyboard.dismiss();
                        const target = state.routes.find(
                          (r) => r.name === tab.name,
                        );
                        if (!target) return;
                        const event = navigation.emit({
                          type: "tabPress",
                          target: target.key,
                          canPreventDefault: true,
                        });
                        if (!event.defaultPrevented)
                          navigation.navigate(tab.name);
                      }}
                      style={({ pressed }) => ({
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      {active ? (
                        <View
                          style={{
                            position: "absolute",
                            top: -8,
                            width: 44,
                            height: 3,
                            borderBottomLeftRadius: 3,
                            borderBottomRightRadius: 3,
                            backgroundColor: c.accent,
                          }}
                        />
                      ) : null}
                      <SocialIcon name={tab.icon} color={color} size={24} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: active ? "700" : "500",
                          color,
                        }}
                      >
                        {tab.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }}
      >
        {mainTabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title }}
          />
        ))}
        {[
          "courses",
          "library",
          "quiz",
          "planner",
          "course",
          "papers",
          "materials",
          "note",
          "lessons",
          "community",
          "profile",
        ].map((name) => (
          <Tabs.Screen key={name} name={name} options={{ href: null }} />
        ))}
      </Tabs>
    </RoleGate>
  );
}
