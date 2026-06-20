import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  CreditCard,
  Dumbbell,
  Home,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  UserRound,
  WalletCards,
  User,
  Mail,
} from 'lucide-react-native';

import InfoRow from '../components/InfoRow';
import PaymentRow from '../components/PaymentRow';
import StatusBadge from '../components/StatusBadge';
import { getMemberStyles } from '../styles/memberStyles';
import {
  calculateDaysLeft,
  formatDate,
  formatMoney,
  getMemberCode,
  getMembershipStatus,
} from '../utils/memberUtils';

import { useAppContext } from '../context/AppContext';

export default function DashboardScreen() {
  const { colors, profile, onRefresh, refreshing, setGlobalLoading } = useAppContext();
  const styles = getMemberStyles(colors);
  const insets = useSafeAreaInsets();

  const handleRefresh = async () => {
    setGlobalLoading(true);
    try {
      await onRefresh();
    } finally {
      setGlobalLoading(false);
    }
  };
  const member = profile?.member || {};
  const payments = profile?.payments || [];
  const status = useMemo(() => getMembershipStatus(member), [member]);
  const daysLeft = calculateDaysLeft(member.expiryDate);
  const totalPaid = profile?.summary?.totalPaid || 0;
  const plan = member.planId || {};
  const expiryTone =
    status.tone === 'danger' ? colors.danger : status.tone === 'warning' ? colors.warning : colors.success;
  const planAmount = plan.amount || plan.price || 0;
  const planName = plan.name || 'No Plan';
  const memberInitial = member.name?.trim()?.charAt(0)?.toUpperCase() || 'M';
  const planProgress = useMemo(() => {
    const start = new Date(member.joinDate);
    const expiry = new Date(member.expiryDate);
    const today = new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime()) || expiry <= start) return 0;

    const rawProgress = (today - start) / (expiry - start);
    return Math.min(Math.max(rawProgress, 0), 1);
  }, [member.expiryDate, member.joinDate]);
  const progressPercent = Math.round(planProgress * 100);
  const daysLabel =
    daysLeft === null
      ? 'No expiry set'
      : daysLeft < 0
        ? `${Math.abs(daysLeft)} days overdue`
        : daysLeft === 0
          ? 'Expires today'
          : `${daysLeft} days left`;

  const renderStatCard = ({ Icon, label, value, detail, tone = colors.accent }) => (
    <View style={styles.dashboardStatCard} key={label}>
      <View style={[styles.dashboardStatIcon, { backgroundColor: `${tone}14` }]}>
        <Icon color={tone} size={20} strokeWidth={2.4} />
      </View>
      <Text style={styles.dashboardStatLabel}>{label}</Text>
      <Text style={styles.dashboardStatValue} numberOfLines={1} selectable>
        {value}
      </Text>
      <Text style={styles.dashboardStatDetail} numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.dashboardSafe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          styles.dashboardContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 112 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.dashboardHeader}>
          <View style={styles.dashboardHeaderCopy}>
            <Text style={styles.dashboardGreeting} numberOfLines={1}>
              Hi, {member.name || 'Member'}
            </Text>
            <Text style={styles.dashboardSubtitle}>Your membership overview for today.</Text>
          </View>
          {/* <TouchableOpacity
            style={styles.dashboardRefreshButton}
            onPress={onRefresh}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Refresh dashboard"
          >
            {refreshing ? <ActivityIndicator color={colors.accent} /> : <RotateCcw color={colors.accent} size={20} />}
          </TouchableOpacity> */}
        </View>

        <View style={styles.dashboardHero}>
          <View style={styles.dashboardHeroGlow} />
          <View style={styles.dashboardHeroTop}>
            <View style={styles.dashboardAvatarWrap}>
              {member.photo ? (
                <Image source={{ uri: member.photo }} style={styles.dashboardAvatar} />
              ) : (
                <View style={styles.dashboardAvatarPlaceholder}>
                  <Text style={styles.dashboardAvatarInitial}>{memberInitial}</Text>
                </View>
              )}
            </View>

            <View style={styles.dashboardHeroIdentity}>
              {/* <Text style={styles.dashboardHeroKicker}>Current member</Text> */}
              <Text style={styles.dashboardHeroName} numberOfLines={1} selectable>
                {member.name || 'Member'}
              </Text>
              <View style={styles.dashboardCodeRow}>
                <BadgeCheck color="#BDEFE0" size={16} />
                <Text style={styles.dashboardCodeText} selectable>
                  {getMemberCode(member)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dashboardHeroStatusRow}>
            <StatusBadge status={status} colors={colors} />
            <Text style={styles.dashboardHeroJoined}>Joined {formatDate(member.joinDate)}</Text>
          </View>

          <View style={styles.dashboardPlanBlock}>
            <Text style={styles.dashboardPlanLabel}>Current plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.dashboardPlanName} numberOfLines={1} selectable>
                {planName}
              </Text>
              {planAmount > 0 && (
                <Text style={[styles.dashboardPlanName, { opacity: 0.7, fontSize: (styles.dashboardPlanName?.fontSize || 18) - 2 }]} numberOfLines={1}>
                  · {formatMoney(planAmount)}
                </Text>
              )}
            </View>
          </View>

              
          <View style={styles.dashboardHeroMeta}>
            <View style={styles.dashboardHeroMetaItem}>
              <User color="#DFF8EE" size={18} />
              <Text style={styles.dashboardHeroMetaText} numberOfLines={1}>
                {member.gender?.toUpperCase() || 'MEMBER'}
              </Text>
            </View>

            {member.batch && (
              <View style={styles.dashboardHeroMetaItem}>
                <Clock color="#DFF8EE" size={18} />
                <Text style={styles.dashboardHeroMetaText} numberOfLines={1}>
                  {member.batch.toUpperCase()}
                </Text>
              </View>
            )}
            
            {/* <View style={styles.dashboardHeroMetaItem}>
              <CreditCard color="#DFF8EE" size={18} />
              <Text style={styles.dashboardHeroMetaText} numberOfLines={1}>
                {formatMoney(planAmount)}
              </Text>
            </View> */}
          </View>
        </View>

        <View style={styles.renewalPanel}>
          <View style={styles.renewalHeader}>
            <View style={[styles.renewalIcon, { backgroundColor: `${expiryTone}14` }]}>
              <Clock color={expiryTone} size={22} />
            </View>
            <View style={styles.renewalCopy}>
              <Text style={styles.renewalLabel}>Membership expiry</Text>
              <Text style={styles.renewalTitle} selectable>
                {formatDate(member.expiryDate)}
              </Text>
            </View>
            <View style={[styles.renewalBadge, { backgroundColor: `${expiryTone}14`, borderColor: `${expiryTone}35` }]}>
              <Text style={[styles.renewalBadgeText, { color: expiryTone }]} numberOfLines={1}>
                {daysLabel}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: expiryTone }]} />
          </View>

          <View style={styles.renewalFooter}>
            <Text style={styles.renewalFootnote}>{progressPercent}% of this membership cycle used</Text>
            <Text style={styles.renewalFootnote}>Started {formatDate(member.joinDate)}</Text>
          </View>
        </View>

        <View style={styles.dashboardStatsGrid}>
          {renderStatCard({
            Icon: Clock,
            label: 'Time left',
            value: daysLeft === null ? '-' : daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`,
            detail: daysLeft !== null && daysLeft < 0 ? 'Overdue' : 'Remaining',
            tone: expiryTone,
          })}
          {renderStatCard({
            Icon: WalletCards,
            label: 'Total paid',
            value: formatMoney(totalPaid),
            detail: `${payments.length} payment record(s)`,
            tone: colors.success,
          })}
          {renderStatCard({
            Icon: CreditCard,
            label: 'Plan value',
            value: formatMoney(planAmount),
            detail: plan.durationMonths ? `${plan.durationMonths} month plan` : planName,
            tone: colors.accent,
          })}
          {renderStatCard({
            Icon: CalendarDays,
            label: 'Joined',
            value: formatDate(member.joinDate),
            detail: member.age ? `${member.age} years old` : 'Profile active',
            tone: colors.secondary,
          })}
        </View>

        <View style={styles.dashboardSection}>
          <View style={styles.dashboardSectionHeader}>
            <View>
              <Text style={styles.dashboardSectionEyebrow}>Profile</Text>
              <Text style={styles.dashboardSectionTitle}>Member details</Text>
            </View>
            <UserRound color={colors.textMuted} size={22} />
          </View>

          <InfoRow Icon={Phone} label="Phone Number" value={String(member.phone || '-')} colors={colors} />
          <InfoRow Icon={Mail} label="Email Address" value={member.email || '-'} colors={colors} />
          <InfoRow Icon={CalendarDays} label="Joining Date" value={formatDate(member.joinDate)} colors={colors} />
          <InfoRow Icon={Clock} label="Batch" value={member.batch ? (member.batch.charAt(0).toUpperCase() + member.batch.slice(1)) : '-'} colors={colors} />
          <InfoRow
            Icon={CreditCard}
            label="Plan Duration"
            value={plan.durationMonths ? `${plan.durationMonths} month(s)` : '-'}
            colors={colors}
          />
          <InfoRow Icon={Home} label="Emergency Contact" value={String(member.emergencyContact || '-')} colors={colors} />
        </View>

        <View style={styles.dashboardSection}>
          <View style={styles.dashboardSectionHeader}>
            <View>
              <Text style={styles.dashboardSectionEyebrow}>Billing</Text>
              <Text style={styles.dashboardSectionTitle}>Payments</Text>
            </View>
            <View style={styles.paymentCountPill}>
              <WalletCards color={colors.accent} size={14} />
              <Text style={styles.paymentCountText}>{payments.length}</Text>
            </View>
          </View>

          {payments.length ? (
            <View style={styles.paymentList}>
              {payments.map((payment) => (
                <PaymentRow
                  key={payment._id || payment.id || `${payment.amount}-${payment.paidOn}`}
                  payment={payment}
                  colors={colors}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPayment}>
              <Search color={colors.textMuted} size={28} />
              <Text style={styles.emptyPaymentText}>No payments found.</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
