import React from 'react';
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

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingPricingPanel.title"
      values={{
        listingTitle: (
          <ListingLink listing={listing}>
            <FormattedMessage id="EditListingPricingPanel.listingTitle" />
          </ListingLink>
        ),
      }}
    />
  ) : (
    <FormattedMessage id="EditListingPricingPanel.createListingTitle" />
  );

  const rates = publicData && publicData.rates;

  const initialValues = {
    rates: rates && [rates[0] / 100, rates[1] / 100],
  };

  // const priceCurrencyValid =
  //   minPrice instanceof Money && maxPrice instanceof Money
  //     ? minPrice.currency === config.currency && maxPrice.currency === config.currency
  //     : true;
  const form = (
    <EditListingPricingForm
      className={css.form}
      initialValues={initialValues}
      onSubmit={values => {
        const { rates } = values;
        rates[0] *= 100;
        rates[1] *= 100;

        const updateValues = {
          publicData: {
            rates,
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
  // ) : (
  //   <div className={css.priceCurrencyInvalid}>
  //     <FormattedMessage id="EditListingPricingPanel.listingPriceCurrencyInvalid" />
  //   </div>
  // );

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
