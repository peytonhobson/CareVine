import React, { forwardRef } from 'react';

import { findOptionsForSelectFilter } from '../../../util/search';
import { SectionCard } from './';
import classNames from 'classnames';

import css from './sections.module.css';

const JobDescriptionSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const { careTypes } = listing?.attributes?.publicData;

  const jobDescriptionTitle = <h1 className={css.title}>About this job</h1>;

  const careTypeOptions = findOptionsForSelectFilter('careTypes', filterConfig);

  return (
    <SectionCard title={jobDescriptionTitle} ref={ref}>
      <h2 className={classNames(css.subTitle, css.noTopMargin)}>Description</h2>
      <p>{listing?.attributes?.description}</p>
      <h2 className={css.subTitle}>Care Types</h2>
      <ul className={css.itemContainer}>
        {careTypes?.map((service, index) => {
          return currentUserListing?.attributes?.publicData?.careTypes?.includes(service) ? (
            <li key={index} className={css.sharedItem}>
              {findLabel(service, careTypeOptions)}
            </li>
          ) : (
            <li key={index} className={css.item}>
              {findLabel(service, careTypeOptions)}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
});

export default JobDescriptionSection;
