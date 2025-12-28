<?php
defined('BASEPATH') OR exit('No direct script access allowed');

if (!function_exists('extract_channel_id')) {
    /**
     * Extracts the YouTube Channel ID from a given URL.
     * Supports different formats: /channel/ID, /user/USERNAME, /c/CUSTOM_NAME.
     *
     * @param string $channel_url The YouTube channel URL.
     * @param object $service The Google_Service_YouTube instance.
     * @return string|null The Channel ID or null if not found.
     */
    function extract_channel_id($channel_url, $service) {
        // Check if the URL is in the format: youtube.com/channel/CHANNEL_ID
        if (preg_match('/youtube\.com\/channel\/([^\/]+)/', $channel_url, $matches)) {
            return $matches[1];
        } 
        // Check if the URL is in the format: youtube.com/user/USERNAME
        elseif (preg_match('/youtube\.com\/user\/([^\/]+)/', $channel_url, $matches)) {
            $username = $matches[1];
            // Fetch channel ID by username using the API
            $response = $service->channels->listChannels('id', ['forUsername' => $username]);
            if (!empty($response->items)) {
                return $response->items[0]->id;
            }
        } 
        // Check if the URL is in the format: youtube.com/c/CUSTOM_NAME
        elseif (preg_match('/youtube\.com\/c\/([^\/]+)/', $channel_url, $matches)) {
            $custom_name = $matches[1];
            // Fetch channel ID by custom name
            $response = $service->search->listSearch('snippet', ['q' => $custom_name, 'type' => 'channel']);
            if (!empty($response->items)) {
                return $response->items[0]->id->channelId;
            }
        }

        return null; // Return null if no valid channel ID could be determined
    }
}
