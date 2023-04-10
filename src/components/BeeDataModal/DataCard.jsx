import PropTypes from 'prop-types';


import React from 'react'

const DataCard = ({stream}) => {
  
    return (
    <div className='shadow-lg hover:shadow-xl transition-all border border-gray-100 flex flex-col justify-start items-start w-[350px] p-[20px] rounded-[20px]'>
         <h1 className="!font-thin teext-[20px]">{stream.title}</h1>
         <div>
         <div className='h-full flex justify-center items-center'>
          
             {stream.icon}
            
        <div>

       
        <div>
        <h2 className="text-[10px]">current value</h2> 
        <p className="text-[30px]">{stream.currentValue} <span></span>{stream.unit}</p>
        </div>
         <div>
         <p>previous Stream : {stream.lastValue} {stream.unit}</p> 
         </div>
       </div>
        </div>
         </div>
        
       
        
        
        
        
    </div>
  )
}

export default DataCard

DataCard.propTypes ={
    stream:PropTypes.object

}