import { StyleSheet, Dimensions } from 'react-native';
import colors from '../constants/colors';
import { spacing, fontSizes } from './default';
import { Screen } from 'react-native-screens';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  /* ===========================
      Core Containers
  ============================ */
  containerLight: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
  },
  containerDark: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
  },
  flex: {
    flex: 1,
    flexDirection: 'row',
  },
  padding: {
    padding: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },

  footerContainer: {
    width: '100%',
    paddingBottom: 140,
    marginBottom: 100,
    marginTop: 8,
  },

  /* ===========================
      Universal Spacing Helpers
  ============================ */
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },
  mb10: { marginBottom: 10 },
  mb20: { marginBottom: 20 },
  mr10: { marginRight: 10 },
  bold: { fontWeight: 'bold' },

  /* ===========================
      Typography (base)
  ============================ */
  heading: {
    fontSize: fontSizes.xlarge,
    lineHeight: fontSizes.xlarge + 8,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: fontSizes.medium,
    lineHeight: fontSizes.medium + 6,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  textLight: { color: colors.textLight },
  textSecondary: { color: colors.textSecondary },

  /* ===========================
      Onboarding Typography
  ============================ */
  onboardingHeader: {
    fontSize: fontSizes.xxlarge || 26,
    lineHeight: (fontSizes.xxlarge || 26) + 10,
    fontFamily: 'Poppins-Bold',
    color: colors.onPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  onboardingSubheader: {
    fontSize: fontSizes.medium + 1,
    lineHeight: (fontSizes.medium + 1) + 6,
    fontFamily: 'Inter-Regular',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },

  /* ===========================
      Onboarding Layout Helpers
  ============================ */
  onboardingProgressWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg + 4,
  },
  onboardingProgressDot: {
    width: 32,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.surfaceDark,
    opacity: 0.25,
    marginHorizontal: 5,
  },
  onboardingProgressDotActive: {
    width: 46,
    backgroundColor: colors.onPrimary,
    opacity: 1,
  },
  onboardingImage: {
    width: Math.min(width * 0.9, 420),
    height: Math.min(width * 0.9 * 0.63, 420 * 0.63),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: spacing.lg,
  },
  onboardingCTAWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  onboardingFooterRow: {
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  /* ===========================
      Buttons
  ============================ */
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: fontSizes.medium,
    fontWeight: '600',
  },
  buttonYellow: {
    backgroundColor: colors.highlightYellow,
  },

  /* ===========================
      Splash Branding
  ============================ */
  logoImage: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  logoText: {
    fontSize: fontSizes.xlarge,
    fontWeight: 'bold',
    color: colors.primaryLight,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  /* ===========================
      Login 
  ============================ */
  loginTextBlock: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  loginHeading: {
    fontFamily: 'Poppins-Bold',
    fontSize: fontSizes.medium,
    lineHeight: 30,
    textAlign: 'left',
    color: colors.primary,
    marginBottom: 8,
  },
  loginSubheading: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    color: colors.textSecondary,
    maxWidth: width * 0.84,
  },
  inputRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Home Screen
  homeCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  toastContainer: {

  },toastIcon:{

  },toastText:{
    
  },
  // UPDATED: bottom-sheet look
  loginContainer: {
    marginTop: '10%',
    paddingBottom: spacing.md,
    width: '100%',
  },
  logoTopCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 8,
    alignSelf: 'center',
  },

  card: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    width: '100%',
    alignSelf: 'stretch',
  },

});

export default globalStyles;
