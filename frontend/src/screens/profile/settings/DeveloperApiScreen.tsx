import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import { RootState } from "../../../redux/store";
import { keys } from "../../../hooks/queryKeys";
import { createApiKey, listApiKeys, revokeApiKey } from "../../../services/apiKeys";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString();
};

const getWebClipboard = () => {
  return (
    (globalThis as unknown as {
      navigator?: { clipboard?: { writeText?: (value: string) => Promise<void> } };
    }).navigator?.clipboard ?? null
  );
};

export default function DeveloperApiScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const ownerId = useSelector((state: RootState) => state.auth.currentUser?.uid);
  const [label, setLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: keys.apiKeys(ownerId ?? ""),
    queryFn: () => listApiKeys(ownerId ?? ""),
    enabled: !!ownerId,
  });

  const createMutation = useMutation({
    mutationFn: () => createApiKey(label.trim() || undefined),
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setCopied(false);
      setLabel("");
      queryClient.invalidateQueries({ queryKey: keys.apiKeys(ownerId ?? "") });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create API key";
      Alert.alert("Create API key", message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) => revokeApiKey(apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.apiKeys(ownerId ?? "") });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to revoke API key";
      Alert.alert("Revoke API key", message);
    },
  });

  const handleCopy = async () => {
    if (!createdKey) {
      return;
    }
    const clipboard = getWebClipboard();
    if (clipboard?.writeText) {
      await clipboard.writeText(createdKey);
      setCopied(true);
      return;
    }
    Alert.alert("Copy key", "Press and hold the key to copy.");
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: "#ffffff",
        },
        content: {
          paddingBottom: theme.spacing.xl,
        },
        sectionTitle: {
          marginTop: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          color: "#6B6B6B",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        sectionCard: {
          marginHorizontal: theme.spacing.lg,
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "#E5E5E5",
          backgroundColor: "#ffffff",
        },
        input: {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "#E5E5E5",
          borderRadius: 12,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          color: "#111111",
          marginHorizontal: theme.spacing.lg,
          backgroundColor: "#ffffff",
        },
        helper: {
          paddingHorizontal: theme.spacing.lg,
          color: "#6B6B6B",
          fontSize: 13,
        },
        createButton: {
          marginTop: theme.spacing.md,
          marginHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderRadius: 12,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
        },
        createButtonText: {
          color: "#ffffff",
          fontWeight: "700",
        },
        keyCard: {
          marginHorizontal: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "#E5E5E5",
          backgroundColor: "#F8F8F8",
          gap: theme.spacing.sm,
        },
        keyRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        keyValue: {
          flex: 1,
          color: "#111111",
          fontSize: 14,
        },
        copyButton: {
          padding: theme.spacing.sm,
          borderRadius: 8,
          backgroundColor: "#ffffff",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "#E5E5E5",
        },
        copyLabel: {
          color: "#6B6B6B",
          fontSize: 12,
        },
        keyItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "#E5E5E5",
          gap: theme.spacing.sm,
        },
        keyItemLast: {
          borderBottomWidth: 0,
        },
        keyLabel: {
          color: "#111111",
          fontSize: 16,
          fontWeight: "600",
        },
        keyMeta: {
          color: "#6B6B6B",
          fontSize: 12,
          marginTop: 2,
        },
        revoke: {
          color: theme.colors.danger,
          fontSize: 13,
          fontWeight: "600",
        },
        revoked: {
          color: "#6B6B6B",
          fontSize: 12,
        },
      }),
    [theme],
  );

  return (
    <Screen scroll padding={false} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Create API key</Text>
      <Text style={[styles.helper, { marginBottom: theme.spacing.sm }]}>
        Label your key so you can recognize it later.
      </Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Key label"
        placeholderTextColor="#9AA3B2"
        style={styles.input}
      />
      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          { opacity: pressed || createMutation.isPending ? 0.7 : 1 },
        ]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !ownerId}
      >
        <Text style={styles.createButtonText}>
          {createMutation.isPending ? "Creating..." : "Create key"}
        </Text>
      </Pressable>

      {createdKey ? (
        <>
          <Text style={styles.sectionTitle}>New key</Text>
          <View style={styles.keyCard}>
            <View style={styles.keyRow}>
              <Text style={styles.keyValue} selectable>
                {createdKey}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.copyButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleCopy}
              >
                <Feather name="copy" size={16} color="#111111" />
              </Pressable>
            </View>
            <Text style={styles.copyLabel}>
              {copied ? "Copied." : "Save this key now. You will not see it again."}
            </Text>
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Your keys</Text>
      <View style={styles.sectionCard}>
        {isLoading ? (
          <View style={styles.keyItem}>
            <Text style={styles.keyMeta}>Loading keys...</Text>
          </View>
        ) : apiKeys.length === 0 ? (
          <View style={styles.keyItem}>
            <Text style={styles.keyMeta}>No API keys yet.</Text>
          </View>
        ) : (
          apiKeys.map((key, index) => (
            <View
              key={key.id}
              style={[styles.keyItem, index === apiKeys.length - 1 && styles.keyItemLast]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.keyLabel}>{key.label || "API key"}</Text>
                <Text style={styles.keyMeta}>
                  Created {formatDate(key.created_at)}
                  {key.last_used_at ? ` · Last used ${formatDate(key.last_used_at)}` : ""}
                </Text>
              </View>
              {key.revoked_at ? (
                <Text style={styles.revoked}>Revoked</Text>
              ) : (
                <Pressable
                  onPress={() => revokeMutation.mutate(key.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Text style={styles.revoke}>Revoke</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
