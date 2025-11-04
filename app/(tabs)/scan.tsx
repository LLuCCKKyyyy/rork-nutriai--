import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Platform, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, X, Plus, Search } from "lucide-react-native";
import { useNutrition } from "@/contexts/NutritionContext";
import { foodDatabase } from "@/data/foods";
import type { FoodItem, MealEntry } from "@/types/nutrition";
import { generateText } from "@rork/toolkit-sdk";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useNutrition();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");

  const filteredFoods = foodDatabase.filter(
    (food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (food.nameTurkish?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleTakePicture = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Camera not available", "Camera is not available on web. Please use the gallery instead.");
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze this food image and identify the dish. Return ONLY the food name in English in this exact format: "Food: [name]". Be concise and use common English food names.`;
      
      const response = await generateText({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: `data:image/jpeg;base64,${base64Image}` },
            ],
          },
        ],
      });

      const foodName = response.replace(/Food:\s*/i, "").trim();
      const matchedFood = foodDatabase.find(
        (f) =>
          f.name.toLowerCase() === foodName.toLowerCase() ||
          f.nameTurkish?.toLowerCase() === foodName.toLowerCase()
      );

      if (matchedFood) {
        setSelectedFood(matchedFood);
      } else {
        setSearchQuery(foodName);
        Alert.alert("Food identified", `Found: ${foodName}. Please select from the list or search manually.`);
      }
    } catch (error) {
      console.error("Image analysis error:", error);
      Alert.alert("Error", "Failed to analyze image. Please try again or search manually.");
    } finally {
      setAnalyzing(false);
      setShowCamera(false);
    }
  };

  const handleAddMeal = () => {
    if (!selectedFood) return;

    const meal: MealEntry = {
      id: Date.now().toString(),
      foodItem: selectedFood,
      quantity: parseFloat(quantity) || 1,
      timestamp: new Date(),
      mealType: selectedMealType,
    };

    addMeal(meal);
    setSelectedFood(null);
    setQuantity("1");
    Alert.alert("Success", "Meal added successfully!", [
      { text: "Add Another", style: "default" },
      { text: "View Dashboard", onPress: () => router.push("/" as any) },
    ]);
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      if (photo.base64) {
        setShowCamera(false);
        await analyzeImage(photo.base64);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  if (showCamera && Platform.OS !== "web") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={[styles.cameraOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <X color="#ffffff" size={28} />
            </TouchableOpacity>

            <View style={styles.cameraActions}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapturePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Food</Text>
        <Text style={styles.headerSubtitle}>Take a photo or search manually</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleTakePicture}>
          <Camera color="#10b981" size={32} />
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
          <ImageIcon color="#10b981" size={32} />
          <Text style={styles.actionButtonText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {analyzing && (
        <View style={styles.analyzingContainer}>
          <Text style={styles.analyzingText}>Analyzing image with AI...</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search color="#9ca3af" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search food..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <ScrollView style={styles.foodList} contentContainerStyle={styles.foodListContent}>
        {filteredFoods.map((food) => (
          <TouchableOpacity
            key={food.id}
            style={styles.foodItem}
            onPress={() => setSelectedFood(food)}
          >
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.nameTurkish && (
                <Text style={styles.foodNameTurkish}>{food.nameTurkish}</Text>
              )}
              <Text style={styles.foodPortion}>{food.portion}</Text>
            </View>
            <View style={styles.foodNutrition}>
              <Text style={styles.foodCalories}>{food.nutrition.calories} cal</Text>
              <Text style={styles.foodMacros}>
                P: {food.nutrition.protein}g  C: {food.nutrition.carbs}g  F: {food.nutrition.fat}g
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedFood(null)}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>

            {selectedFood && (
              <>
                <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                {selectedFood.nameTurkish && (
                  <Text style={styles.modalSubtitle}>{selectedFood.nameTurkish}</Text>
                )}
                <Text style={styles.modalPortion}>{selectedFood.portion}</Text>

                <View style={styles.modalNutrition}>
                  <Text style={styles.modalNutritionTitle}>Nutrition per serving</Text>
                  <View style={styles.modalNutritionGrid}>
                    <View style={styles.modalNutritionItem}>
                      <Text style={styles.modalNutritionValue}>{selectedFood.nutrition.calories}</Text>
                      <Text style={styles.modalNutritionLabel}>Calories</Text>
                    </View>
                    <View style={styles.modalNutritionItem}>
                      <Text style={styles.modalNutritionValue}>{selectedFood.nutrition.protein}g</Text>
                      <Text style={styles.modalNutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.modalNutritionItem}>
                      <Text style={styles.modalNutritionValue}>{selectedFood.nutrition.carbs}g</Text>
                      <Text style={styles.modalNutritionLabel}>Carbs</Text>
                    </View>
                    <View style={styles.modalNutritionItem}>
                      <Text style={styles.modalNutritionValue}>{selectedFood.nutrition.fat}g</Text>
                      <Text style={styles.modalNutritionLabel}>Fat</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    placeholder="1"
                  />
                </View>

                <View style={styles.mealTypeContainer}>
                  <Text style={styles.mealTypeLabel}>Meal Type</Text>
                  <View style={styles.mealTypeButtons}>
                    {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.mealTypeButton,
                          selectedMealType === type && styles.mealTypeButtonActive,
                        ]}
                        onPress={() => setSelectedMealType(type)}
                      >
                        <Text
                          style={[
                            styles.mealTypeButtonText,
                            selectedMealType === type && styles.mealTypeButtonTextActive,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={handleAddMeal}>
                  <Plus color="#ffffff" size={20} />
                  <Text style={styles.addButtonText}>Add to Log</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  analyzingContainer: {
    padding: 20,
    alignItems: "center",
  },
  analyzingText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600" as const,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    padding: 20,
    gap: 12,
  },
  foodItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodInfo: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  foodNameTurkish: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  foodPortion: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  foodNutrition: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  foodCalories: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#10b981",
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 12,
    color: "#6b7280",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  closeButton: {
    alignSelf: "flex-start",
    margin: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  cameraActions: {
    alignItems: "center",
    paddingBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10b981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalClose: {
    alignSelf: "flex-end",
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 8,
  },
  modalPortion: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 20,
  },
  modalNutrition: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalNutritionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
    marginBottom: 12,
  },
  modalNutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalNutritionItem: {
    alignItems: "center",
  },
  modalNutritionValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  modalNutritionLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  mealTypeContainer: {
    marginBottom: 24,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
  },
  mealTypeButtonActive: {
    backgroundColor: "#10b981",
  },
  mealTypeButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  mealTypeButtonTextActive: {
    color: "#ffffff",
  },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
