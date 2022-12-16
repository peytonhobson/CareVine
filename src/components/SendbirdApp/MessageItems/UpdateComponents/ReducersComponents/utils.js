//https://github.com/sendbird/uikit-js/blob/develop/src/smart-components/Conversation/utils.js
import * as channelActions from "../actionTypes";
import * as topics from "../topics";

// import { getSendingMessageStatus } from "../../utils";


const SendingMessageStatus = {
  NONE: "none",
  SUCCEEDED: "succeeded",
  // FAILED: "failed",
  PENDING: "pending",
};

export const getSendingMessageStatus = ()=> ({ ...SendingMessageStatus });
//FAILED,
const { SUCCEEDED,  PENDING } = getSendingMessageStatus();
const UNDEFINED = 'undefined';

export const hasOwnProperty = (property) => (payload) => {
  // eslint-disable-next-line no-prototype-builtins
  if (payload && payload.hasOwnProperty && payload.hasOwnProperty(property)) {
    return true;
  }
  return false;
};

export const passUnsuccessfullMessages = (allMessages, newMessage) => {
  const { sendingStatus = UNDEFINED } = newMessage;
  if (sendingStatus === SUCCEEDED || sendingStatus === PENDING) {
    const lastIndexOfSucceededMessage = allMessages
      .map(
        (message) =>
          message.sendingStatus ||
          (message.isAdminMessage && message.isAdminMessage()
            ? SUCCEEDED
            : UNDEFINED)
      )
      .lastIndexOf(SUCCEEDED);
    if (lastIndexOfSucceededMessage + 1 < allMessages.length) {
      const messages = [...allMessages];
      messages.splice(lastIndexOfSucceededMessage + 1, 0, newMessage);
      return messages;
    }
  }
  return [...allMessages, newMessage];
};

export const scrollIntoLast = (intialTry = 0) => {
  const MAX_TRIES = 10;
  const currentTry = intialTry;
  if (currentTry > MAX_TRIES) {
    return;
  }
  try {
    const scrollDOM = document.querySelector('.sendbird-conversation__scroll-container');
    // eslint-disable-next-line no-multi-assign
    scrollDOM.scrollTop = scrollDOM.scrollHeight;
  } catch (error) {
    setTimeout(() => {
      scrollIntoLast(currentTry + 1);
    }, 500 * currentTry);
  }
};


export const pubSubHandleRemover = (subscriber) => {
  subscriber.forEach((s) => {
    try {
      s.remove();
    } catch {
      //
    }
  });
};

export const pubSubHandler = (channelUrl, pubSub, dispatcher) => {
  const subscriber = new Map();
  if (!pubSub || !pubSub.subscribe) return subscriber;
  subscriber.set(topics.SEND_USER_MESSAGE, pubSub.subscribe(topics.SEND_USER_MESSAGE, (msg) => {
    const { channel, message } = msg;
    scrollIntoLast();
    if (channel && (channelUrl === channel.url)) {
      dispatcher({
        type: channelActions.SEND_MESSAGEGE_SUCESS,
        payload: message,
      });
    }
  }));
  subscriber.set(topics.SEND_MESSAGE_START, pubSub.subscribe(topics.SEND_MESSAGE_START, (msg) => {
    const { channel, message } = msg;
    if (channel && (channelUrl === channel.url)) {
      dispatcher({
        type: channelActions.SEND_MESSAGEGE_START,
        payload: message,
      });
    }
  }));
  subscriber.set(topics.SEND_FILE_MESSAGE, pubSub.subscribe(topics.SEND_FILE_MESSAGE, (msg) => {
    const { channel, message } = msg;
    scrollIntoLast();
    if (channel && (channelUrl === channel.url)) {
      dispatcher({
        type: channelActions.SEND_MESSAGEGE_SUCESS,
        payload: message,
      });
    }
  }));
  subscriber.set(topics.UPDATE_USER_MESSAGE, pubSub.subscribe(topics.UPDATE_USER_MESSAGE, (msg) => {
    const { channel, message, fromSelector } = msg;
    if (fromSelector && channel && (channelUrl === channel.url)) {
      dispatcher({
        type: channelActions.ON_MESSAGE_UPDATED,
        payload: { channel, message },
      });
    }
  }));
  subscriber.set(topics.DELETE_MESSAGE, pubSub.subscribe(topics.DELETE_MESSAGE, (msg) => {
    const { channel, messageId } = msg;
    if (channel && (channelUrl === channel.url)) {
      dispatcher({
        type: channelActions.ON_MESSAGE_DELETED,
        payload: messageId,
      });
    }
  }));

  return subscriber;
};

