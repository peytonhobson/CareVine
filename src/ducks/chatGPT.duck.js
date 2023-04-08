import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';
import { chatGPTGenerateText } from '../util/api';

const generateBioPrompt = listing => {
  const { publicData } = listing.attributes;

  const firstName = listing.author.attributes.profile.firstName;

  const {
    certificationsAndTraining,
    languagesSpoken,
    careTypes,
    experienceAreas,
    experienceLevel,
  } = publicData;

  const prompt = `Generate a first-person bio between 400 and 600 characters for a caregiver named ${firstName} who listed the following information on their profile to show to potential clients. Leave room for the caregiver to fill in some of their past history themselves:
            Certifications and Training: ${certificationsAndTraining}
            Languages Spoken: ${languagesSpoken}
            Care Types: ${careTypes}
            Experience Areas: ${experienceAreas}
            Experience Level: ${experienceLevel}
    `;

  return prompt;
};

// ================ Action types ================ //

export const GENERATE_BIO_REQUEST = 'app/chatGPT/VERIFICATION_REQUEST';
export const GENERATE_BIO_SUCCESS = 'app/chatGPT/VERIFICATION_SUCCESS';
export const GENERATE_BIO_ERROR = 'app/chatGPT/VERIFICATION_ERROR';

// ================ Reducer ================ //

const initialState = {
  generateBioInProgress: false,
  generateBioError: null,
  generatedBio: null,
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

// ================ Thunks ================ //

export const generateBio = listing => (dispatch, getState, sdk) => {
  dispatch(generateBioRequest());

  const prompt = generateBioPrompt(listing);

  return chatGPTGenerateText({ prompt })
    .then(response => {
      console.log(response);
      dispatch(generateBioSuccess(response.data));
    })
    .catch(e => {
      dispatch(generateBioError(storableError(e)));
    });
};
