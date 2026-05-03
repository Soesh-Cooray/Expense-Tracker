import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, Text, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation } from 'expo-router';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../store/Authstore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const SettingsScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [activeRoute] = useState('settings');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [selectedImageType, setSelectedImageType] = useState('image/jpeg');
  const [previewUri, setPreviewUri] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.username || user?.email || '');
    if (!selectedImageUri) {
      setPreviewUri(user?.imageUrl || user?.profilePicture || user?.avatar || '');
    }
  }, [user, selectedImageUri]);

  useEffect(() => {
    const restorePickerResult = async () => {
      const pendingResult = await ImagePicker.getPendingResultAsync();

      if (!pendingResult || pendingResult.canceled || !pendingResult.assets?.length) {
        return;
      }

      const asset = pendingResult.assets[0];
      setSelectedImageUri(asset.uri || '');
      setSelectedImageName(asset.fileName || `profile-${Date.now()}.jpg`);
      setSelectedImageType(asset.mimeType || 'image/jpeg');
      setPreviewUri(asset.uri || '');
    };

    restorePickerResult();
  }, []);

  const authHeaders = token ? { 'x-auth-token': token } : {};

  const applyPickedAsset = (asset, sourceLabel = 'picker') => {
    if (!asset?.uri) {
      setDebugMessage(`[${sourceLabel}] No usable asset URI returned.`);
      return false;
    }

    setSelectedImageUri(asset.uri);
    setSelectedImageName(asset.fileName || `profile-${Date.now()}.jpg`);
    setSelectedImageType(asset.mimeType || 'image/jpeg');
    setPreviewUri(asset.uri);
    setDebugMessage(`[${sourceLabel}] Asset selected: ${asset.uri}`);
    return true;
  };

  const buildDisplayUser = (updates) => {
    const nextUser = { ...(user || {}), ...updates };

    if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
      nextUser.username = updates.email;
      delete nextUser.email;
    }

    return nextUser;
  };

  const handleSaveProfile = async () => {
    if (!API_BASE_URL) {
      Alert.alert('Configuration error', 'API base URL is missing.');
      return;
    }

    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const payload = {};

    if (trimmedName && trimmedName !== (user?.name || '')) {
      payload.name = trimmedName;
    }

    const currentEmail = (user?.username || user?.email || '').trim().toLowerCase();
    if (trimmedEmail && trimmedEmail !== currentEmail) {
      payload.email = trimmedEmail;
    }

    if (!payload.name && !payload.email) {
      Alert.alert('No changes', 'Update your name or email before saving.');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await axios.put(`${API_BASE_URL}/users/update-profile`, payload, {
        headers: authHeaders,
      });

      const updatedUser = response.data?.user || buildDisplayUser(payload);
      updateUser(updatedUser);
      setName(updatedUser.name || '');
      setEmail(updatedUser.username || updatedUser.email || '');
      Alert.alert('Success', response.data?.message || 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Update failed', error?.response?.data?.message || error.message || 'Please try again');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!API_BASE_URL) {
      Alert.alert('Configuration error', 'API base URL is missing.');
      return;
    }

    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Invalid password', 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirmation must match.');
      return;
    }

    try {
      setSavingPassword(true);
      const response = await axios.put(
        `${API_BASE_URL}/users/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: authHeaders,
        }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', response.data?.message || 'Password changed successfully');
    } catch (error) {
      Alert.alert('Password update failed', error?.response?.data?.message || error.message || 'Please try again');
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePickImage = async () => {
    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo library access to choose a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        legacy: true,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        applyPickedAsset(asset, 'picker');
        return;
      }

      const pendingResult = await ImagePicker.getPendingResultAsync();

      if (!pendingResult?.canceled && pendingResult?.assets?.length) {
        applyPickedAsset(pendingResult.assets[0], 'pending');
        return;
      }
    } catch (error) {
      Alert.alert('Picker error', error?.message || 'Could not open image picker.');
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!API_BASE_URL) {
      Alert.alert('Configuration error', 'API base URL is missing.');
      return;
    }

    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    if (!selectedImageUri) {
      Alert.alert('No image selected', 'Choose a profile image first.');
      return;
    }
    const formData = new FormData();
    formData.append('image', {
      uri: selectedImageUri,
      name: selectedImageName || `profile-${Date.now()}.jpg`,
      type: selectedImageType || 'image/jpeg',
    });

    try {
      setUploadingImage(true);
      const response = await axios.put(`${API_BASE_URL}/users/change-profile-picture`, formData, {
        headers: {
          ...authHeaders,
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.imageUrl || previewUri;
      updateUser({ imageUrl });
      setPreviewUri(imageUrl);
      setSelectedImageUri('');
      setSelectedImageName('');
      setSelectedImageType('image/jpeg');
      Alert.alert('Success', response.data?.message || 'Profile picture updated successfully');
    } catch (error) {
      Alert.alert('Upload failed', error?.response?.data?.message || error.message || 'Please try again');
    } finally {
      setUploadingImage(false);
    }
  };

  const avatarLabel = (name || email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const avatarSource = previewUri ? { uri: previewUri } : undefined;

  return (
    <View style={styles.wrapper}>
      <Sidebar navigation={navigation} activeRoute={activeRoute} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Settings</Text>
          <Text style={styles.subtitle}>Manage your profile details, password, and profile photo.</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.avatarRow}>
              {avatarSource ? (
                <Avatar.Image size={84} source={avatarSource} style={styles.avatar} />
              ) : (
                <Avatar.Text size={84} label={avatarLabel} style={styles.avatar} />
              )}
              <View style={styles.avatarActions}>
                <Button mode="outlined" onPress={handlePickImage} style={styles.secondaryButton}>
                  Choose Image
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUploadProfilePicture}
                  loading={uploadingImage}
                  disabled={uploadingImage}
                  style={styles.primaryButton}
                >
                  Upload Photo
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Update Profile</Text>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            <Button
              mode="contained"
              onPress={handleSaveProfile}
              loading={savingProfile}
              disabled={savingProfile}
              style={styles.primaryButton}
            >
              Save Profile
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Change Password</Text>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry={showCurrentPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? 'eye' : 'eye-off'}
                  onPress={() => setShowCurrentPassword((value) => !value)}
                />
              }
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={showNewPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-reset" />}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye' : 'eye-off'}
                  onPress={() => setShowNewPassword((value) => !value)}
                />
              }
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={showConfirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="check-decagram" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye' : 'eye-off'}
                  onPress={() => setShowConfirmPassword((value) => !value)}
                />
              }
            />
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={savingPassword}
              disabled={savingPassword}
              style={styles.primaryButton}
            >
              Update Password
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Current Account</Text>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Name</Text>
              <Text style={styles.accountValue}>{user?.name || 'Not set'}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{user?.username || user?.email || 'Not set'}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Profile Image</Text>
              <Text style={styles.accountValue}>{user?.imageUrl ? 'Uploaded' : 'Default avatar'}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f7fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    marginTop: 20,
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 6,
    color: '#6b7280',
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  avatar: {
    backgroundColor: '#177AD5',
  },
  avatarActions: {
    flex: 1,
    marginLeft: Platform.OS === 'web' ? 16 : 0,
    marginTop: Platform.OS === 'web' ? 0 : 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    borderRadius: 10,
    marginTop: 4,
  },
  secondaryButton: {
    borderRadius: 10,
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  accountLabel: {
    color: '#6b7280',
    flex: 1,
  },
  accountValue: {
    flex: 2,
    color: '#111827',
    textAlign: 'right',
  },
  divider: {
    marginVertical: 10,
  },
});

export default SettingsScreen;