/**
 * YouTube API Integration
 * Handles verification of YouTube channels and subscriptions
 */

import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY, // Add this to your .env
});

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: number;
}

/**
 * Extract Channel ID from various YouTube URL formats
 */
export function extractChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/i,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/i,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube channel details including description
 */
export async function getChannelDetails(channelIdOrHandle: string): Promise<YouTubeChannel | null> {
  try {
    // Try as channel ID first
    let response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelIdOrHandle],
    });

    // If not found, try as handle/username
    if (!response.data.items || response.data.items.length === 0) {
      response = await youtube.channels.list({
        part: ['snippet', 'statistics'],
        forHandle: channelIdOrHandle,
      });
    }

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const channel = response.data.items[0];
    return {
      id: channel.id!,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
      thumbnailUrl: channel.snippet?.thumbnails?.high?.url || '',
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
    };
  } catch (error) {
    console.error('YouTube API error:', error);
    return null;
  }
}

/**
 * Verify if a verification code exists in channel description
 */
export async function verifyChannelCode(
  channelUrl: string,
  verificationCode: string
): Promise<{ verified: boolean; channelData?: YouTubeChannel }> {
  const channelIdOrHandle = extractChannelId(channelUrl);
  
  if (!channelIdOrHandle) {
    return { verified: false };
  }

  const channelData = await getChannelDetails(channelIdOrHandle);
  
  if (!channelData) {
    return { verified: false };
  }

  const verified = channelData.description.includes(verificationCode);
  
  return { verified, channelData: verified ? channelData : undefined };
}

/**
 * Check if a user is subscribed to a channel (requires OAuth)
 * Note: This requires user's YouTube OAuth token
 */
export async function checkUserSubscription(
  userAccessToken: string,
  channelId: string
): Promise<boolean> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: userAccessToken });

    const youtubeAuth = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await youtubeAuth.subscriptions.list({
      part: ['snippet'],
      mine: true,
      forChannelId: channelId,
    });

    return (response.data.items?.length || 0) > 0;
  } catch (error) {
    console.error('Subscription check error:', error);
    return false;
  }
}
