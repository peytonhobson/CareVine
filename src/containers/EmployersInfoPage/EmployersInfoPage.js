import React from 'react';

import css from './EmployersInfoPage.module.css';

import landingImage from '../../assets/landing-background.jpg';

const EmployersInfoPage = () => {
  return (
    <div className={css.root}>
      <section className={css.hasSectionDivider}>
        <div
          className={css.hero}
          data-controller="SectionDivider"
          style={{ clipPath: 'url(#section-divider)', backgroundImage: `url(${landingImage})` }}
          data-controllers-bound="SectionDivider"
        ></div>
        <div
          className={css.sectionDividerDisplay}
          style={{
            strokeThickness: 0,
            strokeDasharray: 0,
            strokeLinecap: 'square',
          }}
        >
          <svg className={css.sectionDividerSvgClip}>
            <clipPath id="section-divider" clipPathUnits="objectBoundingBox">
              <path
                className={css.sectionDividerClip}
                d="M2, 0.876 L2, 1 l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124 L-1, -1 L2, -1 z"
              ></path>
            </clipPath>
          </svg>
          <svg className={css.sectionDividerSvgStroke} viewBox="0 0 1 1" preserveAspectRatio="none">
            <path
              className={css.sectionDividerStroke}
              d="M2, 0.876 L2, 1 l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124"
              vectorEffect="non-scaling-stroke"
            ></path>
          </svg>
        </div>
      </section>
    </div>
  );
};

export default EmployersInfoPage;
