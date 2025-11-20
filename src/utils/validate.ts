
export const validatePhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (!digits) return 'Please enter the mobile number.';
    if (digits.length > 10) return 'Enter only 10 digits.';
    if (digits.length < 10) return 'Please enter a valid mobile number';
    return null;
};