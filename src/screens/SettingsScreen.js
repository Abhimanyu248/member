import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View, Modal, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Moon, Sun, UserRound, Lock, ChevronRight } from 'lucide-react-native';
import { memberApi } from '../utils/api';
import { getMemberStyles } from '../styles/memberStyles';
import { getMemberCode } from '../utils/memberUtils';
import { useAppContext } from '../context/AppContext';

export default function SettingsScreen() {
  const { colors, profile, isDarkMode, onThemeModeChange, onLogout } = useAppContext();
  const styles = getMemberStyles(colors);
  const insets = useSafeAreaInsets();
  const member = profile?.member || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const localStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontSize: 15,
      marginBottom: 16,
    },
    modalError: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: 16,
      fontWeight: '500',
    },
    modalSuccess: {
      color: colors.success,
      fontSize: 14,
      marginBottom: 16,
      fontWeight: '500',
    },
    indicatorText: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: -10,
      marginBottom: 16,
    },
    matchText: {
      color: colors.success,
    },
    mismatchText: {
      color: colors.danger,
    },
    modalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 12,
    },
    modalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
    },
    modalCancelButton: {
      backgroundColor: 'transparent',
    },
    modalCancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    modalSubmitButton: {
      backgroundColor: colors.accent,
    },
    modalSubmitButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
  });

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await memberApi.changePassword(member.phone, currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setModalVisible(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.dashboardSafe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 112 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenKicker}>Member App</Text>
            <Text style={styles.screenTitle}>Setting</Text>
          </View>
        </View>

        <View style={styles.settingsProfile}>
          <View style={styles.settingsAvatar}>
            <UserRound color={colors.accent} size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsName}>{member.name || 'Member'}</Text>
            <Text style={styles.settingsCode}>{getMemberCode(member)}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              {isDarkMode ? <Moon color={colors.accent} size={21} /> : <Sun color={colors.accent} size={21} />}
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Theme mode</Text>
              <Text style={styles.settingBody}>{isDarkMode ? 'Dark' : 'Light'}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={onThemeModeChange}
              trackColor={{ false: colors.border, true: `${colors.accent}70` }}
              thumbColor={isDarkMode ? colors.accent : colors.surface}
            />
          </View>

          <View style={[styles.settingRow, { marginTop: 15, borderTopWidth: 1, borderColor: colors.border, paddingTop: 15 }]}>
            <View style={styles.settingIcon}>
              <Lock color={colors.accent} size={21} />
            </View>
            <TouchableOpacity style={styles.settingCopy} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingBody}>Update portal credentials</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7} style={{ padding: 6 }}>
              <ChevronRight color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutAction} onPress={onLogout} activeOpacity={0.75}>
          <LogOut color={colors.danger} size={21} />
          <Text style={styles.logoutActionText}>Log out</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setError('');
            setSuccess('');
          }}
        >
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.modalContent}>
              <Text style={localStyles.modalTitle}>Change Password</Text>
              
              {error ? <Text style={localStyles.modalError}>{error}</Text> : null}
              {success ? <Text style={localStyles.modalSuccess}>{success}</Text> : null}

              <Text style={localStyles.modalLabel}>Current Password</Text>
              <TextInput
                style={localStyles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                placeholderTextColor={colors.textMuted}
              />

              <Text style={localStyles.modalLabel}>New Password</Text>
              <TextInput
                style={localStyles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                placeholderTextColor={colors.textMuted}
              />

              <Text style={localStyles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={localStyles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                placeholderTextColor={colors.textMuted}
              />
              {confirmPassword ? (
                <Text style={[
                  localStyles.indicatorText,
                  newPassword === confirmPassword ? localStyles.matchText : localStyles.mismatchText
                ]}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </Text>
              ) : null}

              <View style={localStyles.modalButtonRow}>
                <TouchableOpacity
                  style={[localStyles.modalButton, localStyles.modalCancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={loading}
                >
                  <Text style={localStyles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[localStyles.modalButton, localStyles.modalSubmitButton]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={localStyles.modalSubmitButtonText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
