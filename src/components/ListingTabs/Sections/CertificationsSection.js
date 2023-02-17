import React, { forwardRef } from 'react';

import { findOptionsForSelectFilter } from '../../../util/search';

import { SectionCard } from './';

import css from './sections.module.css';

const CertificationsSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const certificationsAndTrainingCardTitle = (
    <h1 className={css.title}>Certifications & Training</h1>
  );

  const publicData = listing?.attributes?.publicData;
  const { certificationsAndTraining } = publicData;

  const certificationsOptions = findOptionsForSelectFilter(
    'certificationsAndTraining',
    filterConfig
  );

  return (
    <SectionCard title={certificationsAndTrainingCardTitle} ref={ref}>
      {certificationsAndTraining?.length > 0 ? (
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
      ) : null}
    </SectionCard>
  );
});

export default CertificationsSection;
