import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { colors } from "../../theme/colors";

export default function MoreScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.kicker}>VOZ PÚBLICA</Text>
      <Text style={styles.title}>Mais</Text>
      <Text style={styles.subtitle}>
        Acesse informações, fontes e preferências do aplicativo.
      </Text>

      <MenuGroup title="Explorar">
        <MenuItem
          title="Busca global"
          description="Pesquise agentes, proposições e órgãos."
          onPress={() => router.push("/search" as Href)}
        />
        <MenuItem
          title="Órgãos públicos"
          description="Consulte o catálogo SIAFI da CGU."
          onPress={() => router.push("/agencies" as Href)}
        />
        <MenuItem
          title="Compromissos documentados"
          description="Registros, critérios e evidências."
          onPress={() => router.push("/(tabs)/commitments" as Href)}
        />
        <MenuItem
          title="Favoritos"
          description="Representantes salvos neste aparelho."
          onPress={() => router.push("/(tabs)/favorites" as Href)}
        />
      </MenuGroup>

      <MenuGroup title="Transparência">
        <MenuItem
          title="Fontes e metodologia"
          description="Cobertura, consulta e limitações."
          onPress={() => router.push("/sources" as Href)}
        />
      </MenuGroup>

      <MenuGroup title="Aplicativo">
        <MenuItem
          title="Acessibilidade e preferências"
          description="Suporte a texto do sistema e uso sem conta."
          onPress={() => router.push("/settings" as Href)}
        />
        <MenuItem
          title="Sobre o Voz Pública"
          description="Missão, escopo e versão."
          onPress={() => router.push("/about" as Href)}
        />
        <MenuItem
          title="Ajuda e reporte"
          description="Interprete dados e reporte um problema."
          onPress={() => router.push("/help" as Href)}
        />
      </MenuGroup>

      <View style={styles.footer}>
        <Text style={styles.footerName}>Voz Pública</Text>
        <Text style={styles.footerBody}>
          Consultas públicas, com fontes identificadas e sem cadastro.
        </Text>
      </View>
    </Screen>
  );
}

function MenuGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

function MenuItem({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={styles.itemCopy}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
      <Text style={styles.arrow} accessible={false}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8 },
  group: { gap: 8 },
  groupTitle: { color: colors.muted, fontSize: 12, fontWeight: "800", marginLeft: 3 },
  menuCard: {
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
  },
  item: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: { backgroundColor: colors.primaryLight },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  arrow: { color: colors.primary, fontSize: 24 },
  footer: { alignItems: "center", gap: 5, paddingVertical: 8 },
  footerName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  footerBody: { color: colors.muted, fontSize: 11, textAlign: "center" },
});
