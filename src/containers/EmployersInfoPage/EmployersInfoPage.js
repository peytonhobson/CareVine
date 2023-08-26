import React, { useEffect, useState } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
  PrimaryButton,
} from '../../components';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { TopbarContainer } from '../../containers';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './EmployersInfoPage.module.css';

import landingImage from '../../assets/about-us.jpg';
import backgroundCheckImage from '../../assets/Magnify-BG.png';

const EmployersInfoPage = props => {
  const { scrollingDisabled } = props;

  const yourselfRef = React.useRef(null);
  const scribbleRef = React.useRef(null);
  const ensureRef = React.useRef(null);
  const scribbleRef2 = React.useRef(null);
  const bookingsRef = React.useRef(null);
  const scribbleRef3 = React.useRef(null);

  const isMobile = useCheckMobileScreen();

  const positionScribble = (reference, scribble) => {
    if (reference.current && scribble.current) {
      const parentRect = reference.current.parentElement.parentElement.parentElement.getBoundingClientRect();
      const rect = reference.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const top = rect.top - parentRect.top;
      const left = rect.left - parentRect.left;

      const scribbleNode = scribble.current;
      scribbleNode.style.top = `${top}px`;
      scribbleNode.style.left = `${left}px`;
      scribbleNode.style.width = `${width}px`;
      scribbleNode.style.height = `${height}px`;
      scribbleNode.style.fontSize = `${height - 60}px`;
    }
  };

  useEffect(() => {
    window.addEventListener('resize', () => positionScribble(yourselfRef, scribbleRef));
    window.addEventListener('resize', () => positionScribble(ensureRef, scribbleRef2));
    window.addEventListener('resize', () => positionScribble(bookingsRef, scribbleRef3));

    // Call handler right away so state gets updated with initial window size
    positionScribble(yourselfRef, scribbleRef);
    positionScribble(ensureRef, scribbleRef2);
    positionScribble(bookingsRef, scribbleRef3);
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', () => positionScribble(yourselfRef, scribbleRef));
      window.removeEventListener('resize', () => positionScribble(ensureRef, scribbleRef2));
      window.removeEventListener('resize', () => positionScribble(bookingsRef, scribbleRef3));
    };
  }, [yourselfRef?.current, scribbleRef?.current, ensureRef?.current, scribbleRef2?.current]);

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      // description={schemaDescription}
      // title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        // description: schemaDescription,
        // name: schemaTitle,
        // image: [schemaImage],
      }}
    >
      <LayoutWrapperTopbar>
        <TopbarContainer
          currentPage="ForCaregiversPage"
          desktopClassName={css.topbarDesktop}
          mobileClassName={css.topbarMobile}
        />
      </LayoutWrapperTopbar>
      <LayoutSingleColumn>
        <LayoutWrapperMain>
          <section className={css.hasSectionDivider}>
            <div
              className={css.sectionHero}
              style={{
                clipPath: 'url(#section-divider)',
              }}
            >
              {/* TODO: Change alt */}
              <img src={landingImage} alt="About Us" />
            </div>
            <div className={css.sectionContent}>
              <div>
                <h1>
                  Find Local Caregivers<br></br>
                  For Your Home
                </h1>
              </div>
            </div>
            <div
              className={css.sectionDividerDisplay}
              style={{
                strokeThickness: 0,
                strokeDasharray: 0,
                strokeLinecap: 'square',
              }}
            >
              <div className={css.sectionDividerBlock}></div>
              <svg className={css.sectionDividerSvgClip}>
                <clipPath id="section-divider" clipPathUnits="objectBoundingBox">
                  <path
                    className={css.sectionDividerClip}
                    d="M2, 0.876 L2, 1 l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124 L-1, -1 L2, -1 z"
                  ></path>
                </clipPath>
              </svg>
              <svg
                className={css.sectionDividerSvgStroke}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                <path
                  className={css.sectionDividerStroke}
                  d="M2, 0.876 L2, 1 l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124l0,0 c-0.25,0 -0.5,0 -1,-0.124 l0,0.124"
                  vectorEffect="non-scaling-stroke"
                ></path>
              </svg>
            </div>
          </section>
          <section className={css.contentSection}>
            <div className={css.contentWrapper}>
              {!isMobile ? (
                <div className={css.contentMain}>
                  <img className={css.landingImage} src={landingImage} alt="About Us" />
                </div>
              ) : null}
              <div className={css.contentSide}>
                <div>
                  <h2>
                    Book the right care for <span ref={yourselfRef}>you</span>
                  </h2>
                  <div className={css.scribble} ref={scribbleRef}>
                    <svg viewBox="0 0 277 19">
                      <path
                        d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="886"
                        strokeDashoffset="1772"
                      ></path>
                    </svg>
                  </div>
                </div>
                {isMobile ? (
                  <div className={css.contentMain}>
                    <img className={css.landingImage} src={landingImage} alt="About Us" />
                  </div>
                ) : null}
                <p>
                  We are a local company that provides a platform for families to find local
                  caregivers for their home care needs. We are not a franchise or a large
                  corporation. We are a local company that is here to help you find the right
                  caregiver for your family.
                </p>
                <PrimaryButton className={css.learnMoreButton}>Learn More</PrimaryButton>
              </div>
            </div>
            <div className={css.contentWrapper}>
              <div className={css.contentSide}>
                <div>
                  <h2>
                    Background Checks to <span ref={ensureRef}>ensure</span> safety
                  </h2>

                  <div className={css.scribble} ref={scribbleRef2}>
                    <svg viewBox="0 0 277 80">
                      <path
                        d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                        vector-effect="non-scaling-stroke"
                        stroke-dasharray="886"
                        stroke-dashoffset="1772"
                      ></path>
                    </svg>
                  </div>
                </div>
                {isMobile ? (
                  <div className={css.contentMain}>
                    <img className={css.landingImage} src={backgroundCheckImage} alt="About Us" />
                  </div>
                ) : null}
                <p>
                  We are a local company that provides a platform for families to find local
                  caregivers for their home care needs. We are not a franchise or a large
                  corporation. We are a local company that is here to help you find the right
                  caregiver for your family.
                </p>

                <PrimaryButton className={css.learnMoreButton}>Learn More</PrimaryButton>
              </div>
              {!isMobile ? (
                <div className={css.contentMain}>
                  <img className={css.landingImage} src={backgroundCheckImage} alt="About Us" />
                </div>
              ) : null}
              <div className={css.contentDivider}></div>
            </div>
          </section>
          <section className={css.bookingsSection}>
            <div className={css.contentSide} style={{ maxWidth: 'none' }}>
              <div>
                <h2 className="text-center">
                  Bookings to <span ref={bookingsRef}>simplify</span> the process
                </h2>
                <div className={css.scribble} ref={scribbleRef3}>
                  <svg viewBox="0 0 277 80">
                    <path
                      d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                      vector-effect="non-scaling-stroke"
                      stroke-dasharray="886"
                      stroke-dashoffset="1772"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    currentUser,
    currentUserFetched,
    currentUserListing,
    currentUserListingFetched,
  } = state.user;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    currentUserFetched,
    currentUserListing,
    currentUserListingFetched,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(EmployersInfoPage);
