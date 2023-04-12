import PropTypes from 'prop-types';

import React from 'react'

//iconify
import { Icon } from '@iconify/react';

//components
import Nav from './Nav';

const BeeDataModal = (props) => {
    
  return (

    <div id="data" className='animate-translateBox fixed top-[0px] sm:left-[85px] w-full sm:w-[800px] h-screen bg-white z-[1000]  m-w-[1000px]  overflow-y-scroll'>
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