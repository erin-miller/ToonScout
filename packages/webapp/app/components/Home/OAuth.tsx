import React from "react";
import "/styles/auth.css";
import ArrowButton from "@/app/components/ArrowButton";

const generateRandomString = (length = 16) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

export const initOAuth = () => {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const uri = window.location.origin;
  const redirectUri = encodeURIComponent(uri);
  const scope = encodeURIComponent("identify");

  const randomState = generateRandomString();
  localStorage.setItem("oauth-state", randomState);

  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&state=${btoa(
    randomState
  )}`;

  // Redirect to Discord authorization URL
  window.location.href = url;
};

const OAuth = () => {
  return (
    <div>
      <h2 className="minnie-title text-3xl mb-6 w-full">Connect to Discord</h2>
      <p>When connected, you can view your toon's information on Discord.</p>
      <p className="py-2">Click the button below to begin!</p>
      <ArrowButton onClick={initOAuth} />
    </div>
  );
};

export default OAuth;
