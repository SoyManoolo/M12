// src/pages/index.tsx
import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from 'next/router';

const HomePage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
};

export default HomePage;
