const VERIFIED_EMAIL = 'vishnubangaru001@gmail.com';

export const isVerifiedAccount = (value) => {
  if (value && typeof value === 'object' && value.isVerifiedAccount === true) return true;
  const email = typeof value === 'string' ? value : value?.email;
  return typeof email === 'string' && email.trim().toLowerCase() === VERIFIED_EMAIL;
};
