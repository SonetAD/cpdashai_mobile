import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  BackdropBlur,
  Fill,
  Group,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

interface GlassDatePickerProps {
  // Modal control mode (explicit)
  visible?: boolean;
  onClose?: () => void;
  onSelect?: (date: Date) => void;
  selectedDate?: Date | string;
  // Wrapper mode (with children)
  children?: React.ReactNode;
  onDateSelect?: (date: Date) => void;
  initialDate?: Date;
  // Common props
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'days' | 'months' | 'years';

// Icons
const ChevronLeftIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Helper to safely parse date string (MM/DD/YYYY format)
const parseDateString = (dateStr?: string | Date): Date | undefined => {
  try {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? undefined : dateStr;
    }

    // Try parsing MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year) &&
          month >= 0 && month <= 11 && day >= 1 && day <= 31 && year > 1900) {
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? undefined : date;
      }
    }

    // Fallback to Date constructor
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  } catch (error) {
    console.warn('GlassDatePicker: Failed to parse date:', error);
    return undefined;
  }
};

// Safe date creation helper
const createSafeDate = (year: number, month: number, day: number): Date | null => {
  try {
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('GlassDatePicker: Failed to create date:', error);
    return null;
  }
};

// Glass Background with Skia - accepts dimensions as props
const GlassBackground = ({ width, height }: { width: number; height: number }) => {
  // Don't render if dimensions are invalid
  if (width <= 10 || height <= 100) {
    return null;
  }

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Backdrop blur effect */}
      <BackdropBlur blur={15} clip={{ x: 0, y: 0, width, height }}>
        <Fill color="rgba(255, 255, 255, 0)" />
      </BackdropBlur>

      {/* Glass card with gradient */}
      <Group>
        <RoundedRect x={0} y={0} width={width} height={height} r={24}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[
              'rgba(255, 255, 255, 0.95)',
              'rgba(241, 245, 249, 0.9)',
              'rgba(255, 255, 255, 0.85)',
            ]}
          />
        </RoundedRect>
      </Group>

      {/* Liquid glass highlight at top */}
      <RoundedRect x={2} y={2} width={width - 4} height={80} r={22}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, 80)}
          colors={[
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0)',
          ]}
        />
      </RoundedRect>

      {/* Border glow effect */}
      <RoundedRect
        x={0}
        y={0}
        width={width}
        height={height}
        r={24}
        style="stroke"
        strokeWidth={1}
        color="rgba(148, 163, 184, 0.3)"
      />
    </Canvas>
  );
};

export const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
  // Modal control mode props
  visible: externalVisible,
  onClose: externalOnClose,
  onSelect,
  selectedDate,
  // Wrapper mode props
  children,
  onDateSelect,
  initialDate,
  // Common props
  minDate,
  maxDate,
  title = 'Select Date',
}) => {
  // Internal state for wrapper mode
  const [internalVisible, setInternalVisible] = useState(false);

  // Determine if we're in wrapper mode (has children) or modal control mode
  const isWrapperMode = !!children;
  const visible = isWrapperMode ? internalVisible : (externalVisible ?? false);
  const onClose = isWrapperMode ? () => setInternalVisible(false) : (externalOnClose ?? (() => {}));

  // Support both onSelect and onDateSelect callbacks
  const handleDateSelection = useCallback((date: Date) => {
    onSelect?.(date);
    onDateSelect?.(date);
  }, [onSelect, onDateSelect]);

  // Use initialDate as fallback for selectedDate
  const effectiveSelectedDate = selectedDate ?? initialDate;

  // Use useWindowDimensions for responsive sizing with safe fallbacks
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Ensure valid dimensions (fallback to reasonable defaults if 0)
  const safeScreenWidth = screenWidth > 0 ? screenWidth : 375;
  const safeScreenHeight = screenHeight > 0 ? screenHeight : 812;

  // Calculate responsive dimensions using safe values
  const isSmallScreen = safeScreenWidth < 360;
  const horizontalPadding = isSmallScreen ? 16 : 24;
  const calendarWidth = Math.max(Math.min(safeScreenWidth - (horizontalPadding * 2), 400), 280);
  const calendarHeight = Math.max(Math.min(safeScreenHeight * 0.75, 520), 400);
  const daySize = Math.max(Math.floor((calendarWidth - 48) / 7), 30);
  const indicatorSize = Math.max(daySize - 6, 24);

  // Parse the selectedDate prop safely
  const parsedSelectedDate = useMemo(() => parseDateString(effectiveSelectedDate), [selectedDate]);

  const [viewDate, setViewDate] = useState(() => parsedSelectedDate || new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(parsedSelectedDate);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const year = (parsedSelectedDate || new Date()).getFullYear();
    return Math.floor(year / 12) * 12;
  });

  // Animated values for selection indicator
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorY = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;

  // Reset viewDate and tempSelectedDate when modal opens
  useEffect(() => {
    if (visible) {
      try {
        setError(null);
        setViewMode('days'); // Reset to days view
        const parsed = parseDateString(effectiveSelectedDate);
        setViewDate(parsed || new Date());
        setTempSelectedDate(parsed);
        // Reset year range based on current date
        const year = (parsed || new Date()).getFullYear();
        setYearRangeStart(Math.floor(year / 12) * 12);
        // Reset indicator opacity
        indicatorOpacity.setValue(parsed ? 1 : 0);
      } catch (err) {
        console.warn('GlassDatePicker: Error initializing:', err);
        setError('Failed to initialize calendar');
        setViewDate(new Date());
        setTempSelectedDate(undefined);
        setViewMode('days');
      }
    }
  }, [visible, selectedDate]);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Get days in month with error handling
  const getDaysInMonth = useCallback((month: number, year: number) => {
    try {
      return new Date(year, month + 1, 0).getDate();
    } catch {
      return 30; // Fallback
    }
  }, []);

  // Get first day of month (0 = Sunday) with error handling
  const getFirstDayOfMonth = useCallback((month: number, year: number) => {
    try {
      return new Date(year, month, 1).getDay();
    } catch {
      return 0; // Fallback to Sunday
    }
  }, []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    try {
      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
      const days: (number | null)[] = [];

      // Empty slots before first day
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Days of month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }

      return days;
    } catch (err) {
      console.warn('GlassDatePicker: Error generating calendar days:', err);
      return [];
    }
  }, [currentMonth, currentYear, getDaysInMonth, getFirstDayOfMonth]);

  // Get first day offset for position calculations
  const firstDayOffset = getFirstDayOfMonth(currentMonth, currentYear);

  // Calculate grid position for a given day
  const getGridPosition = useCallback((day: number) => {
    const index = firstDayOffset + day - 1;
    const column = index % 7;
    const row = Math.floor(index / 7);
    return { column, row };
  }, [firstDayOffset]);

  // Calculate target position for indicator - centered in cell
  const calculateIndicatorPosition = useCallback((day: number) => {
    const { column, row } = getGridPosition(day);
    // Center the indicator in the cell
    const targetX = column * daySize + 3;
    const targetY = row * daySize + 3;
    return { targetX, targetY };
  }, [getGridPosition, daySize]);

  // Track if this is the initial modal open (to skip animation)
  const isInitialOpen = useRef(true);

  // Reset initial flag when modal opens
  useEffect(() => {
    if (visible) {
      isInitialOpen.current = true;
    }
  }, [visible]);

  // Handle indicator position - both initial and subsequent selections
  useEffect(() => {
    try {
      if (tempSelectedDate &&
          tempSelectedDate.getMonth() === currentMonth &&
          tempSelectedDate.getFullYear() === currentYear) {
        const day = tempSelectedDate.getDate();
        const { targetX, targetY } = calculateIndicatorPosition(day);

        if (isInitialOpen.current) {
          // First selection after modal opens - set position instantly
          indicatorX.setValue(targetX);
          indicatorY.setValue(targetY);
          indicatorOpacity.setValue(1);
          isInitialOpen.current = false;
        } else {
          // Subsequent selections - animate with spring physics
          Animated.parallel([
            Animated.spring(indicatorX, {
              toValue: targetX,
              useNativeDriver: true,
              friction: 8,
              tension: 80,
            }),
            Animated.spring(indicatorY, {
              toValue: targetY,
              useNativeDriver: true,
              friction: 8,
              tension: 80,
            }),
            Animated.timing(indicatorOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else if (!tempSelectedDate ||
                 tempSelectedDate.getMonth() !== currentMonth ||
                 tempSelectedDate.getFullYear() !== currentYear) {
        // Hide indicator if no selection or viewing different month
        Animated.timing(indicatorOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.warn('GlassDatePicker: Error updating indicator:', err);
    }
  }, [tempSelectedDate, currentMonth, currentYear, calculateIndicatorPosition, daySize]);

  // Check if date is disabled with error handling
  const isDateDisabled = useCallback((day: number) => {
    try {
      const date = createSafeDate(currentYear, currentMonth, day);
      if (!date) return true;
      date.setHours(0, 0, 0, 0);

      if (minDate) {
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        if (date < min) return true;
      }

      if (maxDate) {
        const max = new Date(maxDate);
        max.setHours(0, 0, 0, 0);
        if (date > max) return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [currentMonth, currentYear, minDate, maxDate]);

  // Check if date is selected (use temp selection)
  const isDateSelected = useCallback((day: number) => {
    if (!tempSelectedDate) return false;
    try {
      return (
        tempSelectedDate.getDate() === day &&
        tempSelectedDate.getMonth() === currentMonth &&
        tempSelectedDate.getFullYear() === currentYear
      );
    } catch {
      return false;
    }
  }, [tempSelectedDate, currentMonth, currentYear]);

  // Check if date is today
  const isToday = useCallback((day: number) => {
    try {
      const today = new Date();
      return (
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear
      );
    } catch {
      return false;
    }
  }, [currentMonth, currentYear]);

  // Navigation handlers with error handling
  const goToPreviousMonth = useCallback(() => {
    try {
      Haptics.selectionAsync();
      const newDate = createSafeDate(currentYear, currentMonth - 1, 1);
      if (newDate) {
        setViewDate(newDate);
      }
    } catch (err) {
      console.warn('GlassDatePicker: Error navigating to previous month:', err);
    }
  }, [currentYear, currentMonth]);

  const goToNextMonth = useCallback(() => {
    try {
      Haptics.selectionAsync();
      const newDate = createSafeDate(currentYear, currentMonth + 1, 1);
      if (newDate) {
        setViewDate(newDate);
      }
    } catch (err) {
      console.warn('GlassDatePicker: Error navigating to next month:', err);
    }
  }, [currentYear, currentMonth]);

  // Handle header click to toggle view modes
  const handleHeaderClick = useCallback(() => {
    Haptics.selectionAsync();
    if (viewMode === 'days') {
      setViewMode('months');
    } else if (viewMode === 'months') {
      setViewMode('years');
    } else {
      setViewMode('days');
    }
  }, [viewMode]);

  // Handle month selection
  const handleSelectMonth = useCallback((monthIndex: number) => {
    Haptics.selectionAsync();
    const newDate = createSafeDate(currentYear, monthIndex, 1);
    if (newDate) {
      setViewDate(newDate);
      setViewMode('days');
    }
  }, [currentYear]);

  // Handle year selection
  const handleSelectYear = useCallback((year: number) => {
    Haptics.selectionAsync();
    const newDate = createSafeDate(year, currentMonth, 1);
    if (newDate) {
      setViewDate(newDate);
      setViewMode('months');
    }
  }, [currentMonth]);

  // Navigate year range (for years view)
  const goToPreviousYearRange = useCallback(() => {
    Haptics.selectionAsync();
    setYearRangeStart(prev => prev - 12);
  }, []);

  const goToNextYearRange = useCallback(() => {
    Haptics.selectionAsync();
    setYearRangeStart(prev => prev + 12);
  }, []);

  // Navigate months/years based on view mode
  const handlePreviousNavigation = useCallback(() => {
    if (viewMode === 'days') {
      goToPreviousMonth();
    } else if (viewMode === 'months') {
      Haptics.selectionAsync();
      const newDate = createSafeDate(currentYear - 1, currentMonth, 1);
      if (newDate) {
        setViewDate(newDate);
      }
    } else {
      goToPreviousYearRange();
    }
  }, [viewMode, goToPreviousMonth, goToPreviousYearRange, currentYear, currentMonth]);

  const handleNextNavigation = useCallback(() => {
    if (viewMode === 'days') {
      goToNextMonth();
    } else if (viewMode === 'months') {
      Haptics.selectionAsync();
      const newDate = createSafeDate(currentYear + 1, currentMonth, 1);
      if (newDate) {
        setViewDate(newDate);
      }
    } else {
      goToNextYearRange();
    }
  }, [viewMode, goToNextMonth, goToNextYearRange, currentYear, currentMonth]);

  // Get header text based on view mode
  const getHeaderText = useCallback(() => {
    if (viewMode === 'days') {
      return `${MONTHS[currentMonth]} ${currentYear}`;
    } else if (viewMode === 'months') {
      return `${currentYear}`;
    } else {
      return `${yearRangeStart} - ${yearRangeStart + 11}`;
    }
  }, [viewMode, currentMonth, currentYear, yearRangeStart]);

  // Generate years for year picker
  const yearsToShow = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(yearRangeStart + i);
    }
    return years;
  }, [yearRangeStart]);

  // Select date handler (just highlights, doesn't confirm)
  const handleSelectDate = useCallback((day: number) => {
    try {
      if (isDateDisabled(day)) return;
      Haptics.selectionAsync();

      // Scale animation feedback on press
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 0.85,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const selected = createSafeDate(currentYear, currentMonth, day);
      if (selected) {
        setTempSelectedDate(selected);
        setError(null);
      } else {
        setError('Invalid date selected');
      }
    } catch (err) {
      console.warn('GlassDatePicker: Error selecting date:', err);
      setError('Failed to select date');
    }
  }, [currentYear, currentMonth, isDateDisabled]);

  // Confirm selection with error handling
  const handleConfirm = useCallback(() => {
    try {
      if (tempSelectedDate && !isNaN(tempSelectedDate.getTime())) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDateSelection(tempSelectedDate);
      }
      onClose();
    } catch (err) {
      console.warn('GlassDatePicker: Error confirming selection:', err);
      onClose();
    }
  }, [tempSelectedDate, handleDateSelection, onClose]);

  // Go to today with error handling
  const handleGoToToday = useCallback(() => {
    try {
      Haptics.selectionAsync();
      const today = new Date();
      setTempSelectedDate(today);
      setViewDate(today);
      setError(null);
    } catch (err) {
      console.warn('GlassDatePicker: Error going to today:', err);
    }
  }, []);

  // Format selected date for display
  const formatSelectedDate = useCallback(() => {
    try {
      if (!tempSelectedDate || isNaN(tempSelectedDate.getTime())) return 'Select a date';
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      return tempSelectedDate.toLocaleDateString('en-US', options);
    } catch {
      return 'Select a date';
    }
  }, [tempSelectedDate]);

  // Dynamic styles based on screen size
  const dynamicStyles = useMemo(() => ({
    modalContainer: {
      width: calendarWidth,
      height: calendarHeight,
      borderRadius: 24,
      backgroundColor: '#FFFFFF', // Fallback when Canvas is not ready
      shadowColor: 'rgba(37, 99, 235, 1)',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.25,
      shadowRadius: 30,
      elevation: 15,
    },
    dayCell: {
      width: daySize,
      height: daySize,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 1,
    },
    dayButton: {
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    selectionIndicator: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: '#2563EB',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      shadowColor: 'rgba(37, 99, 235, 1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 0,
    },
    dayHeaderCell: {
      width: daySize,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: isSmallScreen ? 10 : 12,
    },
    selectedDateText: {
      fontSize: isSmallScreen ? 20 : 24,
    },
    monthYearText: {
      fontSize: isSmallScreen ? 16 : 18,
    },
    dayText: {
      fontSize: isSmallScreen ? 13 : 15,
    },
    navButton: {
      width: isSmallScreen ? 38 : 44,
      height: isSmallScreen ? 38 : 44,
      borderRadius: isSmallScreen ? 19 : 22,
    },
  }), [calendarWidth, calendarHeight, daySize, indicatorSize, isSmallScreen]);

  // Handler to open modal in wrapper mode
  const handleOpenModal = useCallback(() => {
    Haptics.selectionAsync();
    setInternalVisible(true);
  }, []);

  // Render modal content
  const modalContent = (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={dynamicStyles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Skia Glass Background */}
          <GlassBackground width={calendarWidth} height={calendarHeight} />

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
              <Text style={[styles.selectedDateText, dynamicStyles.selectedDateText]}>
                {formatSelectedDate()}
              </Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                onPress={handlePreviousNavigation}
                style={[styles.navButton, dynamicStyles.navButton]}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon size={isSmallScreen ? 20 : 24} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleHeaderClick}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.monthYearText, dynamicStyles.monthYearText]}>
                  {getHeaderText()}
                </Text>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4 }}>
                  <Path d="M6 9l6 6 6-6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextNavigation}
                style={[styles.navButton, dynamicStyles.navButton]}
                activeOpacity={0.7}
              >
                <ChevronRightIcon size={isSmallScreen ? 20 : 24} />
              </TouchableOpacity>
            </View>

            {/* Days View */}
            {viewMode === 'days' && (
              <>
                {/* Day Headers */}
                <View style={styles.dayHeaders}>
                  {DAYS.map((day) => (
                    <View key={day} style={dynamicStyles.dayHeaderCell}>
                      <Text style={styles.dayHeaderText}>{isSmallScreen ? day[0] : day}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGridWrapper}>
                  <View style={styles.calendarGrid}>
                    {/* Animated Selection Indicator */}
                    <Animated.View
                      style={[
                        dynamicStyles.selectionIndicator,
                        {
                          opacity: indicatorOpacity,
                          transform: [
                            { translateX: indicatorX },
                            { translateY: indicatorY },
                            { scale: indicatorScale },
                          ],
                        },
                      ]}
                    />

                    {/* Day cells */}
                    {calendarDays.map((day, index) => (
                      <View key={index} style={dynamicStyles.dayCell}>
                        {day !== null && (
                          <TouchableOpacity
                            onPress={() => handleSelectDate(day)}
                            disabled={isDateDisabled(day)}
                            style={[
                              dynamicStyles.dayButton,
                              isToday(day) && !isDateSelected(day) && styles.dayButtonToday,
                              isDateDisabled(day) && styles.dayButtonDisabled,
                            ]}
                            activeOpacity={0.7}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          >
                            <Text style={[
                              styles.dayText,
                              dynamicStyles.dayText,
                              isDateSelected(day) && styles.dayTextSelected,
                              isToday(day) && !isDateSelected(day) && styles.dayTextToday,
                              isDateDisabled(day) && styles.dayTextDisabled,
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Months View */}
            {viewMode === 'months' && (
              <View style={styles.monthsGrid}>
                {MONTHS_SHORT.map((month, index) => {
                  const isCurrentMonth = index === currentMonth && currentYear === viewDate.getFullYear();
                  const isSelectedMonth = tempSelectedDate && index === tempSelectedDate.getMonth() && currentYear === tempSelectedDate.getFullYear();
                  return (
                    <TouchableOpacity
                      key={month}
                      onPress={() => handleSelectMonth(index)}
                      style={[
                        styles.monthCell,
                        isSelectedMonth && styles.monthCellSelected,
                        isCurrentMonth && !isSelectedMonth && styles.monthCellCurrent,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.monthCellText,
                        isSelectedMonth && styles.monthCellTextSelected,
                        isCurrentMonth && !isSelectedMonth && styles.monthCellTextCurrent,
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Years View */}
            {viewMode === 'years' && (
              <View style={styles.yearsGrid}>
                {yearsToShow.map((year) => {
                  const isCurrentYear = year === new Date().getFullYear();
                  const isSelectedYear = tempSelectedDate && year === tempSelectedDate.getFullYear();
                  return (
                    <TouchableOpacity
                      key={year}
                      onPress={() => handleSelectYear(year)}
                      style={[
                        styles.yearCell,
                        isSelectedYear && styles.yearCellSelected,
                        isCurrentYear && !isSelectedYear && styles.yearCellCurrent,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.yearCellText,
                        isSelectedYear && styles.yearCellTextSelected,
                        isCurrentYear && !isSelectedYear && styles.yearCellTextCurrent,
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleGoToToday}
                style={styles.todayLink}
                activeOpacity={0.7}
              >
                <Text style={styles.todayLinkText}>Today</Text>
              </TouchableOpacity>

              <View style={styles.footerActions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[styles.okButton, !tempSelectedDate && styles.okButtonDisabled]}
                  activeOpacity={0.7}
                  disabled={!tempSelectedDate}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // In wrapper mode, render children wrapped in Pressable + modal
  if (isWrapperMode) {
    return (
      <>
        <Pressable onPress={handleOpenModal}>
          {children}
        </Pressable>
        {modalContent}
      </>
    );
  }

  // In modal control mode, just render the modal
  return modalContent;
};

// Trigger button component for consistency - now responsive
interface DatePickerTriggerProps {
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const DatePickerTrigger: React.FC<DatePickerTriggerProps> = ({
  value,
  placeholder = 'Select date',
  onPress,
  disabled = false,
  size = 'medium',
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 360;

  // Responsive sizing based on prop and screen
  const sizeStyles = useMemo(() => {
    const baseSize = {
      small: { paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, iconSize: 16 },
      medium: { paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, iconSize: 20 },
      large: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 17, iconSize: 24 },
    };

    // Adjust for small screens
    if (isSmallScreen) {
      return {
        paddingVertical: Math.max(baseSize[size].paddingVertical - 2, 8),
        paddingHorizontal: Math.max(baseSize[size].paddingHorizontal - 4, 10),
        fontSize: Math.max(baseSize[size].fontSize - 1, 12),
        iconSize: Math.max(baseSize[size].iconSize - 2, 14),
      };
    }

    return baseSize[size];
  }, [size, isSmallScreen]);

  const triggerContent = (
    <>
      <Text
        style={[
          styles.triggerText,
          { fontSize: sizeStyles.fontSize },
          !value && styles.triggerPlaceholder,
          disabled && styles.triggerTextDisabled,
        ]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <CalendarIcon size={sizeStyles.iconSize} />
    </>
  );

  const triggerStyle = [
    styles.trigger,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
    },
    disabled && styles.triggerDisabled,
  ];

  // If no onPress provided (wrapper mode), render as View
  if (!onPress) {
    return (
      <View style={triggerStyle}>
        {triggerContent}
      </View>
    );
  }

  // Otherwise render as TouchableOpacity
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={triggerStyle}
      activeOpacity={0.7}
    >
      {triggerContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    borderRadius: 24,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  title: {
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selectedDateText: {
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthYearText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(241, 245, 249, 0.6)',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  calendarGridWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  dayButtonToday: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  dayButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  dayText: {
    fontWeight: '500',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#2563EB',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#94A3B8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    marginTop: 'auto',
  },
  todayLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  todayLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  okButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(37, 99, 235, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  okButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Trigger button styles
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 44, // Accessibility minimum touch target
  },
  triggerDisabled: {
    backgroundColor: '#E5E7EB',
  },
  triggerText: {
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  triggerPlaceholder: {
    color: '#9CA3AF',
  },
  triggerTextDisabled: {
    color: '#6B7280',
  },
  // Months Grid styles
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flex: 1,
    alignContent: 'center',
  },
  monthCell: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  monthCellSelected: {
    backgroundColor: '#2563EB',
  },
  monthCellCurrent: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  monthCellText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  monthCellTextSelected: {
    color: '#FFFFFF',
  },
  monthCellTextCurrent: {
    color: '#2563EB',
  },
  // Years Grid styles
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flex: 1,
    alignContent: 'center',
  },
  yearCell: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  yearCellSelected: {
    backgroundColor: '#2563EB',
  },
  yearCellCurrent: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  yearCellText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  yearCellTextSelected: {
    color: '#FFFFFF',
  },
  yearCellTextCurrent: {
    color: '#2563EB',
  },
});
