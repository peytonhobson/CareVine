import React from 'react';

import { Card as MuiCard, CardContent as MuiCardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Button } from '../../';
import { useHistory } from 'react-router-dom';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { FormattedMessage } from 'react-intl';

import '@sendbird/uikit-react/dist/index.css';
import css from './index.module.css';

const NotifyForPaymentMessage = props => {
  const { message, userId } = props;

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

  const redirectToPayoutSetup = () => {
    history.push('/account/payments');
  };

  // const context = useSendbirdStateContext();
  // const channelContext = useChannelContext();

  // if (channelContext && context) {
  //   const params = {
  //     appId: process.env.REACT_APP_SENDBIRD_APP_ID,
  //     modules: [new GroupChannelModule()],
  //   };

  //   const sb = SendbirdChat.init(params);
  //   console.log(context);

  //   sb.connect(context.stores.userStore.user.userId).then(() => {
  //     sb.groupChannel.getChannel(channelContext.channelUrl).then(channel => {
  //       channel.deleteMessage(message);
  //     });
  //   });
  // }

  return (
    <div className={baseClass}>
      {message.sender.userId === userId ? (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>{message.message}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className={css.cardTitle}>
              <FormattedMessage
                id="NotifyForPaymentMessage.senderWantsToPay"
                values={{ sender: message.sender.nickname }}
              />
            </p>
            <p className={css.cardMessage}>
              <FormattedMessage id="NotifyForPaymentMessage.clickButtonBelow" />
            </p>

            <div className={css.bottomWrapper}>
              <Button rootClassName={css.setupButton} onClick={redirectToPayoutSetup}>
                <FormattedMessage id="NotifyForPaymentMessage.buttonLabel" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotifyForPaymentMessage;
