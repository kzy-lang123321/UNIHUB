import React from "react";
import { View } from "react-native";

export type SocialIconName =
  | "home"
  | "search"
  | "bell"
  | "book"
  | "saved"
  | "menu"
  | "plus"
  | "close"
  | "comment"
  | "like"
  | "share"
  | "edit";
export function SocialIcon({
  name,
  color = "#65676B",
  size = 24,
}: {
  name: SocialIconName;
  color?: string;
  size?: number;
}) {
  const line = {
    position: "absolute" as const,
    backgroundColor: color,
    borderRadius: 2,
  };
  const outline = {
    position: "absolute" as const,
    borderColor: color,
    borderWidth: 1.8,
  };
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <View
        style={{
          width: 24,
          height: 24,
          transform: [{ scale: size / 24 }],
          transformOrigin: "top left",
        }}
      >
        {name === "search" ? (
          <>
            <View
              style={{
                ...outline,
                width: 14,
                height: 14,
                left: 2,
                top: 2,
                borderRadius: 9,
              }}
            />
            <View
              style={{
                ...line,
                width: 9,
                height: 2,
                left: 14,
                top: 17,
                transform: [{ rotate: "45deg" }],
              }}
            />
          </>
        ) : null}
        {name === "home" ? (
          <>
            <View
              style={{
                ...outline,
                width: 14,
                height: 14,
                top: 4,
                left: 5,
                transform: [{ rotate: "45deg" }],
                borderRightWidth: 0,
                borderBottomWidth: 0,
              }}
            />
            <View
              style={{
                ...outline,
                width: 15,
                height: 12,
                top: 10,
                left: 4.5,
                borderTopWidth: 0,
                borderRadius: 2,
              }}
            />
            <View
              style={{
                ...outline,
                width: 5,
                height: 8,
                left: 9.5,
                top: 14,
                borderBottomWidth: 0,
              }}
            />
          </>
        ) : null}
        {name === "book" ? (
          <>
            <View
              style={{
                ...outline,
                width: 19,
                height: 17,
                left: 2.5,
                top: 4,
                borderRadius: 3,
              }}
            />
            <View
              style={{ ...line, height: 17, width: 1.8, left: 11, top: 4 }}
            />
            <View style={{ ...line, width: 4, height: 1.5, left: 5, top: 9 }} />
            <View
              style={{ ...line, width: 4, height: 1.5, left: 14, top: 9 }}
            />
          </>
        ) : null}
        {name === "saved" ? (
          <>
            <View
              style={{
                ...outline,
                width: 14,
                height: 17,
                top: 2,
                left: 5,
                borderBottomWidth: 0,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
            <View
              style={{
                ...line,
                width: 8,
                height: 1.8,
                left: 4.5,
                top: 18,
                transform: [{ rotate: "-35deg" }],
              }}
            />
            <View
              style={{
                ...line,
                width: 8,
                height: 1.8,
                left: 11,
                top: 18,
                transform: [{ rotate: "35deg" }],
              }}
            />
          </>
        ) : null}
        {name === "menu"
          ? [5, 11, 17].map((top) => (
              <View
                key={top}
                style={{ ...line, width: 19, height: 2, left: 2.5, top }}
              />
            ))
          : null}
        {name === "plus" || name === "close" ? (
          <View
            style={{
              width: 24,
              height: 24,
              transform: [{ rotate: name === "close" ? "45deg" : "0deg" }],
            }}
          >
            <View style={{ ...line, width: 18, height: 2, left: 3, top: 11 }} />
            <View style={{ ...line, width: 2, height: 18, left: 11, top: 3 }} />
          </View>
        ) : null}
        {name === "bell" ? (
          <>
            <View
              style={{
                ...outline,
                width: 14,
                height: 15,
                left: 5,
                top: 3,
                borderTopLeftRadius: 9,
                borderTopRightRadius: 9,
                borderBottomWidth: 0,
              }}
            />
            <View style={{ ...line, width: 18, height: 2, left: 3, top: 17 }} />
            <View
              style={{ ...line, width: 5, height: 3, left: 9.5, top: 20 }}
            />
          </>
        ) : null}
        {name === "comment" ? (
          <>
            <View
              style={{
                ...outline,
                width: 19,
                height: 15,
                left: 2,
                top: 3,
                borderRadius: 5,
              }}
            />
            <View
              style={{
                ...outline,
                width: 6,
                height: 6,
                top: 15,
                left: 6,
                borderTopWidth: 0,
                borderRightWidth: 0,
                transform: [{ skewY: "-30deg" }],
              }}
            />
          </>
        ) : null}
        {name === "like" ? (
          <>
            <View
              style={{
                ...outline,
                width: 12,
                height: 12,
                top: 9,
                left: 9,
                borderRadius: 3,
              }}
            />
            <View
              style={{
                ...outline,
                width: 6,
                height: 12,
                top: 9,
                left: 2,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                ...outline,
                width: 6,
                height: 12,
                top: 1,
                left: 10,
                borderRadius: 3,
                transform: [{ rotate: "20deg" }],
              }}
            />
          </>
        ) : null}
        {name === "share" ? (
          <>
            <View
              style={{
                ...outline,
                width: 15,
                height: 13,
                left: 3,
                top: 9,
                borderTopWidth: 0,
                borderRightWidth: 0,
                borderBottomLeftRadius: 5,
              }}
            />
            <View
              style={{
                ...line,
                width: 16,
                height: 2,
                left: 6,
                top: 9,
                transform: [{ rotate: "-35deg" }],
              }}
            />
            <View
              style={{
                ...outline,
                width: 8,
                height: 8,
                left: 14,
                top: 3,
                borderLeftWidth: 0,
                borderBottomWidth: 0,
              }}
            />
          </>
        ) : null}
        {name === "edit" ? (
          <>
            <View
              style={{
                ...outline,
                width: 6,
                height: 18,
                top: 1,
                left: 10,
                borderRadius: 2,
                transform: [{ rotate: "40deg" }],
              }}
            />
            <View
              style={{ ...line, width: 16, height: 1.8, left: 3, top: 22 }}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}
