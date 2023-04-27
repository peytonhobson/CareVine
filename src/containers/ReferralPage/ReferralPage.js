import React, { useState } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  GradientButton,
} from '../../components';
import { TopbarContainer } from '..';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { connect } from 'react-redux';

import { compose } from 'redux';

import css from './ReferralPage.module.css';

const ReferralPageComponent = props => {
  const { intl, scrollingDisabled } = props;

  const schemaTitle = intl.formatMessage({ id: 'ReferralPage.schemaTitle' });

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      title={schemaTitle}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="ReferralPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <h1 className={css.mainTitle}>Refer a Friend</h1>
          <h3>Invite your friends to CareVine and get rewards when they sign up.</h3>
        </LayoutWrapperMain>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing, currentUserListingFetched } = state.user;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
  };
};

const mapDispatchToProps = {};

const ReferralPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ReferralPageComponent);

export default ReferralPage;
