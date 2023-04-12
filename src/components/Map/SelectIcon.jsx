import selectedBee from "../../assets/images/selectedBee.png"


import L from "leaflet";

let SelectIcon = new L.Icon({
  iconUrl: selectedBee,
  iconRetinaUrl: selectedBee,
  iconAnchor: null,
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: new L.Point(50, 50),
  className: "leaflet-div-icon",
});




export default SelectIcon;
