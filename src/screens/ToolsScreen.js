import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Scale,
  Ruler,
  Flame,
  Calculator,
  RefreshCw,
  Sparkles,
  User,
  Heart,
  TrendingUp,
  Activity,
} from 'lucide-react-native';

import { getMemberStyles } from '../styles/memberStyles';
import { useAppContext } from '../context/AppContext';

export default function ToolsScreen() {
  const { colors, profile, showAlert, refreshing, setGlobalLoading } = useAppContext();
  const styles = getMemberStyles(colors);
  const insets = useSafeAreaInsets();
  const member = profile?.member || {};

  // Input states initialized with member profile defaults if available
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState(member.age ? String(member.age) : '25');
  const [gender, setGender] = useState(member.gender || 'male');
  const [activityLevel, setActivityLevel] = useState('moderate'); // sedentary | light | moderate | active | extra

  // Result state
  const [result, setResult] = useState(null);

  const activityOptions = [
    { label: 'Sedentary (Little/no exercise)', value: 'sedentary', multiplier: 1.2 },
    { label: 'Light Exercise (1-3 days/week)', value: 'light', multiplier: 1.375 },
    { label: 'Moderate Exercise (3-5 days/week)', value: 'moderate', multiplier: 1.55 },
    { label: 'Hard Exercise (6-7 days/week)', value: 'active', multiplier: 1.725 },
    { label: 'Extra Active (Athletic/Physical job)', value: 'extra', multiplier: 1.9 },
  ];

  // Dynamic storage key scoped to individual member to support multi-user security
  const getStorageKey = () => {
    if (!member._id) return null;
    return `bmi_calc_result_${member._id}`;
  };

  // Load saved results on mount
  useEffect(() => {
    const loadSavedResult = async () => {
      const key = getStorageKey();
      if (!key) return;
      try {
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setResult(parsed);
          // Restore the input fields to easily let the member tweak values
          if (parsed.inputs) {
            setHeight(parsed.inputs.height || '');
            setWeight(parsed.inputs.weight || '');
            setAge(parsed.inputs.age || '');
            setGender(parsed.inputs.gender || 'male');
            setActivityLevel(parsed.inputs.activityLevel || 'moderate');
          }
        } else {
          // Reset fields to member's details when switching to a gym with no saved results
          setResult(null);
          setHeight('');
          setWeight('');
          setAge(member.age ? String(member.age) : '25');
          setGender(member.gender || 'male');
          setActivityLevel('moderate');
        }
      } catch (err) {
        console.error('Failed to load persisted BMI result:', err);
      }
    };

    loadSavedResult();
  }, [member._id]);

  const handleRefresh = async () => {
    const key = getStorageKey();
    if (!key) return;
    setGlobalLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(key);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setResult(parsed);
        if (parsed.inputs) {
          setHeight(parsed.inputs.height || '');
          setWeight(parsed.inputs.weight || '');
          setAge(parsed.inputs.age || '');
          setGender(parsed.inputs.gender || 'male');
          setActivityLevel(parsed.inputs.activityLevel || 'moderate');
        }
      } else {
        setResult(null);
        setHeight('');
        setWeight('');
        setAge(member.age ? String(member.age) : '25');
        setGender(member.gender || 'male');
        setActivityLevel('moderate');
      }
    } catch (err) {
      console.error('Failed to load persisted BMI result:', err);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setGlobalLoading(false);
    }
  };

  const calculateBMI = async () => {
    Keyboard.dismiss();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);

    if (!h || !w || !a || h <= 0 || w <= 0 || a <= 0) {
      showAlert({
        title: 'Invalid Input',
        message: 'Please enter valid details for height, weight, and age.',
        type: 'warning',
        buttons: [{ text: 'OK' }],
      });
      return;
    }

    // BMI calculation
    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);

    // BMR Calculation using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // Daily Calorie Expenditure (TDEE)
    const selectedActivity = activityOptions.find(opt => opt.value === activityLevel);
    const multiplier = selectedActivity ? selectedActivity.multiplier : 1.55;
    const tdee = bmr * multiplier;

    // Determine Classification & Recommendation
    let classification = '';
    let categoryColor = colors.success;
    let recommendation = '';
    let recommendedGoal = 'maintain'; // lose | maintain | gain
    let targetCalorieAdjustment = 0;

    if (bmi < 18.5) {
      classification = 'Underweight';
      categoryColor = '#3498db'; // Soft blue
      recommendation = 'To achieve a healthy weight, we recommend a moderate caloric surplus and clean weight-gaining focus.';
      recommendedGoal = 'gain';
      targetCalorieAdjustment = 500;
    } else if (bmi >= 18.5 && bmi < 25) {
      classification = 'Normal Weight';
      categoryColor = colors.success || '#2ecc71'; // Health green
      recommendation = 'Excellent! You are in a healthy range. Maintain your active lifestyle and follow a balanced diet.';
      recommendedGoal = 'maintain';
      targetCalorieAdjustment = 0;
    } else if (bmi >= 25 && bmi < 30) {
      classification = 'Overweight';
      categoryColor = '#f39c12'; // Vibrant orange
      recommendation = 'A clean diet with a moderate caloric deficit alongside strength training is recommended to shed fat.';
      recommendedGoal = 'lose';
      targetCalorieAdjustment = -500;
    } else {
      classification = 'Obese';
      categoryColor = colors.danger || '#e74c3c'; // Alert red
      recommendation = 'Prioritize a structured calorie deficit, active movement, and nutrient-dense meals for sustainable fat loss.';
      recommendedGoal = 'lose';
      targetCalorieAdjustment = -500;
    }

    const newResult = {
      bmi: parseFloat(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      classification,
      categoryColor,
      recommendation,
      recommendedGoal,
      targetCalories: Math.round(tdee + targetCalorieAdjustment),
      inputs: {
        height: String(height),
        weight: String(weight),
        age: String(age),
        gender,
        activityLevel,
      },
    };

    setResult(newResult);

    // Save to local storage
    try {
      const key = getStorageKey();
      if (key) {
        await AsyncStorage.setItem(key, JSON.stringify(newResult));
      }
    } catch (err) {
      console.error('Failed to persist BMI result locally:', err);
    }

  };

  const resetCalculator = async () => {
    setHeight('');
    setWeight('');
    setAge(member.age ? String(member.age) : '25');
    setGender(member.gender || 'male');
    setActivityLevel('moderate');
    setResult(null);

    // Remove from local storage
    try {
      const key = getStorageKey();
      if (key) {
        await AsyncStorage.removeItem(key);
      }
    } catch (err) {
      console.error('Failed to clear persisted BMI result locally:', err);
    }

  };

  const localStyles = StyleSheet.create({
    topHeader: {
      marginBottom: 10,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 18,
    },
    inputField: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    customInputWrap: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      backgroundColor: colors.surfaceAlt || '#f9f9f9',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    customInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    genderContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 18,
    },
    genderButton: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt || '#f9f9f9',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    genderActiveButton: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    genderButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    genderActiveButtonText: {
      color: '#FFFFFF',
    },
    activityContainer: {
      marginBottom: 20,
    },
    activityChip: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt || '#f9f9f9',
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activityActiveChip: {
      backgroundColor: `${colors.accent}12`,
      borderColor: colors.accent,
    },
    activityText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    activityActiveText: {
      color: colors.accent,
      fontWeight: '700',
    },
    calculateBtn: {
      height: 54,
      borderRadius: 16,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    calculateBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    resultTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resetBtnText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    bmiHeaderCard: {
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      marginBottom: 18,
      borderWidth: 1,
    },
    bmiScore: {
      fontSize: 48,
      fontWeight: '900',
      color: '#FFFFFF',
      lineHeight: 56,
    },
    bmiLabel: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    adviceBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 12,
      padding: 12,
      marginTop: 14,
      width: '100%',
    },
    adviceText: {
      color: '#FFFFFF',
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 18,
    },
    resultDetailRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 18,
    },
    detailBox: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      alignItems: 'center',
    },
    detailVal: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 4,
    },
    detailLbl: {
      fontSize: 11,
      color: colors.textMuted || colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    recommendedBanner: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    recommendedCalValue: {
      fontSize: 28,
      fontWeight: '900',
    },
    recommendedCalLabel: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    breakdownCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      overflow: 'hidden',
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    breakdownLabelCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    breakdownLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    breakdownVal: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    activeBreakdownVal: {
      color: colors.accent,
      fontWeight: '900',
    },
  });

  return (
    <SafeAreaView style={styles.dashboardSafe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 112 },
        ]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        <View style={[styles.topBar, localStyles.topHeader]}>
          <View>
            <Text style={styles.screenTitle}>BMI & Calories</Text>
          </View>
        </View>

        {!result ? (
          <View style={localStyles.sectionCard}>
            {/* Height & Weight Inputs */}
            <View style={localStyles.inputRow}>
              <View style={localStyles.inputField}>
                <Text style={localStyles.inputLabel}>Height (cm)</Text>
                <View style={localStyles.customInputWrap}>
                  <Ruler color={colors.accent} size={20} />
                  <TextInput
                    style={localStyles.customInput}
                    value={height}
                    onChangeText={setHeight}
                    placeholder="e.g. 175"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={localStyles.inputField}>
                <Text style={localStyles.inputLabel}>Weight (kg)</Text>
                <View style={localStyles.customInputWrap}>
                  <Scale color={colors.accent} size={20} />
                  <TextInput
                    style={localStyles.customInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="e.g. 70"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Age & Gender Selection */}
            <View style={localStyles.inputRow}>
              <View style={[localStyles.inputField, { flex: 0.8 }]}>
                <Text style={localStyles.inputLabel}>Age (years)</Text>
                <View style={localStyles.customInputWrap}>
                  <User color={colors.accent} size={20} />
                  <TextInput
                    style={localStyles.customInput}
                    value={age}
                    onChangeText={setAge}
                    placeholder="25"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={localStyles.inputField}>
                <Text style={localStyles.inputLabel}>Gender</Text>
                <View style={localStyles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      localStyles.genderButton,
                      gender === 'male' && localStyles.genderActiveButton,
                    ]}
                    onPress={() => setGender('male')}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        localStyles.genderButtonText,
                        gender === 'male' && localStyles.genderActiveButtonText,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localStyles.genderButton,
                      gender === 'female' && localStyles.genderActiveButton,
                    ]}
                    onPress={() => setGender('female')}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        localStyles.genderButtonText,
                        gender === 'female' && localStyles.genderActiveButtonText,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Activity Level Selector */}
            <Text style={localStyles.inputLabel}>Activity Level</Text>
            <View style={localStyles.activityContainer}>
              {activityOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    localStyles.activityChip,
                    activityLevel === option.value && localStyles.activityActiveChip,
                  ]}
                  onPress={() => setActivityLevel(option.value)}
                  activeOpacity={0.75}
                >
                  <Activity
                    color={activityLevel === option.value ? colors.accent : colors.textSecondary}
                    size={16}
                  />
                  <Text
                    style={[
                      localStyles.activityText,
                      activityLevel === option.value && localStyles.activityActiveText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={localStyles.calculateBtn}
              onPress={calculateBMI}
              activeOpacity={0.8}
            >
              <Calculator color="#FFFFFF" size={20} />
              <Text style={localStyles.calculateBtnText}>Calculate BMI & Calories</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={localStyles.sectionCard}>
            <View style={localStyles.resultTitleRow}>
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Calculation Results</Text>
              <TouchableOpacity
                style={localStyles.resetBtn}
                onPress={resetCalculator}
                activeOpacity={0.7}
              >
                <RefreshCw color={colors.textSecondary} size={13} />
                <Text style={localStyles.resetBtnText}>Recalculate</Text>
              </TouchableOpacity>
            </View>

            {/* BMI Banner */}
            <View
              style={[
                localStyles.bmiHeaderCard,
                {
                  backgroundColor: result.categoryColor,
                  borderColor: result.categoryColor,
                },
              ]}
            >
              <Text style={localStyles.bmiScore}>{result.bmi}</Text>
              <Text style={localStyles.bmiLabel}>{result.classification}</Text>

              <View style={localStyles.adviceBox}>
                <Text style={localStyles.adviceText}>{result.recommendation}</Text>
              </View>
            </View>

            {/* BMR and Maintenance Calories row */}
            <View style={localStyles.resultDetailRow}>
              <View style={localStyles.detailBox}>
                <Flame color="#e67e22" size={20} />
                <Text style={localStyles.detailVal}>{result.bmr} kcal</Text>
                <Text style={localStyles.detailLbl}>BMR / Basal Burn</Text>
              </View>

              <View style={localStyles.detailBox}>
                <Sparkles color={colors.accent} size={20} />
                <Text style={localStyles.detailVal}>{result.tdee} kcal</Text>
                <Text style={localStyles.detailLbl}>TDEE / Maintenance</Text>
              </View>
            </View>

            {/* Tailored Calorie Target Recommendation */}
            <View
              style={[
                localStyles.recommendedBanner,
                {
                  backgroundColor: `${colors.accent}10`,
                  borderColor: `${colors.accent}30`,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    localStyles.recommendedCalLabel,
                    { color: colors.accent },
                  ]}
                >
                  ⭐ Recommended Daily Target
                </Text>
                <Text
                  style={[
                    localStyles.recommendedCalValue,
                    { color: colors.textPrimary },
                  ]}
                >
                  {result.targetCalories}{' '}
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>kcal/day</Text>
                </Text>
              </View>
              <View style={{ paddingRight: 4 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: colors.accent,
                    backgroundColor: `${colors.accent}18`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  {result.recommendedGoal === 'lose'
                    ? 'Weight Loss'
                    : result.recommendedGoal === 'gain'
                    ? 'Weight Gain'
                    : 'Maintain'}
                </Text>
              </View>
            </View>

            {/* Goal Breakdown List */}
            <Text style={[localStyles.inputLabel, { marginBottom: 10 }]}>Goal Breakdown</Text>
            <View style={localStyles.breakdownCard}>
              {/* Weight Loss row */}
              <View style={localStyles.breakdownRow}>
                <View style={localStyles.breakdownLabelCol}>
                  <Heart
                    color={result.recommendedGoal === 'lose' ? colors.accent : colors.textSecondary}
                    size={16}
                  />
                  <View>
                    <Text style={localStyles.breakdownLabel}>Weight Loss (-500 kcal)</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted || colors.textSecondary, fontWeight: '600', marginTop: 2 }}>
                      ~0.5 kg decrease / week
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    localStyles.breakdownVal,
                    result.recommendedGoal === 'lose' && localStyles.activeBreakdownVal,
                  ]}
                >
                  {result.tdee - 500} kcal
                </Text>
              </View>

              {/* Maintain row */}
              <View style={localStyles.breakdownRow}>
                <View style={localStyles.breakdownLabelCol}>
                  <Scale
                    color={
                      result.recommendedGoal === 'maintain' ? colors.accent : colors.textSecondary
                    }
                    size={16}
                  />
                  <View>
                    <Text style={localStyles.breakdownLabel}>Maintain Weight (TDEE)</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted || colors.textSecondary, fontWeight: '600', marginTop: 2 }}>
                      No weight change
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    localStyles.breakdownVal,
                    result.recommendedGoal === 'maintain' && localStyles.activeBreakdownVal,
                  ]}
                >
                  {result.tdee} kcal
                </Text>
              </View>

              {/* Weight Gain row */}
              <View style={[localStyles.breakdownRow, { borderBottomWidth: 0 }]}>
                <View style={localStyles.breakdownLabelCol}>
                  <TrendingUp
                    color={result.recommendedGoal === 'gain' ? colors.accent : colors.textSecondary}
                    size={16}
                  />
                  <View>
                    <Text style={localStyles.breakdownLabel}>Weight Gain (+500 kcal)</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted || colors.textSecondary, fontWeight: '600', marginTop: 2 }}>
                      ~0.5 kg increase / week
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    localStyles.breakdownVal,
                    result.recommendedGoal === 'gain' && localStyles.activeBreakdownVal,
                  ]}
                >
                  {result.tdee + 500} kcal
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
