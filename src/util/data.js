import isArray from 'lodash/isArray';
import reduce from 'lodash/reduce';
import { sanitizeEntity } from './sanitize';
import { findOptionsForSelectFilter } from './search';
import { filters } from '../marketplace-custom-config';
import { property } from 'lodash';
import {
  CAREGIVER,
  MISSING_SUBSCRIPTION,
  MISSING_REQUIREMENTS,
  EMAIL_VERIFICATION,
} from './constants';
import { types as sdkTypes } from '../util/sdkLoader';
const { Money } = sdkTypes;
import { formatMoneyInteger } from './currency';
import { BACKGROUND_CHECK_APPROVED, SUBSCRIPTION_ACTIVE_TYPES } from './constants';
import moment from 'moment';
import { addTimeToStartOfDay } from './dates';

const BANK_ACCOUNT = 'Bank Account';
const CARD_PROCESSING_FEE = 0.029;
const BANK_PROCESSING_FEE = 0.008;

/**
 * Combine the given relationships objects
 *
 * See: http://jsonapi.org/format/#document-resource-object-relationships
 */
export const combinedRelationships = (oldRels, newRels) => {
  if (!oldRels && !newRels) {
    // Special case to avoid adding an empty relationships object when
    // none of the resource objects had any relationships.
    return null;
  }
  return { ...oldRels, ...newRels };
};

/**
 * Combine the given resource objects
 *
 * See: http://jsonapi.org/format/#document-resource-objects
 */
export const combinedResourceObjects = (oldRes, newRes) => {
  const { id, type } = oldRes;
  if (newRes.id.uuid !== id.uuid || newRes.type !== type) {
    throw new Error('Cannot merge resource objects with different ids or types');
  }
  const attributes = newRes.attributes || oldRes.attributes;
  const attributesOld = oldRes.attributes || {};
  const attributesNew = newRes.attributes || {};
  // Allow (potentially) sparse attributes to update only relevant fields
  const attrs = attributes ? { attributes: { ...attributesOld, ...attributesNew } } : null;
  const relationships = combinedRelationships(oldRes.relationships, newRes.relationships);
  const rels = relationships ? { relationships } : null;
  return { id, type, ...attrs, ...rels };
};

/**
 * Combine the resource objects form the given api response to the
 * existing entities.
 */
export const updatedEntities = (oldEntities, apiResponse) => {
  const { data, included = [] } = apiResponse;
  const objects = (Array.isArray(data) ? data : [data]).concat(included);

  const newEntities = objects.reduce((entities, curr) => {
    const { id, type } = curr;

    // Some entities (e.g. listing and user) might include extended data,
    // you should check if src/util/sanitize.js needs to be updated.
    const current = sanitizeEntity(curr);

    entities[type] = entities[type] || {};
    const entity = entities[type][id.uuid];
    entities[type][id.uuid] = entity ? combinedResourceObjects({ ...entity }, current) : current;

    return entities;
  }, oldEntities);

  return newEntities;
};

/**
 * Denormalise the entities with the resources from the entities object
 *
 * This function calculates the dernormalised tree structure from the
 * normalised entities object with all the relationships joined in.
 *
 * @param {Object} entities entities object in the SDK Redux store
 * @param {Array<{ id, type }} resources array of objects
 * with id and type
 * @param {Boolean} throwIfNotFound wheather to skip a resource that
 * is not found (false), or to throw an Error (true)
 *
 * @return {Array} the given resource objects denormalised that were
 * found in the entities
 */
export const denormalisedEntities = (entities, resources, throwIfNotFound = true) => {
  const denormalised = resources.map(res => {
    const { id, type } = res;
    const entityFound = entities[type] && id && entities[type][id.uuid];
    if (!entityFound) {
      if (throwIfNotFound) {
        throw new Error(`Entity with type "${type}" and id "${id ? id.uuid : id}" not found`);
      }
      return null;
    }
    const entity = entities[type][id.uuid];
    const { relationships, ...entityData } = entity;

    if (relationships) {
      // Recursively join in all the relationship entities
      return reduce(
        relationships,
        (ent, relRef, relName) => {
          // A relationship reference can be either a single object or
          // an array of objects. We want to keep that form in the final
          // result.
          const hasMultipleRefs = Array.isArray(relRef.data);
          const multipleRefsEmpty = hasMultipleRefs && relRef.data.length === 0;
          if (!relRef.data || multipleRefsEmpty) {
            ent[relName] = hasMultipleRefs ? [] : null;
          } else {
            const refs = hasMultipleRefs ? relRef.data : [relRef.data];

            // If a relationship is not found, an Error should be thrown
            const rels = denormalisedEntities(entities, refs, true);

            ent[relName] = hasMultipleRefs ? rels : rels[0];
          }
          return ent;
        },
        entityData
      );
    }
    return entityData;
  });
  return denormalised.filter(e => !!e);
};

/**
 * Denormalise the data from the given SDK response
 *
 * @param {Object} sdkResponse response object from an SDK call
 *
 * @return {Array} entities in the response with relationships
 * denormalised from the included data
 */
export const denormalisedResponseEntities = sdkResponse => {
  const apiResponse = sdkResponse.data;
  const data = apiResponse.data;
  const resources = Array.isArray(data) ? data : [data];

  if (!data || resources.length === 0) {
    return [];
  }

  const entities = updatedEntities({}, apiResponse);
  return denormalisedEntities(entities, resources);
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} transaction entity object, which is to be ensured against null values
 */
export const ensureTransaction = (transaction, booking = null, listing = null, provider = null) => {
  const empty = {
    id: null,
    type: 'transaction',
    attributes: {},
    booking,
    listing,
    provider,
  };
  return { ...empty, ...transaction };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} booking entity object, which is to be ensured against null values
 */
export const ensureBooking = booking => {
  const empty = { id: null, type: 'booking', attributes: {} };
  return { ...empty, ...booking };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} listing entity object, which is to be ensured against null values
 */
export const ensureListing = listing => {
  const empty = {
    id: null,
    type: 'listing',
    attributes: { publicData: {}, privateData: {}, metadata: {} },
    images: [],
  };
  return { ...empty, ...listing };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} listing entity object, which is to be ensured against null values
 */
export const ensureOwnListing = listing => {
  const empty = {
    id: null,
    type: 'ownListing',
    attributes: { publicData: {}, metadata: {}, privateData: {} },
    images: [],
  };
  return { ...empty, ...listing };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} user entity object, which is to be ensured against null values
 */
export const ensureUser = user => {
  const empty = { id: null, type: 'user', attributes: { profile: {} } };
  return { ...empty, ...user };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} current user entity object, which is to be ensured against null values
 */
export const ensureCurrentUser = user => {
  const empty = {
    id: null,
    type: 'currentUser',
    attributes: { profile: { publicData: {}, privateData: {}, metadata: {} } },
    profileImage: {},
  };
  return { ...empty, ...user };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} time slot entity object, which is to be ensured against null values
 */
export const ensureTimeSlot = timeSlot => {
  const empty = { id: null, type: 'timeSlot', attributes: {} };
  return { ...empty, ...timeSlot };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} availability exception entity object, which is to be ensured against null values
 */
export const ensureDayAvailabilityPlan = availabilityPlan => {
  const empty = { type: 'day', entries: [] };
  return { ...empty, ...availabilityPlan };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} availability exception entity object, which is to be ensured against null values
 */
export const ensureAvailabilityException = availabilityException => {
  const empty = { id: null, type: 'availabilityException', attributes: {} };
  return { ...empty, ...availabilityException };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} stripeCustomer entity from API, which is to be ensured against null values
 */
export const ensureStripeCustomer = stripeCustomer => {
  const empty = { id: null, type: 'stripeCustomer', attributes: {} };
  return { ...empty, ...stripeCustomer };
};

/**
 * Create shell objects to ensure that attributes etc. exists.
 *
 * @param {Object} stripeCustomer entity from API, which is to be ensured against null values
 */
export const ensurePaymentMethodCard = stripePaymentMethod => {
  const empty = {
    id: null,
    type: 'stripePaymentMethod',
    attributes: { type: 'stripe-payment-method/card', card: {} },
  };
  const cardPaymentMethod = { ...empty, ...stripePaymentMethod };

  if (cardPaymentMethod.attributes.type !== 'stripe-payment-method/card') {
    throw new Error(`'ensurePaymentMethodCard' got payment method with wrong type.
      'stripe-payment-method/card' was expected, received ${cardPaymentMethod.attributes.type}`);
  }

  return cardPaymentMethod;
};

/**
 * Get the display name of the given user as string. This function handles
 * missing data (e.g. when the user object is still being downloaded),
 * fully loaded users, as well as banned users.
 *
 * For banned or deleted users, a translated name should be provided.
 *
 * @param {propTypes.user} user
 * @param {String} defaultUserDisplayName
 *
 * @return {String} display name that can be rendered in the UI
 */
export const userDisplayNameAsString = (user, defaultUserDisplayName) => {
  const hasDisplayName = user?.attributes?.profile?.displayName;

  if (hasDisplayName) {
    const displayName = user.attributes.profile.displayName.split(' ');
    displayName[0] =
      displayName[0].charAt(0).toUpperCase() + displayName[0].slice(1, displayName[0].length);
    displayName[1] =
      displayName[1].charAt(0).toUpperCase() + displayName[1].slice(1, displayName[0].length);

    return displayName[0] + ' ' + displayName[1];
  } else {
    return defaultUserDisplayName || '';
  }
};

/**
 * DEPRECATED: Use userDisplayNameAsString function or UserDisplayName component instead
 *
 * @param {propTypes.user} user
 * @param {String} bannedUserDisplayName
 *
 * @return {String} display name that can be rendered in the UI
 */
export const userDisplayName = (user, bannedUserDisplayName) => {
  console.warn(
    `Function userDisplayName is deprecated!
User function userDisplayNameAsString or component UserDisplayName instead.`
  );

  return userDisplayNameAsString(user, bannedUserDisplayName);
};

/**
 * Get the abbreviated name of the given user. This function handles
 * missing data (e.g. when the user object is still being downloaded),
 * fully loaded users, as well as banned users.
 *
 * For banned  or deleted users, a default abbreviated name should be provided.
 *
 * @param {propTypes.user} user
 * @param {String} defaultUserAbbreviatedName
 *
 * @return {String} abbreviated name that can be rendered in the UI
 * (e.g. in Avatar initials)
 */
export const userAbbreviatedName = (user, defaultUserAbbreviatedName) => {
  const hasAttributes = user && user.attributes;
  const hasProfile = hasAttributes && user.attributes.profile;
  const hasDisplayName = hasProfile && user.attributes.profile.abbreviatedName;

  if (hasDisplayName) {
    return user.attributes.profile.abbreviatedName.toUpperCase();
  } else {
    return defaultUserAbbreviatedName || '';
  }
};

/**
 * A customizer function to be used with the
 * mergeWith function from lodash.
 *
 * Works like merge in every way exept that on case of
 * an array the old value is completely overridden with
 * the new value.
 *
 * @param {Object} objValue Value of current field, denoted by key
 * @param {Object} srcValue New value
 * @param {String} key Key of the field currently being merged
 * @param {Object} object Target object that is receiving values from source
 * @param {Object} source Source object that is merged into object param
 * @param {Object} stack Tracks merged values
 *
 * @return {Object} New value for objValue if the original is an array,
 * otherwise undefined is returned, which results in mergeWith using the
 * standard merging function
 */
export const overrideArrays = (objValue, srcValue, key, object, source, stack) => {
  if (isArray(objValue)) {
    return srcValue;
  }
};

/**
 * Humanizes a line item code. Strips the "line-item/" namespace
 * definition from the beginnign, replaces dashes with spaces and
 * capitalizes the first character.
 *
 * @param {string} code a line item code
 *
 * @return {string} returns the line item code humanized
 */
export const humanizeLineItemCode = code => {
  if (!/^line-item\/.+/.test(code)) {
    throw new Error(`Invalid line item code: ${code}`);
  }
  const lowercase = code.replace(/^line-item\//, '').replace(/-/g, ' ');

  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
};

export const convertFilterKeyToLabel = (filterType, key) => {
  return findOptionsForSelectFilter(filterType, filters)?.find(data => data.key === key)?.label;
};

export const convertFilterKeysToLabels = (filterType, keys) => {
  return findOptionsForSelectFilter(filterType, filters)
    ?.filter(data => {
      return keys?.includes(data.key);
    })
    ?.map(filter => filter.label);
};

export const cutTextToPreview = (text, length) => {
  var textCutoff = text.substr(0, length);

  while (textCutoff.charAt(textCutoff.length - 1) !== ' ' && textCutoff.length > 0) {
    textCutoff = textCutoff.substr(0, textCutoff.length - 1);
  }

  textCutoff = textCutoff.substr(0, textCutoff.length - 1);

  if (textCutoff.charAt(textCutoff.length - 1).match(/^[.,:!?]/)) {
    textCutoff = textCutoff.substr(0, textCutoff.length - 1);
  }

  return textCutoff.length > 0 ? textCutoff + '...' : text.substring(0, length);
};

export const userCanMessage = currentUser => {
  const userType = currentUser?.attributes?.profile?.metadata?.userType;
  const emailVerified = currentUser?.attributes?.emailVerified;
  const backgroundCheckApprovedStatus =
    currentUser?.attributes?.profile?.metadata?.backgroundCheckApproved?.status;
  const backgroundCheckSubscription =
    currentUser?.attributes?.profile?.metadata?.backgroundCheckSubscription;

  return userType === CAREGIVER
    ? emailVerified &&
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED &&
        SUBSCRIPTION_ACTIVE_TYPES.includes(backgroundCheckSubscription?.status)
    : emailVerified;
};

export const getMissingInfoModalValue = (currentUser, currentUserListing) => {
  const userType = currentUser?.attributes.profile.metadata.userType;
  const emailVerified = currentUser?.attributes.emailVerified;
  const backgroundCheckApprovedStatus =
    currentUser?.attributes?.profile.metadata.backgroundCheckApproved?.status;
  const backgroundCheckSubscription =
    currentUser?.attributes?.profile.metadata.backgroundCheckSubscription;
  const listingState = currentUserListing?.attributes?.state;

  const canMessage =
    userType === CAREGIVER
      ? emailVerified &&
        backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED &&
        SUBSCRIPTION_ACTIVE_TYPES.includes(backgroundCheckSubscription?.status) &&
        (listingState === 'published' || listingState === 'closed')
      : emailVerified;

  if (!canMessage) {
    if (userType === CAREGIVER) {
      if (emailVerified && backgroundCheckApprovedStatus === BACKGROUND_CHECK_APPROVED) {
        return MISSING_SUBSCRIPTION;
      } else {
        return MISSING_REQUIREMENTS;
      }
    }
    return EMAIL_VERIFICATION;
  }
  return null;
};

export const formatPrice = (rates, intl) => {
  const minPriceMoney = new Money(rates[0], 'USD');
  const maxPriceMoney = new Money(rates[1], 'USD');

  if (minPriceMoney && maxPriceMoney) {
    const formattedMinPrice = formatMoneyInteger(intl, minPriceMoney);
    const formattedMaxPrice = formatMoneyInteger(intl, maxPriceMoney);

    return {
      formattedMinPrice,
      formattedMaxPrice,
      priceTitle: formattedMinPrice + ' - ' + formattedMaxPrice,
    };
  } else if (maxPriceMoney && minPriceMoney) {
    return {
      formattedMinPrice: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPrice' },
        { currency: minPriceMoney.currency }
      ),
      formattedMaxPrice: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPrice' },
        { currency: maxPriceMoney.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'CaregiverListingCard.unsupportedPriceTitle' },
        { currency: maxPriceMoney.currency }
      ),
    };
  }
  return {};
};

export const truncateString = function(fullStr, strLen) {
  if (!strLen) strLen = 40;
  if (fullStr === null || fullStr === undefined) return '';
  if (fullStr.length <= strLen) return fullStr;
  var separator = '...';
  var sepLen = separator.length;
  var charsToShow = strLen - sepLen;
  var frontChars = Math.ceil(charsToShow / 2);
  var backChars = Math.floor(charsToShow / 2);
  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};

export const convertTimeFrom12to24 = fullTime => {
  if (!fullTime || fullTime.length === 5) {
    return fullTime;
  }

  const [time, ampm] = fullTime.split(/(am|pm)/i);
  const [hours, minutes] = time.split(':');
  let convertedHours = parseInt(hours);

  if (ampm.toLowerCase() === 'am' && hours === '12') {
    convertedHours = 0;
  } else if (ampm.toLowerCase() === 'pm' && hours !== '12') {
    convertedHours += 12;
  }

  return `${convertedHours.toString().padStart(2, '0')}:${minutes}`;
};

export const convertTimeFrom24to12 = fullTime => {
  if (!fullTime || fullTime.length !== 5) {
    return fullTime;
  }

  const [hours, minutes] = fullTime.split(':');

  if (hours === '00') {
    return `12:${minutes}am`;
  }

  if (hours === '12') {
    return `12:${minutes}pm`;
  }

  if (hours > 12) {
    return `${parseInt(hours) - 12}:${minutes}pm`;
  }

  if (hours < 10 && hours.includes('0')) {
    return `${hours.replace('0', '')}:${minutes}am`;
  }

  return `${hours}:${minutes}am`;
};

export const findEndTimeFromLineItems = lineItems => {
  if (!lineItems || lineItems.length === 0) return null;
  const sortedLineItems = lineItems.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const lastDay = sortedLineItems[sortedLineItems.length - 1] ?? { endTime: '12:00am' };
  const additionalTime =
    lastDay.endTime === '12:00am' ? 24 : convertTimeFrom12to24(lastDay.endTime).split(':')[0];
  const endTime = moment(sortedLineItems[sortedLineItems.length - 1].date)
    .add(additionalTime, 'hours')
    .toDate();

  return endTime;
};

export const findStartTimeFromLineItems = lineItems => {
  if (!lineItems || lineItems.length === 0) return null;
  const sortedLineItems = lineItems.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const firstDay = sortedLineItems[0] ?? { startTime: '12:00am' };
  const additionalTime = convertTimeFrom12to24(firstDay.startTime).split(':')[0];
  const startTime = moment(sortedLineItems[0].date)
    .add(additionalTime, 'hours')
    .toDate();

  return startTime;
};

export const calculateRefundAmount = (lineItems, caregiverCanceled) => {
  // If caregiver canceled then we need to refund the full amount
  // Otherwise, all line items that are within 48 hours of the start time
  // will be refunded at 50% of the amount
  if (caregiverCanceled) {
    const fullRefunds = lineItems
      ?.filter(l => {
        const differenceInHours = addTimeToStartOfDay(l.date, l.startTime) - moment().toDate();
        return differenceInHours > 0;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    return parseInt(Number(fullRefunds) * 100);
  } else {
    const fiftyPercentRefunds = lineItems
      ?.filter(l => {
        const differenceInHours = addTimeToStartOfDay(l.date, l.startTime) - moment().toDate();
        return differenceInHours < 48 * 36e5 && differenceInHours > 0;
      })
      .reduce((acc, curr) => acc + curr.amount / 2, 0);

    const fullRefunds = lineItems
      ?.filter(l => {
        const startTime = addTimeToStartOfDay(l.date, l.startTime);
        return startTime - moment().toDate() >= 48 * 36e5;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    return parseInt((Number(fiftyPercentRefunds) + Number(fullRefunds)) * 100);
  }
};

export const calculateAverageRating = reviews => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, curr) => acc + curr.attributes.rating, 0);
  return sum / reviews.length;
};

export const calculateProcessingFee = (subTotal, transactionFee, selectedPaymentMethod) => {
  const totalAmount = Number(subTotal) + Number(transactionFee);
  if (selectedPaymentMethod === BANK_ACCOUNT) {
    const calculatedFee = parseFloat(
      Math.round(((totalAmount * BANK_PROCESSING_FEE) / (1 - BANK_PROCESSING_FEE)) * 100) / 100
    ).toFixed(2);
    return calculatedFee > 5 ? '5.00' : calculatedFee;
  }

  return parseFloat(
    Math.round(((totalAmount * CARD_PROCESSING_FEE + 0.3) / (1 - CARD_PROCESSING_FEE)) * 100) / 100
  ).toFixed(2);
};
