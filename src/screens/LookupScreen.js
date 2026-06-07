import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Lock, Phone } from 'lucide-react-native';

import Button from '../components/Button';
import { BACKGROUND_IMAGE, getMemberStyles } from '../styles/memberStyles';

export default function LookupScreen({ colors, onLookup, loading, error, phone, setPhone, password, setPassword }) {
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
            <Text style={styles.brandName}>GymPro Member</Text>
            <Text style={styles.brandTagline}>Membership dashboard</Text>
          </View>

          <View style={styles.lookupCard}>
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
