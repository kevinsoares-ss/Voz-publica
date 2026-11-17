import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import type { CguAnnualExpense } from "../services/api";

export function CguExpenseCard({
  expense,
  expanded,
  onToggle,
}: {
  expense: CguAnnualExpense;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.agencyName}>
        {expense.orgao ?? "Órgão não informado pela fonte"}
      </Text>
      {expense.orgaoSuperior ? (
        <Text style={styles.meta}>Órgão superior: {expense.orgaoSuperior}</Text>
      ) : null}
      <Text style={styles.meta}>
        Código: {expense.codigoOrgao ?? "Não informado pela fonte"}
      </Text>
      <View style={styles.values}>
        <ValueRow label="Empenhado" value={expense.empenhado} />
        <ValueRow label="Liquidado" value={expense.liquidado} />
        <ValueRow label="Pago" value={expense.pago} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.detailToggle}
      >
        <Text style={styles.detailToggleText}>
          {expanded ? "Ocultar detalhes" : "Ver detalhes do registro"}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.detailList}>
          <Text style={styles.detailTitle}>Dados retornados pela CGU</Text>
          {Object.entries(expense)
            .filter(([key]) =>
              ![
                "ano",
                "orgao",
                "codigoOrgao",
                "orgaoSuperior",
                "codigoOrgaoSuperior",
                "empenhado",
                "liquidado",
                "pago",
              ].includes(key),
            )
            .map(([key, value]) => (
              <ValueRow key={key} label={key} value={formatDetailValue(value)} />
            ))}
          <Text style={styles.meta}>
            Período: {expense.ano ?? "Não informado pela fonte"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ValueRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.amount}>
        {value ? `R$ ${value}` : "Não informado pela fonte"}
      </Text>
    </View>
  );
}

function formatDetailValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value === null || value === undefined) return "Não informado pela fonte";
  const serialized = JSON.stringify(value) ?? String(value);
  return serialized.length > 240 ? `${serialized.slice(0, 237)}...` : serialized;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 8,
  },
  agencyName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  values: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    marginTop: 4,
    paddingTop: 7,
  },
  detailToggle: { minHeight: 44, justifyContent: "center" },
  detailToggleText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  detailList: {
    gap: 7,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  detailTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  amount: { color: colors.ink, fontSize: 12, fontWeight: "700", flexShrink: 1 },
});
