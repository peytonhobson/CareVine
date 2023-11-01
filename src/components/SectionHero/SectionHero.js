import React, { useEffect, useState, useRef, useCallback } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { NamedLink, OwnListingLink, IconArrowHead, InlineTextButton } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { useCheckMobileScreen } from '../../util/hooks';
import UnauthenticatedContainer from './UnauthenticatedContainer';
import { useMediaQuery } from '@mui/material';

import backgroundImage from '../../assets/landing-background.jpg';
import mobileBackgroundImage from '../../assets/Landing-Mobile.jpg';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(true);

  const isMobile = useCheckMobileScreen();
  const isLarge = useMediaQuery('(min-width:1024px)');

  const imageRef = useRef(null);

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

  const heroRef = useCallback(node => {
    const image = new Image();

    image.onload = () => {
      if (!node) return;
      node.style.background = `url('${image.src}')`;
      node.style.backgroundColor = 'var(--matterColor)';
      node.style.backgroundPosition = 'center';
      node.style.backgroundSize = 'cover';
    };

    image.src = isLarge ? backgroundImage : mobileBackgroundImage;
    imageRef.current = image;
  }, []);

  useEffect(() => {
    if (imageRef?.current) {
      const isLarge = window.innerWidth > 1024;

      imageRef.current.src = isLarge ? backgroundImage : mobileBackgroundImage;
    }
  }, [isLarge]);

  const handleSearchSubmit = values => {
    const valOrigin = values.location.selectedPlace.origin;
    // Need to parse float twice to ensure no trailing zeros
    // If there are trailing zeros then urlHelpers parse will return null
    const lat = parseFloat(parseFloat(valOrigin.lat).toFixed(5));
    const lng = parseFloat(parseFloat(valOrigin.lng).toFixed(5));
    const origin = `${lat}%2C${lng}`;

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
          <UnauthenticatedContainer handleSearchSubmit={handleSearchSubmit} />
        )
      ) : null}

      <div className={css.learnMoreButtonContainer} onClick={scrollToContent}>
        {showLearnMore && (
          <InlineTextButton className={css.learnMoreButton}>
            Learn More{' '}
            <IconArrowHead direction="down" className={css.arrowHead} height="1em" width="1em" />
          </InlineTextButton>
        )}
      </div>
    </div>
  );
};

SectionHero.defaultProps = { rootClassName: null, className: null };

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
