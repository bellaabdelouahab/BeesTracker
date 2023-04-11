import PropTypes from 'prop-types';

import React from 'react'

//iconify
import { Icon } from '@iconify/react';

//components
import Nav from './Nav';

const BeeDataModal = (props) => {
    
  return (

    <div id="data" className='animate-translateBox fixed left-[10px] sm:left-[85px] bottom-[30%] w-[300px] sm:w-[550px] h-[400px] bg-white z-[1000]  sm:h-[400px] m-w-[1000px] sm:bottom-[23%] overflow-y-scroll'>
       <div className='w-full flex flex-col items-end'>
       <Icon icon="ic:baseline-close" onClick={props.onClose} className='cursor-pointer text-[30px] text-[#1769aa] m-[14px]'/>
       </div>
       <Nav/>
    </div>
  
  )
}

export default BeeDataModal


BeeDataModal.propTypes = {
    onClose: PropTypes.func
  };