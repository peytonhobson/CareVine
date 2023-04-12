import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';
import { chatGPTGenerateText } from '../util/api';
import { convertFilterKeysToLabels, convertFilterKeyToLabel } from '../util/data';
import {
  AVAILABILITY_PLAN_ONE_TIME,
  AVAILABILITY_PLAN_24_HOUR,
  AVAILABILITY_PLAN_REPEAT,
} from '../util/constants';

const generateBioPrompt = listing => {
  const { publicData } = listing.attributes;

  const {
    certificationsAndTraining,
    languagesSpoken,
    careTypes,
    experienceAreas,
    experienceLevel,
  } = publicData;

  const prompt = `Generate a first-person bio with less than 800 characters (including spaces) for a caregiver with the following traits.
            Don't include every trait. Leave some space in brackets for the caregiver to fill in their past history:

            Certifications and Training: ${convertFilterKeysToLabels(
              'certificationsAndTraining',
              certificationsAndTraining
            )}
            Languages Spoken:  ${convertFilterKeysToLabels('languagesSpoken', languagesSpoken)}
            Care Types: ${convertFilterKeysToLabels('careTypes', careTypes)}
            Experience Areas: ${convertFilterKeysToLabels('detailedCareNeeds', experienceAreas)}
            Experience Level: ${convertFilterKeyToLabel('experienceLevel', experienceLevel)}
    `;

  return prompt;
};

const generateJobDescriptionPrompt = listing => {
  const { publicData } = listing.attributes;

  const {
    careTypes,
    residenceType,
    scheduleType,
    availabilityPlan,
    careRecipients,
    detailedCareNeeds,
    languagesSpoken,
    certificationsAndTraining,
  } = publicData;

  let scheduleTimes = null;

  if (scheduleType === AVAILABILITY_PLAN_24_HOUR) {
    scheduleTimes = `Days of Care: ${JSON.stringify(availabilityPlan.availableDays)}
    Working hours per day: ${availabilityPlan.hoursPerDay}`;
  }
  if (scheduleType === AVAILABILITY_PLAN_REPEAT) {
    scheduleTimes = `Days and times of Care: ${JSON.stringify(availabilityPlan.entries)}`;
  }

  const prompt = `I or someone I know is seeking care. Generate a first-person job description with less than 800 characters (including spaces) with the following traits.
            Only include the items in the traits that are the most important.

            Preferred Certifications and Training: ${
              certificationsAndTraining
                ? convertFilterKeysToLabels('certificationsAndTraining', certificationsAndTraining)
                : 'None'
            }
            Languages Needed:  ${convertFilterKeysToLabels('languagesSpoken', languagesSpoken)}
            Needed Care Types: ${convertFilterKeysToLabels('careTypes', careTypes)}
            Preferred Experience Areas: ${convertFilterKeysToLabels(
              'detailedCareNeeds',
              detailedCareNeeds
            )}
            Care Recipients Information: ${JSON.stringify(careRecipients)}
            Residence Type: ${convertFilterKeyToLabel('residenceType', residenceType)}
            Care Schedule Type: ${convertFilterKeyToLabel('scheduleType', scheduleType)}
            ${scheduleTimes}
    `;

  return prompt;
};

// ================ Action types ================ //

export const GENERATE_BIO_REQUEST = 'app/chatGPT/VERIFICATION_REQUEST';
export const GENERATE_BIO_SUCCESS = 'app/chatGPT/VERIFICATION_SUCCESS';
export const GENERATE_BIO_ERROR = 'app/chatGPT/VERIFICATION_ERROR';

export const GENERATE_JOB_DESCRIPTION_REQUEST = 'app/chatGPT/GENERATE_JOB_DESCRIPTION_REQUEST';
export const GENERATE_JOB_DESCRIPTION_SUCCESS = 'app/chatGPT/GENERATE_JOB_DESCRIPTION_SUCCESS';
export const GENERATE_JOB_DESCRIPTION_ERROR = 'app/chatGPT/GENERATE_JOB_DESCRIPTION_ERROR';

// ================ Reducer ================ //

const initialState = {
  generateBioInProgress: false,
  generateBioError: null,
  generatedBio: null,
  generateJobDescriptionInProgress: false,
  generateJobDescriptionError: null,
  generatedJobDescription: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case GENERATE_BIO_REQUEST:
      return {
        ...state,
        generateBioInProgress: true,
        generateBioError: null,
      };
    case GENERATE_BIO_SUCCESS:
      return { ...state, generateBioInProgress: false, generatedBio: payload };
    case GENERATE_BIO_ERROR:
      return { ...state, generateBioInProgress: false, generateBioError: payload };

    case GENERATE_JOB_DESCRIPTION_REQUEST:
      return {
        ...state,
        generateJobDescriptionInProgress: true,
        generateJobDescriptionError: null,
      };
    case GENERATE_JOB_DESCRIPTION_SUCCESS:
      return {
        ...state,
        generateJobDescriptionInProgress: false,
        generatedJobDescription: payload,
      };
    case GENERATE_JOB_DESCRIPTION_ERROR:
      return {
        ...state,
        generateJobDescriptionInProgress: false,
        generateJobDescriptionError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const generateBioRequest = () => ({ type: GENERATE_BIO_REQUEST });
export const generateBioSuccess = response => ({ type: GENERATE_BIO_SUCCESS, payload: response });
export const generateBioError = error => ({
  type: GENERATE_BIO_ERROR,
  payload: error,
  error: true,
});

export const generateJobDescriptionRequest = () => ({ type: GENERATE_JOB_DESCRIPTION_REQUEST });
export const generateJobDescriptionSuccess = response => ({
  type: GENERATE_JOB_DESCRIPTION_SUCCESS,
  payload: response,
});
export const generateJobDescriptionError = error => ({
  type: GENERATE_JOB_DESCRIPTION_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const generateBio = listing => async (dispatch, getState, sdk) => {
  dispatch(generateBioRequest());

  const prompt = generateBioPrompt(listing);

  try {
    const response = await chatGPTGenerateText({ prompt });

    await sdk.ownListings.update({
      id: listing.id.uuid,
      description: response.data,
    });

    dispatch(generateBioSuccess(response.data));
  } catch (e) {
    log.error(e, 'generate-bio-failed', { listingId: listing.id.uuid });
    dispatch(generateBioError(storableError(e)));
  }
};

export const generateJobDescription = listing => async (dispatch, getState, sdk) => {
  dispatch(generateJobDescriptionRequest());

  const prompt = generateJobDescriptionPrompt(listing);

  try {
    const response = await chatGPTGenerateText({ prompt });

    await sdk.ownListings.update({
      id: listing.id.uuid,
      description: response.data,
    });

    dispatch(generateJobDescriptionSuccess(response.data));
  } catch (e) {
    log.error(e, 'generate-job-description-failed', { listingId: listing.id.uuid });
    dispatch(generateJobDescriptionError(storableError(e)));
  }
};
