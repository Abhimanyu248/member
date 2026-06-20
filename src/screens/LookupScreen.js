import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Lock, Phone, ChevronRight } from 'lucide-react-native';

import Button from '../components/Button';
import { BACKGROUND_IMAGE, getMemberStyles } from '../styles/memberStyles';

export default function LookupScreen({
  colors,
  onLookup,
  loading,
  error,
  phone,
  setPhone,
  password,
  setPassword,
  multiGymProfiles = [],
  onSelectGym,
  onCancelGymSelection,
}) {
  const styles = getMemberStyles(colors);

  return (
    <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={styles.lookupBackground} resizeMode="cover">
      <View style={styles.lookupOverlay} />
      <SafeAreaView style={styles.lookupSafe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.lookupContainer}
        >
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Activity color="#FFFFFF" size={34} strokeWidth={2.6} />
            </View>
            <Text style={styles.brandName}>GymSync</Text>
            <Text style={styles.brandTagline}>Membership dashboard</Text>
          </View>

          <View style={styles.lookupCard}>
            {multiGymProfiles && multiGymProfiles.length > 0 ? (
              <View>
                <Text style={styles.title}>Select Gym</Text>
                <Text style={styles.subtitle}>Choose the gym profile you want to access:</Text>

                {error ? (
                  <Text style={styles.errorText} selectable>
                    {error}
                  </Text>
                ) : null}

                <View style={{ marginTop: 5, gap: 10 }}>
                  {multiGymProfiles.map((p) => (
                    <TouchableOpacity
                      key={p.memberId}
                      style={{
                        height: 64,
                        backgroundColor: colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      activeOpacity={0.7}
                      onPress={() => onSelectGym(p.memberId)}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '800',
                          }}
                          numberOfLines={1}
                        >
                          {p.gymName}
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 13,
                            fontWeight: '600',
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          Member: {p.name}
                        </Text>
                      </View>
                      <ChevronRight color={colors.textSecondary} size={18} />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ marginTop: 20 }}>
                  <Button title="Back to Login" onPress={onCancelGymSelection} colors={colors} variant="secondary" />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.title}>Member Login</Text>
                <Text style={styles.subtitle}>Use your registered phone number & password.</Text>

                {error ? (
                  <Text style={styles.errorText} selectable>
                    {error}
                  </Text>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrap}>
                    <Phone color={colors.textMuted} size={18} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Registered phone"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginTop: 15 }]}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrap}>
                    <Lock color={colors.textMuted} size={18} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      secureTextEntry
                      autoCapitalize="none"
                      placeholderTextColor={colors.textMuted}
                      onSubmitEditing={onLookup}
                    />
                  </View>
                </View>

                <View style={{ marginTop: 25 }}>
                  <Button title="Login to Portal" onPress={onLookup} loading={loading} colors={colors} />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
