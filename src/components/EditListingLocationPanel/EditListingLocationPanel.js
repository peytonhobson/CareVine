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
    const { geolocation, publicData } = currentListing.attributes;

    // Only render current search if full place object is available in the URL params
    // TODO bounds are missing - those need to be queried directly from Google Places
    const locationFieldsPresent = publicData && publicData.location && geolocation;
    const location = publicData && publicData.location ? publicData.location : {};

    const travelDistanceFieldPresent = publicData && publicData.travelDistance;
    const travelDistance = publicData && publicData.travelDistance ? publicData.travelDistance : {};

    const nearBusLine = publicData && publicData.nearBusLine ? publicData.nearBusLine : null;

    return {
      location: locationFieldsPresent
        ? {
            search: location.zipcode,
            selectedPlace: { location, origin: geolocation },
          }
        : null,
      travelDistance: travelDistanceFieldPresent ? travelDistance : 15,
      nearBusLine,
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
            const { location, travelDistance, nearPublicTransit } = values;

            const {
              selectedPlace: { address, origin },
            } = location;

            const zipcode = address.split(' ')[2];
            const timezone = zipcodeToTimezone.lookup(zipcode);

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
                        city: address.split(',')[0],
                        state: address.split(',')[1].split(' ')[1],
                        zipcode,
                      },
                      travelDistance,
                    },
                  }
                : {
                    geolocation: origin,
                    publicData: {
                      location: {
                        city: address.split(',')[0],
                        state: address.split(',')[1].split(' ')[1],
                        zipcode,
                      },
                      nearPublicTransit: nearPublicTransitValue,
                      availabilityPlan: availabilityPlanMaybe,
                    },
                  };

            this.setState({
              initialValues: {
                location: { search: zipcode, selectedPlace: { address, origin } },
                travelDistance,
                nearPublicTransit: nearPublicTransitValue,
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
