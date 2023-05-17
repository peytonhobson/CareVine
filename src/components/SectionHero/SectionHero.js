import React, { useEffect, useState, useRef } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import {
  NamedLink,
  Logo,
  OwnListingLink,
  IconArrowHead,
  InlineTextButton,
  Button,
} from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(true);

  const isMobile = useCheckMobileScreen();

  const {
    rootClassName,
    className,
    userType,
    currentUserListing,
    currentUser,
    currentUserFetched,
    scrollToContent,
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

  const classes = classNames(
    rootClassName || css.root,
    className,
    isMobile && !currentUser && css.middleHero
  );

  const itemsToBrowse = userType === CAREGIVER ? 'Jobs' : 'Caregivers';

  const geolocation = (currentUserListing && currentUserListing.attributes.geolocation) || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing && currentUserListing.attributes.publicData.location;

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
    <div className={classes}>
      {currentUserFetched && (
        <div className={classNames(css.heroContent, isMobile && !currentUser && css.middleHero)}>
          {currentUser ? (
            <>
              <h1
                className={classNames(css.heroMainTitle, { [css.heroMainTitleFEDelay]: mounted })}
              >
                <FormattedMessage id={title} />
              </h1>
              {userType === CAREGIVER ? (
                <h3
                  className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}
                >
                  <FormattedMessage id="SectionHero.subTitleCaregiver" />
                </h3>
              ) : (
                <h3
                  className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}
                >
                  <FormattedMessage id="SectionHero.subTitleEmployer" />
                </h3>
              )}
            </>
          ) : (
            <>
              <Logo format="hero" className={css.logo} alt="CareVine" />
              <h3
                className={classNames(css.heroSubTitle, isMobile && css.centered, {
                  [css.heroSubTitleFEDelay]: mounted,
                })}
              >
                <FormattedMessage id="SectionHero.subTitleUnAuth" />
              </h3>
            </>
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
          ) : (
            <div className={css.heroButtonContainer}>
              <NamedLink
                name="SignupPage"
                className={classNames(css.heroButtonUnAuth, {
                  [css.heroButtonFEDelay]: mounted,
                })}
              >
                <FormattedMessage id="SectionHero.signUpButton" values={{ itemsToBrowse }} />
              </NamedLink>
              <Button
                className={classNames(css.heroButtonUnAuth, {
                  [css.heroButtonFEDelay]: mounted,
                })}
                onClick={scrollToContent}
              >
                <FormattedMessage id="SectionHero.learnMoreButton" />
              </Button>
            </div>
          )}
        </div>
      )}

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
