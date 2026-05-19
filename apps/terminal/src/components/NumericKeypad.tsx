import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '⌫'],
] as const;

type KeyValue = (typeof KEYS)[number][number];

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
}

export function NumericKeypad({ onKeyPress }: NumericKeypadProps) {
  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => (
            <KeyButton key={key} value={key} onPress={onKeyPress} />
          ))}
        </View>
      ))}
    </View>
  );
}

function KeyButton({
  value,
  onPress,
}: {
  value: KeyValue;
  onPress: (k: string) => void;
}) {
  const isBackspace = value === '⌫';

  return (
    <TouchableOpacity
      style={[styles.key, isBackspace && styles.keyBackspace]}
      onPress={() => onPress(value)}
      activeOpacity={0.6}
    >
      {isBackspace ? (
        <Ionicons name="backspace-outline" size={24} color={COLORS.subtext} />
      ) : (
        <Text style={styles.keyText}>{value}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBackspace: {
    backgroundColor: COLORS.bg,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
});
