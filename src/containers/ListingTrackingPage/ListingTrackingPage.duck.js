import { getProdListings } from '../../util/api';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

const whiteListedCaregiverIds = [
  '646cfff8-1bac-4cf8-ab52-5171c1322e68',
  '646d0a79-bc93-43ad-8fcd-ed7acce16f20',
  '646d128f-618b-4986-9ffb-5c05cb65afc1',
  '646d23fa-4c97-48fb-976c-106f92b58933',
  '646d30ef-89fb-43a7-b8db-9c4aa3940252',
  '646d352d-b1c1-4e6a-90ed-9059bba066ca',
  '646d3aa3-a683-44f5-be23-947a4987e3b1',
  '646d41a1-213d-4ee1-a6ff-b44c0ddaff7e',
  '646d6371-35fc-442d-83c2-c77f9dec75da',
  '646d666d-4c2d-47a3-a7dd-773b57a02955',
  '646d6938-2bb0-4949-b8e4-e69132076b9c',
  '646e251e-f57b-4bfc-9282-f17f84cbff41',
  '646e276c-17bf-448e-8fa5-2767cddd12f1',
  '646e2e04-8bf3-451d-8792-31b3f7fc0067',
  '647a3963-6cb9-4dbe-91f0-d50461aed926',
  '647a3fa1-1326-450e-b502-14ef5285bc25',
  '647a41a7-36f7-45cb-b97e-4f5ab4b548ff',
  '647a4b35-3a5a-4a85-b6f4-45d32852cd9e',
  '647a4cee-14cb-4491-9e94-68111fc84b2d',
  '647b8173-e960-4713-b8f1-3b71bb13db3c',
  '647b8492-aaa9-4af5-8652-b5861603affa',
  '647b8962-031c-456f-b74f-86ec443d27a2',
  '647b8c08-3a97-4882-a764-b7193df46530',
  '647b8df5-6fce-4239-a87d-5debcdee22e6',
  '647b9213-d01e-4686-9e57-9993cebac5f1',
  '647b9379-78ae-45de-b9c3-da973b42cd9e',
  '647ba33d-228b-408a-b6f2-1e6011ddf595',
  '647ca8ac-7aa4-41ac-acc9-27089c8abf06',
  '647caffb-bdc3-41ed-a24f-9370f487082d',
  '647cb211-5a1f-4ef7-9f6a-a6a02d3bd8c7',
  '647d1155-5155-491b-aca9-30c103bfd80f',
  '647d1304-b878-4d56-a0eb-139c04781a6d',
  '647d171a-1050-4b52-b805-051c0c944d06',
  '647d1919-ae23-4c64-a02f-98d60b9aabe3',
  '647d1aad-afc7-4e3e-91de-1e687871966a',
  '647dfd75-367d-4507-8e82-6c395c2537f3',
  '647e0034-db5b-44ae-b835-e694538ec1df',
  '6480d22c-ebb4-481a-bc0f-ee50c2a3ff64',
  '6480d772-9da3-4e95-916d-67c88474f815',
  '6480d9e0-2cd6-4fcf-8d46-9df242c7e497',
  '6480e115-b383-4b5d-a966-b3b517d9a399',
  '6480e2ea-aa0b-4c7b-84b1-711755cb6ee4',
];

// ================ Action types ================ //

export const SHOW_LISTINGS_REQUEST = 'app/ListingTrackingPage/SHOW_LISTINGS_REQUEST';
export const SHOW_LISTINGS_SUCCESS = 'app/ListingTrackingPage/SHOW_LISTINGS_SUCCESS';
export const SHOW_LISTINGS_ERROR = 'app/ListingTrackingPage/SHOW_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  geolocations: [],
};

const ListingTrackingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SHOW_LISTINGS_REQUEST:
      return {
        ...state,
        geolocations: [],
      };
    case SHOW_LISTINGS_SUCCESS:
      return {
        ...state,
        geolocations: payload,
      };
    case SHOW_LISTINGS_ERROR:
      return {
        ...state,
        geolocations: [],
      };

    default:
      return state;
  }
};

export default ListingTrackingPageReducer;

// ================ Action creators ================ //

export const showListingsRequest = () => ({
  type: SHOW_LISTINGS_REQUEST,
});

export const showListingsSuccess = response => ({
  type: SHOW_LISTINGS_SUCCESS,
  payload: response,
});

export const showListingsError = e => ({
  type: SHOW_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const showListings = () => (dispatch, getState, sdk) => {
  dispatch(showListingsRequest());

  return getProdListings({ listingType: 'caregiver' })
    .then(l => {
      console.log(l.data);
      const listings = l.data.filter(
        listing => !whiteListedCaregiverIds.includes(listing.relationships.author.data.id.uuid)
      );

      console.log(listings.find(l => !l.relationships.author.data.id.uuid));

      const geolocations = listings?.map(listing => {
        return {
          lat: listing.attributes.geolocation?.lat,
          lng: listing.attributes.geolocation?.lng,
          id: listing.id.uuid,
        };
      });

      console.log(geolocations.length);

      dispatch(showListingsSuccess(geolocations));
    })
    .catch(e => {
      console.log(e);
    });
};
