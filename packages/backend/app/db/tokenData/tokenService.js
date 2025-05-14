import { connectToCookieDB } from "./tokenDB.js";

export async function storeCookieToken(userId, accessToken, expiresAt) {
  const collection = await connectToCookieDB();

  try {
    const result = await collection.updateOne(
      { userId: userId },
      {
        $set: {
          accessToken: accessToken,
          expiresAt: new Date(Date.now() + expiresAt * 1000),
        },
      },
      { upsert: true },
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("Error storing token:", error.message);
    throw error;
  }
}

// Get the token by the accessToken (which is in the cookie)
export async function getCookieToken(accessToken) {
  const collection = await connectToCookieDB();

  try {
    const user = await collection.findOne({ accessToken: accessToken });
    if (user) {
      const userId = user.userId;
      const expiresAt = new Date(user.expiresAt);
      return { userId, expiresAt }; // Return userId and expiry
    }
    return null;
  } catch (error) {
    console.error("Error retrieving token:", error.message);
    throw error;
  }
}
