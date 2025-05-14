export async function getScoutToken(target) {
  try {
    const response = await fetch(
      process.env.API_LINK + "/scout/get-scout-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to install commands.");
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Token not found in response.");
    }
    return data.token;
  } catch (error) {
    console.error("Error during install:", error);
  }
}

export async function storeScoutToken(userId, data) {
  try {
    const response = await fetch(
      process.env.API_LINK + "/scout/store-scout-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, data }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to store token.");
    }
  } catch (error) {
    console.error("Error during token storage:", error);
  }
}

export async function updateHidden(target) {
  try {
    const response = await fetch(
      process.env.API_LINK + "/scout/update-hidden",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update visibility.");
    }

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error("Error during visibility update:", error);
  }
}
