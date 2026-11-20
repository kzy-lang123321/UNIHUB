import React, { useState } from "react";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useStore } from "../store";
import { colors } from "../theme";
export function useColors() {
  return colors[useStore((s) => s.dark) ? "dark" : "light"];
}
export function Label({
  children,
  muted = false,
  size = 15,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
}) {
  const c = useColors();
  return (
    <Text
      style={{
        color: muted ? c.muted : c.text,
        fontSize: size,
        lineHeight: size * 1.5,
      }}
    >
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: 28,
        fontWeight: "700",
        letterSpacing: -0.8,
        color: c.text,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  const c = useColors();
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={{
        backgroundColor: accent ? c.tint : c.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: c.border,
        padding: 20,
        gap: 12,
      }}
    >
      {children}
    </Animated.View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 13,
        paddingHorizontal: 18,
        paddingVertical: 13,
        backgroundColor: secondary ? c.tint : c.accent,
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text
        style={{
          color: secondary
            ? c.accent
            : useStore.getState().dark
              ? "#111827"
              : "#FFFFFF",
          fontWeight: "700",
          fontSize: 14,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field(props: TextInputProps) {
  const c = useColors();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      style={[
        {
          backgroundColor: c.card,
          color: c.text,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          minHeight: 50,
          padding: 14,
          fontSize: 15,
        },
        props.style,
      ]}
    />
  );
}
export function Page({
  children,
  scrollRef,
}: {
  children: React.ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <ScrollView
      ref={scrollRef}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={c.accent}
          onRefresh={() => {
            setRefreshing(true);
            void client
              .refetchQueries({ type: "active" })
              .finally(() => setRefreshing(false));
          }}
        />
      }
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.page,
        { paddingTop: Math.max(30, insets.top + 12) },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{ width: "100%", maxWidth: 760, alignSelf: "center", gap: 20 }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { padding: 22, paddingTop: 30, paddingBottom: 48 },
});
