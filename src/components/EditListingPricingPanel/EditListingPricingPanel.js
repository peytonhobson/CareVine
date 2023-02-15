import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ListingLink } from '../../components';
import { EditListingPricingForm } from '../../forms';
import { ensureOwnListing } from '../../util/data';
import { types as sdkTypes } from '../../util/sdkLoader';
import config from '../../config';

import css from './EditListingPricingPanel.module.css';
import { isStartDateSelected } from '../FieldDateRangeInput/DateRangeInput.helpers';
import { CAREGIVER } from '../../util/constants';

const { Money } = sdkTypes;

const EditListingPricingPanel = props => {
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
  } = props;

  const [submittedValues, setSubmittedValues] = useState(null);

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { publicData, metadata } = currentListing.attributes;
  const listingType = metadata && metadata.listingType;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const titleValue =
    listingType === CAREGIVER ? (
      <span className={css.payRangeText}>
        <FormattedMessage id="EditListingPricingPanel.PayRange" />
      </span>
    ) : (
      <span className={css.payRangeText}>
        <FormattedMessage id="EditListingPricingPanel.PriceRange" />
      </span>
    );
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingPricingPanel.title"
      values={{
        payRange: titleValue,
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingPricingPanel.createListingTitle"
      values={{
        payRange: titleValue,
      }}
    />
  );

  const { minPrice, maxPrice } = publicData;
  const rates = minPrice && maxPrice ? [minPrice, maxPrice] : null;

  const initialValues = {
    rates: submittedValues
      ? submittedValues.rates.map(rate => rate)
      : rates
      ? rates.map(rate => rate / 100)
      : [15, 25],
  };

  const form = (
    <EditListingPricingForm
      className={css.form}
      initialValues={initialValues}
      onSubmit={values => {
        const { rates } = values;

        setSubmittedValues(values);

        const updateValues = {
          publicData: {
            minPrice: rates[0] * 100,
            maxPrice: rates[1] * 100,
          },
        };

        onSubmit(updateValues);
      }}
      onChange={onChange}
      saveActionMsg={submitButtonText}
      disabled={disabled}
      ready={ready}
      updated={panelUpdated}
      updateInProgress={updateInProgress}
      fetchErrors={errors}
    />
  );

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      {form}
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingPricingPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingPricingPanel.propTypes = {
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

export default EditListingPricingPanel;
