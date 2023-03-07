import React from 'react';
import { bool, object, string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { propTypes, LISTING_STATE_DRAFT } from '../../util/types';
import { getListingType, createSlug } from '../../util/urlHelpers';
import { NamedLink } from '../../components';
import { LISTING_PAGE_PARAM_TYPE_DRAFT, LISTING_PAGE_PARAM_TYPE_NEW } from '../../util/urlHelpers';

import css from './OwnListingLink.module.css';

const newListingStates = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT];

const OwnListingLink = props => {
  const { className, listing, listingFetched, children } = props;

  if (!listingFetched) {
    return null;
  }

  if (!listing) {
    return (
      <NamedLink className={className ? className : css.defaultLinkStyle} name="NewListingPage">
        {children ? children : <FormattedMessage id="OwnListingLink.addYourListingLink" />}
      </NamedLink>
    );
  }

  const currentListing = ensureOwnListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', state } = currentListing.attributes;
  const slug = createSlug(title);
  const isDraft = state === LISTING_STATE_DRAFT;

  const listingType = currentListing.attributes.metadata.listingType;

  const isNewListing = newListingStates.includes(state);

  return (
    <NamedLink
      className={className ? className : css.yourListingsLink}
      name="EditListingPage"
      params={{
        id,
        slug,
        type: getListingType(isDraft),
        tab: listingType === 'employer' ? 'care-type' : 'services',
      }}
    >
      <span className={css.menuItemBorder} />
      {children ? (
        children
      ) : isNewListing ? (
        <FormattedMessage id="OwnListingLink.finishYourListingLink" />
      ) : (
        <FormattedMessage id="OwnListingLink.editYourListingLink" />
      )}
    </NamedLink>
  );
};

OwnListingLink.defaultProps = {
  className: null,
  listing: null,
  listingFetched: false,
  children: null,
};

OwnListingLink.propTypes = {
  className: string,
  listing: propTypes.ownListing,
  listingFetched: bool,
  children: object,
};

export default OwnListingLink;
