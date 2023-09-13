import intersection from 'lodash/intersection';
import config from '../../config';
import { createResourceLocatorString } from '../../util/routes';
import { parseSelectFilterOptions } from '../../util/search';
import { createSlug } from '../../util/urlHelpers';
import routeConfiguration from '../../routeConfiguration';
import { calculateDistanceBetweenOrigins } from '../../util/maps';
import { isArray } from 'lodash';
import { SUBSCRIPTION_ACTIVE_TYPES } from '../../util/constants';

const flatten = (acc, val) => acc.concat(val);

/**
 * Validates a filter search param agains a filters configuration.
 *
 * All invalid param names and values are dropped
 *
 * @param {String} queryParamName Search parameter name
 * @param {Object} paramValue Search parameter value
 * @param {Object} filters Filters configuration
 */
export const validURLParamForExtendedData = (queryParamName, paramValueRaw, filters) => {
  // Resolve configuration for this filter
  const filterConfig = filters.find(f => {
    const isArray = Array.isArray(f.queryParamNames);
    return isArray
      ? f.queryParamNames.includes(queryParamName)
      : f.queryParamNames === queryParamName;
  });

  const paramValue = (paramValueRaw && paramValueRaw.toString()) || '';

  if (filterConfig) {
    const { min, max } = filterConfig.config || {};

    if (['SelectSingleFilter', 'SelectMultipleFilter'].includes(filterConfig.type)) {
      // Pick valid select options only
      const allowedValues = filterConfig.config.options.map(o => o.key);
      const searchMode = filterConfig.config.searchMode;
      const valueArray = parseSelectFilterOptions(paramValue);
      const validValues = intersection(valueArray, allowedValues).join(',');

      return validValues.length > 0
        ? { [queryParamName]: searchMode ? `${searchMode}:${validValues}` : validValues }
        : {};
    } else if (filterConfig) {
      // Generic filter - remove empty params
      return paramValue.length > 0 ? { [queryParamName]: paramValue } : {};
    }
  }

  if (queryParamName === 'origin' && paramValueRaw) {
    return { origin: paramValueRaw };
  }

  return {};
};

/**
 * Checks filter param value validity.
 *
 * Non-filter params are dropped.
 *
 * @param {Object} params Search params
 * @param {Object} filters Filters configuration
 */
export const validFilterParams = (params, filters) => {
  const filterParamNames = filters.map(f => f.queryParamNames).reduce(flatten, []);
  const paramEntries = Object.entries(params);

  return paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;

    return filterParamNames.includes(paramName)
      ? {
          ...validParams,
          ...validURLParamForExtendedData(paramName, paramValue, filters),
        }
      : { ...validParams };
  }, {});
};

/**
 * Checks filter param value validity.
 *
 * Non-filter params are returned as they are.
 *
 * @param {Object} params Search params
 * @param {Object} filters Filters configuration
 */
export const validURLParamsForExtendedData = (params, filters) => {
  const filterParamNames = filters
    .map(f => f.queryParamNames)
    .reduce(flatten, [])
    .concat('origin');
  const paramEntries = Object.entries(params);

  return paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;

    return filterParamNames.includes(paramName)
      ? {
          ...validParams,
          ...validURLParamForExtendedData(paramName, paramValue, filters),
        }
      : { ...validParams, [paramName]: paramValue };
  }, {});
};

// extract search parameters, including a custom URL params
// which are validated by mapping the values to marketplace custom config.
export const pickSearchParamsOnly = (params, filters, sortConfig) => {
  const { address, origin, bounds, listingType, ...rest } = params || {};
  const boundsMaybe = bounds ? { bounds } : {};
  const originMaybe = origin ? { origin } : {};
  const filterParams = validFilterParams(rest, filters);
  const sort = rest[sortConfig.queryParamName];
  const sortMaybe = sort ? { sort } : {};
  const listingTypeMaybe = listingType ? { listingType } : {};

  return {
    ...boundsMaybe,
    ...originMaybe,
    ...filterParams,
    ...sortMaybe,
    ...listingTypeMaybe,
  };
};

export const createSearchResultSchema = (listings, address, intl) => {
  // Schema for search engines (helps them to understand what this page is about)
  // http://schema.org
  // We are using JSON-LD format
  const siteTitle = config.siteTitle;
  const searchAddress = address || intl.formatMessage({ id: 'SearchPage.schemaMapSearch' });
  const schemaDescription = intl.formatMessage({ id: 'SearchPage.schemaDescription' });
  const schemaTitle = intl.formatMessage(
    { id: 'SearchPage.schemaTitle' },
    { searchAddress, siteTitle }
  );

  const schemaListings = listings.map((l, i) => {
    const title = l.attributes.title;
    const pathToItem = createResourceLocatorString('ListingPage', routeConfiguration(), {
      id: l.id.uuid,
      slug: createSlug(title),
    });
    return {
      '@type': 'ListItem',
      position: i,
      url: `${config.canonicalRootURL}${pathToItem}`,
      name: title,
    };
  });

  const schemaMainEntity = JSON.stringify({
    '@type': 'ItemList',
    name: 'search',
    itemListOrder: 'http://schema.org/ItemListOrderAscending',
    itemListElement: schemaListings,
  });
  return {
    title: schemaTitle,
    description: schemaDescription,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'SearchResultsPage',
      description: schemaDescription,
      name: schemaTitle,
      mainEntity: [schemaMainEntity],
    },
  };
};

// Returns true if transaction is between current User and curent author
export const hasExistingTransaction = (transaction, currentUser, currentAuthor) => {
  const txCustomerId = transaction.relationships.customer.data.id.uuid;
  const txProviderId = transaction.relationships.provider.data.id.uuid;
  const currentAuthorId = currentAuthor.id.uuid;
  const currentUserId = currentUser.id.uuid;

  return (
    (txCustomerId === currentUserId && txProviderId === currentAuthorId) ||
    (txCustomerId === currentAuthorId && txProviderId === currentUserId)
  );
};

export const sortCaregiverMatch = (caregiverListing, employerListing) => {
  let cgScore = 0;

  const cgPublicData = caregiverListing.attributes.publicData;
  const employerPublicData = employerListing.attributes.publicData;

  const cgGeolocation = caregiverListing.attributes.geolocation;
  const employerGeolocation = employerListing.attributes.geolocation;

  if (
    calculateDistanceBetweenOrigins(cgGeolocation, employerGeolocation) <
    cgPublicData.travelDistance
  ) {
    cgScore += 10;
  }

  const cgCareTypes = cgPublicData.careTypes || [];
  const employerCareTypes = employerPublicData.careTypes || [];

  const cgCareTypesScore = cgCareTypes.filter(careType => employerCareTypes.includes(careType))
    .length;

  cgScore += 5 * cgCareTypesScore;

  const cgLanguages = isArray(cgPublicData.languagesSpoken) ? cgPublicData.languagesSpoken : [];
  const employerLanguages = isArray(employerPublicData.languagesSpoken)
    ? employerPublicData.languagesSpoken
    : [];

  const cgLanguagesScore = cgLanguages.filter(language => employerLanguages.includes(language))
    .length;

  cgScore += 5 * cgLanguagesScore;

  const cgExperienceAreas = cgPublicData.experienceAreas || [];
  const employerDetailedCareNeeds = employerPublicData.detailedCareNeeds || [];

  const cgExperienceAreasScore =
    cgExperienceAreas &&
    cgExperienceAreas.filter(
      experienceArea =>
        employerDetailedCareNeeds && employerDetailedCareNeeds.includes(experienceArea)
    ).length;

  cgScore += cgExperienceAreasScore;

  const cgOpenToLiveIn = cgPublicData.openToLiveIn;
  const employerCareSchedule = employerPublicData.careSchedule;

  if (employerCareSchedule.liveIn && cgOpenToLiveIn) {
    cgScore += 20;
  }

  const cgAdditionalInfo = cgPublicData.additionalInfo || [];
  const employerAdditionalInfo = employerPublicData.additionalInfo || [];

  const cgAdditionalInfoScore = cgAdditionalInfo.filter(additionalInfo =>
    employerAdditionalInfo.includes(additionalInfo)
  ).length;

  cgScore += 3 * cgAdditionalInfoScore;

  const cgCertificationsAndTraining = cgPublicData.certificationsAndTraining || [];
  const employerCertificationsAndTraining = employerPublicData.certificationsAndTraining || [];

  const cgCertificationsAndTrainingScore = cgCertificationsAndTraining.filter(
    certificationAndTraining => employerCertificationsAndTraining.includes(certificationAndTraining)
  ).length;

  cgScore += 2 * cgCertificationsAndTrainingScore;

  const caregiverAuthor = caregiverListing?.author;
  const caregiverAuthorMetadata = caregiverAuthor?.attributes?.profile?.metadata;

  const hasPremiumSubscription =
    SUBSCRIPTION_ACTIVE_TYPES.includes(
      caregiverAuthorMetadata?.backgroundCheckSubscription?.status
    ) || caregiverAuthorMetadata?.backgroundCheckSubscription?.type === 'vine';

  if (hasPremiumSubscription) {
    cgScore += 35;
  }

  return cgScore;
};

export const sortEmployerMatch = (employerListing, caregiverListing) => {
  let empScore = 0;

  const cgPublicData = caregiverListing.attributes.publicData;
  const employerPublicData = employerListing.attributes.publicData;

  const cgGeolocation = caregiverListing.attributes.geolocation;
  const employerGeolocation = employerListing.attributes.geolocation;

  if (
    calculateDistanceBetweenOrigins(cgGeolocation, employerGeolocation) <
    cgPublicData.travelDistance
  ) {
    empScore += 10;
  }

  const cgCareTypes = cgPublicData.careTypes || [];
  const employerCareTypes = employerPublicData.careTypes || [];

  const employerCareTypesScore = employerCareTypes.filter(careType =>
    cgCareTypes.includes(careType)
  ).length;

  empScore += 5 * employerCareTypesScore;

  const cgLanguages = isArray(cgPublicData.languagesSpoken) ? cgPublicData.languagesSpoken : [];
  const employerLanguages = isArray(employerPublicData.languagesSpoken)
    ? employerPublicData.languagesSpoken
    : [];

  const employerLanguagesScore = employerLanguages.filter(language =>
    cgLanguages.includes(language)
  ).length;

  empScore += 5 * employerLanguagesScore;

  const cgExperienceAreas = cgPublicData.experienceAreas || [];
  const employerDetailedCareNeeds = employerPublicData.detailedCareNeeds || [];

  const employerExperienceAreasScore = employerDetailedCareNeeds.filter(experienceArea =>
    cgExperienceAreas.includes(experienceArea)
  ).length;

  empScore += employerExperienceAreasScore;

  const cgOpenToLiveIn = cgPublicData.openToLiveIn;
  const employerCareSchedule = employerPublicData.careSchedule;

  if (employerCareSchedule.liveIn && cgOpenToLiveIn) {
    empScore += 20;
  }

  const cgAdditionalInfo = cgPublicData.additionalInfo || [];
  const employerAdditionalInfo = employerPublicData.additionalInfo || [];

  const employerAdditionalInfoScore = employerAdditionalInfo.filter(additionalInfo =>
    cgAdditionalInfo.includes(additionalInfo)
  ).length;

  empScore += 3 * employerAdditionalInfoScore;

  const empNearPublicTransit = employerPublicData.nearPublicTransit || 'no';
  const cgHasCar = cgAdditionalInfo.includes('hasCar');

  if (empNearPublicTransit === 'yes' && cgHasCar === false) {
    empScore += 20;
  }

  const cgCertificationsAndTraining = cgPublicData.certificationsAndTraining || [];
  const employerCertificationsAndTraining = employerPublicData.certificationsAndTraining || [];

  const employerCertificationsAndTrainingScore = employerCertificationsAndTraining.filter(
    certificationAndTraining => cgCertificationsAndTraining.includes(certificationAndTraining)
  ).length;

  empScore += 2 * employerCertificationsAndTrainingScore;

  return empScore;
};
