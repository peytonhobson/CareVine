import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  ListingCard,
  PaginationLinks,
  CaregiverListingCard,
  EmployerListingCard,
} from '../../components';
import { EMPLOYER } from '../../util/constants';
import css from './SearchResultsPanel.module.css';

const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings,
    pagination,
    search,
    setActiveListing,
    currentUserType,
    currentUser,
    onContactUser,
    currentUserListing,
    onManageDisableScrolling,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="SearchPage"
        pageSearchParams={search}
        pagination={pagination}
      />
    ) : null;

  // Panel width relative to the viewport
  const panelMediumWidth = 50;
  const panelLargeWidth = 62.5;
  const cardRenderSizes = [
    '(max-width: 400px) 100vw',
    `(max-width: 600px) ${panelMediumWidth}vw`,
    `(max-width: 800px) ${panelLargeWidth / 2}vw`,
    `${panelLargeWidth / 3}vw`,
  ].join(', ');

  return (
    <div className={classes}>
      <div className={css.listingCards}>
        {listings.map(l =>
          currentUserType === EMPLOYER ? (
            <CaregiverListingCard
              className={css.listingCard}
              key={l.id.uuid}
              listing={l}
              renderSizes={cardRenderSizes}
              setActiveListing={setActiveListing}
              currentUser={currentUser}
              onContactUser={onContactUser}
              currentUserListing={currentUserListing}
            />
          ) : (
            <EmployerListingCard
              className={css.listingCard}
              key={l.id.uuid}
              listing={l}
              renderSizes={cardRenderSizes}
              setActiveListing={setActiveListing}
              currentUser={currentUser}
              onContactUser={onContactUser}
              currentUserListing={currentUserListing}
              onManageDisableScrolling={onManageDisableScrolling}
            />
          )
        )}
        {props.children}
      </div>
      {paginationLinks}
    </div>
  );
};

SearchResultsPanel.defaultProps = {
  children: null,
  className: null,
  listings: [],
  pagination: null,
  rootClassName: null,
  search: null,
};

const { array, node, object, string } = PropTypes;

SearchResultsPanel.propTypes = {
  children: node,
  className: string,
  listings: array,
  pagination: propTypes.pagination,
  rootClassName: string,
  search: object,
};

export default SearchResultsPanel;
