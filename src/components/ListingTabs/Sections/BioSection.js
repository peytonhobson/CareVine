import React, { forwardRef } from 'react';

import { SectionCard } from './';

import css from './sections.module.css';

const BioSection = forwardRef((props, ref) => {
  const { listing } = props;

  const authorName = listing?.author?.attributes?.profile?.displayName?.split(' ')[0];

  const bioCardTitle = <h1 className={css.title}>About {authorName}</h1>;

  return (
    <SectionCard title={bioCardTitle} ref={ref}>
      <p>{listing?.attributes?.description}</p>
    </SectionCard>
  );
});

export default BioSection;
