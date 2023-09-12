/*
 * Marketplace specific configuration.
 *
 * Every filter needs to have following keys:
 * - id:     Unique id of the filter.
 * - label:  The default label of the filter.
 * - type:   String that represents one of the existing filter components:
 *           BookingDateRangeFilter, KeywordFilter, PriceFilter,
 *           SelectSingleFilter, SelectMultipleFilter.
 * - group:  Is this 'primary' or 'secondary' filter?
 *           Primary filters are visible on desktop layout by default.
 *           Secondary filters are behind "More filters" button.
 *           Read more from src/containers/SearchPage/README.md
 * - queryParamNames: Describes parameters to be used with queries
 *                    (e.g. 'price' or 'pub_amenities'). Most of these are
 *                    the same between webapp URLs and API query params.
 *                    You can't change 'dates', 'price', or 'keywords'
 *                    since those filters are fixed to a specific attribute.
 * - config: Extra configuration that the filter component needs.
 *
 * Note 1: Labels could be tied to translation file
 *         by importing FormattedMessage:
 *         <FormattedMessage id="some.translation.key.here" />
 *
 * Note 2: If you need to add new custom filter components,
 *         you need to take those into use in:
 *         src/containers/SearchPage/FilterComponent.js
 *
 * Note 3: If you just want to create more enum filters
 *         (i.e. SelectSingleFilter, SelectMultipleFilter),
 *         you can just add more configurations with those filter types
 *         and tie them with correct extended data key
 *         (i.e. pub_<key> or meta_<key>).
 */

export const filters = [
  // {
  //   id: 'dates-length',
  //   label: 'Dates',
  //   type: 'BookingDateRangeLengthFilter',
  //   group: 'primary',
  //   // Note: BookingDateRangeFilter is fixed filter,
  //   // you can't change "queryParamNames: ['dates'],"
  //   queryParamNames: ['dates', 'minDuration'],
  //   config: {
  //     // A global time zone to use in availability searches. As listings
  //     // can be in various time zones, we must decide what time zone we
  //     // use in search when looking for available listings within a
  //     // certain time interval.
  //     //
  //     // If you have all/most listings in a certain time zone, change this
  //     // config value to that.
  //     //
  //     // See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  //     searchTimeZone: 'Etc/UTC',

  //     // Options for the minimum duration of the booking
  //     options: [
  //       { key: '0', label: 'Any length' },
  //       { key: '60', label: '1 hour', shortLabel: '1h' },
  //       { key: '120', label: '2 hours', shortLabel: '2h' },
  //     ],
  //   },
  // },
  {
    id: 'distance',
    label: 'Distance',
    type: 'DistanceFilter',
    group: 'primary',
    // Note: PriceFilter is fixed filter,
    // you can't change "queryParamNames: ['price'],"
    queryParamNames: ['distance'],
    // Price filter configuration
    // Note: unlike most prices this is not handled in subunits
    config: {
      min: 0,
      max: 100,
      step: 1,
    },
  },
  {
    id: 'price',
    label: 'Max Pay',
    type: 'PriceFilter',
    group: 'primary',
    // Note: PriceFilter is fixed filter,
    // you can't change "queryParamNames: ['price'],"
    queryParamNames: ['price'],
    // Price filter configuration
    // Note: unlike most prices this is not handled in subunits
    config: {
      min: 0,
      max: 50,
      step: 1,
    },
  },
  {
    id: 'minPrice',
    label: 'Minimum Pay',
    type: 'PriceFilter',
    group: 'primary',
    // Note: PriceFilter is fixed filter,
    // you can't change "queryParamNames: ['price'],"
    queryParamNames: ['pub_maxPrice'],
    // Price filter configuration
    // Note: unlike most prices this is not handled in subunits
    config: {
      min: 0,
      max: 50,
      step: 1,
    },
  },
  // {
  //   id: 'keyword',
  //   label: 'Keyword',
  //   type: 'KeywordFilter',
  //   group: 'primary',
  //   // Note: KeywordFilter is fixed filter,
  //   // you can't change "queryParamNames: ['keywords'],"
  //   queryParamNames: ['keywords'],
  //   // NOTE: If you are ordering search results by distance
  //   // the keyword search can't be used at the same time.
  //   // You can turn on/off ordering by distance from config.js file.
  //   config: {},
  // },
  {
    id: 'careTypes',
    label: 'Care Types',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_careTypes'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'householdTasks', label: 'Household Tasks' },
        { key: 'personalCare', label: 'Personal Care' },
        { key: 'companionship', label: 'Companionship' },
        { key: 'transportation', label: 'Transportation/Shopping' },
        { key: 'specializedCare', label: 'Specialized Care' },
        { key: 'memoryCare', label: 'Memory Care' },
        { key: 'hospiceCare', label: 'Hospice Care' },
      ],
    },
  },
  {
    id: 'residenceType',
    label: 'Residence Type',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_residenceType'],
    config: {
      searchMode: 'has_any',
      options: [
        { key: 'ownHome', label: 'Own Home' },
        { key: 'withFamily', label: 'Living with Family' },
        { key: 'independentFacility', label: 'Independent Living Facility' },
        { key: 'assistedLiving', label: 'Assisted Living Facility' },
      ],
    },
  },
  {
    id: 'openToLiveIn',
    label: 'Open to Live-In',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_openToLiveIn'],
    config: {
      options: [
        { key: 'yes', label: 'Yes' },
        { key: 'no', label: 'No' },
      ],
    },
  },
  {
    id: 'scheduleType',
    label: 'Schedule Type',
    type: 'SelectSingleFilter',
    group: 'primary',
    queryParamNames: ['pub_scheduleType'],
    config: {
      options: [
        { key: 'oneTime', label: 'One Time' },
        { key: 'repeat', label: 'Repeat' },
        { key: '24hour', label: '24 Hour' },
      ],
    },
  },
  {
    id: 'detailedCareNeeds',
    label: 'Recipient Care Needs',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_detailedCareNeeds'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_all',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        {
          key: 'hospice',
          label: 'Hospice Care',
        },
        {
          key: 'memory',
          label: 'Memory Care',
        },
        {
          key: 'medicationAdministration',
          label: 'Medication Administration',
        },
        {
          key: 'incontinence',
          label: 'Incontinence Care',
        },
        {
          key: 'insulinAdministration',
          label: 'Insulin Administration',
        },
        {
          key: 'bedConfined',
          label: 'Bed Confined Care',
        },
        {
          key: 'dressing',
          label: 'Dressing Assistance',
        },
        {
          key: 'hygiene',
          label: 'Hygiene Care',
        },
        {
          key: 'showering',
          label: 'Showering Assistance',
        },
        {
          key: 'transfer',
          label: 'Transfer Assistance',
        },
        {
          key: 'walking',
          label: 'Walking Assistance',
        },
        {
          key: 'mealPrep',
          label: 'Meal Preparation',
        },
        {
          key: 'companionship',
          label: 'Companionship',
        },
        {
          key: 'transportation',
          label: 'Transportation/Shopping',
        },
        {
          key: 'cleaning',
          label: 'Cleaning/House care',
        },
        {
          key: 'catheter',
          label: 'Catheter Care',
        },
        {
          key: 'medMgmt',
          label: 'Medication Management',
        },
        {
          key: 'fallPrevention',
          label: 'Fall Prevention',
        },
        {
          key: 'bowel',
          label: 'Bowel Care',
        },
        {
          key: 'colostomy',
          label: 'Colostomy Care',
        },
        {
          key: 'diabetesMgmt',
          label: 'Diabetes Management',
        },
        {
          key: 'feedingTube',
          label: 'Feeding Tube Administration',
        },
        {
          key: 'hoyerLift',
          label: 'Hoyer Lift',
        },
        {
          key: 'woundcare',
          label: 'Basic Wound Care',
        },
        {
          key: 'vitalSign',
          label: 'Vital Sign Monitoring',
        },
        {
          key: 'exercise',
          label: 'Exercise Assistance',
        },
      ],
    },
  },
  {
    id: 'experienceAreas',
    label: 'Desired Experience Areas',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_experienceAreas'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_all',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        {
          key: 'hospice',
          label: 'Hospice Care',
        },
        {
          key: 'memory',
          label: 'Memory Care',
        },
        {
          key: 'medicationAdministration',
          label: 'Medication Administration',
        },
        {
          key: 'incontinence',
          label: 'Incontinence Care',
        },
        {
          key: 'insulinAdministration',
          label: 'Insulin Administration',
        },
        {
          key: 'bedConfined',
          label: 'Bed Confined Care',
        },
        {
          key: 'dressing',
          label: 'Dressing Assistance',
        },
        {
          key: 'hygiene',
          label: 'Hygiene Care',
        },
        {
          key: 'showering',
          label: 'Showering Assistance',
        },
        {
          key: 'transfer',
          label: 'Transfer Assistance',
        },
        {
          key: 'walking',
          label: 'Walking Assistance',
        },
        {
          key: 'mealPrep',
          label: 'Meal Preparation',
        },
        {
          key: 'companionship',
          label: 'Companionship',
        },
        {
          key: 'transportation',
          label: 'Transportation/Shopping',
        },
        {
          key: 'cleaning',
          label: 'Cleaning/House care',
        },
        {
          key: 'catheter',
          label: 'Catheter Care',
        },
        {
          key: 'medMgmt',
          label: 'Medication Management',
        },
        {
          key: 'fallPrevention',
          label: 'Fall Prevention',
        },
        {
          key: 'bowel',
          label: 'Bowel Care',
        },
        {
          key: 'colostomy',
          label: 'Colostomy Care',
        },
        {
          key: 'diabetesMgmt',
          label: 'Diabetes Management',
        },
        {
          key: 'feedingTube',
          label: 'Feeding Tube Administration',
        },
        {
          key: 'hoyerLift',
          label: 'Hoyer Lift',
        },
        {
          key: 'woundcare',
          label: 'Basic Wound Care',
        },
        {
          key: 'vitalSign',
          label: 'Vital Sign Monitoring',
        },
        {
          key: 'exercise',
          label: 'Exercise Assistance',
        },
      ],
    },
  },
  {
    id: 'certificationsAndTraining',
    label: 'Certifications and Training',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_certificationsAndTraining'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'hha', label: 'Home Health Aide or Equivalent' },
        { key: 'cna', label: 'Certified Nursing Assistant' },
        { key: 'rn', label: 'Registered Nurse' },
        { key: 'cpr', label: 'CPR Training' },
        { key: 'lpc', label: 'Licensed Practical Nurse' },
        { key: 'ma', label: 'Medical Assistant' },
        { key: 'pca', label: 'Personal Care Assistant' },
      ],
    },
  },
  {
    id: 'additionalInfo',
    label: 'Additional Information',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_additionalInfo'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_all',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'nonSmoker', label: 'Non-smoker' },
        { key: 'hasCar', label: 'Have a car' },
        { key: 'comfortableWithPets', label: 'Comfortable with pets' },
        { key: 'collegeDegree', label: 'Have a college degree' },
      ],
    },
  },
  {
    id: 'recipientAge',
    label: 'Recipient Age',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_age'],
    config: {
      searchMode: 'has_any',
      options: [
        { key: 'early30s', label: '30-34' },
        { key: 'late30s', label: '35-39' },
        { key: 'early40s', label: '40-44' },
        { key: 'late40s', label: '45-49' },
        { key: 'early50s', label: '50-54' },
        { key: 'late50s', label: '55-59' },
        { key: 'early60s', label: '60-64' },
        { key: 'late60s', label: '65-69' },
        { key: 'early70s', label: '70-74' },
        { key: 'late70s', label: '75-79' },
        { key: 'early80s', label: '80-84' },
        { key: 'late80s', label: '85-89' },
        { key: 'early90s', label: '90-94' },
        { key: 'late90s', label: '95-99' },
        { key: '100s', label: '100+' },
      ],
    },
  },
  {
    id: 'nearPublicTransit',
    label: 'Near Public Transit',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_nearPublicTransit'],
    config: {
      options: [
        { key: 'yes', label: 'Yes' },
        { key: 'no', label: 'No' },
      ],
    },
  },
  {
    id: 'recipientRelationship',
    label: 'Recipient Relationship',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_recipientRelationship'],
    config: {
      searchMode: 'has_any',
      options: [
        { key: 'parent', label: 'My parent' },
        { key: 'spouse', label: 'My spouse' },
        { key: 'grandparent', label: 'My grandparent' },
        { key: 'friend', label: 'My friend/extended relative' },
        { key: 'myself', label: 'Myself' },
      ],
    },
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_gender'],
    config: {
      options: [
        { key: 'male', label: 'Male' },
        { key: 'female', label: 'Female' },
      ],
    },
  },
  {
    id: 'languagesSpoken',
    label: 'Languages',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_languagesSpoken'],
    config: {
      // Optional modes: 'has_all', 'has_any'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_all',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'english', label: 'English' },
        { key: 'spanish', label: 'Spanish' },
      ],
    },
  },
  {
    id: 'experienceLevel',
    label: 'Experience Level',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_experienceLevel'],
    config: {
      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: '1-2', label: '1-2 years' },
        { key: '3-4', label: '3-4 years' },
        { key: '5-9', label: '5-9 years' },
        { key: '10+', label: '10+ years' },
        { key: '0', label: 'I am seeking my first senior care job' },
      ],
    },
  },
  {
    id: 'covidVaccination',
    label: 'Covid Vaccination',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_covidVaccination'],
    config: {
      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'yes', label: 'Yes' },
        { key: 'no', label: 'No' },
      ],
    },
  },
  {
    id: 'listingType',
    label: 'Listing Type',
    type: 'SelectSingleFilter',
    group: 'secondary',
    queryParamNames: ['pub_listingType'],
    config: {
      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'caregiver', label: 'Caregiver' },
        { key: 'employer', label: 'Employer' },
      ],
    },
  },
];

export const sortConfig = {
  // Enable/disable the sorting control in the SearchPage
  active: true,

  // Note: queryParamName 'sort' is fixed,
  // you can't change it since Flex API expects it to be named as 'sort'
  queryParamName: 'sort',

  // Internal key for the relevance option, see notes below.
  relevanceKey: 'relevance',

  // Keyword filter is sorting the results already by relevance.
  // If keyword filter is active, we need to disable sorting.
  conflictingFilters: [],

  options: [
    { key: 'relevant', label: 'Most Relevant' },
    { key: 'createdAt', label: 'Newest' },
    { key: '-createdAt', label: 'Oldest' },
    { key: '-pub_minPrice', label: 'Lowest pay' },
    { key: 'pub_minPrice', label: 'Highest pay' },
    { key: '-pub_maxPrice', label: 'Lowest pay' },
    { key: 'pub_maxPrice', label: 'Highest pay' },

    // The relevance is only used for keyword search, but the
    // parameter isn't sent to the Marketplace API. The key is purely
    // for handling the internal state of the sorting dropdown.
    // { key: 'relevance', label: 'Relevance', longLabel: 'Relevance (Keyword search)' },
  ],
};
