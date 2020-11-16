import React from 'react';
import circleRed from './circleRed.svg';
import circleGreen from './circleGreen.svg';


function StatusIndicator({connected, handleClickOpen = e => {}}) {
  const icon_style = { 
    position:"absolute",
    top: "15px",
    right: "15px",
  }

  return (
    <div onClick={handleClickOpen} style={icon_style}>
    
      <span style={{color:"white"}} >Status: </span>

      <img 
        src={connected ? circleGreen : circleRed} 
        alt=""
        width="12" 
        height="12" 
      />
    
    </div>
  )
}


export default function StatusIcon({connected}) {

  return (
    <div>
      <StatusIndicator connected={connected}/>
    </div>
  ) 
}
