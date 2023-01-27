import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import ContextMenu, { MenuItem, MenuItems } from '@sendbird/uikit-react/ui/ContextMenu';
import IconButton from '@sendbird/uikit-react/ui/IconButton';
import Icon, { IconTypes, IconColors } from '@sendbird/uikit-react/ui/Icon';
import useSendbirdStateContext from '@sendbird/uikit-react/useSendbirdStateContext';
import { n as noop } from '@sendbird/uikit-react/utils-c17213bb';
import Modal from '@sendbird/uikit-react/ui/Modal';
import { useChannelListContext } from '@sendbird/uikit-react/ChannelList/context';
import { GroupChannel } from '@sendbird/chat/groupChannel';

const LeaveChannelModal = props => {
  const { channel = null, onSubmit = noop, onCancel = noop } = props;

  const channelFromContext = useChannelListContext()?.currentChannel;
  const leavingChannel = channel || channelFromContext;
  const state = useSendbirdStateContext();

  const logger = state?.config?.logger;
  const isOnline = state?.config?.isOnline;
  if (leavingChannel) {
    return (
      <Modal
        disabled={!isOnline}
        onCancel={onCancel}
        onSubmit={() => {
          logger.info('ChannelSettings: Leaving channel', leavingChannel);
          leavingChannel?.leave().then(() => {
            logger.info('ChannelSettings: Leaving channel successful!', leavingChannel);
            onSubmit();
          });
        }}
        submitText="Delete"
        titleText="Delete this chat?"
      />
    );
  }
};

export default function ChannelPreviewAction({ channel, disabled }) {
  const parentRef = useRef(null);
  const parentContainerRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      role="button"
      style={{ display: 'inline-block' }}
      onKeyDown={e => {
        e.stopPropagation();
      }}
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
      }}
      ref={parentContainerRef}
    >
      <ContextMenu
        menuTrigger={toggleDropdown => (
          <IconButton ref={parentRef} onClick={toggleDropdown} height="32px" width="32px">
            <Icon type={IconTypes.MORE} fillColor={IconColors.PRIMARY} width="24px" height="24px" />
          </IconButton>
        )}
        menuItems={closeDropdown => (
          <MenuItems
            parentRef={parentRef}
            parentContainRef={parentContainerRef}
            closeDropdown={closeDropdown}
          >
            <MenuItem
              onClick={() => {
                if (disabled) {
                  return;
                }
                setShowModal(true);
                closeDropdown();
              }}
            >
              Delete Chat
            </MenuItem>
          </MenuItems>
        )}
      />
      {showModal && (
        <LeaveChannelModal
          channel={channel}
          onSubmit={() => {
            setShowModal(false);
            channel.leave();
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

ChannelPreviewAction.propTypes = {
  disabled: PropTypes.bool,
  channel: PropTypes.shape({}),
};

ChannelPreviewAction.defaultProps = {
  disabled: false,
  channel: null,
};
