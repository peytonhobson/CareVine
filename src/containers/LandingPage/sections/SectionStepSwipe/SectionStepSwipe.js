import React, { useState, useRef } from 'react';

import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  IconArrowHead,
  IconCalendarHeart,
  Button,
  IconUserProfile,
  IconCaregiver,
  NamedLink,
} from '../../../../components';
import Geocoder, {
  CURRENT_LOCATION_ID,
} from '../../../../components/LocationAutocompleteInput/GeocoderMapbox';
import { useMediaQuery } from '@mui/material';

const INTERVIEW_SLUG = 'the-art-of-interviewing-how-to-hire-the-perfect-caregiver-for-private-care';

import './SectionStepSwipe.css';
import css from 'styled-jsx/css';

const SectionStepSwipe = ({ history }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const leftScreen = '-100vw';
  const middleScreen = '0';
  const rightScreen = '100vw';

  const nodeRef1 = useRef(null);
  const nodeRef2 = useRef(null);
  const nodeRef3 = useRef(null);
  const nodeRef4 = useRef(null);

  const handleCurrentLocation = () => {
    let geocoder = new Geocoder();

    const prediction = {
      id: CURRENT_LOCATION_ID,
      predictionPlace: {},
    };

    geocoder
      .getPlaceDetails(prediction)
      .then(place => {
        const valOrigin = place.origin;
        // Need to parse float twice to ensure no trailing zeros
        // If there are trailing zeros then urlHelpers parse will return null
        const lat = parseFloat(parseFloat(valOrigin.lat).toFixed(5));
        const lng = parseFloat(parseFloat(valOrigin.lng).toFixed(5));
        const origin = `${lat}%2C${lng}`;

        history.push(`s?origin=${origin}&distance=30&listingType=caregiver`);
      })
      .catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
  };

  const handleChangeNextStep = () => {
    if (currentStep === 0) {
      nodeRef1.current.style.left = leftScreen;
      nodeRef2.current.style.left = middleScreen;
      setCurrentStep(1);
    }
    if (currentStep === 1) {
      nodeRef2.current.style.left = leftScreen;
      nodeRef3.current.style.left = middleScreen;
      setCurrentStep(2);
    }
    if (currentStep === 2) {
      nodeRef3.current.style.left = leftScreen;
      nodeRef4.current.style.left = middleScreen;
      setCurrentStep(3);
    }
  };

  const handleChangePrevStep = () => {
    if (currentStep === 1) {
      nodeRef1.current.style.left = middleScreen;
      nodeRef2.current.style.left = rightScreen;
      setCurrentStep(0);
    }
    if (currentStep === 2) {
      nodeRef2.current.style.left = middleScreen;
      nodeRef3.current.style.left = rightScreen;
      setCurrentStep(1);
    }
    if (currentStep === 3) {
      nodeRef3.current.style.left = middleScreen;
      nodeRef4.current.style.left = rightScreen;
      setCurrentStep(2);
    }
  };

  return (
    <section className="stepsSection">
      <h2 className="contentTitle">Your Roadmap to Finding the Perfect Caregiver</h2>
      <div className="stepsSectionCard card1">
        <IconArrowHead
          direction="left"
          height="3em"
          width="3em"
          className={`stepArrow ${currentStep === 0 ? 'disabled' : ''}`}
          onClick={handleChangePrevStep}
        />
        <div className="stepsContainer">
          <div className="step step1" ref={nodeRef1}>
            <div className="innerStep">
              <IconUserProfile width="4em" height="4em" />
              <h2 className="stepTitle">Create Your Personalized Profile</h2>
              <p className="stepSubText">
                Become a part of the CareVine and create a profile that gives a basic description of
                the care recipient’s needs. This also allows caregivers to find and contact you if
                they think they would be a good fit.
              </p>
            </div>
          </div>
          <div className="step step2" ref={nodeRef2}>
            <div className="innerStep">
              <IconCaregiver width="4em" height="4em" />
              <h2 className="stepTitle">Discover Your Ideal Caregiver</h2>
              <p className="stepSubText">
                Browse the CareVine network of caregivers in your area to find the right one for
                you. CareVine’s platform automatically sorts caregivers based on the information in
                your profile, giving you the best matches at the top. You can also add additional
                filters and sort based off your preferences.
              </p>
            </div>
          </div>
          <div className="step step3" ref={nodeRef3}>
            <div className="innerStep">
              <IconCalendarHeart width="3.5em" height="3.5em" />
              <h2 className="stepTitle">Tackle the nitty-gritty</h2>
              <p className="stepSubText">
                Send the caregiver a message and get to know them a little bit. Ask questions that
                are important to you as well as more mundane things such as: ( ). If they seem like
                a fit, we recommend conducting a thorough interview before you book for care. Our
                interview guide can help guide you through this process and can be found{' '}
                <NamedLink name="BlogPostPage" params={{ slug: INTERVIEW_SLUG }}>
                  here
                </NamedLink>
                .
              </p>
            </div>
          </div>
          <div className="step step4" ref={nodeRef4}>
            <div className="innerStep">
              <IconCalendarHeart width="3.5em" height="3.5em" />
              <h2 className="stepTitle">Book Your Care</h2>
              <p className="stepSubText">
                When you’ve found your perfect caregiver, use our hassle-free booking system to make
                it official. The booking system allows you to request dates and times, send
                payments, change or cancel bookings, as well as providing a convenient way to view
                previous or future bookings.
              </p>
              <div className="stepButtonContainer">
                <Button className="stepButton" onClick={handleCurrentLocation}>
                  Find Your Caregiver
                </Button>
              </div>
            </div>
          </div>
        </div>
        <IconArrowHead
          direction="right"
          height="3em"
          width="3em"
          className={`stepArrow ${currentStep === 3 ? 'disabled' : ''}`}
          onClick={handleChangeNextStep}
        />
      </div>
    </section>
  );
};

export default compose(withRouter)(SectionStepSwipe);
