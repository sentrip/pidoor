import React from 'react';
import circleRed from './circleRed.svg';
import circleGreen from './circleGreen.svg';



export default function StatusIcon({connected}) {
  const isConnected = React.useState(connected)
  const icon_style = { 
    position:"absolute",
    top: "15px",
    right: "15px",
  }

  return (
    <div style={icon_style}>
    
      <span style={{color:"white"}} >Status: </span>

      <img 
        src={circleGreen} 
        alt=""
        width="12" 
        height="12" 
        style={{display: connected ? 'inline-block' : 'none'}}
      />

      <img 
        src={circleRed} 
        alt=""
        width="12" 
        height="12"
        style={{display: connected ? 'none' : 'inline-block'}}
      />
    
    </div>
  )
}
