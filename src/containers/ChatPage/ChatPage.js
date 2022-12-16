import { SendbirdApp } from '../../components';
import '@sendbird/uikit-react/dist/index.css';
import SBProvider from '@sendbird/uikit-react/SendbirdProvider';
import { withRouter } from 'react-router-dom';

import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './ChatPage.module.css';

const ChatPageComponent = props => {
  const { currentUser, history } = props;

  const appId = process.env.REACT_APP_SENDBIRD_APP_ID;
  const userId = currentUser && currentUser.attributes && currentUser.attributes.email;
  const nickname =
    currentUser && currentUser.attributes && currentUser.attributes.profile.displayName;
  const profileUrl =
    currentUser &&
    currentUser.profileImage &&
    currentUser.profileImage.attributes.variants['square-small'].url;

  return (
    // Need to add access token in private data
    <SBProvider appId={appId} userId={userId} nickname={nickname}>
      <SendbirdApp history={history} />
    </SBProvider>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return {
    currentUser,
  };
};

const mapDispatchToProps = dispatch => ({});

const ChatPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ChatPageComponent);

export default ChatPage;
