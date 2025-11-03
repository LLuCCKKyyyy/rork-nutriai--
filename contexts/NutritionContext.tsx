import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { DailyLog, MealEntry, UserProfile, NutritionInfo } from "@/types/nutrition";

const STORAGE_KEYS = {
  DAILY_LOGS: "nutriai_daily_logs",
  USER_PROFILE: "nutriai_user_profile",
};

const defaultProfile: UserProfile = {
  id: "1",
  name: "User",
  email: "",
  goals: {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
    dailyWater: 2500,
  },
};

export const [NutritionProvider, useNutrition] = createContextHook(() => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);

  const logsQuery = useQuery({
    queryKey: ["dailyLogs"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : defaultProfile;
    },
  });

  const { mutate: saveLogsMutate } = useMutation({
    mutationFn: async (logs: DailyLog[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
      return logs;
    },
  });

  const { mutate: saveProfileMutate } = useMutation({
    mutationFn: async (profile: UserProfile) => {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return profile;
    },
  });

  useEffect(() => {
    if (logsQuery.data) {
      setDailyLogs(logsQuery.data);
    }
  }, [logsQuery.data]);

  useEffect(() => {
    if (profileQuery.data) {
      setUserProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  const getTodayLog = useCallback((): DailyLog => {
    const today = new Date().toISOString().split("T")[0];
    const existingLog = dailyLogs.find((log) => log.date === today);

    if (existingLog) {
      return existingLog;
    }

    return {
      date: today,
      meals: [],
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      },
      waterIntake: 0,
    };
  }, [dailyLogs]);

  const addMeal = useCallback((meal: MealEntry) => {
    const today = new Date().toISOString().split("T")[0];
    const todayLog = getTodayLog();
    const updatedMeals = [...todayLog.meals, meal];

    const totalNutrition = updatedMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.foodItem.nutrition.calories * m.quantity,
        protein: acc.protein + m.foodItem.nutrition.protein * m.quantity,
        carbs: acc.carbs + m.foodItem.nutrition.carbs * m.quantity,
        fat: acc.fat + m.foodItem.nutrition.fat * m.quantity,
        fiber: (acc.fiber || 0) + (m.foodItem.nutrition.fiber || 0) * m.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } as NutritionInfo
    );

    const updatedLog: DailyLog = {
      ...todayLog,
      meals: updatedMeals,
      totalNutrition,
    };

    const updatedLogs = dailyLogs.filter((log) => log.date !== today);
    updatedLogs.push(updatedLog);

    setDailyLogs(updatedLogs);
    saveLogsMutate(updatedLogs);
  }, [dailyLogs, getTodayLog, saveLogsMutate]);

  const addWater = useCallback((amount: number) => {
    const today = new Date().toISOString().split("T")[0];
    const todayLog = getTodayLog();
    const updatedLog: DailyLog = {
      ...todayLog,
      waterIntake: todayLog.waterIntake + amount,
    };

    const updatedLogs = dailyLogs.filter((log) => log.date !== today);
    updatedLogs.push(updatedLog);

    setDailyLogs(updatedLogs);
    saveLogsMutate(updatedLogs);
  }, [dailyLogs, getTodayLog, saveLogsMutate]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    saveProfileMutate(updated);
  }, [userProfile, saveProfileMutate]);

  const todayLog = useMemo(() => getTodayLog(), [getTodayLog]);

  return useMemo(() => ({
    dailyLogs,
    userProfile,
    todayLog,
    addMeal,
    addWater,
    updateProfile,
    isLoading: logsQuery.isLoading || profileQuery.isLoading,
  }), [dailyLogs, userProfile, todayLog, addMeal, addWater, updateProfile, logsQuery.isLoading, profileQuery.isLoading]);
});
