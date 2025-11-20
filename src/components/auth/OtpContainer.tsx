import React, { useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
    Text,
} from 'react-native';
import { CustomText, Button } from '../../utils/libraryAssets'; // adjust if your index path differs
import colors from '../../constants/colors';
import { fontSizes, spacing } from '../../styles/default';
import globalStyles from '../../styles/globalStyles';

type Props = {
    phone: string;
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    otpError?: string | null;
    onVerify: () => void;
    resendTimer: number;
    onResend: () => void;
};

const OtpContainer: React.FC<Props> = ({ phone, otp, setOtp, otpError, onVerify, resendTimer, onResend }) => {
    const otpRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const id = setTimeout(() => otpRefs.current[0]?.focus(), 150);
        return () => clearTimeout(id);
    }, []);

    const onOtpChange = (v: string, i: number) => {
        const digit = v.replace(/\D/g, '').slice(0, 1);
        setOtp((prev) => {
            const next = [...prev];
            next[i] = digit;
            return next;
        });
        if (digit && i < otpRefs.current.length - 1) otpRefs.current[i + 1]?.focus();
    };

    const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (otp[i]) {
                setOtp((prev) => {
                    const next = [...prev];
                    next[i] = '';
                    return next;
                });
            } else if (i > 0) {
                otpRefs.current[i - 1]?.focus();
                setOtp((prev) => {
                    const next = [...prev];
                    next[i - 1] = '';
                    return next;
                });
            }
        }
    };

    return (
        <View>

            <View style={globalStyles.loginTextBlock}>
                <CustomText variant="title" style={globalStyles.loginHeading}>
                    {`Enter the 6-digit code sent to \n+91 ${phone}`}
                </CustomText>
            </View>
            <View style={styles.otpRow}>
                {otp.map((d, i) => {
                    const isLast = i === otp.length - 1;
                    return (
                        <TextInput
                            key={`otp-${i}`}
                            ref={(r) => (otpRefs.current[i] = r)}
                            value={d}
                            onChangeText={(v) => onOtpChange(v, i)}
                            onKeyPress={(e) => onKeyPress(e, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            style={[styles.otpInput, d ? styles.otpFilled : null]}
                            textAlign="center"
                            returnKeyType={isLast ? 'done' : 'next'}
                            blurOnSubmit={false}
                            onSubmitEditing={() => {
                                if (isLast) onVerify();        // ⬅️ press “Done” to verify
                                else otpRefs.current[i + 1]?.focus();
                            }}
                        />
                    );
                })}
            </View>

            {otpError ? <CustomText style={styles.inlineErrorCenter}>{otpError}</CustomText> : null}

            <Button title="Verify OTP" onPress={onVerify} fullWidth size="medium" style={styles.button} />

            <View style={styles.resendRow}>
                <CustomText style={styles.resendText}>Didn’t receive the code?</CustomText>
                <View style={styles.resendBox}>
                    {resendTimer > 0 ? (
                        <Text style={styles.prefixText}>{`Resend in ${resendTimer}s`}</Text>
                    ) : (
                        <TouchableOpacity onPress={onResend} activeOpacity={0.8} style={styles.resendTouchable}>
                            <Text style={styles.prefixText}>Resend</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const BOX_WIDTH = 48;

const styles = StyleSheet.create({
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    otpInput: {
        width: BOX_WIDTH,
        height: 50,
        borderRadius: 10,
        backgroundColor: 'lightgrey',
        color: colors.primary,
        fontSize: fontSizes.secondmedium,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: colors.backgroundLight,
    },
    otpFilled: {
        borderColor: colors.lightBorder,
        shadowColor: colors.primary,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 1,
    },
    inlineErrorCenter: {
        color: colors.error,
        marginTop: 6,
        textAlign: 'center',
        fontSize: fontSizes.medium,
    },
    button: { marginTop: spacing.md, borderRadius: 12 },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        marginVertical: 5,
    },
    resendText: { color: colors.textSecondary, marginRight: 8 },
    resendBox: { width: 140, minHeight: 22, alignItems: 'center', justifyContent: 'center' },
    resendTouchable: { paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
    prefixText: { fontSize: fontSizes.medium, color: colors.textPrimary, fontFamily: 'Poppins-Medium' },
});

export default OtpContainer;
