import React, { useEffect, useState } from 'react';
import '@sendbird/uikit-react/dist/index.css';
import { Card as MuiCard, CardContent as MuiCardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { Button } from '../../';
import PaymentButton from '../CustomButtons/PaymentButton';

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
    isPaymentModalOpen,
  } = props;

  const sendbirdContext = useSendbirdStateContext();
  const channelContext = useChannelContext();

  const baseClass =
    message.sender.userId === userId
      ? 'sendbird-message-hoc__message-content sendbird-message-content outgoing'
      : 'incoming';

  const Card = styled(props => <MuiCard elevation={0} {...props} />)(({ theme }) => ({
    backgroundColor: 'rgb(240, 240, 240)',
    marginBottom: '40px',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '50%',
  }));

  const CardContent = styled(props => <MuiCardContent elevation={0} {...props} />)(({ theme }) => ({
    padding: '5px',
    '&.MuiCardContent-root:last-child': {
      paddingBottom: '5px',
    },
  }));

  const history = useHistory();

  const openStripeModal = () => {
    const modalInitialValues = {
      provider: otherUser,
      channelUrl: channelContext.channelUrl,
      channelContext: context,
    };

    onOpenPaymentModal(modalInitialValues);
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

  const [isDisabled, setIsDisabled] = useState(false);
  const [fetchUserFromChannelUrlInProgress, setFetchUserFromChannelUrlInProgress] = useState(false);

  useEffect(() => {
    sendbirdContext &&
      sendbirdContext.config &&
      sendbirdContext.config.pubSub &&
      sendbirdContext.config.pubSub.subscribe(
        'PAYMENT_MODAL_DISPLAY_CHANGE',
        ({ isPaymentModalOpen }) => {
          setIsDisabled(isPaymentModalOpen);
        }
      );
  }, [sendbirdContext]);

  useEffect(() => {
    sendbirdContext &&
      sendbirdContext.config &&
      sendbirdContext.config.pubSub &&
      sendbirdContext.config.pubSub.subscribe(
        'FETCH_OTHER_USER_IN_PROGRESS_CHANGE',
        ({ fetchUserFromChannelUrlInProgress }) => {
          setFetchUserFromChannelUrlInProgress(fetchUserFromChannelUrlInProgress);
        }
      );
  }, [sendbirdContext]);

  return (
    <div className={baseClass}>
      {message.sender.userId === userId ? (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>
              {/* <FormattedMessage id="ModalMissingInformation.verifyEmailTitle" /> */}
              {message.message}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>
              {/* <FormattedMessage id="ModalMissingInformation.verifyEmailTitle" /> */}
              {message.sender.nickname} is requesting payment from you.
            </p>
            <p className={css.cardMessage}>
              {/* <FormattedMessage id="ModalMissingInformation.verifyEmailText" /> */}
              Click the button below make a payment.
            </p>

            <div className={css.bottomWrapper}>
              <PaymentButton
                rootClassName={css.paymentButtonRoot}
                className={css.paymentButton}
                disabled={isDisabled}
                onOpenPaymentModal={onOpenPaymentModal}
                otherUser={otherUser}
                channelUrl={channelContext.channelUrl}
                //TODO: Need to change channel context to be global context in all related instances
                sendbirdContext={sendbirdContext}
                fetchUserFromChannelUrlInProgress={fetchUserFromChannelUrlInProgress}
              >
                Pay
              </PaymentButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotifyForPaymentMessage;
