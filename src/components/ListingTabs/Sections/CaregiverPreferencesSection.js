import React, { forwardRef } from 'react';
import { findOptionsForSelectFilter } from '../../../util/search';

import { SectionCard } from './';
import classNames from 'classnames';

import css from './sections.module.css';

const CaregiverPreferencesSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const {
    certificationsAndTraining,
    additionalInfo,
    languagesSpoken,
    idealCaregiverDetails,
  } = listing?.attributes?.publicData;

  const caregiverPreferencesTitle = <h1 className={css.title}>Caregiver Preferences</h1>;

  const certificationsOptions = findOptionsForSelectFilter(
    'certificationsAndTraining',
    filterConfig
  );
  const additionalInfoOptions = findOptionsForSelectFilter('additionalInfo', filterConfig);
  const languageOptions = findOptionsForSelectFilter('languagesSpoken', filterConfig);

  return (
    <SectionCard title={caregiverPreferencesTitle} ref={ref}>
      {idealCaregiverDetails?.trim() !== '' && (
        <>
          <h2 className={classNames(css.subTitle, css.noTopMargin)}>About</h2>
          <p>{idealCaregiverDetails}</p>
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
      {certificationsAndTraining?.length > 0 ? (
        <>
          <h2 className={css.subTitle}>Certifications/Training</h2>
          <ul className={css.itemContainer}>
            {certificationsAndTraining?.map((certification, index) => {
              return currentUserListing?.attributes?.publicData?.certificationsAndTraining?.includes(
                certification
              ) ? (
                <li key={index} className={css.sharedItem}>
                  {findLabel(certification, certificationsOptions)}
                </li>
              ) : (
                <li key={index} className={css.item}>
                  {findLabel(certification, certificationsOptions)}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      {additionalInfo?.length > 0 && (
        <>
          <h2 className={css.subTitle}>Other</h2>
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
    </SectionCard>
  );
});

export default CaregiverPreferencesSection;
