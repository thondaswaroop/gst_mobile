// src/components/ui/SnackbarProvider.tsx
import React, { createContext, useContext, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../constants/colors"; // adjust relative path if needed

type SnackbarOptions = {
  type?: "success" | "error" | "info";
  duration?: number; // ms, 0 = sticky until dismiss
  action?: { label: string; onPress: () => void };
};

type ShowFn = (message: string, opts?: SnackbarOptions) => void;
const SnackbarContext = createContext<{ show: ShowFn } | null>(null);

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState("");
  const [opts, setOpts] = useState<SnackbarOptions>({});
  const anim = useRef(new Animated.Value(0)).current; // 0 hidden -> 1 visible
  const timeoutRef = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  const keyboardOffsetRef = useRef(0);

  // listen to keyboard to keep snackbar above it
  React.useEffect(() => {
    const onShow = (e: any) => {
      const height = e.endCoordinates?.height ?? 0;
      keyboardOffsetRef.current = height;
    };
    const onHide = () => {
      keyboardOffsetRef.current = 0;
    };
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const slideIn = (duration = 250) =>
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }).start();
  const slideOut = (duration = 200) =>
    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }).start(() => {
      setVisible(false);
      setMsg("");
      setOpts({});
    });

  const show: ShowFn = (message, options = {}) => {
    // clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMsg(message);
    setOpts(options);
    setVisible(true);

    // animate in
    slideIn();

    // auto-dismiss if duration > 0
    if (options.duration !== 0) {
      const dur = typeof options.duration === "number" ? options.duration : 3500;
      timeoutRef.current = (setTimeout(() => {
        slideOut();
        timeoutRef.current = null;
      }, dur) as unknown) as number;
    }
  };

  const handleAction = () => {
    if (opts.action && opts.action.onPress) {
      try {
        opts.action.onPress();
      } catch (e) {
        // ignore
      }
    }
    slideOut();
  };

  // render
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  // colors by type
  const bgColor =
    opts.type === "success" ? colors.brandGreen : opts.type === "error" ? colors.error : "rgba(12,159,211,0.12)";

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            {
              transform: [{ translateY }],
              bottom: (keyboardOffsetRef.current || 0) + Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={[styles.snack, { backgroundColor: bgColor, borderColor: colors.borderDark }]}>
            <Text style={styles.message} numberOfLines={2}>
              {msg}
            </Text>

            {opts.action ? (
              <TouchableOpacity onPress={handleAction} style={styles.action}>
                <Text style={styles.actionText}>{opts.action.label.toUpperCase()}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={() => slideOut()} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    // bottom set dynamically
    zIndex: 1000,
    alignItems: "center",
  },
  snack: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    maxWidth: 900,
  },
  message: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
  },
  action: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionText: {
    color: colors.white,
    fontWeight: "700",
  },
  close: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  closeText: {
    color: colors.white,
    opacity: 0.9,
    fontSize: 14,
  },
});
