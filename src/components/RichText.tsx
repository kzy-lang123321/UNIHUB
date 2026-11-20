import React from "react";
import { Text, View } from "react-native";
import { useColors } from "./ui";
export function RichText({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 12 }}>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <Text
          selectable
          key={i}
          style={{
            color: c.text,
            fontSize: 16,
            lineHeight: 27,
            textAlign: /[\u0600-\u06ff]/.test(text) ? "right" : "left",
            writingDirection: /[\u0600-\u06ff]/.test(text) ? "rtl" : "ltr",
          }}
        >
          {paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) =>
            part.startsWith("**") ? (
              <Text key={j} style={{ fontWeight: "700" }}>
                {part.slice(2, -2)}
              </Text>
            ) : part.startsWith("*") ? (
              <Text key={j} style={{ fontStyle: "italic" }}>
                {part.slice(1, -1)}
              </Text>
            ) : (
              part
            ),
          )}
        </Text>
      ))}
    </View>
  );
}
