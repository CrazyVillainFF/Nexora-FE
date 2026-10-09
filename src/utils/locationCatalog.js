import { allCountries } from 'country-region-data';

export const COUNTRIES = allCountries
  .map(([name, code]) => ({ name, code }))
  .sort((left, right) => left.name.localeCompare(right.name));

export const getRegionsForCountry = (countryCode) => {
  const country = allCountries.find(([, code]) => code === countryCode);
  return country
    ? country[2].map(([name, code]) => ({ name, code: code || '' })).sort((left, right) => left.name.localeCompare(right.name))
    : [];
};

export const filterLocationOptions = (options, query) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return options;
  return options.filter(({ name }) => name.toLocaleLowerCase().includes(normalizedQuery));
};
