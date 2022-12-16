import React from 'react';
import '@sendbird/uikit-react/dist/index.css';
import { Card as MuiCard, CardContent as MuiCardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { PaymentButton } from '../../';

import css from './index.module.css';
import classNames from 'classnames';

const NotifyForPaymentMessage = props => {
  // props
  const {
    message,
    emojiContainer,
    onDeleteMessage,
    onUpdateMessage,
    userId,
    sdk,
    currentChannel,
    updateLastMessage,
    onOpenPaymentModal,
    currentUser,
    otherUser,
  } = props;

  const context = useSendbirdStateContext();
  const channelContext = useChannelContext();

  const baseClass =
    message.sender.userId === userId
      ? 'sendbird-message-hoc__message-content sendbird-message-content outgoing mainContainer'
      : css.mainContainer;

  const Card = styled(props => <MuiCard disableGutters elevation={0} square {...props} />)(
    ({ theme }) => ({
      backgroundColor: 'rgb(240, 240, 240)',
      marginBottom: '40px',
      borderRadius: '16px',
      padding: '20px',
      maxWidth: '50%',
      display: 'flex',
      flexShrink: 1,
    })
  );

  const CardContent = styled(props => (
    <MuiCardContent disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    padding: '5px',
    display: 'flex',
    flexShrink: 1,
    '&.MuiCardContent-root:last-child': {
      paddingBottom: '5px',
    },
  }));

  const incomingClasses = classNames(css.incomingContainer);

  const history = useHistory();

  const redirectToPayoutSetup = () => {
    history.push('/account/payments');
  };

  //   if (channelContext && currentUser) {
  //     const params = {
  //       appId: process.env.REACT_APP_SENDBIRD_APP_ID,
  //       modules: [new GroupChannelModule()],
  //     };

  //     const sb = SendbirdChat.init(params);

  //     sb.connect(currentUser.id.uuid).then(() => {
  //       sb.groupChannel.getChannel(channelContext.channelUrl).then(channel => {
  //         channel.deleteMessage(message);
  //       });
  //     });
  //   }

  return (
    <div className={baseClass}>
      {message.sender.userId === userId ? (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>
              {/* <FormattedMessage id="ModalMissingInformation.verifyEmailTitle" /> */}
              You made a payment to {JSON.parse(message.data).providerName}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>
              {/* <FormattedMessage id="ModalMissingInformation.verifyEmailTitle" /> */}
              {message.sender.nickname} made a payment to you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotifyForPaymentMessage;
