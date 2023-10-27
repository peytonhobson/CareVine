import React, { useState, useRef, useMemo, useCallback } from 'react';
import { CAREGIVER } from '../../util/constants';
import config from '../../config';

import { ButtonTabNavHorizontal } from '..';
import {
  AdditionalInfoSection,
  AvailabilitySection,
  BioSection,
  CaregiverPreferencesSection,
  CareRecipientsSection,
  CareScheduleSection,
  CertificationsSection,
  JobDescriptionSection,
  ServicesSection,
} from './Sections';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './ListingTabs.module.css';

const ListingTabs = props => {
  const { listing, currentUserListing } = props;

  const isMobile = useCheckMobileScreen();

  const caregiverTabs = [
    'Availability',
    'Bio',
    'Services',
    isMobile ? 'Training' : 'Certifications/Training',
    'Additional',
  ];
  const employerTabs = [
    'Job Description',
    'Care Schedule',
    'Care Recipients(s)',
    'Caregiver Preferences',
  ];

  const findLabel = (key, options) => {
    const found = options.find(option => option.key === key);
    return found ? found.label : null;
  };

  const getTabs = (listingType, onClick, selected) => {
    const tabText = listingType === CAREGIVER ? caregiverTabs : employerTabs;

    return tabText.map(tab => {
      return {
        text: tab,
        selected: selected === tab,
        onClick: () => onClick(tab),
      };
    });
  };

  const scrollToRef = ref => {
    if (isMobile) {
      window.scrollTo({ top: ref.offsetTop - 100, behavior: 'smooth' });
    } else {
      console.log(ref.offsetTop);
      window.scrollTo({ top: ref.offsetTop - 130, behavior: 'smooth' });
    }
  };

  const listingType = listing?.attributes?.metadata?.listingType;

  const [selectedTab, setSelectedTab] = useState(
    listingType === CAREGIVER ? 'Availability' : 'Job Description'
  );
  const availabilityRef = useRef(null);
  const bioRef = useRef(null);
  const servicesRef = useRef(null);
  const certificationsAndTrainingRef = useRef(null);
  const additionalInfoRef = useRef(null);
  const jobDescriptionRef = useRef(null);
  const careScheduleRef = useRef(null);
  const careRecipientsRef = useRef(null);
  const caregiverPreferencesRef = useRef(null);

  const refMap = {
    Availability: availabilityRef,
    Bio: bioRef,
    Services: servicesRef,
    'Certifications/Training': certificationsAndTrainingRef,
    Training: certificationsAndTrainingRef,
    Additional: additionalInfoRef,
    'Job Description': jobDescriptionRef,
    'Care Schedule': careScheduleRef,
    'Care Recipients(s)': careRecipientsRef,
    'Caregiver Preferences': caregiverPreferencesRef,
  };

  const { publicData } = listing.attributes;
  const { careSchedule, availabilityPlan: publicAvailabilityPlan } = publicData;

  const onClick = tab => {
    if (refMap[tab].current) {
      console.log(refMap[tab].current);
      scrollToRef(refMap[tab].current);
    }

    setSelectedTab(tab);
  };

  const tabs = useMemo(() => {
    return getTabs(listingType, onClick, selectedTab);
  }, [listingType, selectedTab]);

  const entries = publicAvailabilityPlan?.entries;
  const isProfileClosed = listing.attributes.state === 'closed';

  const renderSection = useCallback(
    (section, key) => {
      switch (section) {
        case 'Availability':
          return (
            <AvailabilitySection
              key={key}
              entries={entries}
              isProfileClosed={isProfileClosed}
              ref={availabilityRef}
            />
          );
        case 'Bio':
          return <BioSection key={key} listing={listing} ref={bioRef} />;
        case 'Services':
          return (
            <ServicesSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={servicesRef}
            />
          );
        case 'Training':
          return (
            <CertificationsSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={certificationsAndTrainingRef}
            />
          );
        case 'Certifications/Training':
          return (
            <CertificationsSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={certificationsAndTrainingRef}
            />
          );
        case 'Additional':
          return (
            <AdditionalInfoSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={additionalInfoRef}
            />
          );
        case 'Job Description':
          return (
            <JobDescriptionSection
              listing={listing}
              key={key}
              ref={jobDescriptionRef}
              currentUserListing={currentUserListing}
              findLabel={findLabel}
              filterConfig={config.custom.filters}
            />
          );
        case 'Care Schedule':
          return (
            <CareScheduleSection
              key={key}
              careSchedule={careSchedule}
              filterConfig={config.custom.filters}
              ref={careScheduleRef}
              isMobile={isMobile}
            />
          );
        case 'Care Recipients(s)':
          return (
            <CareRecipientsSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={careRecipientsRef}
            />
          );
        case 'Caregiver Preferences':
          return (
            <CaregiverPreferencesSection
              key={key}
              listing={listing}
              currentUserListing={currentUserListing}
              filterConfig={config.custom.filters}
              findLabel={findLabel}
              ref={caregiverPreferencesRef}
            />
          );
        default:
          return null;
      }
    },
    [
      JSON.stringify(listing),
      JSON.stringify(currentUserListing),
      JSON.stringify(entries),
      isProfileClosed,
    ]
  );

  const mappedTabs = useMemo(() => {
    return tabs.map((tab, index) => {
      return renderSection(tab.text, tab.text);
    });
  }, [JSON.stringify(tabs), renderSection]);

  return (
    <>
      <ButtonTabNavHorizontal
        tabs={tabs}
        rootClassName={css.nav}
        tabRootClassName={css.tab}
        tabContentClass={css.tabContent}
        tabClassName={css.tab}
      />
      {mappedTabs}
    </>
  );
};

export default ListingTabs;
