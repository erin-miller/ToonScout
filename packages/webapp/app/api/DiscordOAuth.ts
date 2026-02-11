export async function handleOAuthToken(fragment: URLSearchParams) {
  const accessToken = fragment.get('access_token')
  const state = fragment.get('state')
  const expiresAt = fragment.get('expires_in')
  let userId: string

  if (accessToken) {
    userId = await getDiscordUserId(accessToken)

    if (userId && expiresAt) {
      await storeToken(userId, accessToken, expiresAt) // Sends token to backend to store in cookie
    } else {
      console.error('Failed to get user ID.')
      return null
    }
  } else {
    userId = ''
    console.error('Access token not found.')
  }

  if (state === null || localStorage.getItem('oauth-state') !== atob(decodeURIComponent(state))) {
    console.log('You may have been click-jacked!')
    return
  }

  // clear fragment
  window.history.replaceState({}, document.title, window.location.pathname)
  return userId
}

async function storeToken(userId: string, accessToken: string, expiresAt: string) {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_API_HTTP + '/token/store-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, accessToken, expiresAt }),
      credentials: 'include' // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error('Failed to store token in the database.')
    }
  } catch (error) {
    console.error('Error storing access token:', error)
  }
}

async function getDiscordUserId(accessToken: string) {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Discord user information.')
    }

    const userData = await response.json()
    return userData.id
  } catch (error) {
    console.error('Error fetching Discord user ID:', error)
    return null
  }
}
