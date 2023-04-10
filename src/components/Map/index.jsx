import { useState } from 'react';

// react-leaflet
import { MapContainer, TileLayer,Marker ,Popup} from 'react-leaflet';

// Components
import BeeDataModal from '../BeeDataModal';
import CustomIcon from "../CustomIcon"



const ourLocation = [30.4270, -8.8763]


const Map = () => {
   const [isBeeDatalDisplayed,setIsBeeDataDisplayed] = useState(false) 

   const closeBeeData = ()=>setIsBeeDataDisplayed(false)
   const openBeeData = ()=>setIsBeeDataDisplayed(true)


  return (
    <MapContainer style={{width:"100%",height:"100vh"}} center={ourLocation} zoom={9} scrollWheelZoom={false}>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  <Marker position={ourLocation} icon={CustomIcon} eventHandlers={{ click: openBeeData }}>
    
  </Marker>
   {isBeeDatalDisplayed && <BeeDataModal onClose={closeBeeData}/>}
</MapContainer>
  )
}

export default Map;