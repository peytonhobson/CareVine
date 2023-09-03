import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureOwnListing } from '../../util/data';
import { ListingLink } from '../../components';
import { EditListingLocationForm } from '../../forms';
import { CAREGIVER } from '../../util/constants';
import zipcodeToTimezone from 'zipcode-to-timezone';
import parser from 'parse-address';

import css from './EditListingLocationPanel.module.css';

const stateMap = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

const findZipcode = address => {
  const addressArray = address.split(' ');

  const digitArray = addressArray.filter(word => {
    return word.trim().match(/\d+/g);
  });

  return digitArray[digitArray.length - 1].trim().replace(/\D/g, '');
};

const findCity = address => {
  const addressArray = address.split(',');
  const city = addressArray[1];

  return city.trim();
};

const findState = address => {
  const states = Object.keys(stateMap);

  const state = states.find(state => {
    return address.includes(state);
  });

  return stateMap[state];
};

class EditListingLocationPanel extends Component {
  constructor(props) {
    super(props);

    this.getInitialValues = this.getInitialValues.bind(this);

    this.state = {
      initialValues: this.getInitialValues(),
    };
  }

  getInitialValues() {
    const { listing } = this.props;
    const currentListing = ensureOwnListing(listing);
    const { geolocation, publicData, privateData } = currentListing.attributes;

    // Only render current search if full place object is available in the URL params
    const locationFieldsPresent = privateData && privateData.address && geolocation;
    const address = privateData && privateData.address ? privateData.address : {};

    const travelDistanceFieldPresent = publicData && publicData.travelDistance;
    const travelDistance = publicData && publicData.travelDistance ? publicData.travelDistance : {};

    const nearPublicTransit = publicData.nearPublicTransit ? publicData.nearPublicTransit : null;
    const residenceType = publicData.residenceType?.length > 0 ? publicData.residenceType[0] : null;

    return {
      location: locationFieldsPresent
        ? {
            search: address.fullAddress,
            selectedPlace: { address: address.fullAddress, origin: geolocation },
          }
        : null,
      travelDistance: travelDistanceFieldPresent ? travelDistance : 15,
      nearPublicTransit: nearPublicTransit,
      residenceType,
    };
  }

  render() {
    const {
      className,
      rootClassName,
      listing,
      disabled,
      ready,
      onSubmit,
      onChange,
      submitButtonText,
      panelUpdated,
      updateInProgress,
      errors,
      currentUser,
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);
    const currentListing = ensureOwnListing(listing);

    const isPublished =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
    const panelTitle = isPublished ? (
      <FormattedMessage
        id="EditListingLocationPanel.title"
        values={{
          location: (
            <span className={css.locationText}>
              <FormattedMessage id="EditListingLocationPanel.location" />
            </span>
          ),
        }}
      />
    ) : (
      <FormattedMessage
        id="EditListingLocationPanel.createListingTitle"
        values={{
          location: (
            <span className={css.locationText}>
              <FormattedMessage id="EditListingLocationPanel.createListingLocation" />
            </span>
          ),
        }}
      />
    );

    const { userType } = currentUser && currentUser.attributes.profile.metadata;

    return (
      <div className={classes}>
        <h1 className={css.title}>{panelTitle}</h1>
        <EditListingLocationForm
          className={css.form}
          initialValues={this.state.initialValues}
          onSubmit={values => {
            const { location, travelDistance, nearPublicTransit, residenceType } = values;

            this.setState({ residenceType: [residenceType] });

            const {
              selectedPlace: { address, origin },
            } = location;

            const parsedAddress = parser.parseLocation(address);

            const timezone = zipcodeToTimezone.lookup(parsedAddress.zip);

            const availabilityPlanMaybe =
              currentListing.attributes.publicData.availabilityPlan ||
              currentListing.attributes.publicData.careSchedule;

            if (availabilityPlanMaybe) {
              availabilityPlanMaybe.timezone = timezone;
            }

            if (!parsedAddress.zip) {
              const zipcode = findZipcode(address);
              parsedAddress.zip = zipcode;
            }

            if (!parsedAddress.city) {
              const city = findCity(address);
              parsedAddress.city = city;
            }

            if (!parsedAddress.state) {
              const state = findState(address);
              parsedAddress.state = state;
            }

            const updateValues =
              userType === CAREGIVER
                ? {
                    geolocation: origin,
                    publicData: {
                      location: {
                        city: parsedAddress.city,
                        state: parsedAddress.state,
                        zipcode: parsedAddress.zip,
                      },
                      travelDistance,
                    },
                    privateData: {
                      address: { ...parsedAddress, fullAddress: address },
                    },
                  }
                : {
                    geolocation: origin,
                    publicData: {
                      location: {
                        city: parsedAddress.city,
                        state: parsedAddress.state,
                        zipcode: parsedAddress.zip,
                      },
                      nearPublicTransit,
                      availabilityPlan: availabilityPlanMaybe,
                      residenceType: [residenceType],
                    },
                    privateData: {
                      address: {
                        ...parsedAddress,
                        fullAddress: address,
                      },
                    },
                  };

            this.setState({
              initialValues: {
                location: { search: address, selectedPlace: { address, origin } },
                travelDistance,
                nearPublicTransit,
                residenceType,
              },
            });
            onSubmit(updateValues);
          }}
          onChange={onChange}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
          userType={userType}
        />
      </div>
    );
  }
}

const { func, object, string, bool } = PropTypes;

EditListingLocationPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingLocationPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingLocationPanel;
