import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../src/components/ui";
import { SocialIcon, SocialIconName } from "../../src/components/SocialIcon";

export default function Library() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  function open(kind?: string) {
    router.push({
      pathname: "/(student)/materials",
      params: { search, ...(kind ? { kind } : {}) },
    });
  }
  const sections: {
    title: string;
    subtitle: string;
    icon: SocialIconName;
    color: string;
    action: () => void;
  }[] = [
    {
      title: "Books",
      subtitle: "Your reference shelf",
      icon: "book",
      color: "#1877F2",
      action: () => open("book"),
    },
    {
      title: "Lecture notes",
      subtitle: "One lecture at a time",
      icon: "edit",
      color: "#8A49D6",
      action: () => open("notes"),
    },
    {
      title: "Past papers",
      subtitle: "Prepare with practice",
      icon: "saved",
      color: "#CB861A",
      action: () => open("past-paper"),
    },
    {
      title: "Assignments",
      subtitle: "Coursework in one place",
      icon: "comment",
      color: "#188567",
      action: () => open("assignment"),
    },
  ];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: 25,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 680,
          alignSelf: "center",
          gap: 18,
          paddingHorizontal: 16,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            color: c.text,
            fontSize: 30,
            fontWeight: "800",
            letterSpacing: -1,
          }}
        >
          Library
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.card,
            borderRadius: 25,
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
          }}
        >
          <SocialIcon name="search" color={c.muted} size={21} />
          <TextInput
            accessibilityLabel="Search courses or books"
            placeholder="Search books, notes or a subject"
            placeholderTextColor={c.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => open()}
            returnKeyType="search"
            style={{ color: c.text, flex: 1, minHeight: 52, fontSize: 15 }}
          />
        </View>
        {search ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => open()}
            style={{
              backgroundColor: c.accent,
              minHeight: 46,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Search academic resources
            </Text>
          </Pressable>
        ) : null}
        <View
          style={{
            padding: 20,
            gap: 13,
            backgroundColor: c.tint,
            borderRadius: 16,
          }}
        >
          <SocialIcon name="book" color={c.accent} size={32} />
          <Text
            style={{
              color: c.text,
              fontWeight: "700",
              fontSize: 22,
              lineHeight: 28,
            }}
          >
            A little less searching.{"\n"}A lot more learning.
          </Text>
          <Text style={{ color: c.muted, lineHeight: 22 }}>
            Your college’s approved books, lecture notes and original documents.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Books & notes · Browse or search files"
            onPress={() => open()}
            style={{ minHeight: 42, justifyContent: "center" }}
          >
            <Text style={{ color: c.accent, fontWeight: "700", fontSize: 15 }}>
              Browse all materials →
            </Text>
          </Pressable>
        </View>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 18 }}>
          Browse by type
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {sections.map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.title.toLowerCase()}`}
              onPress={item.action}
              style={({ pressed }) => ({
                width: "48%",
                flexGrow: 1,
                minHeight: 142,
                backgroundColor: c.card,
                borderRadius: 13,
                padding: 17,
                gap: 11,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <SocialIcon name={item.icon} color={item.color} size={28} />
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
                {item.title}
              </Text>
              <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
                {item.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 18 }}>
          Your study space
        </Text>
        <View
          style={{
            borderRadius: 13,
            overflow: "hidden",
            backgroundColor: c.card,
          }}
        >
          {[
            {
              title: "Downloaded documents",
              subtitle: "Saved on your phone",
              icon: "saved" as const,
              action: () => open("saved"),
            },
            {
              title: "Your courses",
              subtitle: "Browse your semester",
              icon: "book" as const,
              action: () => router.push("/(student)/courses"),
            },
            {
              title: "Study plan",
              subtitle: "Make time for what matters",
              icon: "edit" as const,
              action: () => router.push("/(student)/planner"),
            },
          ].map((item, index) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={item.action}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: 17,
                gap: 15,
                minHeight: 78,
                borderTopWidth: index ? 0.5 : 0,
                borderTopColor: c.border,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <SocialIcon name={item.icon} color={c.accent} size={24} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{ color: c.text, fontWeight: "600", fontSize: 15 }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {item.subtitle}
                </Text>
              </View>
              <Text style={{ color: c.muted, fontSize: 22 }}>›</Text>
            </Pressable>
          ))}
        </View>
        <Text
          style={{
            color: c.muted,
            fontSize: 12,
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          Akl Postgraduate College · Matta, Swat
        </Text>
      </View>
    </ScrollView>
  );
}
