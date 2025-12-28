<?php
defined('BASEPATH') or exit('No direct script access allowed');

// Manually load the Google API Client Library classes
function load_google_client_library() {
    // Base path to the library
    $libraryPath = APPPATH . 'third_party/google-api-php-client/src/';

    // Include all the required Google API PHP Client files
    require_once $libraryPath . 'Client.php';
   // require_once $libraryPath . 'Service/YouTube.php';
    require_once $libraryPath . 'Service/Resource.php';
    //require_once $libraryPath . 'Service/YouTube/Resource/Subscriptions.php';
    require_once $libraryPath . 'Model.php';
    require_once $libraryPath . 'Collection.php';
    require_once $libraryPath . 'Http/REST.php';
    //require_once $libraryPath . 'Http/Request.php';
    require_once $libraryPath . 'Http/Batch.php';
    require_once $libraryPath . 'Http/MediaFileUpload.php';
    require_once $libraryPath . 'Service.php';
    //require_once $libraryPath . 'Auth/OAuth2.php';
}
