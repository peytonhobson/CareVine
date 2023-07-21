import { types as sdkTypes } from './util/sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;

// An array of locations to show in the LocationAutocompleteInput when
// the input is in focus but the user hasn't typed in any search yet.
//
// Each item in the array should be an object with a unique `id` (String) and a
// `predictionPlace` (util.types.place) properties.
const defaultLocations = [
  {
    id: 'default-miami',
    predictionPlace: {
      address: 'Miami, Florida',
      origin: {
        _sdkType: 'LatLng',
        lat: 25.774173,
        lng: -80.19362,
      },
      bounds: new LatLngBounds(new LatLng(25.979434, -80.144468), new LatLng(25.515125, -80.8736)),
    },
  },
  {
    id: 'default-seattle',
    predictionPlace: {
      address: 'Seattle, Washington',
      origin: { _sdkType: 'LatLng', lat: 47.603832, lng: -122.330062 },
      bounds: new LatLngBounds(
        new LatLng(47.7779392908564, -122.216605992108),
        new LatLng(47.3403950185547, -122.441233019046)
      ),
    },
  },
  {
    id: 'default-new-york',
    predictionPlace: {
      address: 'New York City, New York',
      origin: {
        _sdkType: 'LatLng',
        lat: 40.73061111,
        lng: -73.98661111,
      },
      bounds: new LatLngBounds(
        new LatLng(40.917576401307, -73.7008392055224),
        new LatLng(40.477399, -74.2590879797556)
      ),
    },
  },
];
export default defaultLocations;
