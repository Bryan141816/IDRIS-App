import MapView from "../../../components/MapView/MapView";

const markers = [
    { lat: 10.313924, lng: 123.887082 },
    { lat: 10.316693, lng: 123.898476 },
    { lat: 10.322786, lng: 123.910633 },
  ];

const MapOfCebu = () =>{
    return(
        <MapView center={[10.313924, 123.887082]} markers={markers}></MapView>
    );
}
export default MapOfCebu