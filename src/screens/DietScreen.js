import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  Salad,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  ChefHat,
  Sparkles,
  AlertCircle,
  Zap,
  ArrowLeft,
  RefreshCw,
  Scale,
  Calculator,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { getMemberStyles } from '../styles/memberStyles';
import { useAppContext } from '../context/AppContext';
import { memberApi } from '../utils/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { key: 'lose',     label: 'Lose Weight',  icon: TrendingDown, color: '#e74c3c', desc: 'Reduce body fat with a calorie deficit' },
  { key: 'maintain', label: 'Maintain',      icon: Minus,        color: '#2ecc71', desc: 'Keep your current weight stable' },
  { key: 'gain',     label: 'Gain Weight',   icon: TrendingUp,   color: '#3498db', desc: 'Build muscle mass with a calorie surplus' },
];

const RATE_OPTIONS = {
  lose: [
    { label: '0.25 kg / week', value: -275,  note: 'Mild deficit · Easier to sustain' },
    { label: '0.5 kg / week',  value: -550,  note: 'Moderate deficit · Recommended' },
    { label: '0.75 kg / week', value: -825,  note: 'Aggressive deficit · Challenging' },
    { label: '1 kg / week',    value: -1100, note: 'Very aggressive · Hard to maintain' },
  ],
  gain: [
    { label: '0.25 kg / week', value: 275,  note: 'Lean bulk · Minimal fat gain' },
    { label: '0.5 kg / week',  value: 550,  note: 'Moderate bulk · Recommended' },
    { label: '0.75 kg / week', value: 825,  note: 'Aggressive bulk · Some fat gain' },
    { label: '1 kg / week',    value: 1100, note: 'Very aggressive · Expect fat gain' },
  ],
};

const DIET_STYLES = [
  { key: 'balanced',     label: 'Balanced',       icon: Salad,    desc: 'Equal macros · All-round health' },
  { key: 'high_protein', label: 'High Protein',   icon: Zap,      desc: '35 % protein · Muscle building' },
  { key: 'high_carb',    label: 'High Carb',      icon: Wheat,    desc: '55 % carbs · Energy & endurance' },
  { key: 'high_fat',     label: 'High Fat / Keto', icon: Droplets, desc: '60 % fat · Low carb lifestyle' },
];

const FOOD_PREFS = [
  { key: 'veg',     label: 'Vegetarian',     icon: Leaf },
  { key: 'non_veg', label: 'Non-Vegetarian', icon: Beef },
];

// Steps:  1 = Goal  2 = Rate  3 = Diet style  4 = Food pref  5 = Result
// 'maintain' skips step 2.

// ─── Macro calculator ─────────────────────────────────────────────────────────

function getMacros(calories, style) {
  let p, c, f;
  if (style === 'high_protein')     { p = 0.35; c = 0.40; f = 0.25; }
  else if (style === 'high_carb')   { p = 0.20; c = 0.55; f = 0.25; }
  else if (style === 'high_fat')    { p = 0.25; c = 0.15; f = 0.60; }
  else                              { p = 0.30; c = 0.40; f = 0.30; }
  return {
    protein: Math.round((calories * p) / 4),
    carbs:   Math.round((calories * c) / 4),
    fat:     Math.round((calories * f) / 9),
  };
}

// ─── Diet plan mapper ─────────────────────────────────────────────────────────

function mapBackendPlan(backendPlan, goal, dietStyle, foodPref) {
  if (!backendPlan) return null;

  const breakfast = backendPlan.breakfast || {};
  const lunch = backendPlan.lunch || {};
  const snacks = backendPlan.snacks || {};
  const postWorkout = backendPlan.postWorkout || {};
  const dinner = backendPlan.dinner || {};

  const activeGoal = backendPlan.goal || goal || 'maintain';
  const activeStyle = backendPlan.dietStyle || dietStyle || 'balanced';
  const activePref = backendPlan.dietType || foodPref || (breakfast.veg ? 'veg' : 'non_veg');

  const isVeg = activePref === 'veg';

  return {
    ...backendPlan,
    macros: {
      protein: backendPlan.totalProtein || 0,
      carbs: backendPlan.totalCarb || 0,
      fat: backendPlan.totalFat || 0,
    },
    meals: [
      { time: 'Breakfast', name: breakfast.mealName || 'Breakfast', description: breakfast.mealDescription || '', kcal: breakfast.calories || 0 },
      { time: 'Lunch', name: lunch.mealName || 'Lunch', description: lunch.mealDescription || '', kcal: lunch.calories || 0 },
      { time: 'Snack', name: snacks.mealName || 'Snack', description: snacks.mealDescription || '', kcal: snacks.calories || 0 },
      { time: 'Post Workout', name: postWorkout.mealName || 'Post Workout', description: postWorkout.mealDescription || '', kcal: postWorkout.calories || 0 },
      { time: 'Dinner', name: dinner.mealName || 'Dinner', description: dinner.mealDescription || '', kcal: dinner.calories || 0 },
    ],
    proteinSources: isVeg
      ? ['Paneer', 'Tofu', 'Lentils (dal)', 'Chickpeas', 'Greek yogurt', 'Cottage cheese', 'Eggs']
      : ['Chicken breast', 'Eggs', 'Fish (salmon/tuna)', 'Lean beef', 'Paneer', 'Shrimp', 'Turkey'],
    carbSources: ['Brown rice', 'Oats', 'Sweet potato', 'Quinoa', 'Whole wheat roti', 'Banana', 'Fruits'],
    fatSources: ['Avocado', 'Almonds', 'Walnuts', 'Olive oil', 'Ghee (small amount)', 'Flaxseeds', 'Chia seeds'],
    tips: activeGoal === 'lose'
      ? ['Eat slowly — it takes 20 min to feel full', 'Prioritise protein at every meal', 'Avoid liquid calories (juices, sodas)', 'Stay hydrated — aim for 3 L water/day']
      : activeGoal === 'gain'
      ? ['Eat every 3–4 hours', 'Add calorie-dense foods like nuts, avocado', 'Consume protein within 1 hr post-workout', "Don't skip meals — consistency is key"]
      : ['Match portion size to activity level', 'Focus on whole, unprocessed foods', 'Balance all 3 macros each meal', 'Get 7–8 hrs sleep for recovery'],
  };
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function OptionChip({ label, sublabel, icon: Icon, active, color, onPress, colors }) {
  const bg = active ? (color || colors.accent) : colors.surface;
  const border = active ? (color || colors.accent) : colors.border;
  const textColor = active ? '#FFF' : colors.textPrimary;
  const subColor = active ? 'rgba(255,255,255,0.75)' : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: border,
        backgroundColor: bg,
        marginBottom: 10,
      }}
    >
      {Icon && <Icon color={active ? '#FFF' : (color || colors.accent)} size={18} strokeWidth={2.4} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>{label}</Text>
        {sublabel ? (
          <Text style={{ fontSize: 12, fontWeight: '600', color: subColor, marginTop: 2 }}>{sublabel}</Text>
        ) : null}
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: active ? '#FFF' : colors.border,
        backgroundColor: active ? '#FFF' : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: color || colors.accent }} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DietScreen() {
  const { colors, profile, showAlert, onRefresh, refreshing, setGlobalLoading } = useAppContext();
  const styles = getMemberStyles(colors);
  const insets = useSafeAreaInsets();
  const member = profile?.member || {};
  const isExpired = member.expiryDate ? new Date(member.expiryDate) < new Date() : true;
  const isActive = member.status === 'active';
  const hasDietAccess = member.hasDietAccess === true;
  const isAccessAllowed = isActive && !isExpired && hasDietAccess;

  const limit = member.dietGenerationDailyLimit ?? 3;
  const getRemainingGenerations = () => {
    if (!member.lastDietGeneratedAt) return limit;
    try {
      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
      const lastGeneratedStr = new Date(member.lastDietGeneratedAt).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
      if (todayStr === lastGeneratedStr) {
        return Math.max(0, limit - (member.dietGenerationCountToday ?? 0));
      }
    } catch (e) {
      console.warn('Error calculating remaining diet limit:', e);
    }
    return limit;
  };
  const remaining = getRemainingGenerations();

  const getLockDetails = () => {
    if (!isActive) {
      return {
        icon: AlertCircle,
        color: '#e74c3c',
        title: 'Account Inactive',
        text: 'Your membership account is not active. Please contact your gym owner to activate your profile.',
      };
    }
    if (isExpired) {
      return {
        icon: Flame,
        color: '#f39c12',
        title: 'Membership Expired',
        text: member.expiryDate
          ? `Your membership expired on ${new Date(member.expiryDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}. Please renew your membership to generate diet plans.`
          : 'Your membership has expired. Please renew your membership to generate diet plans.',
      };
    }
    return {
      icon: Salad,
      color: colors.accent,
      title: 'Diet Access Restricted',
      text: 'To unlock customized meal planning and macro tracking, please contact your gym owner to enable Diet Access on your profile.',
    };
  };

  const lockDetails = getLockDetails();
  const LockIcon = lockDetails.icon;

  const s = localStyles(colors);
  const navigation = useNavigation();

  // ── storage keys ──
  const bmiKey      = member._id ? `bmi_calc_result_${member._id}` : null;
  const dietPlanKey = member._id ? `diet_plan_${member._id}` : null;

  // ── state ──
  const [tdee, setTdee] = useState(null);
  const [loadingCalorie, setLoadingCalorie] = useState(true);

  const [step, setStep]           = useState(1);   // 1–5
  const [goal, setGoal]           = useState(null);
  const [rateIdx, setRateIdx]     = useState(0);
  const [dietStyle, setDietStyle] = useState(null);
  const [foodPref, setFoodPref]   = useState(null);
  const [plan, setPlan]           = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [replacingMealTime, setReplacingMealTime] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Sync TDEE and update plan if necessary ──
  const syncTdee = useCallback(async () => {
    if (!bmiKey) return;
    try {
      const bmiRaw = await AsyncStorage.getItem(bmiKey);
      let latestTdee = null;
      if (bmiRaw) {
        const parsed = JSON.parse(bmiRaw);
        if (parsed?.tdee) {
          latestTdee = parsed.tdee;
        }
      }

      if (latestTdee === null) {
        // If TDEE was reset/removed in Tools, reset the diet planner
        setTdee(null);
        setGoal(null);
        setRateIdx(0);
        setDietStyle(null);
        setFoodPref(null);
        setPlan(null);
        setStep(1);
        setIsGenerating(false);
        try {
          await AsyncStorage.removeItem(dietPlanKey);
        } catch {}
        return;
      }

      if (tdee !== latestTdee) {
        // TDEE has changed! Show alert to let the user regenerate from 1st step if they have a plan
        if (plan && goal && dietStyle && foodPref) {
          showAlert({
            title: 'Calorie Metrics Updated',
            message: 'Your BMI & calorie metrics have changed. Please regenerate your diet plan to match your new daily calorie targets.',
            type: 'info',
            buttons: [
              {
                text: 'Regenerate',
                onPress: async () => {
                  setTdee(latestTdee);
                  setGoal(null);
                  setRateIdx(0);
                  setDietStyle(null);
                  setFoodPref(null);
                  setPlan(null);
                  setStep(1);
                  setIsGenerating(false);
                  try {
                    await AsyncStorage.removeItem(dietPlanKey);
                  } catch {}
                }
              }
            ]
          });
        } else {
          setTdee(latestTdee);
        }
      }
    } catch { /* ignore */ }
  }, [bmiKey, dietPlanKey, goal, rateIdx, dietStyle, foodPref, tdee, plan, onRefresh]);

  // Sync TDEE on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      syncTdee();
    });
    return unsubscribe;
  }, [navigation, syncTdee]);

  // ── load TDEE + restore saved plan ──
  useEffect(() => {
    if (!bmiKey || !dietPlanKey) return;
    (async () => {
      try {
        // Load TDEE from Tools screen cache
        const bmiRaw = await AsyncStorage.getItem(bmiKey);
        let latestTdee = null;
        if (bmiRaw) {
          const parsed = JSON.parse(bmiRaw);
          if (parsed?.tdee) {
            latestTdee = parsed.tdee;
          }
        }

        if (latestTdee !== null) {
          setTdee(latestTdee);
        }

        // 1. Try to fetch from local storage first
        const planRaw = await AsyncStorage.getItem(dietPlanKey);
        let restored = false;

        if (planRaw) {
          const saved = JSON.parse(planRaw);
          if (saved?.plan && saved.plan._id) {
            const savedTdee = saved.planTdee;
            
            if (latestTdee !== null && savedTdee !== latestTdee) {
              // Show the alert and let them regenerate!
              showAlert({
                title: 'Calorie Metrics Updated',
                message: 'Your BMI & calorie metrics have changed. Please regenerate your diet plan to match your new daily calorie targets.',
                type: 'info',
                buttons: [
                  {
                    text: 'Regenerate',
                    onPress: async () => {
                      setGoal(null);
                      setRateIdx(0);
                      setDietStyle(null);
                      setFoodPref(null);
                      setPlan(null);
                      setStep(1);
                      setIsGenerating(false);
                      try {
                        await AsyncStorage.removeItem(dietPlanKey);
                      } catch {}
                    }
                  }
                ]
              });
            } else {
              setGoal(saved.goal);
              setRateIdx(saved.rateIdx ?? 0);
              setDietStyle(saved.dietStyle);
              setFoodPref(saved.foodPref);
              setPlan(saved.plan);
              setStep(5);
              restored = true;
            }
          }
        }

        // 2. Fallback to fetching from backend if not restored from local storage
        if (!restored) {
          let savedPlan = null;
          try {
            savedPlan = await memberApi.getDietPlan();
          } catch (err) {
            console.error("Failed to load plan from backend:", err);
          }

          if (savedPlan && savedPlan._id) {
            const mapped = mapBackendPlan(savedPlan);
            const activeGoal = savedPlan.goal || 'maintain';
            const activeStyle = savedPlan.dietStyle || 'balanced';
            const activePref = savedPlan.dietType || 'veg';

            // Match/infer rateIdx
            let matchedRateIdx = 0;
            if (activeGoal !== 'maintain' && latestTdee !== null) {
              const calDiff = (savedPlan.totalCalories || 0) - latestTdee;
              const options = RATE_OPTIONS[activeGoal] || [];
              let minDiff = Infinity;
              options.forEach((opt, idx) => {
                const diff = Math.abs(opt.value - calDiff);
                if (diff < minDiff) {
                  minDiff = diff;
                  matchedRateIdx = idx;
                }
              });
            }

            setGoal(activeGoal);
            setRateIdx(matchedRateIdx);
            setDietStyle(activeStyle);
            setFoodPref(activePref);
            setPlan(mapped);
            setStep(5);

            // Update local cache
            const payload = {
              goal: activeGoal,
              rateIdx: matchedRateIdx,
              dietStyle: activeStyle,
              foodPref: activePref,
              plan: mapped,
              planTdee: latestTdee,
            };
            await AsyncStorage.setItem(dietPlanKey, JSON.stringify(payload));
          }
        }
      } catch { /* ignore */ }
      finally { setLoadingCalorie(false); }
    })();
  }, [member._id, member.phone, bmiKey, dietPlanKey]);

  // ── derived ──
  const rateValue = goal && goal !== 'maintain' ? (RATE_OPTIONS[goal]?.[rateIdx]?.value ?? 0) : 0;
  const targetCalories = tdee != null && goal != null ? tdee + rateValue : null;

  // step labels for the progress bar
  const STEPS = goal === 'maintain'
    ? ['Goal', 'Diet Style', 'Food Pref', 'Plan']
    : ['Goal', 'Rate', 'Diet Style', 'Food Pref', 'Plan'];

  // map logical step → display index (0-based)
  const displayStep = goal === 'maintain'
    ? [0, 0, 1, 2, 3][step - 1] ?? 0
    : step - 1;

  // ── navigation helpers ──
  const goBack = () => {
    if (step === 1) return;
    if (step === 3 && goal === 'maintain') { setStep(1); return; } // skip rate
    setStep(s => s - 1);
  };

  const advanceTo = (nextStep) => setStep(nextStep);

  const handleRefresh = async () => {
    setGlobalLoading(true);
    try {
      // 1. Refetch the member profile details from backend
      await onRefresh();

      // 2. Fetch current diet plan from the backend API directly
      let savedPlan = null;
      try {
        savedPlan = await memberApi.getDietPlan();
      } catch (err) {
        console.error("Failed to load plan from backend:", err);
      }

      if (savedPlan && savedPlan._id) {
        const mapped = mapBackendPlan(savedPlan);
        const activeGoal = savedPlan.goal || 'maintain';
        const activeStyle = savedPlan.dietStyle || 'balanced';
        const activePref = savedPlan.dietType || 'veg';

        // Match/infer rateIdx
        let matchedRateIdx = 0;
        if (activeGoal !== 'maintain' && tdee !== null) {
          const calDiff = (savedPlan.totalCalories || 0) - tdee;
          const options = RATE_OPTIONS[activeGoal] || [];
          let minDiff = Infinity;
          options.forEach((opt, idx) => {
            const diff = Math.abs(opt.value - calDiff);
            if (diff < minDiff) {
              minDiff = diff;
              matchedRateIdx = idx;
            }
          });
        }

        setGoal(activeGoal);
        setRateIdx(matchedRateIdx);
        setDietStyle(activeStyle);
        setFoodPref(activePref);
        setPlan(mapped);
        setStep(5);

        // Update local cache
        const payload = {
          goal: activeGoal,
          rateIdx: matchedRateIdx,
          dietStyle: activeStyle,
          foodPref: activePref,
          plan: mapped,
          planTdee: tdee,
        };
        await AsyncStorage.setItem(dietPlanKey, JSON.stringify(payload));
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  // ── handlers ──
  const onSelectGoal = (key) => {
    setGoal(key);
    setRateIdx(0);
    setPlan(null);
    if (key === 'maintain') advanceTo(3); // skip rate step
    else advanceTo(2);
  };

  const onSelectRate = (idx) => {
    setRateIdx(idx);
    advanceTo(3);
  };

  const onSelectDietStyle = (key) => {
    setDietStyle(key);
    advanceTo(4);
  };

  const restoreLastPlan = async () => {
    setActionLoading(true);
    try {
      // 1. Try to fetch from local storage first
      const planRaw = await AsyncStorage.getItem(dietPlanKey);
      let restoredFromLocal = false;

      if (planRaw) {
        const saved = JSON.parse(planRaw);
        if (saved?.plan && saved.plan._id) {
          setGoal(saved.goal);
          setRateIdx(saved.rateIdx ?? 0);
          setDietStyle(saved.dietStyle);
          setFoodPref(saved.foodPref);
          setPlan(saved.plan);
          setStep(5);
          restoredFromLocal = true;
        }
      }

      // 2. Fallback to fetching from backend if not available locally
      if (!restoredFromLocal) {
        let savedPlan = null;
        try {
          savedPlan = await memberApi.getDietPlan();
        } catch (err) {
          console.error("Failed to load plan from backend:", err);
        }

        if (savedPlan && savedPlan._id) {
          const mapped = mapBackendPlan(savedPlan);
          const activeGoal = savedPlan.goal || 'maintain';
          const activeStyle = savedPlan.dietStyle || 'balanced';
          const activePref = savedPlan.dietType || 'veg';

          // Match/infer rateIdx
          let matchedRateIdx = 0;
          if (activeGoal !== 'maintain' && tdee !== null) {
            const calDiff = (savedPlan.totalCalories || 0) - tdee;
            const options = RATE_OPTIONS[activeGoal] || [];
            let minDiff = Infinity;
            options.forEach((opt, idx) => {
              const diff = Math.abs(opt.value - calDiff);
              if (diff < minDiff) {
                minDiff = diff;
                matchedRateIdx = idx;
              }
            });
          }

          setGoal(activeGoal);
          setRateIdx(matchedRateIdx);
          setDietStyle(activeStyle);
          setFoodPref(activePref);
          setPlan(mapped);
          setStep(5);

          // Update local cache
          const payload = {
            goal: activeGoal,
            rateIdx: matchedRateIdx,
            dietStyle: activeStyle,
            foodPref: activePref,
            plan: mapped,
            planTdee: tdee,
          };
          await AsyncStorage.setItem(dietPlanKey, JSON.stringify(payload));
        }
      }
    } catch (err) {
      console.error('Failed to restore last diet plan:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const onSelectFoodPref = async (key) => {
    setActionLoading(true);
    try {
      const targetCal = tdee + (goal === 'maintain' ? 0 : rateValue);
      const backendPlan = await memberApi.generateDietPlan({
        calorieRequirement: targetCal,
        goal,
        dietType: key,
        dietStyle,
      });
      const p = mapBackendPlan(backendPlan, goal, dietStyle, key);
      setFoodPref(key);
      setPlan(p);
      advanceTo(5);

      // Persist the full wizard state + generated plan with the TDEE it was generated for
      const payload = { goal, rateIdx, dietStyle, foodPref: key, plan: p, planTdee: tdee };
      await AsyncStorage.setItem(dietPlanKey, JSON.stringify(payload));
      await onRefresh();
    } catch (err) {
      showAlert({
        title: 'Generation Failed',
        message: err.message || 'Failed to generate diet plan',
        type: 'error',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              restoreLastPlan();
            },
          },
        ],
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceMeal = async (timeLabel) => {
    if (!plan) return;

    let slotKey = timeLabel.toLowerCase();
    if (slotKey === 'snack') {
      slotKey = 'snacks';
    } else if (slotKey === 'post workout') {
      slotKey = 'postWorkout';
    }
    
    setReplacingMealTime(timeLabel);
    try {
      let activePlanId = plan._id;

      // Self-healing check: if the plan has no _id (legacy cached plan), generate it on backend first!
      if (!activePlanId) {
        console.log('No backend ID found. Registering plan on the backend first...');
        const targetCal = tdee + (goal === 'maintain' ? 0 : rateValue);
        const generated = await memberApi.generateDietPlan({
          calorieRequirement: targetCal,
          goal,
          dietType: foodPref,
          dietStyle,
        });
        activePlanId = generated._id;
        // Keep the generated plan in state to sync it
        const mappedGenerated = mapBackendPlan(generated, goal, dietStyle, foodPref);
        setPlan(mappedGenerated);
      }

      const updatedBackendPlan = await memberApi.replaceDietMeal({
        dietPlanId: activePlanId,
        mealTime: slotKey,
      });

      const updatedPlan = mapBackendPlan(updatedBackendPlan, goal, dietStyle, foodPref);
      setPlan(updatedPlan);

      // Update local storage too
      const payload = { goal, rateIdx, dietStyle, foodPref, plan: updatedPlan, planTdee: tdee };
      await AsyncStorage.setItem(dietPlanKey, JSON.stringify(payload));
    } catch (err) {
      showAlert({
        title: 'Failed to Replace Meal',
        message: err.message || 'Failed to replace meal',
        type: 'error',
         buttons: [{ text: 'OK' }],
      });
    } finally {
      setReplacingMealTime(null);
    }
  };

  const handleReset = async () => {
    setGoal(null);
    setRateIdx(0);
    setDietStyle(null);
    setFoodPref(null);
    setPlan(null);
    setStep(1);
    setIsGenerating(false);

    // Clear persisted plan
    try {
      await AsyncStorage.removeItem(dietPlanKey);
    } catch { /* ignore */ }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderCalorieBanner = (compact = false) => (
    <View style={[s.calCard, compact && s.calCardCompact]}>
      <View style={s.calCardGlow} />
      {compact ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.calIconWrap}>
            <Flame color="#FF6B35" size={18} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.calNote}>Maintenance calorie</Text>
            <Text style={[s.calValue, { fontSize: 22, lineHeight: 28 }]}>
              {tdee?.toLocaleString()}
              <Text style={[s.calUnit, { fontSize: 13 }]}> kcal/day</Text>
            </Text>
          </View>
          {targetCalories && targetCalories !== tdee && (
            <View style={s.targetBadge}>
              <Target color={colors.accent} size={12} />
              <Text style={s.targetBadgeText}>{targetCalories?.toLocaleString()} kcal</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={s.calIconWrap}>
              <Flame color="#FF6B35" size={22} strokeWidth={2.4} />
            </View>
            <Text style={s.calNote}>Your maintenance calorie is</Text>
          </View>
          {loadingCalorie ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 10 }} />
          ) : tdee != null ? (
            <>
              <Text style={s.calValue}>
                {tdee.toLocaleString()}
                <Text style={s.calUnit}> kcal / day</Text>
              </Text>
              <Text style={s.calSub}>
                This is your TDEE — the calories your body burns maintaining its current weight.
              </Text>
            </>
          ) : (
            <View style={s.calWarning}>
              <AlertCircle color="#f39c12" size={18} />
              <Text style={s.calWarningText}>
                No BMI data found. Please calculate your BMI & calories in the{' '}
                <Text style={{ fontWeight: '900' }}>Tools</Text> tab first.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderProgressBar = () => (
    <View style={s.progressWrap}>
      {STEPS.map((label, i) => {
        const isLastStep = i === STEPS.length - 1;
        const done = i < displayStep || (isLastStep && step === 5 && !!plan);
        const active = i === displayStep;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={[
                s.progressDot,
                done   && { backgroundColor: colors.accent, borderColor: colors.accent },
                active && { backgroundColor: colors.accent, borderColor: colors.accent, transform: [{ scale: 1.2 }] },
              ]}>
                {done && <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>✓</Text>}
              </View>
              <Text style={[s.progressLabel, (active || done) && { color: colors.accent }]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[s.progressLine, done && { backgroundColor: colors.accent }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  const renderHeader = (title, subtitle) => (
    <View style={s.stepHeader}>
      {step > 1 && (
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.75}>
          <ArrowLeft color={colors.textPrimary} size={20} strokeWidth={2.4} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.stepTitle}>{title}</Text>
        {subtitle ? <Text style={s.stepSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  // ─── Step renders ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <>
      {renderCalorieBanner(false)}
      {!loadingCalorie && tdee != null && (
        <View style={s.stepCard}>
          {renderHeader('What is your goal?', 'We\'ll tailor your plan around it')}
          {GOAL_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.key}
              label={opt.label}
              sublabel={opt.desc}
              icon={opt.icon}
              color={opt.color}
              active={goal === opt.key}
              onPress={() => onSelectGoal(opt.key)}
              colors={colors}
            />
          ))}
        </View>
      )}
    </>
  );

  const renderStep2 = () => {
    const opts = RATE_OPTIONS[goal] || [];
    const label = goal === 'lose' ? 'How fast do you want to lose?' : 'How fast do you want to gain?';
    return (
      <>
        {renderCalorieBanner(true)}
        <View style={s.stepCard}>
          {renderHeader(label, 'Choose a weekly rate that fits your lifestyle')}
          {opts.map((opt, idx) => (
            <OptionChip
              key={opt.label}
              label={opt.label}
              sublabel={opt.note}
              active={rateIdx === idx}
              onPress={() => onSelectRate(idx)}
              colors={colors}
            />
          ))}
        </View>
      </>
    );
  };

  const renderStep3 = () => (
    <>
      {renderCalorieBanner(true)}
      <View style={s.stepCard}>
        {renderHeader('Diet style preference', 'How do you prefer to split your macros?')}
        {DIET_STYLES.map((opt) => (
          <OptionChip
            key={opt.key}
            label={opt.label}
            sublabel={opt.desc}
            icon={opt.icon}
            active={dietStyle === opt.key}
            onPress={() => onSelectDietStyle(opt.key)}
            colors={colors}
          />
        ))}
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      {renderCalorieBanner(true)}
      <View style={s.stepCard}>
        {renderHeader('Food preference', 'This shapes your meal suggestions')}
        {FOOD_PREFS.map((opt) => (
          <OptionChip
            key={opt.key}
            label={opt.label}
            icon={opt.icon}
            active={foodPref === opt.key}
            onPress={() => onSelectFoodPref(opt.key)}
            colors={colors}
          />
        ))}
      </View>
    </>
  );

  const renderStep5 = () => {
    if (!plan) return null;
    return (
      <>
        {/* Compact calorie + target summary */}
        {renderCalorieBanner(true)}

        {/* Summary chips */}
        <View style={s.summaryRow}>
          {[
            { label: GOAL_OPTIONS.find(g => g.key === goal)?.label, color: GOAL_OPTIONS.find(g => g.key === goal)?.color },
            { label: goal !== 'maintain' ? RATE_OPTIONS[goal]?.[rateIdx]?.label : 'No change', color: colors.accent },
            { label: DIET_STYLES.find(d => d.key === dietStyle)?.label, color: colors.accent },
            { label: FOOD_PREFS.find(f => f.key === foodPref)?.label, color: colors.accent },
          ].map((chip, i) => chip.label ? (
            <View key={i} style={[s.summaryChip, { borderColor: `${chip.color}50`, backgroundColor: `${chip.color}12` }]}>
              <Text style={[s.summaryChipText, { color: chip.color }]}>{chip.label}</Text>
            </View>
          ) : null)}
        </View>

        {/* Back button row */}
        <TouchableOpacity onPress={goBack} style={s.backRowBtn} activeOpacity={0.75}>
          <ArrowLeft color={colors.textSecondary} size={16} strokeWidth={2.4} />
          <Text style={s.backRowBtnText}>Change preferences</Text>
        </TouchableOpacity>

        {/* Macros */}
        <View style={s.planCard}>
          <View style={s.planCardHeader}>
            <ChefHat color={colors.accent} size={20} />
            <Text style={s.planCardTitle}>Your Daily Macros</Text>
          </View>
          <View style={s.macroRow}>
            {[
              { label: 'Protein', value: `${plan.macros.protein}g`, color: '#e74c3c' },
              { label: 'Carbs',   value: `${plan.macros.carbs}g`,   color: '#f39c12' },
              { label: 'Fat',     value: `${plan.macros.fat}g`,     color: '#3498db' },
            ].map((m) => (
              <View key={m.label} style={s.macroBox}>
                <Text style={[s.macroVal, { color: m.color }]}>{m.value}</Text>
                <Text style={s.macroLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
          <Text style={s.macroTarget}>Total: {plan.totalCalories?.toLocaleString()} kcal / day</Text>
        </View>

        {/* Meals */}
        <View style={s.planCard}>
          <View style={s.planCardHeader}>
            <Flame color="#FF6B35" size={20} />
            <Text style={s.planCardTitle}>Meal Plan</Text>
          </View>
          {plan.meals.map((meal, i) => (
            <View key={meal.time} style={[s.mealRow, i === plan.meals.length - 1 && { borderBottomWidth: 0 }, { alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <View style={[s.mealTimePill, { alignSelf: 'flex-start', marginBottom: 6 }]}>
                  <Text style={s.mealTimeText}>{meal.time}</Text>
                </View>
                <Text style={s.mealName}>{meal.name}</Text>
                {meal.description ? <Text style={s.mealDesc}>{meal.description}</Text> : null}
                <Text style={s.mealKcal}>~{meal.kcal} kcal</Text>
              </View>
              <TouchableOpacity
                style={s.replaceBtn}
                onPress={() => handleReplaceMeal(meal.time)}
                activeOpacity={0.7}
                disabled={replacingMealTime !== null}
              >
                {replacingMealTime === meal.time ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <RefreshCw color={colors.accent} size={14} strokeWidth={2.4} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Food sources */}
        <View style={s.planCard}>
          <View style={s.planCardHeader}>
            <Salad color={colors.accent} size={20} />
            <Text style={s.planCardTitle}>Recommended Food Sources</Text>
          </View>
          {[
            { label: '🥩 Protein', items: plan.proteinSources, color: '#e74c3c' },
            { label: '🌾 Carbs',   items: plan.carbSources,   color: '#f39c12' },
            { label: '🥑 Healthy Fats', items: plan.fatSources, color: '#3498db' },
          ].map((group, gi) => (
            <View key={group.label} style={{ marginTop: gi > 0 ? 14 : 0 }}>
              <Text style={s.foodGroupLabel}>{group.label}</Text>
              <View style={s.tagWrap}>
                {group.items.map((f) => (
                  <View key={f} style={[s.foodTag, { backgroundColor: `${group.color}18`, borderColor: `${group.color}40` }]}>
                    <Text style={[s.foodTagText, { color: group.color }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={s.planCard}>
          <View style={s.planCardHeader}>
            <Sparkles color={colors.accent} size={20} />
            <Text style={s.planCardTitle}>Key Tips for Your Goal</Text>
          </View>
          {plan.tips.map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipDot} />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Start over */}
        <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.75}>
          <Text style={s.resetBtnText}>Start Over</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderNoBmiScreen = () => (
    <View style={s.lockCard}>
      <View style={[s.lockIconWrap, { backgroundColor: `${colors.accent}15` }]}>
        <Scale color={colors.accent} size={48} strokeWidth={1.5} />
      </View>
      <Text style={s.lockTitle}>No BMI & Calorie Data Present</Text>
      <Text style={s.lockText}>
        Please calculate your BMI & daily calorie expenditure first to generate and view customized diet plans.
      </Text>
      <TouchableOpacity
        style={[s.calculateBtn, { width: '100%', marginTop: 24 }]}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Tools')}
      >
        <Calculator color="#FFF" size={18} strokeWidth={2.4} />
        <Text style={s.calculateBtnText}>Calculate in Tools</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoDietPlanScreen = () => (
    <View style={s.lockCard}>
      <View style={[s.lockIconWrap, { backgroundColor: '#FF6B3515' }]}>
        <ChefHat color="#FF6B35" size={48} strokeWidth={1.5} />
      </View>
      <Text style={s.lockTitle}>No Diet Plan is Generated Yet</Text>
      <Text style={s.lockText}>
        Generate a fully customized meal plan matching your macro and daily calorie requirements.
      </Text>
      <TouchableOpacity
        style={[s.calculateBtn, { width: '100%', marginTop: 24, backgroundColor: colors.accent }]}
        activeOpacity={0.75}
        onPress={() => setIsGenerating(true)}
      >
        <Sparkles color="#FFF" size={18} strokeWidth={2.4} />
        <Text style={s.calculateBtnText}>Generate the Diet Plan</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.dashboardSafe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 112 }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Screen title */}
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: 8 }}>
            <View>
              <Text style={styles.screenTitle}>Diet Planner</Text>
            </View>
            {isAccessAllowed && (
              <View style={{ marginBottom: 4, backgroundColor: `${colors.accent}12`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: `${colors.accent}30` }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  Generations left: <Text style={{ color: colors.accent, fontWeight: '900' }}>{remaining} / {limit}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isAccessAllowed ? (
          <View style={s.lockCard}>
            <View style={[s.lockIconWrap, { backgroundColor: `${lockDetails.color}15` }]}>
              <LockIcon color={lockDetails.color} size={48} strokeWidth={1.5} />
            </View>
            <Text style={s.lockTitle}>{lockDetails.title}</Text>
            <Text style={s.lockText}>{lockDetails.text}</Text>
          </View>
        ) : loadingCalorie ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : tdee === null ? (
          renderNoBmiScreen()
        ) : !plan && !isGenerating ? (
          renderNoDietPlanScreen()
        ) : (
          <>
            {/* Progress bar (hidden on step 1 before goal selected) */}
            {(step > 1 || goal) && tdee != null && renderProgressBar()}

            {/* Step content */}
            {actionLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ marginTop: 16, color: colors.textSecondary, fontWeight: '700' }}>Generating diet plan...</Text>
              </View>
            ) : (
              <>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Local styles ─────────────────────────────────────────────────────────────

const localStyles = (colors) =>
  StyleSheet.create({
    lockCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    lockIconWrap: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: `${colors.accent}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    lockTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    lockText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      fontWeight: '600',
    },
    // ── Progress bar ──
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    progressDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    progressLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 4,
      marginBottom: 14, // align with dots
    },

    // ── Step header (title + back button) ──
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 18,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      lineHeight: 26,
    },
    stepSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 3,
    },

    // ── Step card ──
    stepCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },

    // ── Calorie banner ──
    calCard: {
      backgroundColor: '#10231F',
      borderRadius: 28,
      padding: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 5,
    },
    calCardCompact: {
      padding: 14,
      borderRadius: 20,
    },
    calCardGlow: {
      position: 'absolute',
      right: -40,
      top: -50,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: `${colors.accent}25`,
    },
    calIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: 'rgba(255,107,53,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    calNote: {
      color: '#A7D8CA',
      fontSize: 12,
      fontWeight: '700',
    },
    calValue: {
      color: '#FFFFFF',
      fontSize: 40,
      fontWeight: '900',
      lineHeight: 48,
      marginBottom: 8,
    },
    calUnit: {
      fontSize: 17,
      fontWeight: '700',
      color: '#A7D8CA',
    },
    calSub: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 19,
    },
    calWarning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: 'rgba(243,156,18,0.12)',
      borderRadius: 12,
      padding: 12,
      marginTop: 6,
    },
    calWarningText: {
      flex: 1,
      color: '#f39c12',
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
    },
    targetBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: `${colors.accent}18`,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${colors.accent}30`,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    targetBadgeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '900',
    },

    // ── Result screen ──
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    summaryChip: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    summaryChipText: {
      fontSize: 12,
      fontWeight: '800',
    },
    backRowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    backRowBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },
    planCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    planCardTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    macroRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    macroBox: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      alignItems: 'center',
    },
    macroVal: {
      fontSize: 22,
      fontWeight: '900',
    },
    macroLbl: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    macroTarget: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mealTimePill: {
      backgroundColor: `${colors.accent}18`,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: `${colors.accent}30`,
      minWidth: 72,
      alignItems: 'center',
    },
    mealTimeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    mealName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    mealDesc: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
      lineHeight: 16,
    },
    mealKcal: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    replaceBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.accent}12`,
      borderWidth: 1,
      borderColor: `${colors.accent}25`,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginLeft: 8,
    },
    foodGroupLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    foodTag: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    foodTagText: {
      fontSize: 12,
      fontWeight: '700',
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    tipDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginTop: 6,
    },
    tipText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 20,
    },
    resetBtn: {
      height: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetBtnText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '800',
    },
    calculateBtn: {
      height: 52,
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
  });
