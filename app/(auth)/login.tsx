import React, { useState } from "react";
import { Redirect, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Button,
  Card,
  Field,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { login } from "../../src/features/auth/service";
import { authenticationEnabled } from "../../src/config/access";
import {
  signInErrorCode,
  signInErrorMessage,
} from "../../src/features/auth/errors";
import { configured } from "../../src/services/firebase";
import { useStore } from "../../src/store";
export default function Login() {
  return <InstitutionLogin />;
}

function InstitutionLogin() {
  const c = useColors();
  const [showSignIn, setShowSignIn] = useState(configured);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function demo() {
    useStore.getState().setProfile({
      uid: "demo",
      role: "student",
      institutionId: "akl",
      programId: "bs-cs",
      semester: 1,
      displayName: "Learner",
    });
    router.replace("/");
  }
  return (
    <Page>
      <Row>
        <Text
          style={{
            color: c.text,
            fontSize: 24,
            fontWeight: "800",
            letterSpacing: -1,
          }}
        >
          ◈ UniHub<Text style={{ color: c.accent }}>.</Text>
        </Text>
        <Label muted size={11}>
          MADE FOR YOUR NEXT CHAPTER
        </Label>
      </Row>
      <View style={{ gap: 14, paddingTop: 26 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 39,
            lineHeight: 45,
            fontWeight: "700",
            letterSpacing: -1.8,
            color: c.text,
          }}
        >
          Your next idea{"\n"}is one swipe away.
        </Text>
        <Label muted>Short lessons. Quick questions. Real progress.</Label>
      </View>
      {!showSignIn ? (
        <>
          <View
            style={{
              backgroundColor: "#183D31",
              borderRadius: 28,
              padding: 26,
              gap: 23,
              marginVertical: 6,
            }}
          >
            <Row>
              <Text
                style={{
                  color: "#BADEAB",
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                }}
              >
                A LITTLE PREVIEW
              </Text>
              <Text style={{ color: "#9BBEA4", fontSize: 11 }}>~1 MIN</Text>
            </Row>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: "#F0F4D6",
                lineHeight: 34,
              }}
            >
              Big problems start{"\n"}with small steps.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 26, color: "#C4DAC5" }}>
              An algorithm is just a set of clear steps. Like a recipe, but for
              solving a problem.
            </Text>
            <Row>
              {["01  Read", "02  Try", "03  Remember"].map((label) => (
                <View
                  key={label}
                  style={{
                    backgroundColor: "#2A503C",
                    paddingVertical: 12,
                    paddingHorizontal: 9,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#D7EAD0",
                      fontWeight: "600",
                    }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </Row>
          </View>
          <Button title="Start learning" onPress={demo} />
          <Label muted size={12}>
            Try the student demo. No account needed.
          </Label>
          <Button
            secondary
            title="Institution sign in"
            onPress={() => setShowSignIn(true)}
          />
        </>
      ) : (
        <Card>
          <Label size={21}>Welcome back.</Label>
          <Label muted size={12}>
            Akl Postgraduate College · Matta, Swat
          </Label>
          <Field
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Username"
          />
          <Field
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Password"
          />
          {error ? <Label>{error}</Label> : null}
          <Button
            title={busy ? "Signing in…" : "Sign in"}
            disabled={busy || !username.trim() || !password}
            onPress={() => {
              setBusy(true);
              setError("");
              void login(username.trim(), password)
                .then(() => router.replace("/"))
                .catch((e: unknown) => {
                  // Log the category only; credentials and server responses stay private.
                  console.warn("UniHub sign-in failure:", signInErrorCode(e));
                  setError(signInErrorMessage(e));
                })
                .finally(() => setBusy(false));
            }}
          />
          <Label muted size={12}>
            Your college provides your account. Ask your administrator if you
            need help.
          </Label>
          <Button secondary title="Try the demo instead" onPress={demo} />
          {!configured ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowSignIn(false)}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Label muted>← Back</Label>
            </Pressable>
          ) : null}
        </Card>
      )}
      <Label muted size={11}>
        BS STUDENTS · ONE IDEA AT A TIME
      </Label>
    </Page>
  );
}
