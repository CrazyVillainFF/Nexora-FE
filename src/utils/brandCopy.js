const LEGACY_DEFAULT_HEADLINE = 'professional at nexora';

export const getBrandedHeadline = (headline) => {
  if (typeof headline !== 'string') return headline || '';
  return headline.trim().toLocaleLowerCase() === LEGACY_DEFAULT_HEADLINE
    ? 'Professional at Vuprise'
    : headline;
};
