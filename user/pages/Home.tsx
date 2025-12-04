'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@services/axios";
import mainImage from "@front/assets/images/main.png";

interface SettingsResponse {
  success: boolean;
  data: {
    mainImage: string;
  };
}

export default function Home() {
  
  return (
    <div>      
        <Image
          src={mainImage}
          alt="Main"/>
      </div>
  );
}