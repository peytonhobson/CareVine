import React, { forwardRef } from 'react';

import { findOptionsForSelectFilter } from '../../../util/search';
import { convertFilterKeyToLabel } from '../../../util/data';
import { SectionCard } from './';
import classNames from 'classnames';

import css from './sections.module.css';

const JobDescriptionSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const { careTypes, nearPublicTransit } = listing?.attributes?.publicData;

  const additionalInfo = currentUserListing?.attributes?.publicData?.addiitonalInfo;
  const hasCar = additionalInfo?.includes('hasCar');

  const jobDescriptionTitle = <h1 className={css.title}>About this job</h1>;

  const careTypeOptions = findOptionsForSelectFilter('careTypes', filterConfig);
  const nearPublicTransitLabel = convertFilterKeyToLabel('nearPublicTransit', nearPublicTransit);

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
      <h2 className={css.subTitle}>Near Public Transit</h2>
      <ul className={css.itemContainer}>
        <li className={!hasCar ? css.sharedItem : css.item}>{nearPublicTransitLabel}</li>
      </ul>
    </SectionCard>
  );
});

export default JobDescriptionSection;
