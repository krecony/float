import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumericKeypad } from '../src/components/NumericKeypad';
import { COLORS, GRADIENTS } from '../src/theme';

const GROUP_ID_KEY = '@terminal:groupId';
const MAX_DIGITS = 7; // max 99999.99

function formatAmount(digits: string): string {
  const cents = parseInt(digits || '0', 10);
  return (cents / 100).toFixed(2);
}

export default function HomeScreen() {
  const [digits, setDigits] = useState('0');
  const [groupId, setGroupId] = useState<string>('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(GROUP_ID_KEY).then((stored) => {
      if (stored) {
        setGroupId(stored);
      } else {
        // First launch — open settings automatically
        setSettingsVisible(true);
      }
    });
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setDigits((prev) => {
      if (key === '⌫') {
        return prev.length > 1 ? prev.slice(0, -1) : '0';
      }
      if (prev === '0') {
        if (key === '00') return '0';
        return key;
      }
      if (prev.length >= MAX_DIGITS) return prev;
      return prev + key;
    });
  }, []);

  const handleStartPayment = useCallback(() => {
    const amountCents = parseInt(digits, 10);
    if (amountCents < 1) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than €0.00');
      return;
    }
    if (!groupId) {
      setSettingsVisible(true);
      return;
    }
    router.push({
      pathname: '/waiting',
      params: { amountCents: String(amountCents), groupId },
    });
  }, [digits, groupId]);

  const handleSaveSettings = useCallback(async () => {
    const trimmed = groupIdInput.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a Group ID');
      return;
    }
    await AsyncStorage.setItem(GROUP_ID_KEY, trimmed);
    setGroupId(trimmed);
    setSettingsVisible(false);
  }, [groupIdInput]);

  const amountCents = parseInt(digits, 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>GROUPPAY</Text>
            <Text style={styles.headerTitle}>Merchant Terminal</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              setGroupIdInput(groupId);
              setSettingsVisible(true);
            }}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.subtext} />
          </TouchableOpacity>
        </View>

        {/* Group indicator */}
        {groupId ? (
          <View style={styles.groupBadge}>
            <Ionicons name="people-outline" size={12} color={COLORS.primaryLight} />
            <Text style={styles.groupBadgeText} numberOfLines={1}>
              {groupId}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.groupBadge, styles.groupBadgeWarning]}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="warning-outline" size={12} color={COLORS.error} />
            <Text style={[styles.groupBadgeText, { color: COLORS.error }]}>
              No group configured — tap to set
            </Text>
          </TouchableOpacity>
        )}

        {/* Amount display */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySymbol}>€</Text>
          <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(digits)}
          </Text>
        </View>

        {/* Keypad */}
        <View style={styles.keypadWrapper}>
          <NumericKeypad onKeyPress={handleKeyPress} />
        </View>

        {/* Start Payment button */}
        <TouchableOpacity
          onPress={handleStartPayment}
          activeOpacity={0.85}
          disabled={amountCents < 1}
          style={[styles.payBtn, amountCents < 1 && styles.payBtnDisabled]}
        >
          <LinearGradient
            colors={amountCents >= 1 ? GRADIENTS.primary : [COLORS.muted, COLORS.muted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payBtnGradient}
          >
            <Ionicons name="wifi-outline" size={22} color={COLORS.text} />
            <Text style={styles.payBtnText}>Start Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Settings modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Terminal Settings</Text>
            <Text style={styles.modalLabel}>Group ID</Text>
            <TextInput
              style={styles.modalInput}
              value={groupIdInput}
              onChangeText={setGroupIdInput}
              placeholder="Paste your group UUID here"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHint}>
              Find your Group ID in the GroupPay consumer app under Group Settings.
            </Text>
            <TouchableOpacity onPress={handleSaveSettings} activeOpacity={0.85}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveBtnText}>Save & Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            {groupId ? (
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: COLORS.primaryLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  groupBadgeWarning: {
    backgroundColor: COLORS.error + '12',
    borderColor: COLORS.error + '30',
  },
  groupBadgeText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '500',
    maxWidth: 220,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.subtext,
    lineHeight: 54,
  },
  amountText: {
    fontSize: 64,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -2,
    minWidth: 60,
    textAlign: 'center',
  },
  keypadWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  payBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  payBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  modalSheet: {
    backgroundColor: COLORS.cardElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: -6,
  },
  modalInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalHint: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginTop: -4,
  },
  modalSaveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 15,
    color: COLORS.subtext,
  },
});

