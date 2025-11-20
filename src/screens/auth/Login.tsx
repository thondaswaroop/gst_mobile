// src/screens/auth/Login.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  TextInput,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import AuthContainer from "../../components/auth/AuthContainer";
import KeyboardScrollView from "../../components/KeyboardScrollView";
import globalStyles from "../../styles/globalStyles";
import { Images } from "../../utils/resources";
import { Input, CustomText, Button } from "../../utils/libraryAssets";
import { spacing } from "../../styles/default";
import colors from "../../constants/colors";
import { validatePhone } from "../../utils/validate";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { loginSuccess } from "../../redux/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import apiClient, { setAuthToken } from "../../providers/api";
import { useSelector } from "react-redux";
import { useSnackbar } from '../../components/ui/SnackbarProvider';

const { width } = Dimensions.get("window");
const OTP_LEN = 6;

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const auth = useSelector((s: RootState) => s.auth);
  const { show } = useSnackbar();

  // ---------- hooks (top-level) ----------
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);

  const [resendTimer, setResendTimer] = useState(0);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const logoScale = useRef(new Animated.Value(1)).current;

  // refs for OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);
  otpRefs.current = otpRefs.current.slice(0, OTP_LEN);

  // ---------- API helper ----------
  const fetchUserByPhone = async (phoneNo: string) => {
    try {
      const qs = `checkUser&phone=${encodeURIComponent(phoneNo)}`;
      const res = await apiClient.get<any>(qs);
      if (!res || !res.ok) return null;
      // res.data => { status: true, data: { exists: bool, user: {...}|null } }
      if (res.data && typeof res.data === 'object') {
        return res.data.data ?? null;
      }
      return null;
    } catch (err) {
      console.warn("fetchUserByPhone error", err);
      return null;
    }
  };

  // ---------- phone handlers ----------
  const onPhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    setPhone(digits);
    if (phoneError) setPhoneError(null);
  };

  const maskPhone = (p: string) => {
    if (!p) return "";
    const last = p.slice(-4);
    const prefix = p.length > 10 ? `+${p.slice(0, p.length - 10)}` : "+91";
    return `${prefix} •••• ${last}`;
  };

  // ---------- send / resend OTP ----------
  const sendOtp = async () => {
    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      show(err, { type: 'error', duration: 3000 });
      return;
    }

    try {
      const res = await apiClient.post<any>('sendOtp', { phone });
      if (!res || !res.ok) {
        show(res?.error || 'Failed to send OTP', { type: 'error' });
        return;
      }
      setOtpDigits(Array(OTP_LEN).fill(''));
      setOtpError(null);
      setOtpSent(true);
      setResendTimer(60);

      if (res.data?.otp_for_dev) {
        console.log('DEV OTP for', phone, res.data.otp_for_dev);
        show(`OTP (dev): ${res.data.otp_for_dev}`, { type: 'info', duration: 4000 });
      } else {
        show('OTP sent', { type: 'success', duration: 3000 });
      }

      setTimeout(() => otpRefs.current[0]?.focus(), 250);
    } catch (err) {
      console.warn(err);
      show('Unable to send OTP', { type: 'error' });
    }
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await apiClient.post<any>('sendOtp', { phone });
      if (!res || !res.ok) {
        show(res?.error || 'Unable to resend', { type: 'error' });
        return;
      }
      setOtpDigits(Array(OTP_LEN).fill(''));
      setResendTimer(60);
      setOtpError(null);
      if (res.data?.otp_for_dev) show(`OTP (dev): ${res.data.otp_for_dev}`, { type: 'info' });
      else show('OTP resent', { type: 'success' });
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      console.warn(err);
      show('Unable to resend', { type: 'error' });
    }
  };

  // ---------- verify OTP ----------
    const verifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < OTP_LEN || /[^0-9]/.test(code)) {
      setOtpError('Enter a valid 6-digit code');
      return;
    }
    setOtpError(null);
    setLoadingVerify(true);

    try {
      const res = await apiClient.post<any>('verifyOtp', { phone, code });
      if (!res.ok) {
        show(res.error || 'Verification failed', { type: 'error' });
        setLoadingVerify(false);
        return;
      }

      // server: { status:true, data: { verified: true, exists: bool, user: {...}|null } }
      const payload = res.data?.data ?? res.data;
      if (!payload || payload.verified !== true) {
        show(res.data?.error || 'OTP invalid', { type: 'error' });
        setLoadingVerify(false);
        return;
      }

      if (payload.exists && payload.user) {
        // Existing user -> log them in (persist token if provided)
        const userObj: any = {
          id: payload.user.id ?? `user_${phone}`,
          phone: payload.user.phone ?? phone,
          name: payload.user.name ?? '',
          email: payload.user.email ?? undefined,
          profileCompleted: !!payload.user.profile_completed,
          token: payload.user.token ?? undefined,
        };

        if (userObj.token) setAuthToken(userObj.token);
        try { await AsyncStorage.setItem('user', JSON.stringify(userObj)); } catch (e) { console.warn(e); }
        dispatch(loginSuccess(userObj));
        // @ts-ignore
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        setLoadingVerify(false);
        return;
      }

      // New/incomplete user — go to registration. Pass the server user if any for prefill.
      // @ts-ignore
      navigation.navigate('ProfileRegistration', { phone, user: payload.user ?? null });
    } catch (err) {
      console.warn('verifyOtp error', err);
      show('Verification error', { type: 'error' });
    } finally {
      setLoadingVerify(false);
    }
  };


  // ---------- resend timer ----------
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ---------- edit phone ----------
  const onEditPhone = () => {
    setOtpSent(false);
    setOtpDigits(Array(OTP_LEN).fill(""));
    setOtpError(null);
    setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
  };

  // ---------- OTP input handlers ----------
  const focusNext = (index: number) => {
    if (index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
    else otpRefs.current[index]?.blur();
  };

  const onOtpChange = (text: string, index: number) => {
    const ch = text.replace(/\D/g, "").slice(-1) || "";
    const next = [...otpDigits];
    next[index] = ch;
    setOtpDigits(next);
    setOtpError(null);

    if (ch) {
      focusNext(index);
    }
  };

  const onOtpKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = "";
        setOtpDigits(next);
      } else {
        if (index > 0) {
          const next = [...otpDigits];
          next[index - 1] = "";
          setOtpDigits(next);
          otpRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const onOtpCellPress = (index: number) => {
    otpRefs.current[index]?.focus();
  };

  // ---------- Render ----------
  return (
    <AuthContainer style={{ paddingHorizontal: 0 }}>
      <KeyboardScrollView
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: "100%",
          paddingTop: 100,
          justifyContent: "flex-start",
        }}
      >
        <View style={styles.topWrap}>
          <Animated.Image
            source={Images.logo}
            style={[globalStyles.logo, { transform: [{ scale: logoScale as any }] }]}
            resizeMode="contain"
          />
        </View>

        <View style={{ flexGrow: 1 }} />

        <View style={[globalStyles.loginContainer, globalStyles.padding]}>
          <View style={[styles.card]}>
            <CustomText variant="caption" style={styles.cardTitle}>
              Welcome back
            </CustomText>

            <CustomText variant="xSmall" style={styles.cardSub}>
              Sign in with your mobile number to continue booking.
            </CustomText>

            <View style={{ height: 12 }} />

            {!otpSent ? (
              <>
                <Input
                  label="Mobile number"
                  value={phone}
                  onChangeText={onPhoneChange}
                  keyboardType="number-pad"
                  placeholder="9876543210"
                  gradientStyle={{ borderRadius: 12 }}
                  innerStyle={{ height: 56 }}
                  iconName="call"
                />
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                <Button
                  title="Send OTP"
                  onPress={sendOtp}
                  fullWidth
                  size="medium"
                  style={styles.primaryBtn}
                />
              </>
            ) : (
              <View style={{ marginTop: 12 }}>
                <View style={styles.maskRow}>
                  <CustomText variant="small" style={styles.maskText}>
                    OTP sent to {maskPhone(phone)}
                  </CustomText>

                  <TouchableOpacity activeOpacity={0.85} onPress={onEditPhone}>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.otpRow}>
                  {Array.from({ length: OTP_LEN }).map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={1}
                      style={[styles.otpCell, otpError ? styles.otpCellError : null]}
                      onPress={() => onOtpCellPress(i)}
                    >
                      <TextInput
                        ref={(r) => (otpRefs.current[i] = r)}
                        value={otpDigits[i]}
                        onChangeText={(t) => onOtpChange(t, i)}
                        onKeyPress={(e) => onOtpKeyPress(e, i)}
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        returnKeyType="done"
                        maxLength={1}
                        style={styles.otpTextInput}
                        textContentType="oneTimeCode"
                        blurOnSubmit={false}
                        editable={!loadingVerify}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ marginTop: 12 }}>
                  <Button
                    title={loadingVerify ? "Verifying..." : "Verify & Continue"}
                    onPress={verifyOtp}
                    fullWidth
                    size="medium"
                    style={[styles.primaryBtn, { marginTop: 0 }]}
                    disabled={loadingVerify}
                  />
                </View>

                <View style={styles.resendRow}>
                  <TouchableOpacity onPress={resend} disabled={resendTimer > 0}>
                    <Text style={[styles.resendText, resendTimer > 0 ? styles.resendDisabled : null]}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
              </View>
            )}
          </View>
        </View>
      </KeyboardScrollView>
    </AuthContainer>
  );
};

export default Login;

/* ========== Styles using your colors.ts ========== */
const styles = StyleSheet.create({
  topWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: Platform.OS === "ios" ? 18 : 8,
  },

  card: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderDark,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  cardTitle: {
    fontSize: 18,
  },

  cardSub: {
    marginTop: 6,
    marginBottom: 6,
  },

  primaryBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: colors.brandGreen,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  ghostLink: {
    color: colors.textLight,
    textDecorationLine: "underline",
  },

  smallLink: {
    opacity: 0.8,
  },

  maskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  maskText: {
    fontSize: 13,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "600",
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  otpCell: {
    width: (width - 64) / OTP_LEN,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellError: {
    borderColor: colors.error,
  },

  otpTextInput: {
    height: "100%",
    width: "100%",
    textAlign: "center",
    fontSize: 20,
    color: colors.onPrimary,
    fontWeight: "700",
    padding: 0,
  },

  resendRow: {
    marginTop: 10,
    alignItems: "center",
  },
  resendText: {
    color: colors.brandGreen,
    fontWeight: "600",
  },
  resendDisabled: {
    color: colors.textSecondary,
  },

  errorText: {
    color: colors.error,
    marginTop: 8,
    fontSize: 13,
  },
});
