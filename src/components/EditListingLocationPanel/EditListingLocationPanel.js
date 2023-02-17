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

    const nearBusLine = publicData && publicData.nearBusLine ? publicData.nearBusLine : null;
    const residenceType = publicData && publicData.residenceType ? publicData.residenceType : null;

    return {
      location: locationFieldsPresent
        ? {
            search: address.fullAddress,
            selectedPlace: { address, origin: geolocation },
          }
        : null,
      travelDistance: travelDistanceFieldPresent ? travelDistance : 15,
      nearBusLine,
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
            const { location, travelDistance, nearPublicTransit = [], residenceType } = values;

            const {
              selectedPlace: { address, origin },
            } = location;

            const parsedAddress = parser.parseLocation(address);

            const timezone = zipcodeToTimezone.lookup(parsedAddress.zip);

            const availabilityPlanMaybe = currentListing.attributes.publicData.availabilityPlan;

            if (availabilityPlanMaybe) {
              availabilityPlanMaybe.timezone = timezone;
            }

            const nearPublicTransitValue = nearPublicTransit.length > 0 ? true : false;

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
                      nearPublicTransit: nearPublicTransitValue,
                      availabilityPlan: availabilityPlanMaybe,
                      residenceType,
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
                nearPublicTransit: nearPublicTransitValue,
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
