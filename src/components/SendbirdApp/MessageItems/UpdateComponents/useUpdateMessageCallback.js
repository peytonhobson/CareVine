//https://github.com/sendbird/uikit-js/blob/develop/src/smart-components/Conversation/hooks/useUpdateMessageCallback.js
import { useCallback } from "react";

import * as messageActionTypes from "./actionTypes";
import * as topics from "./topics";

export default function useUpdateMessageCallback(
  { currentChannel, messagesDispatcher, onBeforeUpdateUserMessage, updateLastMessage },
  { logger, pubSub, sdk }
) {
  return useCallback(
    (messageId, text, cb) => {

      const createParamsDefault = (txt) => {
        const params = new sdk.UserMessageParams();
        params.message = txt;
        return params;
      };

      const createCustomPrams =
        onBeforeUpdateUserMessage &&
        typeof onBeforeUpdateUserMessage === "function";

      if (createCustomPrams) {
        logger.info(
          "Channel: creating params using onBeforeUpdateUserMessage",
          onBeforeUpdateUserMessage
        );
      }

      const params = onBeforeUpdateUserMessage
        ? onBeforeUpdateUserMessage(text)
        : createParamsDefault(text);

        
      currentChannel.updateUserMessage(messageId, params, (r, e) => {
        logger.info("Channel: Updating message!", params);
        const swapParams = sdk.getErrorFirstCallback();
        let message = r;
        let err = e;
        if (swapParams) {
          message = e;
          err = r;
        }
        if (cb) {
          cb(err, message);
        }
        if (!err) {
          logger.info("Channel: Updating message success!", message);
          messagesDispatcher({
            type: messageActionTypes.ON_MESSAGE_UPDATED,
            payload: {
              channel: currentChannel,
              message,
            },
          });
          pubSub.publish(topics.UPDATE_USER_MESSAGE, {
            message,
            channel: currentChannel,
          });
        } else {
          logger.warning("Channel: Updating message failed!", err);
        }
        updateLastMessage(currentChannel.url, message.messageId, params);
      });
    },
    [
      messagesDispatcher,
      onBeforeUpdateUserMessage,
      logger,
      pubSub,
      sdk,
      currentChannel,
    ]
  );
}

