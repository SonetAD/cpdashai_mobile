import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useGetFeatureGatesQuery, useGetMyCRSQuery, LockedFeature, FeatureInfo } from '../services/api';

// Feature unlock levels based on CRS (from CRS_GAMIFICATION_SYSTEM.md)
// Levels: Foundation (0-40), Skill Building/Interview Ready (41-60), Achievement/Hire Ready (61-80), Thriving (81-100)
const FEATURE_LEVEL_MAP: Record<string, { minScore: number; levelName: string }> = {
  // Foundation (0+)
  basic_job_search: { minScore: 0, levelName: 'Foundation' },
  profile_tips: { minScore: 0, levelName: 'Foundation' },
  cv_review_basic: { minScore: 0, levelName: 'Foundation' },

  // Skill Building / Interview Ready (41+)
  skill_recommendations: { minScore: 41, levelName: 'Interview Ready' },
  job_match_basic: { minScore: 41, levelName: 'Interview Ready' },
  interview_coach_intro: { minScore: 41, levelName: 'Interview Ready' },
  missions_personalized: { minScore: 41, levelName: 'Interview Ready' },
  application_tracker: { minScore: 41, levelName: 'Interview Ready' },

  // Achievement / Hire Ready (61+)
  advanced_job_matching: { minScore: 61, levelName: 'Hire Ready' },
  interview_coach_full: { minScore: 61, levelName: 'Hire Ready' },
  ai_interview_feedback: { minScore: 61, levelName: 'Hire Ready' },
  cv_optimization: { minScore: 61, levelName: 'Hire Ready' },

  // Thriving (81+)
  mentor_access: { minScore: 81, levelName: 'Thriving' },
  premium_insights: { minScore: 81, levelName: 'Thriving' },
  career_coaching: { minScore: 81, levelName: 'Thriving' },
  exclusive_opportunities: { minScore: 81, levelName: 'Thriving' },
  community_leadership: { minScore: 81, levelName: 'Thriving' },
};

// Get level name from CRS score
const getLevelFromScore = (score: number): string => {
  if (score >= 81) return 'THRIVING';
  if (score >= 61) return 'ACHIEVEMENT';
  if (score >= 41) return 'SKILL_BUILDING';
  return 'FOUNDATION';
};

// Get display name for level
const getLevelDisplayName = (level: string): string => {
  const displayNames: Record<string, string> = {
    'THRIVING': 'Thriving',
    'ACHIEVEMENT': 'Achievement',
    'SKILL_BUILDING': 'Skill Building',
    'FOUNDATION': 'Foundation',
  };
  return displayNames[level] || level;
};

interface FeatureGateContextValue {
  // Feature data
  availableFeatures: FeatureInfo[];
  lockedFeatures: LockedFeature[];
  currentLevel: string;
  currentLevelDisplay: string;

  // CRS data for progress
  crsScore: number;
  pointsToNextLevel: number;
  nextLevel: string | null;

  // Loading/error states
  isLoading: boolean;
  error: any;

  // Helper functions
  hasFeatureAccess: (featureId: string) => boolean;
  getFeatureRequirement: (featureId: string) => LockedFeature | null;
  getFeatureInfo: (featureId: string) => FeatureInfo | null;
  refetch: () => void;
}

const FeatureGateContext = createContext<FeatureGateContextValue | undefined>(undefined);

export const FeatureGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Fetch feature gates from API
  const {
    data: featureGatesData,
    isLoading: isLoadingGates,
    error: gatesError,
    refetch: refetchGates
  } = useGetFeatureGatesQuery(undefined, {
    pollingInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    refetchOnMountOrArgChange: true, // Always refetch on mount
  });

  // Fetch CRS data for progress info
  const {
    data: crsData,
    isLoading: isLoadingCRS,
    refetch: refetchCRS
  } = useGetMyCRSQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const featureGates = featureGatesData?.featureGates;
  const crs = crsData?.myCrs;

  // Memoized feature lists
  const availableFeatures = useMemo(
    () => featureGates?.availableFeatures || [],
    [featureGates?.availableFeatures]
  );

  const lockedFeatures = useMemo(
    () => featureGates?.lockedFeatures || [],
    [featureGates?.lockedFeatures]
  );

  // Get CRS score, prioritizing from featureGates response, then myCrs response
  const crsScore = crs?.totalScore || 0;
  const crsLevel = crs?.level || getLevelFromScore(crsScore);

  // Check if user has access to a specific feature
  const hasFeatureAccess = useCallback((featureId: string): boolean => {
    // If both still loading, default to false (fail closed)
    if (isLoadingGates && isLoadingCRS) return false;

    // First try: Use feature gates API if available
    if (availableFeatures.length > 0) {
      return availableFeatures.some(f => f.featureId === featureId);
    }

    // Fallback: Use CRS score to determine access based on FEATURE_LEVEL_MAP
    // This handles cases where featureGates API isn't available but CRS data is
    if (crsScore > 0 || crsLevel) {
      const featureConfig = FEATURE_LEVEL_MAP[featureId];
      if (featureConfig) {
        const hasAccess = crsScore >= featureConfig.minScore;
        console.log(`[FeatureAccess Fallback] Feature: ${featureId}, CRS: ${crsScore}, Required: ${featureConfig.minScore}, Access: ${hasAccess}`);
        return hasAccess;
      }
      // Unknown feature - default to locked
      console.log(`[FeatureAccess Fallback] Unknown feature: ${featureId}, defaulting to locked`);
      return false;
    }

    // If error and no CRS, fail open for basic features only
    if (gatesError) {
      const basicFeatures = ['basic_job_search', 'profile_tips'];
      return basicFeatures.includes(featureId);
    }

    return false;
  }, [availableFeatures, isLoadingGates, isLoadingCRS, gatesError, crsScore, crsLevel]);

  // Get requirement info for a locked feature
  const getFeatureRequirement = useCallback((featureId: string): LockedFeature | null => {
    // First try from API response
    const fromApi = lockedFeatures.find(f => f.featureId === featureId);
    if (fromApi) return fromApi;

    // Fallback: Generate from FEATURE_LEVEL_MAP if feature is locked based on CRS
    const featureConfig = FEATURE_LEVEL_MAP[featureId];
    if (featureConfig && crsScore < featureConfig.minScore) {
      return {
        featureId,
        featureName: featureId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        requiredLevel: featureConfig.levelName.toUpperCase().replace(' ', '_'),
        requiredLevelDisplay: featureConfig.levelName,
      } as LockedFeature;
    }

    return null;
  }, [lockedFeatures, crsScore]);

  // Get info for an available feature
  const getFeatureInfo = useCallback((featureId: string): FeatureInfo | null => {
    return availableFeatures.find(f => f.featureId === featureId) || null;
  }, [availableFeatures]);

  // Combined refetch
  const refetch = useCallback(() => {
    refetchGates();
    refetchCRS();
  }, [refetchGates, refetchCRS]);

  // Determine loading state - only truly "loading" if both gates and CRS are still loading
  // If CRS is loaded, we can use the fallback feature access logic
  const effectiveLoading = isLoadingGates && isLoadingCRS;

  // Use CRS level as fallback for current level display
  const effectiveLevel = featureGates?.currentLevel || crsLevel || '';
  const effectiveLevelDisplay = featureGates?.currentLevelDisplay || getLevelDisplayName(crsLevel) || 'Bronze';

  const value = useMemo<FeatureGateContextValue>(() => ({
    // Feature data
    availableFeatures,
    lockedFeatures,
    currentLevel: effectiveLevel,
    currentLevelDisplay: effectiveLevelDisplay,

    // CRS data
    crsScore,
    pointsToNextLevel: crs?.pointsToNextLevel || 0,
    nextLevel: crs?.nextLevel || null,

    // Loading/error - only loading if both are loading (we can use CRS fallback)
    isLoading: effectiveLoading,
    error: gatesError,

    // Helpers
    hasFeatureAccess,
    getFeatureRequirement,
    getFeatureInfo,
    refetch,
  }), [
    availableFeatures,
    lockedFeatures,
    effectiveLevel,
    effectiveLevelDisplay,
    crsScore,
    crs?.pointsToNextLevel,
    crs?.nextLevel,
    effectiveLoading,
    gatesError,
    hasFeatureAccess,
    getFeatureRequirement,
    getFeatureInfo,
    refetch,
  ]);

  return (
    <FeatureGateContext.Provider value={value}>
      {children}
    </FeatureGateContext.Provider>
  );
};

// Main hook to access all feature gate data
export const useFeatureGates = (): FeatureGateContextValue => {
  const context = useContext(FeatureGateContext);
  if (!context) {
    throw new Error('useFeatureGates must be used within a FeatureGateProvider');
  }
  return context;
};

// Convenience hook for checking a single feature
export const useFeatureAccess = (featureId: string) => {
  const { hasFeatureAccess, getFeatureRequirement, isLoading, crsScore, currentLevelDisplay, availableFeatures, lockedFeatures } = useFeatureGates();

  const hasAccess = hasFeatureAccess(featureId);
  const requirement = getFeatureRequirement(featureId);

  // Debug logging for feature access issues
  console.log(`[FeatureAccess] Feature: ${featureId}, HasAccess: ${hasAccess}, CRS: ${crsScore}, Level: ${currentLevelDisplay}, Loading: ${isLoading}`);
  console.log(`[FeatureAccess] Available features:`, availableFeatures.map(f => f.featureId));
  console.log(`[FeatureAccess] Locked features:`, lockedFeatures.map(f => f.featureId));

  return {
    hasAccess,
    isLoading,
    requiredLevel: requirement?.requiredLevel || null,
    requiredLevelDisplay: requirement?.requiredLevelDisplay || null,
    currentLevel: currentLevelDisplay,
    crsScore,
  };
};

// Hook for protecting an action with feature check
export const useProtectedAction = (featureId: string, action: () => void) => {
  const { hasAccess, isLoading } = useFeatureAccess(featureId);

  const execute = useCallback(() => {
    if (hasAccess && !isLoading) {
      action();
    }
    // If no access, the FeatureGate component should handle showing the locked UI
  }, [hasAccess, isLoading, action]);

  return {
    execute,
    hasAccess,
    isLoading,
  };
};
