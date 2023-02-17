import React, { forwardRef } from 'react';

import { findOptionsForSelectFilter } from '../../../util/search';

import { SectionCard } from './';

import css from './sections.module.css';

const AdditionalInfoSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const additionalInfoCardTitle = <h1 className={css.title}>Additional Info</h1>;

  const publicData = listing?.attributes?.publicData;
  const { additionalInfo, languagesSpoken } = publicData;

  const additionalInfoOptions = findOptionsForSelectFilter('additionalInfo', filterConfig);
  const languageOptions = findOptionsForSelectFilter('languagesSpoken', filterConfig);

  return (
    <SectionCard title={additionalInfoCardTitle} ref={ref}>
      {additionalInfo?.length > 0 && (
        <>
          <h2 className={css.subTitle}>Additional</h2>
          <ul className={css.itemContainer}>
            {additionalInfo?.map((info, index) => {
              return currentUserListing?.attributes?.publicData?.additionalInfo?.includes(info) ? (
                <li key={index} className={css.sharedItem}>
                  {findLabel(info, additionalInfoOptions).replace('Have', 'Has')}
                </li>
              ) : (
                <li key={index} className={css.item}>
                  {findLabel(info, additionalInfoOptions).replace('Have', 'Has')}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {languagesSpoken?.length > 0 && (
        <>
          <h2 className={css.subTitle}>Languages</h2>
          <ul className={css.itemContainer}>
            {languagesSpoken?.map((language, index) => {
              const label = findLabel(language, languageOptions);
              return currentUserListing?.attributes?.publicData?.languagesSpoken?.includes(
                language
              ) ? (
                <li key={index} className={css.sharedItem}>
                  {label ? label : language}
                </li>
              ) : (
                <li key={index} className={css.item}>
                  {label ? label : language}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </SectionCard>
  );
});

export default AdditionalInfoSection;
