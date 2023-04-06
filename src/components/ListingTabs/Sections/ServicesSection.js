import React, { forwardRef } from 'react';

import { findOptionsForSelectFilter } from '../../../util/search';
import classNames from 'classnames';

import { SectionCard } from './';

import css from './sections.module.css';

const ServicesSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const servicesCardTitle = <h1 className={css.title}>Services</h1>;

  const publicData = listing?.attributes?.publicData;
  const { careTypes, experienceAreas } = publicData;

  const experienceAreaOptions = findOptionsForSelectFilter('detailedCareNeeds', filterConfig);
  const careTypeOptions = findOptionsForSelectFilter('careTypes', filterConfig);

  return (
    <SectionCard title={servicesCardTitle} ref={ref}>
      <h2 className={classNames(css.subTitle, css.noTopMargin)}>Care Types:</h2>
      <ul className={css.itemContainer}>
        {careTypes?.map(service => {
          return currentUserListing?.attributes?.publicData?.careTypes?.includes(service) ? (
            <li className={css.sharedItem}>{findLabel(service, careTypeOptions)}</li>
          ) : (
            <li className={css.item}>{findLabel(service, careTypeOptions)}</li>
          );
        })}
      </ul>

      {experienceAreas?.length > 0 ? (
        <>
          <h2 className={css.subTitle}>Experience Areas:</h2>
          <ul className={css.itemContainer}>
            {experienceAreas?.map(area => {
              return currentUserListing?.attributes?.publicData?.detailedCareNeeds?.includes(
                area
              ) ? (
                <li className={css.sharedItem}>{findLabel(area, experienceAreaOptions)}</li>
              ) : (
                <li className={css.item}>{findLabel(area, experienceAreaOptions)}</li>
              );
            })}
          </ul>
        </>
      ) : null}
    </SectionCard>
  );
});

export default ServicesSection;
