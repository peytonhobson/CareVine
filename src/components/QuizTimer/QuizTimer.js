import React, { useEffect, useState, useRef } from 'react';

// TODO: Change to time when we figure it out
const QUIZ_EXPIRE_MINUTES = 1;

const QuizTimer = props => {
  const {
    identityProofQuiz,
    className,
    onGetIdentityProofQuiz,
    authenticateUserAccessCode,
    identityProofQuizAttempts,
    onAddQuizAttempt,
    currentUser,
    form,
  } = props;

  const [timer, setTimer] = useState('00:00');
  const intervalRef = useRef();

  const getTimeRemaining = timeGenerated => {
    const total = QUIZ_EXPIRE_MINUTES * 1000 * 60 - (Date.now() - timeGenerated);
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    return {
      minutes: minutes < 0 ? '00' : minutes < 10 ? `0${minutes}` : minutes,
      seconds: seconds === 60 || seconds < 0 ? '00' : seconds < 10 ? `0${seconds}` : seconds,
    };
  };

  useEffect(() => {
    if (
      identityProofQuiz?.timeGenerated &&
      identityProofQuiz?.timeGenerated < Date.now() - QUIZ_EXPIRE_MINUTES * 1000 * 59
    ) {
      onAddQuizAttempt();
      if (
        currentUser.id?.uuid &&
        (!identityProofQuizAttempts || identityProofQuizAttempts < 2) &&
        identityProofQuiz?.attemptNumber < 3
      ) {
        onGetIdentityProofQuiz(authenticateUserAccessCode).then(() => {
          form.restart();
        });
      }
    }
  }, [identityProofQuiz?.timeGenerated, timer]);

  useEffect(() => {
    if (identityProofQuiz?.timeGenerated && identityProofQuiz.attemptNumber < 3) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const timeLeft = getTimeRemaining(identityProofQuiz.timeGenerated);
        setTimer(`${timeLeft.minutes}:${timeLeft.seconds}`);

        if (timeLeft.minutes === '00' && timeLeft.seconds === '00') {
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [identityProofQuiz?.timeGenerated]);

  return <div className={className}>{timer}</div>;
};

export default QuizTimer;
