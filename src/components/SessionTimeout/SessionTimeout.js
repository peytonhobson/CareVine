import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import moment from 'moment';

const SessionTimeout = ({ intervalFunction, intervalTime, maxInactiveTime }) => {
  const [events, setEvents] = useState(['click', 'load', 'scroll']);

  let inactiveInterval = useRef();

  // reset interval timer
  let resetTimer = () => {
    const timeStamp = moment();

    if (!inactiveInterval.current) {
      inactiveInterval.current = setInterval(() => {
        intervalFunction();

        const diff = moment.duration(moment().diff(moment(timeStamp)));
        const minPast = diff.minutes();

        if (minPast >= maxInactiveTime) {
          clearInterval(inactiveInterval.current);
          inactiveInterval.current = null;
        }
      }, intervalTime);
    }
  };

  useEffect(() => {
    if (intervalFunction) {
      resetTimer();

      events.forEach(event => {
        window.addEventListener(event, resetTimer);
      });
    }

    return () => {
      clearInterval(inactiveInterval.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [intervalFunction]);

  return <></>;
};

export default SessionTimeout;
