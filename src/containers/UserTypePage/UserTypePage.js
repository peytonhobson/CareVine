import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { updateUserType } from './UserTypePage.duck';
import { Redirect } from 'react-router-dom';
import { NamedRedirect, ButtonGroup, GradientButton } from '../../components';

import css from './UserTypePage.module.css';

const userTypeOptions = [
  { key: 'caregiver', label: 'Become a Caregiver' },
  { key: 'employer', label: 'Look For Care' },
];

const UserTypePageComponent = props => {
  const {
    userType,
    onUpdateUserType,
    updateUserTypeInProgress,
    updateUserTypeError,
    currentUser,
    history,
    location,
    isAuthenticated,
  } = props;

  const [selectedUserType, setSelectedUserType] = useState(null);

  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;

  if (currentUserType || userType) {
    return <NamedRedirect name="NewListingPage" />;
  }

  const submitInProgress = updateUserTypeInProgress;
  const submitDisabled = !selectedUserType || submitInProgress;

  return (
    <div className={css.root}>
      <div className={css.subRoot}>
        <h1 style={{ marginBottom: '2rem' }}>I want to...</h1>
        <ButtonGroup
          className={css.buttonGroup}
          rootClassName={css.buttonGroupRoot}
          name="userType"
          options={userTypeOptions}
          onChange={value => setSelectedUserType(value)}
          selectedClassName={css.buttonGroupSelected}
          label="I want to..."
        />
        <GradientButton
          className={css.submitButton}
          onClick={() => onUpdateUserType(selectedUserType)}
          disabled={submitDisabled}
          inProgress={submitInProgress}
        >
          Next
        </GradientButton>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.Auth;
  const { userType, updateUserTypeInProgress, updateUserTypeError } = state.UserTypePage;
  const { currentUser } = state.user;
  return {
    userType,
    updateUserTypeInProgress,
    updateUserTypeError,
    currentUser,
    isAuthenticated,
  };
};

const mapDispatchToProps = dispatch => ({
  onUpdateUserType: userType => dispatch(updateUserType(userType)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const UserTypePage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(UserTypePageComponent);

export default UserTypePage;
