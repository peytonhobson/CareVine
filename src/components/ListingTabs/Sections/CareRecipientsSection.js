import React, { forwardRef } from 'react';
import { findOptionsForSelectFilter } from '../../../util/search';

import { SectionCard } from './';

import css from './sections.module.css';

const CareRecipientsSection = forwardRef((props, ref) => {
  const { listing, currentUserListing, filterConfig, findLabel } = props;

  const { careRecipients, detailedCareNeeds, recipientDetails } = listing?.attributes?.publicData;

  const careRecipientsTitle = <h1 className={css.title}>Care Recipient(s)</h1>;

  const ageOptions = findOptionsForSelectFilter('recipientAge', filterConfig);
  const genderOptions = findOptionsForSelectFilter('gender', filterConfig);
  const relationshipOptions = findOptionsForSelectFilter('recipientRelationship', filterConfig);
  const careNeedsOptions = findOptionsForSelectFilter('detailedCareNeeds', filterConfig);

  return (
    <SectionCard title={careRecipientsTitle} ref={ref}>
      <div className={css.recipients}>
        {careRecipients?.map((recipient, index) => {
          const { recipientRelationship, gender, age } = recipient;
          const recipientRelationshipLabel = findLabel(recipientRelationship, relationshipOptions);
          const genderLabel = findLabel(gender, genderOptions);
          const ageLabel = findLabel(age, ageOptions);
          return (
            <div key={index} className={css.recipient}>
              <h3 className={css.recipientLabel}>Recipient {index + 1}:</h3>
              <div className={css.recipientTraitsContainer}>
                <span className={css.recipientTrait}>
                  Relationship: {recipientRelationshipLabel}
                </span>
                <span className={css.recipientTrait}>Gender: {genderLabel}</span>
                <span className={css.recipientTrait}>Age: {ageLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
      <h2 className={css.subTitle}>Care Needs</h2>
      <ul className={css.itemContainer}>
        {detailedCareNeeds?.map((need, index) => {
          return currentUserListing?.attributes?.publicData?.experienceAreas?.includes(need) ? (
            <li key={index} className={css.sharedItem}>
              {findLabel(need, careNeedsOptions)}
            </li>
          ) : (
            <li key={index} className={css.item}>
              {findLabel(need, careNeedsOptions)}
            </li>
          );
        })}
      </ul>
      {recipientDetails && (
        <>
          <h2 className={css.subTitle}>Additional Info</h2>
          <p>{recipientDetails}</p>
        </>
      )}
    </SectionCard>
  );
});

export default CareRecipientsSection;
