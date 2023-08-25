import React from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
} from '../../components';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { TopbarContainer } from '../../containers';
import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './EmployersInfoPage.module.css';

import landingImage from '../../assets/about-us.jpg';

const EmployersInfoPage = props => {
  const { scrollingDisabled } = props;
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
      <LayoutSingleColumn>
        <LayoutWrapperMain>
          <section className={css.hasSectionDivider}>
            <div
              className={css.hero}
              data-controller="SectionDivider"
              style={{
                clipPath: 'url(#section-divider)',
              }}
              data-controllers-bound="SectionDivider"
            >
              <TopbarContainer currentPage="ForCaregiversPage" desktopClassName={css.topbar} />
              <div className={css.heroContent}>
                <h1>
                  Find Local Caregivers<br></br>
                  For Your<br></br>
                  Home Care Needs
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
