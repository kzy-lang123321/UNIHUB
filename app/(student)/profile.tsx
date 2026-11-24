import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { useStore } from "../../src/store";
import {
  fetchProfile,
  updateUserProfile,
} from "../../src/features/profile/service";
import {
  deleteCommunityBook,
  fetchCommunityBooks,
} from "../../src/features/community/service";
import { CommunityBook } from "../../src/features/community/types";
import { changePassword, logout } from "../../src/features/auth/service";
import { BiometricSetting } from "../../src/components/DeviceLock";
import { authenticationEnabled } from "../../src/config/access";

export default function UserProfileScreen() {
  const c = useColors();
  const profile = useStore((s) => s.profile);
  const dark = useStore((s) => s.dark);

  const [activeTab, setActiveTab] = useState<"overview" | "contributions" | "settings">("overview");
  const [contributions, setContributions] = useState<CommunityBook[]>([]);

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.fieldOfStudy ?? "");
  const [degreeLevel, setDegreeLevel] = useState(profile?.degreeLevel ?? "BS");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [github, setGithub] = useState(profile?.socialLinks?.github ?? "");
  const [linkedin, setLinkedin] = useState(profile?.socialLinks?.linkedin ?? "");
  const [isProfilePublic, setIsProfilePublic] = useState(profile?.isProfilePublic ?? true);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.uid) {
      void fetchProfile(profile.uid).then((p) => {
        if (p) {
          setDisplayName(p.displayName ?? "");
          setUsername(p.username ?? "");
          setBio(p.bio ?? "");
          setAvatarUrl(p.avatarUrl ?? "");
          setBannerUrl(p.bannerUrl ?? "");
          setPhone(p.phone ?? "");
          setFieldOfStudy(p.fieldOfStudy ?? "");
          setDegreeLevel(p.degreeLevel ?? "BS");
          setInterests(p.interests ?? []);
          setWebsite(p.website ?? "");
          setGithub(p.socialLinks?.github ?? "");
          setLinkedin(p.socialLinks?.linkedin ?? "");
          setIsProfilePublic(p.isProfilePublic ?? true);
        }
      });

      void fetchCommunityBooks({ uploaderUid: profile.uid, status: "all" }).then((books) => {
        setContributions(books);
      });
    }
  }, [profile?.uid]);

  async function handlePickImage(type: "avatar" | "banner") {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const uri = res.assets[0].uri;
      if (type === "avatar") {
        setAvatarUrl(uri);
      } else {
        setBannerUrl(uri);
      }
    } catch {
      //
    }
  }

  function handleAddInterest() {
    if (!interestInput.trim()) return;
    if (!interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
    }
    setInterestInput("");
  }

  function handleRemoveInterest(tag: string) {
    setInterests(interests.filter((i) => i !== tag));
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setError("");
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, {
        displayName: displayName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        phone: phone.trim() || undefined,
        fieldOfStudy: fieldOfStudy.trim() || undefined,
        degreeLevel,
        interests,
        website: website.trim() || undefined,
        socialLinks: {
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
        },
        isProfilePublic,
      });
      setShowEditModal(false);
      setMessage("Profile updated successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setError("");
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(newPassword);
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <Page>
        <Heading>Profile</Heading>
        <Label muted>Please sign in to view your profile.</Label>
      </Page>
    );
  }

  return (
    <Page>
      {/* Cover Banner */}
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.card,
        }}
      >
        {profile.bannerUrl ? (
          <Image
            source={{ uri: profile.bannerUrl }}
            style={{ width: "100%", height: 140, resizeMode: "cover" }}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 120,
              backgroundColor: c.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 32 }}>🎓</Text>
          </View>
        )}

        {/* Profile Card Header */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: -38,
            }}
          >
            {/* Avatar */}
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 4,
                  borderColor: c.card,
                  backgroundColor: c.tint,
                }}
              />
            ) : (
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 4,
                  borderColor: c.card,
                  backgroundColor: c.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "700" }}>
                  {profile.displayName.charAt(0)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Button
                secondary
                title="Edit Profile ✏️"
                onPress={() => setShowEditModal(true)}
              />
              {profile.uid === "demo" ? (
                <Button
                  title="Sign In 🔐"
                  onPress={() => router.push("/(auth)/login")}
                />
              ) : null}
            </View>
          </View>

          {/* Identity */}
          <View style={{ marginTop: 12, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: c.text, fontSize: 22, fontWeight: "700" }}>
                {profile.displayName}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: profile.isProfilePublic !== false ? "#E8F5E9" : c.tint,
                }}
              >
                <Text
                  style={{
                    color: profile.isProfilePublic !== false ? "#2E7D32" : c.muted,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {profile.isProfilePublic !== false ? "PUBLIC" : "PRIVATE"}
                </Text>
              </View>
            </View>

            {profile.username ? (
              <Label muted size={13}>
                @{profile.username}
              </Label>
            ) : null}

            <Label muted size={13}>
              {profile.role.toUpperCase()} · {profile.programId.toUpperCase()} (Semester{" "}
              {profile.semester}) · Akl Postgraduate College
            </Label>

            {profile.bio ? (
              <Text style={{ color: c.text, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
                {profile.bio}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {message ? (
        <View
          style={{
            padding: 12,
            backgroundColor: "#E8F5E9",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#C8E6C9",
          }}
        >
          <Text style={{ color: "#2E7D32", fontSize: 13, fontWeight: "600" }}>{message}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.card,
          borderRadius: 14,
          padding: 4,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("overview")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "overview" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "overview" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Overview
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("contributions")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "contributions" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "contributions" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Contributions ({contributions.length})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("settings")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "settings" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "settings" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Settings
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" ? (
        <View style={{ gap: 14 }}>
          {/* Academic Background */}
          <Card>
            <Heading>Academic Background</Heading>
            <View style={{ gap: 8 }}>
              <Row>
                <Label muted size={13}>Institution</Label>
                <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>
                  Akl Postgraduate College, Matta Swat
                </Text>
              </Row>
              <Row>
                <Label muted size={13}>Program / Department</Label>
                <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>
                  {profile.programId.toUpperCase()}
                </Text>
              </Row>
              <Row>
                <Label muted size={13}>Degree Level</Label>
                <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>
                  {profile.degreeLevel ?? "BS (4 Years)"}
                </Text>
              </Row>
              <Row>
                <Label muted size={13}>Current Semester</Label>
                <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>
                  Semester {profile.semester}
                </Text>
              </Row>
            </View>
          </Card>

          {/* Interests & Fields */}
          <Card>
            <Heading>Academic Interests</Heading>
            {profile.interests && profile.interests.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {profile.interests.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: c.tint,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <Text style={{ color: c.accent, fontWeight: "600", fontSize: 13 }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Label muted size={13}>
                No interests added yet. Tap "Edit Profile" to add topics you love.
              </Label>
            )}
          </Card>

          {/* Contact & Socials */}
          <Card>
            <Heading>Contact & Channels</Heading>
            <View style={{ gap: 8 }}>
              {profile.phone ? (
                <Row>
                  <Label muted size={13}>Phone</Label>
                  <Text style={{ color: c.text, fontSize: 13 }}>{profile.phone}</Text>
                </Row>
              ) : null}
              {profile.website ? (
                <Row>
                  <Label muted size={13}>Portfolio</Label>
                  <Text style={{ color: c.accent, fontSize: 13 }}>{profile.website}</Text>
                </Row>
              ) : null}
              {profile.socialLinks?.github ? (
                <Row>
                  <Label muted size={13}>GitHub</Label>
                  <Text style={{ color: c.text, fontSize: 13 }}>
                    @{profile.socialLinks.github}
                  </Text>
                </Row>
              ) : null}
              {profile.socialLinks?.linkedin ? (
                <Row>
                  <Label muted size={13}>LinkedIn</Label>
                  <Text style={{ color: c.text, fontSize: 13 }}>
                    {profile.socialLinks.linkedin}
                  </Text>
                </Row>
              ) : null}
              {!profile.phone && !profile.website && !profile.socialLinks?.github ? (
                <Label muted size={13}>
                  Add your contact and social channels in profile settings.
                </Label>
              ) : null}
            </View>
          </Card>
        </View>
      ) : null}

      {/* TAB 2: CONTRIBUTIONS */}
      {activeTab === "contributions" ? (
        <View style={{ gap: 14 }}>
          <Row>
            <Heading>My Uploaded Books</Heading>
            <Button
              title="+ Add Book"
              onPress={() => router.push({ pathname: "/(student)/community", params: { tab: "my-uploads" } })}
            />
          </Row>

          {contributions.length === 0 ? (
            <Card>
              <Label size={15}>No contributions yet.</Label>
              <Label muted size={13}>
                Contribute educational textbooks, notes, and handouts to the Community Library.
              </Label>
              <Button
                title="Go to Community Library"
                onPress={() => router.push("/(student)/community")}
              />
            </Card>
          ) : (
            contributions.map((b) => (
              <Card key={b.id}>
                <Row>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
                      {b.title}
                    </Text>
                    <Label muted size={12}>
                      by {b.author} · {b.subject}
                    </Label>
                    <Label muted size={11}>
                      {b.viewsCount} views · {b.downloadsCount} downloads
                    </Label>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor:
                        b.status === "approved"
                          ? "#E8F5E9"
                          : b.status === "pending"
                            ? "#FFF8E1"
                            : "#FFEBEE",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          b.status === "approved"
                            ? "#2E7D32"
                            : b.status === "pending"
                              ? "#F57F17"
                              : "#C62828",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {b.status.toUpperCase()}
                    </Text>
                  </View>
                </Row>
              </Card>
            ))
          )}
        </View>
      ) : null}

      {/* TAB 3: ACCOUNT & SECURITY */}
      {activeTab === "settings" ? (
        <View style={{ gap: 14 }}>
          <Card>
            <Heading>Account & Security</Heading>
            <Button
              secondary
              title="Change Password 🔑"
              onPress={() => setShowPasswordModal(true)}
            />
            {authenticationEnabled ? <BiometricSetting /> : null}
            <Button
              secondary
              title={dark ? "Switch to light mode ☀️" : "Switch to dark mode 🌙"}
              onPress={() => useStore.getState().toggleDark()}
            />
          </Card>

          <Card>
            <Heading>Session</Heading>
            <Button
              secondary
              title={profile.uid === "demo" ? "Leave demo" : "Sign out"}
              onPress={() => {
                void logout().then(() => router.replace("/"));
              }}
            />
          </Card>
        </View>
      ) : null}

      {/* EDIT PROFILE MODAL */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: c.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "90%",
              padding: 20,
              gap: 14,
            }}
          >
            <Row>
              <Heading>Edit Profile</Heading>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Text style={{ color: c.accent, fontSize: 18, fontWeight: "700" }}>✕</Text>
              </Pressable>
            </Row>

            {error ? (
              <View style={{ backgroundColor: "#FFEBEE", padding: 10, borderRadius: 10 }}>
                <Text style={{ color: "#C62828", fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14, paddingBottom: 20 }}>
                {/* Image upload buttons */}
                <Card>
                  <Label size={13}>Profile Images</Label>
                  <Row>
                    <View style={{ flex: 1 }}>
                      <Button
                        secondary
                        title="Pick Avatar Photo"
                        onPress={() => handlePickImage("avatar")}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        secondary
                        title="Pick Cover Banner"
                        onPress={() => handlePickImage("banner")}
                      />
                    </View>
                  </Row>
                </Card>

                <Field label="Full Name *">
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your Name"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                <Field label="Username (@handle)">
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="e.g. ali_swat"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                <Field label="Bio & About">
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    placeholder="Short bio about your academic focus and interests..."
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                      minHeight: 60,
                    }}
                  />
                </Field>

                <Field label="Phone Number">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+92 300 1234567"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                <Field label="Major / Field of Study">
                  <TextInput
                    value={fieldOfStudy}
                    onChangeText={setFieldOfStudy}
                    placeholder="e.g. Software Engineering"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                {/* Interests tags */}
                <View style={{ gap: 6 }}>
                  <Label size={13}>Academic Interests</Label>
                  <Row>
                    <TextInput
                      value={interestInput}
                      onChangeText={setInterestInput}
                      placeholder="Add tag (e.g. Algorithms)"
                      placeholderTextColor={c.muted}
                      style={{
                        flex: 1,
                        backgroundColor: c.card,
                        color: c.text,
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: c.border,
                      }}
                    />
                    <Button secondary title="+ Add" onPress={handleAddInterest} />
                  </Row>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {interests.map((tag) => (
                      <Pressable
                        key={tag}
                        onPress={() => handleRemoveInterest(tag)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: c.tint,
                        }}
                      >
                        <Text style={{ color: c.accent, fontSize: 12 }}>#{tag}</Text>
                        <Text style={{ color: c.muted, fontSize: 12 }}>✕</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Social links */}
                <Field label="Portfolio Website">
                  <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://..."
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                <Field label="GitHub Username">
                  <TextInput
                    value={github}
                    onChangeText={setGithub}
                    placeholder="github username"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                <Field label="LinkedIn Profile">
                  <TextInput
                    value={linkedin}
                    onChangeText={setLinkedin}
                    placeholder="linkedin username or url"
                    placeholderTextColor={c.muted}
                    style={{
                      backgroundColor: c.card,
                      color: c.text,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  />
                </Field>

                {/* Public profile toggle */}
                <Pressable
                  onPress={() => setIsProfilePublic(!isProfilePublic)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    backgroundColor: c.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>
                      Public Profile Visibility
                    </Text>
                    <Label muted size={12}>
                      Allow fellow students in your institution to discover your profile
                    </Label>
                  </View>
                  <Text style={{ fontSize: 20 }}>{isProfilePublic ? "🟢" : "⚪"}</Text>
                </Pressable>

                <Button
                  title={saving ? "Saving..." : "Save Profile Changes"}
                  onPress={handleSaveProfile}
                  disabled={saving}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={showPasswordModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: c.bg,
              borderRadius: 20,
              padding: 20,
              gap: 14,
            }}
          >
            <Heading>Change Password</Heading>
            <Label muted size={13}>
              Choose a secure password of at least 12 characters.
            </Label>
            {error ? (
              <View style={{ backgroundColor: "#FFEBEE", padding: 10, borderRadius: 10 }}>
                <Text style={{ color: "#C62828", fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password (min 12 chars)"
              placeholderTextColor={c.muted}
              style={{
                backgroundColor: c.card,
                color: c.text,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
              }}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor={c.muted}
              style={{
                backgroundColor: c.card,
                color: c.text,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
              }}
            />
            <Row>
              <View style={{ flex: 1 }}>
                <Button secondary title="Cancel" onPress={() => setShowPasswordModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Update" onPress={handleChangePassword} disabled={saving} />
              </View>
            </Row>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
