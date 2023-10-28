import React, { useEffect, useMemo } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { showListings } from './ListingTrackingPage.duck';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
} from '../../components';
import { TopbarContainer } from '..';

export const InboxPageComponent = props => {
  const { geolocations, scrollingDisabled } = props;
  const [map, setMap] = React.useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const markers = useMemo(() => {
    return geolocations.map(g => {
      return { lat: g.lat, lng: g.lng };
    });
  }, [geolocations]);

  useEffect(() => {
    props.onShowListings();
  }, []);

  const onLoad = map => {
    setMap(map);
    const bounds = new google.maps.LatLngBounds();
    markers?.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds);

    map.setCenter(bounds.getCenter());
  };

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      markers?.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds);

      map.setCenter(bounds.getCenter());
    }
  }, [markers]);

  return (
    <Page title="Inbox" scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="InboxPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          {!isLoaded ? (
            <h1>Loading...</h1>
          ) : (
            <GoogleMap mapContainerClassName="w-full h-fullHeightDesktop" onLoad={onLoad}>
              {geolocations.map(g => {
                return <Marker position={{ lat: g.lat, lng: g.lng }} />;
              })}
            </GoogleMap>
          )}
        </LayoutWrapperMain>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { geolocations } = state.ListingTrackingPage;

  return {
    geolocations,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = {
  onShowListings: showListings,
};

const InboxPage = compose(connect(mapStateToProps, mapDispatchToProps))(InboxPageComponent);

export default InboxPage;
