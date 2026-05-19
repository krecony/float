import { setIdVerified } from '@grouppay/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSupabase } from '../../src/providers/SupabaseProvider';
import { colors, spacing, typography } from '../../src/theme';
import { validateVerifyIdForm } from '../../src/utils/verifyIdForm';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1939 }, (_, i) =>
  String(currentYear - i),
);

function SelectField({
  label,
  title,
  options,
  value,
  onSelect,
}: {
  label: string;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={pickerStyles.trigger} onPress={() => setOpen(true)}>
        <Text style={value ? pickerStyles.value : pickerStyles.placeholder} numberOfLines={1}>
          {value || label}
        </Text>
        <Text style={pickerStyles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={pickerStyles.backdrop} onPress={() => setOpen(false)}>
          <SafeAreaView style={pickerStyles.sheet}>
            <Text style={pickerStyles.sheetTitle}>{title}</Text>
            <ScrollView>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  style={[pickerStyles.option, opt === value && pickerStyles.optionSelected]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={[pickerStyles.optionText, opt === value && pickerStyles.optionTextSelected]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

export default function VerifyIdScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, refreshProfile } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [idLast4, setIdLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const buildDob = () => {
    if (!dobDay || !dobMonth || !dobYear) return '';
    const monthIndex = MONTHS.indexOf(dobMonth) + 1;
    return `${dobYear}-${String(monthIndex).padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (!session?.user.id) return;
    const dob = buildDob();
    const validationError = validateVerifyIdForm(legalName, dob, idLast4);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      await setIdVerified(supabase, session.user.id, {
        legal_name: legalName.trim(),
        date_of_birth: dob,
        id_document_last4: idLast4,
      });
      await refreshProfile();
      router.replace('/(onboarding)/payment-method');
    } catch (e) {
      setFormError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Verification failed. Check your details and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const dobComplete = !!dobDay && !!dobMonth && !!dobYear;

  return (
    <Screen title="Verify identity" subtitle="Demo KYC — any values accepted">
      <Input placeholder="Legal name" value={legalName} onChangeText={setLegalName} />

      <Text style={styles.fieldLabel}>Date of birth</Text>
      <View style={styles.dobRow}>
        <View style={styles.dobDay}>
          <SelectField label="DD" title="Day" options={DAYS} value={dobDay} onSelect={setDobDay} />
        </View>
        <View style={styles.dobMonth}>
          <SelectField label="MM" title="Month" options={MONTHS} value={dobMonth} onSelect={setDobMonth} />
        </View>
        <View style={styles.dobYear}>
          <SelectField label="YYYY" title="Year" options={YEARS} value={dobYear} onSelect={setDobYear} />
        </View>
      </View>

      <Input
        placeholder="ID last 4 digits"
        value={idLast4}
        onChangeText={setIdLast4}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={styles.note}>No real ID check. For hackathon demo only.</Text>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button
        label={loading ? 'Verifying…' : 'Verify'}
        onPress={handleVerify}
        disabled={loading || !legalName || !dobComplete || !idLast4}
      />
      <Button
        label="Skip for now"
        variant="ghost"
        onPress={async () => {
          if (!session?.user.id) return;
          setFormError(null);
          try {
            await setIdVerified(supabase, session.user.id, {
              legal_name: 'Demo User',
              date_of_birth: '2000-01-01',
              id_document_last4: '0000',
            });
            await refreshProfile();
            router.replace('/(onboarding)/payment-method');
          } catch (e) {
            setFormError(
              e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : 'Could not skip verification.',
            );
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { color: colors.textMuted, fontSize: 13, marginBottom: -spacing.sm },
  dobRow: { flexDirection: 'row', gap: spacing.sm },
  dobDay: { flex: 1 },
  dobMonth: { flex: 1 },
  dobYear: { flex: 1 },
  note: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 4 },
});

const pickerStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  value: { flex: 1, color: colors.text, ...typography.body },
  placeholder: { flex: 1, color: colors.textMuted, ...typography.body },
  chevron: { color: colors.textMuted, fontSize: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.headline,
    color: colors.text,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionSelected: { backgroundColor: colors.surfaceElevated },
  optionText: { color: colors.text, fontSize: 16 },
  optionTextSelected: { color: colors.accent, fontWeight: '600' },
});
