import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing
} from 'react-native-reanimated';

// Palette de couleurs moderne
const MODERN_COLORS = {
  primary: '#1E3A8A',
  accent: '#10B981',
  text: '#111827',
  white: '#FFFFFF',
  textSecondary: '#6B7280'
};

const CustomButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary' // primary, secondary, outline
}) => {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withTiming(0.95, {
      duration: 100,
      easing: Easing.inOut(Easing.ease)
    });
  };

  const onPressOut = () => {
    scale.value = withTiming(1, {
      duration: 100,
      easing: Easing.inOut(Easing.ease)
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButtonText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButtonText);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButtonText);
    }
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? MODERN_COLORS.primary : MODERN_COLORS.white}
            size="small"
          />
        ) : (
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: MODERN_COLORS.accent,
  },
  secondaryButton: {
    backgroundColor: MODERN_COLORS.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: MODERN_COLORS.white,
  },
  secondaryButtonText: {
    color: MODERN_COLORS.white,
  },
  outlineButtonText: {
    color: MODERN_COLORS.primary,
  },
});

export default CustomButton;
