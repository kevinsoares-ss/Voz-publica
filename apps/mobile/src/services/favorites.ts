import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@voz-publica/favorite-representatives";

export async function getFavoriteIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    !parsed.every((id): id is string => typeof id === "string")
  ) {
    throw new Error("Os favoritos locais estão em um formato inválido.");
  }
  return [...new Set(parsed)];
}

export async function setFavorite(id: string, favorite: boolean): Promise<string[]> {
  const current = await getFavoriteIds();
  const next = favorite
    ? [...new Set([...current, id])]
    : current.filter((savedId) => savedId !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
