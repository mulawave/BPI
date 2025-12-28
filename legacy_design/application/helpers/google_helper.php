<?php
require_once 'vendor/autoload.php'; // Load Google Client Library using Composer's autoload

function getGoogleClient() {
    $client = new Google_Client();
    $client->setApplicationName('BeepAgro Africa');
    $client->setAuthConfig('./youtube/ysk.json'); // Ensure this path is correct relative to your root directory
    $client->setScopes(Google_Service_YouTube::YOUTUBE_READONLY);
    $client->setAccessType('offline');
    $client->setPrompt('consent');
    return $client;
}


