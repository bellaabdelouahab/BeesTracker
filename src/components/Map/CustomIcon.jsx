import bee from "../../assets/svgs/bee.svg";
import be from "../../assets/images/bee-removebg-preview.png";
import selectedBee from "../../assets/images/selectedBee.png"


import L from "leaflet";

let CustomIcon = new L.Icon({
  iconUrl: be,
  iconRetinaUrl: be,
  iconAnchor: null,
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: new L.Point(50, 50),
  className: "leaflet-div-icon",
});




export default CustomIcon;
