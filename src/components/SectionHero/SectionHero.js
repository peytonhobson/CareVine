import React, { useEffect, useState, useRef } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { NamedLink, OwnListingLink, IconArrowHead, InlineTextButton } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { useCheckMobileScreen } from '../../util/hooks';
import { HeroSearchForm } from '../../forms';
import { routeConfiguration } from '../..';
import { createResourceLocatorString } from '../../util/routes';

import defaultBackgroundImage from '../../assets/elderly-vineyards_1440x922.jpg';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(true);
  const [BackgroundImageSet, setBackgroundImageSet] = useState(false);

  const isMobile = useCheckMobileScreen();

  const heroRef = useRef(null);

  const {
    rootClassName,
    className,
    userType,
    currentUserListing,
    currentUser,
    currentUserFetched,
    scrollToContent,
    history,
  } = props;

  const onScroll = () => {
    if (window.scrollY > 50) {
      setShowLearnMore(false);
    } else {
      setShowLearnMore(true);
    }
  };

  useEffect(() => {
    setMounted(true);

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (heroRef?.current) {
      const image = new Image();

      image.onload = () => {
        heroRef.current.style.background = `linear-gradient(-45deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)),
          url('${image.src}')`;
      };

      image.src = defaultBackgroundImage;
      setBackgroundImageSet(true);
    }
  }, [heroRef?.current]);

  const handleSearchSubmit = values => {
    const valOrigin = values.location.selectedPlace.origin;
    const origin = `${Number.parseFloat(valOrigin.lat).toFixed(5)}%2C${Number.parseFloat(
      valOrigin.lng
    ).toFixed(5)}`;

    history.push(`s?origin=${origin}&distance=30&listingType=caregiver`);
  };

  const classes = classNames(
    rootClassName || css.root,
    className,
    isMobile && !currentUser && css.middleHero
  );

  const itemsToBrowse = userType === CAREGIVER ? 'Jobs' : 'Caregivers';

  const geolocation = currentUserListing?.attributes.geolocation || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing?.attributes.publicData.location;

  let title = null;

  switch (userType) {
    case EMPLOYER:
      title = 'SectionHero.titleEmployer';
      break;
    case CAREGIVER:
      title = 'SectionHero.titleCaregiver';
      break;
    default:
      title = 'SectionHero.title';
  }

  const oppositeUserType =
    userType === EMPLOYER ? CAREGIVER : userType === CAREGIVER ? EMPLOYER : null;

  return (
    <div className={classes} ref={heroRef}>
      {currentUserFetched ? (
        currentUser ? (
          <div className={classNames(css.heroContent, isMobile && !currentUser && css.middleHero)}>
            <h1 className={classNames(css.heroMainTitle, { [css.heroMainTitleFEDelay]: mounted })}>
              <FormattedMessage id={title} />
            </h1>
            {userType === CAREGIVER ? (
              <h3 className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}>
                <FormattedMessage id="SectionHero.subTitleCaregiver" />
              </h3>
            ) : (
              <h3 className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}>
                <FormattedMessage id="SectionHero.subTitleEmployer" />
              </h3>
            )}
            {location ? (
              <NamedLink
                name="SearchPage"
                to={{
                  search: `?${origin}&${distance}&sort=relevant${oppositeUserType &&
                    `&listingType=${oppositeUserType}`}`,
                }}
                className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
              >
                <FormattedMessage id="SectionHero.browseButton" values={{ itemsToBrowse }} />
              </NamedLink>
            ) : userType ? (
              currentUserListing ? (
                <OwnListingLink
                  listing={currentUserListing}
                  listingFetched={!!currentUserListing}
                  className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
                >
                  <FormattedMessage id="SectionHero.finishYourProfileButton" />
                </OwnListingLink>
              ) : (
                <NamedLink
                  className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
                  name="NewListingPage"
                >
                  <FormattedMessage id="SectionHero.addYourProfileButton" />
                </NamedLink>
              )
            ) : null}
          </div>
        ) : (
          <div className={css.unAuthContainer}>
            <h1 className={css.yourCare}>Find Your Perfect Caregiver</h1>
            <h2 className={css.perfectCaregiver}>
              <div className={css.subPerfectCaregiver}>
                Private, independent, and experienced caregivers.{' '}
              </div>
              <div className={css.subPerfectCaregiver}>Find yours.</div>
            </h2>
            <HeroSearchForm
              className={css.heroSearchForm}
              onSubmit={handleSearchSubmit}
              isMobile={isMobile}
            />
          </div>
        )
      ) : null}

      {!isMobile && showLearnMore && (
        <div className={css.learnMoreButtonContainer} onClick={scrollToContent}>
          <InlineTextButton className={css.learnMoreButton}>
            Learn More <IconArrowHead direction="down" className={css.arrowHead} />
          </InlineTextButton>
        </div>
      )}
    </div>
  );
};

SectionHero.defaultProps = { rootClassName: null, className: null };

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
