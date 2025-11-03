import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Apple, Droplet, Flame, TrendingUp } from "lucide-react-native";
import { useNutrition } from "@/contexts/NutritionContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayLog, userProfile, addWater } = useNutrition();

  const caloriesPercent = Math.min(
    (todayLog.totalNutrition.calories / userProfile.goals.dailyCalories) * 100,
    100
  );
  const proteinPercent = Math.min(
    (todayLog.totalNutrition.protein / userProfile.goals.dailyProtein) * 100,
    100
  );
  const carbsPercent = Math.min(
    (todayLog.totalNutrition.carbs / userProfile.goals.dailyCarbs) * 100,
    100
  );
  const fatPercent = Math.min(
    (todayLog.totalNutrition.fat / userProfile.goals.dailyFat) * 100,
    100
  );
  const waterPercent = Math.min(
    (todayLog.waterIntake / userProfile.goals.dailyWater) * 100,
    100
  );

  const handleAddWater = () => {
    addWater(250);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#10b981", "#059669"]}
        style={styles.header}
      >
        <Text style={styles.headerDate}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
        <Text style={styles.headerTitle}>Daily Summary</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.caloriesCard}>
          <View style={styles.caloriesHeader}>
            <Flame color="#ef4444" size={32} />
            <Text style={styles.caloriesLabel}>Calories</Text>
          </View>
          <View style={styles.caloriesContent}>
            <Text style={styles.caloriesValue}>{Math.round(todayLog.totalNutrition.calories)}</Text>
            <Text style={styles.caloriesGoal}>/ {userProfile.goals.dailyCalories}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${caloriesPercent}%` }]} />
          </View>
        </View>

        <View style={styles.macrosGrid}>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{Math.round(todayLog.totalNutrition.protein)}g</Text>
            <View style={styles.macroProgressContainer}>
              <View style={[styles.macroProgress, { width: `${proteinPercent}%`, backgroundColor: "#3b82f6" }]} />
            </View>
            <Text style={styles.macroGoal}>{userProfile.goals.dailyProtein}g goal</Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{Math.round(todayLog.totalNutrition.carbs)}g</Text>
            <View style={styles.macroProgressContainer}>
              <View style={[styles.macroProgress, { width: `${carbsPercent}%`, backgroundColor: "#f59e0b" }]} />
            </View>
            <Text style={styles.macroGoal}>{userProfile.goals.dailyCarbs}g goal</Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{Math.round(todayLog.totalNutrition.fat)}g</Text>
            <View style={styles.macroProgressContainer}>
              <View style={[styles.macroProgress, { width: `${fatPercent}%`, backgroundColor: "#8b5cf6" }]} />
            </View>
            <Text style={styles.macroGoal}>{userProfile.goals.dailyFat}g goal</Text>
          </View>
        </View>

        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Droplet color="#3b82f6" size={24} />
            <Text style={styles.waterLabel}>Water Intake</Text>
          </View>
          <View style={styles.waterContent}>
            <Text style={styles.waterValue}>{todayLog.waterIntake}ml</Text>
            <Text style={styles.waterGoal}>/ {userProfile.goals.dailyWater}ml</Text>
          </View>
          <View style={styles.waterProgressContainer}>
            <View style={[styles.waterProgress, { width: `${waterPercent}%` }]} />
          </View>
          <TouchableOpacity style={styles.addWaterButton} onPress={handleAddWater}>
            <Text style={styles.addWaterText}>+ Add 250ml</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/scan" as any)}>
            <Apple color="#10b981" size={28} />
            <Text style={styles.actionText}>Log Food</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/progress" as any)}>
            <TrendingUp color="#10b981" size={28} />
            <Text style={styles.actionText}>View Progress</Text>
          </TouchableOpacity>
        </View>

        {todayLog.meals.length > 0 && (
          <View style={styles.mealsCard}>
            <Text style={styles.mealsTitle}>Today&apos;s Meals</Text>
            {todayLog.meals.map((meal, index) => (
              <View key={meal.id || index} style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.foodItem.name}</Text>
                  <Text style={styles.mealType}>{meal.mealType}</Text>
                </View>
                <Text style={styles.mealCalories}>
                  {Math.round(meal.foodItem.nutrition.calories * meal.quantity)} cal
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerDate: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    fontWeight: "500" as const,
  },
  headerTitle: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "700" as const,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  caloriesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  caloriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  caloriesLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  caloriesContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  caloriesGoal: {
    fontSize: 24,
    color: "#9ca3af",
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 6,
  },
  macrosGrid: {
    flexDirection: "row",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  macroLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 12,
  },
  macroProgressContainer: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  macroProgress: {
    height: "100%",
    borderRadius: 2,
  },
  macroGoal: {
    fontSize: 10,
    color: "#9ca3af",
  },
  waterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  waterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  waterLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  waterContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  waterValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  waterGoal: {
    fontSize: 18,
    color: "#9ca3af",
    marginLeft: 6,
  },
  waterProgressContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  waterProgress: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  addWaterButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  addWaterText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  mealsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  mealType: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize" as const,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#10b981",
  },
});
