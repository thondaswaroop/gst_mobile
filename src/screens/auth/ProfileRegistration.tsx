// src/screens/auth/ProfileRegistration.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/authSlice";
import { AppDispatch } from "../../redux/store";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Input, Button } from "../../utils/libraryAssets";
import colors from "../../constants/colors";
import { useSnackbar } from "../../components/ui/SnackbarProvider";
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient, { setAuthToken } from "../../providers/api";

type RouteParams = { phone?: string; user?: any };

const ProfileRegistration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;

  const phone = params?.phone ?? "";
  const incomingUser = params?.user ?? null;

  const snackbar = (() => {
    try {
      return useSnackbar();
    } catch {
      return null as any;
    }
  })();

  const show = (msg: string, type: "success" | "error" | "info" = "success") => {
    if (snackbar?.show) snackbar.show(msg, { type: type === "success" ? "success" : type === "error" ? "error" : "info", duration: 3000 });
    else console.warn(msg);
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!incomingUser) return;
    if (incomingUser.name) setFullName(incomingUser.name);
    if (incomingUser.email) setEmail(incomingUser.email);
    if (incomingUser.gender === "male" || incomingUser.gender === "female") setGender(incomingUser.gender);
  }, [incomingUser]);

  const validate = () => {
    const e: any = {};
    if (!fullName.trim()) e.fullName = "Name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

    const onSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: any = {
        phone,
        name: fullName.trim(),
        email: email.trim() || null,
        gender,
        profileCompleted: true,
      };

      const res = await apiClient.post<any>('createOrUpdateUser', payload);
      if (!res.ok) {
        show(res.error || 'Unable to save profile', 'error');
        setSaving(false);
        return;
      }

      // server returns: { status:true, data: { created: bool, user: {...} } }
      const out = res.data?.data ?? res.data;
      const serverUser = out?.user ?? null;
      if (!serverUser) {
        show('Unexpected server response', 'error');
        setSaving(false);
        return;
      }

      // build client-side user object
      const userObj: any = {
        id: serverUser.id ?? `user_${phone}`,
        phone: serverUser.phone ?? phone,
        name: serverUser.name ?? fullName.trim(),
        email: serverUser.email ?? email.trim(),
        gender: serverUser.gender ?? gender,
        profileCompleted: !!serverUser.profile_completed,
        token: serverUser.token ?? undefined,
      };

      if (userObj.token) setAuthToken(userObj.token);

      // persist locally
      await AsyncStorage.setItem('user', JSON.stringify(userObj));
      const usersRaw = await AsyncStorage.getItem('users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      if (phone) users[phone] = { ...(users[phone] || {}), ...userObj };
      else users[userObj.id] = userObj;
      await AsyncStorage.setItem('users', JSON.stringify(users));

      dispatch(loginSuccess(userObj));
      show('Profile completed!', 'success');

      // reset to MainTabs
      // @ts-ignore
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      console.warn('createOrUpdateUser error', err);
      show('Unable to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Input
          label="Phone"
          value={phone}
          editable={false}
          iconName="call"
          inputStyle={{ color: colors.textSecondary }}
        />

        <Input
          label="Full name"
          value={fullName}
          iconName="person"
          onChangeText={(t) => {
            setFullName(t);
            if (errors.fullName) setErrors((s) => ({ ...s, fullName: undefined }));
          }}
          placeholder="Your full name"
        />
        {errors.fullName ? <Text style={styles.error}>{errors.fullName}</Text> : null}

        <Input
          label="Email"
          iconName="mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Text style={styles.genderLabel}>Gender</Text>

        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === "male" && styles.genderActive]}
            onPress={() => setGender("male")}
          >
            <View style={styles.genderInner}>
              <Icon name={gender === "male" ? "man" : "man-outline"} size={18} color={gender === "male" ? colors.white : colors.textSecondary} />
              <Text style={[styles.genderTxt, gender === "male" && styles.genderActiveTxt]}> Male</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderBtn, gender === "female" && styles.genderActive]}
            onPress={() => setGender("female")}
          >
            <View style={styles.genderInner}>
              <Icon name={gender === "female" ? "woman" : "woman-outline"} size={18} color={gender === "female" ? colors.white : colors.textSecondary} />
              <Text style={[styles.genderTxt, gender === "female" && styles.genderActiveTxt]}> Female</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button
          title={saving ? "Saving..." : "Save & Continue"}
          onPress={onSave}
          fullWidth
          size="medium"
          style={styles.saveBtn}
          disabled={saving}
        />

        {!navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.navigate("Login" as any)} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, textAlign: "center" }}>Back to Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ProfileRegistration;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop:20,
    flex: 1,
  },

  genderLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.textSecondary,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLight,
  },
  genderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  genderActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  genderTxt: {
    color: colors.textSecondary,
  },
  genderActiveTxt: {
    color: colors.white,
    fontWeight: "700",
  },

  saveBtn: {
    marginTop: 8,
    backgroundColor: colors.brandGreen,
  },

  error: {
    color: colors.error,
    marginTop: 6,
    fontSize: 12,
  },
});
