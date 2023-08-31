import React, { useEffect, useState, useRef } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
  PrimaryButton,
  IconSpinner,
  InlineTextButton,
} from '../../components';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { TopbarContainer } from '../../containers';
import { compose } from 'redux';
import { connect } from 'react-redux';
import Card from '@mui/material/Card';
import { makeStyles, useMediaQuery } from '@material-ui/core';
import classNames from 'classnames';
import { LazyLoadComponent } from 'react-lazy-load-image-component';

import ContactSection from './ContactSection';

import css from './EmployersInfoPage.module.css';

import landingImage from '../../assets/employers-info-hero.jpg';
import backgroundCheckImage from '../../assets/Magnify-BG.png';

const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: 'var(--borderRadius) !important',
    margin: 'auto',
    height: '80vh;',
    aspectRatio: 1.474,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
      margin: '0 2rem',
      height: 'auto',
    },
    [theme.breakpoints.down('sm')]: {
      margin: '0 2rem',
      aspectRatio: '0.747',
      height: 'auto',
    },
  },
}));

const EmployersInfoPage = props => {
  const { scrollingDisabled } = props;

  const yourselfRef = useRef(null);
  const scribbleRef = useRef(null);
  const ensureRef = useRef(null);
  const scribbleRef2 = useRef(null);
  const superiorRef = useRef(null);
  const scribbleRef3 = useRef(null);
  const bookingsRef = useRef(null);
  const scribbleRef4 = useRef(null);
  const contentRef = useRef(null);

  const [videoLoaded, setVideoLoaded] = useState(false);

  const isMobile = useMediaQuery('(max-width: 1024px)');
  const isMobileSmall = useMediaQuery('(max-width: 768px)');
  const classes = useStyles();

  const handleLearnMoreClick = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    window.addEventListener('resize', () => positionScribble(superiorRef, scribbleRef3));
    window.addEventListener('resize', () => positionScribble(bookingsRef, scribbleRef4));

    // Call handler right away so state gets updated with initial window size
    positionScribble(yourselfRef, scribbleRef);
    positionScribble(ensureRef, scribbleRef2);
    positionScribble(superiorRef, scribbleRef3);
    positionScribble(bookingsRef, scribbleRef4);
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', () => positionScribble(yourselfRef, scribbleRef));
      window.removeEventListener('resize', () => positionScribble(ensureRef, scribbleRef2));
      window.removeEventListener('resize', () => positionScribble(superiorRef, scribbleRef3));
      window.removeEventListener('resize', () => positionScribble(bookingsRef, scribbleRef4));
    };
  }, [yourselfRef?.current, scribbleRef?.current, ensureRef?.current, scribbleRef2?.current]);

  // TODO: Schema
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
          // TODO: May need to change
          currentPage="EmployersInfoPage"
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
                  Browse Caregivers,<br></br> Find Tailored Matches
                </h1>
                <InlineTextButton className={css.inlineHeroButton} onClick={handleLearnMoreClick}>
                  Learn More
                </InlineTextButton>
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
          <section className={css.contentSection} ref={contentRef}>
            <div className={css.contentWrapper}>
              {!isMobile ? (
                <div className={css.contentMain}>
                  <img className={css.landingImage} src={landingImage} alt="About Us" />
                </div>
              ) : null}
              <div className={css.contentSide}>
                <div>
                  <h2 className={css.contentTitle}>
                    Discover Care Customized to <span ref={yourselfRef}>You</span>
                  </h2>
                  <div className={css.scribble} ref={scribbleRef}>
                    <svg viewBox="0 0 277 19">
                      <path
                        d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="1000"
                        strokeDashoffset="2500"
                      ></path>
                    </svg>
                  </div>
                </div>
                {isMobile ? (
                  <div className={css.contentMain}>
                    {/* TODO: Change alt */}
                    <img className={css.landingImage} src={landingImage} alt="About Us" />
                  </div>
                ) : null}
                <p>
                  Experience a care solution that's tailored to you. Unlike agencies, CareVine's
                  open marketplace allows you to select caregivers who align perfectly with your
                  needs. You have the control to define and refine your care preferences. It's not
                  just about browsing caregivers; it's about making informed choices for your
                  personalized care journey.
                </p>
                <PrimaryButton className={css.learnMoreButton}>Get Started</PrimaryButton>
              </div>
            </div>
            <div className={css.contentWrapper}>
              <div className={css.contentSide}>
                <div>
                  <h2 className={css.contentTitle}>
                    <span ref={ensureRef}>Secure</span> Choices with Rigorous Verification
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
                    {/* TODO: Change alt */}
                    <img className={css.landingImage} src={backgroundCheckImage} alt="About Us" />
                  </div>
                ) : null}
                <p>
                  At CareVine, the safety and trust of our commmunity are paramount. Every caregiver
                  listed on our platform undergoes a rigorous background check, ensuring they meet
                  the highest standards of integrity and professionalism. Through identity
                  verification and criminal records checks, our meticulous approach ensures that
                  when you choose a caregiver from CareVine, you're choosing with confidence and
                  peace of mind.
                </p>
              </div>
              {!isMobile ? (
                <div className={css.contentMain}>
                  <img className={css.landingImage} src={backgroundCheckImage} alt="About Us" />
                </div>
              ) : null}
            </div>
            <div className={css.contentWrapper}>
              {!isMobile ? (
                <div className={css.contentMain}>
                  <img className={css.landingImage} src={landingImage} alt="About Us" />
                </div>
              ) : null}
              <div className={css.contentSide}>
                <div>
                  <h2 className={css.contentTitle}>
                    Better Rates,<br></br>
                    <span ref={superiorRef}>Superior</span> Care
                  </h2>
                  <div className={css.scribble} ref={scribbleRef3}>
                    <svg viewBox="0 0 277 90">
                      <path
                        d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                        vectorEffect="non-scaling-stroke"
                        stroke-dasharray="886"
                        stroke-dashoffset="1772"
                      ></path>
                    </svg>
                  </div>
                </div>
                {isMobile ? (
                  <div className={css.contentMain}>
                    {/* TODO: Change alt */}
                    <img className={css.landingImage} src={landingImage} alt="About Us" />
                  </div>
                ) : null}
                <p>
                  Choosing a caregiver through our marketplace empowers you to take control of both
                  the quality of care and the associated costs. By self-selecting a caregiver, you
                  bypass traditional agencies and their associated overheads. Without these
                  middlemen, the process becomes more transparent, direct, and cost-effective. This
                  not only results in better rates but also ensures that the caregiver receives a
                  fair compensation. In essence, you get superior care, all while enjoying
                  significant savings.
                </p>
              </div>
            </div>
          </section>
          <section className={css.bookingsSection}>
            <div className="relative">
              <div>
                <h2
                  className={classNames(css.contentTitle, 'text-center')}
                  style={{ margin: isMobile ? '0 0 2rem 0' : '0 0 4rem 0' }}
                >
                  Bookings & Billing Made <span ref={bookingsRef}>Seamless</span>
                </h2>
              </div>
              <div className={css.scribble} ref={scribbleRef4}>
                <svg viewBox="0 0 277 90" class="!stroke-primary">
                  <path
                    d="M 0,84.48 c 21.375,-0.43200000000000216 99.75,-3.167999999999992 142.5,-2.8800000000000097 c 42.75,0.2879999999999967 138.22500000000002,4.800000000000011 142.5,4.800000000000011 c 4.274999999999977,0 -75.525,-5.52000000000001 -114,-4.800000000000011 c -38.474999999999994,0.7199999999999989 -138.225,8.447999999999993 -142.5,9.599999999999994 c -4.274999999999999,1.152000000000001 84.075,-1.9199999999999875 114,-1.9199999999999875 c 29.92500000000001,0 85.5,0.9119999999999919 85.5,1.9199999999999875 c 0,1.0079999999999956 -64.125,4.0800000000000125 -85.5,4.800000000000011 c -21.375,0.7199999999999989 -48.45,0 -57,0"
                    vector-effect="non-scaling-stroke"
                    stroke-dasharray="886"
                    stroke-dashoffset="1772"
                  ></path>
                </svg>
              </div>
            </div>

            <div>
              <LazyLoadComponent>
                <Card className={classes.card}>
                  {videoLoaded ? null : <IconSpinner className={css.demoSpinner} />}
                  <video
                    autoPlay
                    muted
                    playsInline
                    className={css.demo}
                    src={
                      isMobileSmall
                        ? 'https://carevine-videos.s3.us-west-2.amazonaws.com/mobile-no-zoom.mp4'
                        : 'https://carevine-videos.s3.us-west-2.amazonaws.com/booking-demo-desktop.mp4'
                    }
                    onLoadedData={() => setVideoLoaded(true)}
                    style={{
                      display: videoLoaded ? 'flex' : 'none',
                    }}
                  />
                </Card>
              </LazyLoadComponent>
            </div>
          </section>
          <ContactSection
            title={
              <h2
                className="text-6xl text-center"
                style={{ margin: isMobile ? '0 0 2rem 0' : '0 0 4rem 0' }}
              >
                Have Questions? Contact us.
              </h2>
            }
          />
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
