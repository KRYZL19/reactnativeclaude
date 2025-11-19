import { Text, View, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Games</Text>

      <Link href="/number-runner" asChild>
        <Pressable style={styles.gameButton}>
          <Text style={styles.gameButtonText}>🎮 Number Runner 3D</Text>
          <Text style={styles.gameDescription}>
            Swipe through gates and multiply your score!
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },
  gameButton: {
    backgroundColor: "#4488ff",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#4488ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gameButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  gameDescription: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
