//https://github.com/sendbird/uikit-js/blob/develop/src/utils/index.ts
// import format from "date-fns/format";
// import {
//   AdminMessage,
//   FileMessage,
//   MessageListParams,
//   UserMessage,
// } from "sendbird";

export const filterMessageListParams = (
  params,
  message
) => {
  if (params?.messageType && params.messageType !== message.messageType) {
    return false;
  }
  if (
    params?.customTypes?.length > 0 &&
    !params.customTypes.includes(message.customType)
  ) {
    return false;
  }
  if (params?.senderUserIds?.length > 0) {
    if (message?.isUserMessage() || message.isFileMessage()) {
      if (
        !params?.senderUserIds?.includes(
          (message).sender.userId
        )
      ) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
};

const SendingMessageStatus = {
  NONE: "none",
  SUCCEEDED: "succeeded",
  // FAILED: "failed",
  PENDING: "pending",
};

export const getSendingMessageStatus = () => ({
  ...SendingMessageStatus,
});
