import React, { useState } from 'react';
import menu from '@/assets/images/main.png';

const Home = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <>
      <div className="container">
        <div
          className="main_bgimg wow fadeIn"
          data-wow-delay="0.0s"
          style={{
            backgroundImage: `url(${menu})`,
          }}
        ></div>
      </div>
    </>
  );
};

export default Home;
