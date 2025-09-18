import React, { useEffect, useState } from "react";
import menu from "@front/assets/images/main.png";
import { getSettings } from "@shared/services/settings";
import { SettingsData } from "@shared/types/settings";

const Home = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error("설정 불러오기 실패:", err);
      }
    })();
  }, []);

  return (
    <div className="container">
      <div
        className="main_bgimg wow fadeIn"
        data-wow-delay="0.0s"
        style={{
          backgroundImage: `url(${settings?.mainImage || menu})`,
        }}
      ></div>

      {settings && (
        <div className="sns-links">
          <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>{" | "}
          <a href={settings.youtube} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>{" | "}
          <a href={settings.tiktok} target="_blank" rel="noopener noreferrer">
            TikTok
          </a>{" | "}
          <a href={settings.cafe} target="_blank" rel="noopener noreferrer">
            Cafe
          </a>{" | "}
          <a href={settings.shop} target="_blank" rel="noopener noreferrer">
            Shop
          </a>
        </div>
      )}
    </div>
  );
};

export default Home;
