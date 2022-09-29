import React, { useState } from "react";
import "./Fades.css";

const FadeImg = (props) => {
  const [show, setShow] = useState(false);

  const onLoad = () => {
    setShow(true);
  };

  return (
    
    <img
      style={{
        opacity: 0,
        animation: show ? `fadeIn 0.5s ease-out forwards` : "",
      }}
      {...props}
      onLoad={onLoad}
    />
  );
};

export default FadeImg;
