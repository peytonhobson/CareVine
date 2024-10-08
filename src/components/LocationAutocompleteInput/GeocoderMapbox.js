import { types as sdkTypes } from '../../util/sdkLoader';
import { userLocation } from '../../util/maps';
import config from '../../config';
import queryString from 'query-string';

const { LatLng: SDKLatLng, LatLngBounds: SDKLatLngBounds } = sdkTypes;

export const CURRENT_LOCATION_ID = 'current-location';

const GENERATED_BOUNDS_DEFAULT_DISTANCE = 500; // meters
// Distances for generated bounding boxes for different Mapbox place types
const PLACE_TYPE_BOUNDS_DISTANCES = {
  address: 500,
  country: 2000,
  region: 2000,
  postcode: 2000,
  district: 2000,
  place: 2000,
  locality: 2000,
  neighborhood: 2000,
  poi: 2000,
  'poi.landmark': 2000,
};

const locationBounds = (latlng, distance) => {
  if (!latlng) {
    return null;
  }

  const bounds = new window.mapboxgl.LngLat(latlng.lng, latlng.lat).toBounds(distance);
  return new SDKLatLngBounds(
    new SDKLatLng(bounds.getNorth(), bounds.getEast()),
    new SDKLatLng(bounds.getSouth(), bounds.getWest())
  );
};

const placeOrigin = prediction => {
  if (prediction && Array.isArray(prediction.center) && prediction.center.length === 2) {
    // Coordinates in Mapbox features are represented as [longitude, latitude].
    return new SDKLatLng(prediction.center[1], prediction.center[0]);
  }
  return null;
};

const placeBounds = prediction => {
  if (prediction) {
    if (Array.isArray(prediction.bbox) && prediction.bbox.length === 4) {
      // Bounds in Mapbox features are represented as [minX, minY, maxX, maxY]
      return new SDKLatLngBounds(
        new SDKLatLng(prediction.bbox[3], prediction.bbox[2]),
        new SDKLatLng(prediction.bbox[1], prediction.bbox[0])
      );
    } else {
      // If bounds are not available, generate them around the origin

      // Resolve bounds distance based on place type
      const placeType = Array.isArray(prediction.place_type) && prediction.place_type[0];

      const distance =
        (placeType && PLACE_TYPE_BOUNDS_DISTANCES[placeType]) || GENERATED_BOUNDS_DEFAULT_DISTANCE;

      return locationBounds(placeOrigin(prediction), distance);
    }
  }
  return null;
};

// Reverse geoencode the latitude and longtude coordinates
// to return the address of a given location.
export const getPlaceAddress = async place => {
  const returnType = { types: 'postcode' };
  const limitCountriesMaybe = config.maps.search.countryLimit
    ? { country: config.maps.search.countryLimit }
    : {};

  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    place.origin.lng +
    ',' +
    place.origin.lat +
    '.json?' +
    queryString.stringify(limitCountriesMaybe) +
    '&' +
    queryString.stringify(returnType) +
    '&' +
    'access_token=' +
    process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await response.json();
  return body.features[0].place_name.replace(', United States', '');
};

// Reverse geoencode the latitude and longtude coordinates
// to return the address of a given location.
export const getPlaceOrigin = async place => {
  const limitCountriesMaybe = config.maps.search.countryLimit
    ? { country: config.maps.search.countryLimit }
    : {};

  place = place.replace(' ', '%20');

  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    place +
    '.json?' +
    'access_token=' +
    process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await response.json();
  return (body && body.features && body.features[0] && body.features[0].center) || null;
};

export const GeocoderAttribution = () => null;

/**
 * A forward geocoding (place name -> coordinates) implementation
 * using the Mapbox Geocoding API.
 */
class GeocoderMapbox {
  getClient() {
    const libLoaded = typeof window !== 'undefined' && window.mapboxgl && window.mapboxSdk;
    if (!libLoaded) {
      throw new Error('Mapbox libraries are required for GeocoderMapbox');
    }
    if (!this._client) {
      this._client = window.mapboxSdk({
        accessToken: window.mapboxgl.accessToken,
      });
    }
    return this._client;
  }

  // Public API
  //

  /**
   * Search places with the given name.
   *
   * @param {String} search query for place names
   *
   * @return {Promise<{ search: String, predictions: Array<Object>}>}
   * results of the geocoding, should have the original search query
   * and an array of predictions. The format of the predictions is
   * only relevant for the `getPlaceDetails` function below.
   */
  getPlacePredictions(search, searchType = ['address']) {
    const limitCountriesMaybe = config.maps.search.countryLimit
      ? { countries: config.maps.search.countryLimit }
      : {};

    return this.getClient()
      .geocoding.forwardGeocode({
        query: search,
        limit: 5,
        ...limitCountriesMaybe,
        language: [config.locale],
        types: searchType,
      })
      .send()
      .then(response => {
        return {
          search,
          predictions: response.body.features,
        };
      });
  }

  getPostalCodePredictions(search) {
    const limitCountriesMaybe = config.maps.search.countryLimit
      ? { countries: config.maps.search.countryLimit }
      : {};

    return this.getClient()
      .geocoding.forwardGeocode({
        query: search,
        limit: 5,
        ...limitCountriesMaybe,
        language: [config.locale],
        types: ['postcode'],
      })
      .send()
      .then(response => {
        return {
          search,
          predictions: response.body.features,
        };
      });
  }

  /**
   * Get the ID of the given prediction.
   */
  getPredictionId(prediction) {
    return prediction.id;
  }

  /**
   * Get the address text of the given prediction.
   */
  getPredictionAddress(prediction) {
    if (prediction.predictionPlace) {
      // default prediction defined above
      return prediction.predictionPlace.address;
    }
    // prediction from Mapbox geocoding API
    return prediction.place_name;
  }

  /**
   * Fetch or read place details from the selected prediction.
   *
   * @param {Object} prediction selected prediction object
   *
   * @return {Promise<util.propTypes.place>} a place object
   */
  getPlaceDetails(prediction) {
    if (this.getPredictionId(prediction) === CURRENT_LOCATION_ID) {
      return userLocation().then(latlng => {
        return {
          address: '',
          origin: latlng,
          bounds: locationBounds(latlng, config.maps.search.currentLocationBoundsDistance),
        };
      });
    }

    if (prediction.predictionPlace) {
      return Promise.resolve(prediction.predictionPlace);
    }

    return Promise.resolve({
      address: this.getPredictionAddress(prediction),
      origin: placeOrigin(prediction),
      bounds: placeBounds(prediction),
    });
  }
}

export default GeocoderMapbox;
