import React, { useEffect, useState } from 'react';

const QuizTimer = props => {
  const { identityProofQuiz, className } = props;

  const [timer, setTimer] = useState(null);

  const getTimeRemaining = timeGenerated => {
    const total = 15 * 1000 * 60 - (Date.now() - timeGenerated);
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    return {
      minutes: minutes < 10 ? `0${minutes}` : minutes,
      seconds: seconds < 10 ? `0${seconds}` : seconds === 60 ? '00' : seconds,
    };
  };

  useEffect(() => {
    if (identityProofQuiz?.timeGenerated) {
      const timeLeft = getTimeRemaining(identityProofQuiz.timeGenerated);
      setTimer(`${timeLeft.minutes}:${timeLeft.seconds}`);
      const timerInterval = setInterval(() => {
        const timeLeft = getTimeRemaining(identityProofQuiz.timeGenerated);
        setTimer(`${timeLeft.minutes}:${timeLeft.seconds}`);

        if (timeLeft.minutes === '00' && timeLeft.seconds === '00') {
          clearInterval(timerInterval);
        }
      }, 1000);
    }
  }, [identityProofQuiz?.timeGenerated]);

  return <div className={className}>{timer}</div>;
};

export default QuizTimer;
