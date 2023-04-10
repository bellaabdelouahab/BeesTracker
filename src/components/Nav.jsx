import React,{useState} from 'react'


//iconify
import { Icon } from '@iconify/react'

// react-router-dom
import { Link,useLocation,useNavigate } from 'react-router-dom'

//

const Nav = (props) => {
  
  const location = useLocation();
  

  const [selectedNav,setSelectedNav] = useState("Map")
 
  
  const navItemClass = "text-white text-[40px] hover:bg-[#00948C] p-[5px] cursor-pointer transition-all duration-300"

  const navIcon = props.isNavDisplayed?"material-symbols:keyboard-double-arrow-left":"material-symbols:keyboard-double-arrow-right"

 
  

  return (
    
    
    <>
    <Icon onClick={props.ToggleNav} icon={navIcon} className={navItemClass+" bg-[#2CB97D] fixed top-[80px] left-[20px] z-[100000]"}/>
    <div>
      
              
    
      
      {
        props.isNavDisplayed && (
          <div className='fixed top-[0px] left-[0px] h-[100vh] w-[80px] bg-[#2CB97D] z-[10000]'>
<div className='flex flex-col items-center justify-center gap-[10px] h-full'>
      <Link to={"/Map"}>
      <Icon  icon={"material-symbols:home-outline"} className={`${navItemClass} ${selectedNav==="Map"?" bg-[#00948C]":" bg-[#2CB97D]"}`} onClick={()=>setSelectedNav("Map")}/>
</Link>
<Link to={"/Notifications"}>
<Icon icon={"material-symbols:notifications-outline"} className={`${navItemClass} ${selectedNav==="Notifications"?" bg-[#00948C]":" bg-[#2CB97D]"}`} onClick={()=>setSelectedNav("Notifications")}/>

</Link>
<Link to={"/Profile"}>
<Icon icon={"gg:profile"} className={`${navItemClass} ${selectedNav==="Profile"?" bg-[#00948C]":" bg-[#2CB97D]"}`} onClick={()=>setSelectedNav("Profile")}/>

</Link>
      <Icon icon={"material-symbols:logout"} className={`${navItemClass} ${"bg-[#f44336]"}`}/>
      </div>
      </div>
        )
      }
       
  
    </div>
    </>
  )
}

export default Nav