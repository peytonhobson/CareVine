import React from 'react';

import { useCheckMobileScreen } from '../../util/hooks';
import { HeroSearchForm } from '../../forms';

import css from './SectionHero.module.css';

const UnauthenticatedContainer = props => {
  const { handleSearchSubmit } = props;

  const isMobile = useCheckMobileScreen();

  const DesktopCard = ({ children }) =>
    isMobile ? <>{children}</> : <div className={css.desktopCard}>{children}</div>;

  return (
    <div className={css.unAuthContainer}>
      <h1 className={css.yourCare}>
        Find <span style={{ color: 'var(--marketplaceColor)' }}>Local Caregivers</span>
        <br></br> For Your <br></br>{' '}
        <span style={{ color: 'var(--marketplaceColor)' }}>Home Care</span> Needs.
      </h1>
      <DesktopCard>
        <div className={css.stepContainer}>
          <div className={css.step}>
            <h2 className={css.stepIcon}>1</h2>
            <div className={css.stepDescription}>
              <h2>Browse</h2>
              <p>from local caregivers that fit your needs</p>
            </div>
          </div>
          <div className={css.step}>
            <h2 className={css.stepIcon}>2</h2>
            <div className={css.stepDescription}>
              <h2>Select</h2>
              <p>the caregiver you want to hire</p>
            </div>
          </div>
          <div className={css.step}>
            <h2 className={css.stepIcon}>3</h2>
            <div className={css.stepDescription}>
              <h2>Book</h2>
              <p>with our easy-to-use booking system</p>
            </div>
          </div>
        </div>
        {isMobile ? <h2 className={css.inArea}>See Who's In Your Area</h2> : null}
        <HeroSearchForm
          className={css.heroSearchForm}
          onSubmit={handleSearchSubmit}
          isMobile={isMobile}
        />
      </DesktopCard>
    </div>
  );
};

export default UnauthenticatedContainer;
