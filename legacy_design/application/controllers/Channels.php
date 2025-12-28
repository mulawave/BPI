<?php
defined('BASEPATH') OR exit('No direct script access allowed');
//use Google_Client;
//use Google_Service_YouTube;

class Channels extends CI_Controller {
    private $apiKey;

    public function __construct() {
        parent::__construct();
        $this->load->helper('google');
        $this->load->model('Channel_model');
        $this->load->helper( 'url' );
        $this->load->library( 'form_validation' );
        $this->load->library( 'session' );
        $this->load->database();
        $this->load->model( 'generic_model' );
        //$this->load->helper('google_api_helper'); 
        $this->load->library( 'pagination' );
        $this->apiKey = 'AIzaSyDKqUuC-gblgAOEtjpC7dC5R-NnIf9a6X0';
       // load_google_client_library();
    }
    
    private function get_channel_id_from_username($username) {
    // Remove @ symbol if it's a handle
    $username = ltrim($username, '@');

    // Replace with your YouTube API key
    $apiKey = 'AIzaSyDKqUuC-gblgAOEtjpC7dC5R-NnIf9a6X0';

    // YouTube Data API search URL
    $apiUrl = 'https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q='.urlencode($username).'&key='.$apiKey;

    // Use cURL to make the API request
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $apiUrl);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

    // Execute the request and get the response
    $response = curl_exec($curl);
    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($response, true);

    // Check if the API returned a valid channel
    if (isset($data['items']) && count($data['items']) > 0) {
        return $data['items'][0]['id']['channelId'];  // Return the channel ID
    } else {
        return null;  // Return null if no channel ID is found
    }
}

    public function get_plan(){
        $plan_id = $this->input->post('plan_id');
        $userid = $this->session->userdata( 'user_id' );
        $plan_details = $this->generic_model->getInfo('youtube_plans','id',$plan_id);
        $user = $this->generic_model->getInfo('users','id',$userid);
        $availableFunds = ($user->wallet + $user->spendable);
        $vat = (7.5*$plan_details->amount)/100;
        $debit = $plan_details->amount;
        $totalDebitAmt = ($debit + $vat);
        if(bccomp($availableFunds, $totalDebitAmt, 2)  >= 0){
             $newWallet_balance = ($availableFunds - $totalDebitAmt);
             $update_user_data = array(
				'wallet' => $newWallet_balance,
    			);
            $user_table = 'users';
            $user_condition = array('id' => $userid);
            $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
            
            $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>$plan_id,
                            'transaction_type' => 'debit',
                            'amount' => $debit,  // Assuming you have the price for each item
                            'description' => 'Youtube Plan',  // Add a relevant description
                            'status' => 'Successful'
                        );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                  
            $transactionVAT = array(
                            'user_id' => $userid,
                            'order_id' =>$plan_id,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  // Assuming you have the price for each item
                            'description' => 'VAT charge for Youtube Plan',  // Add a relevant description
                            'status' => 'Successful'
                        );
            $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
            $data_ent = [
            'user_id' => $userid,
            'youtube_plan' => $plan_id,
            'balance' => $plan_details->total_sub,
        ]; 	 	 	
            $this->generic_model->insert_data('youtube_provider',$data_ent);
            
            $this->reset_session();
            $this->session->set_flashdata('success', 'Subscription Successful');
            redirect('submit_channel');
        }
        else{
            $this->session->set_flashdata('error', 'insufficient wallet balance, please top up your wallet before proceeding');
            redirect('submit_channel');
        }
        
    }

    // Display form for channel submission
    public function submit_channel() {
    if ( $this->session->userdata( 'user_id' ) ) {
     $userid = $this->session->userdata( 'user_id' );        
     $this->reset_session();
     $user_details = $this->session->userdata( 'user_details' );
     //print_r($user_details);
     $user_channel = $this->generic_model->getInfo_channel('youtube_channels', 'user_id', $userid);
     $data['unread_count'] = $this->generic_model->get_unread_count($userid);
     $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
     $data[ 'user_details' ] = $user_details;
     $data['user_channel'] = $user_channel;
     $this->load->view('submit_channel_form', $data);        
    } 
    else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }

    // Handle channel submission
    public function submit_channel_process() {
        $channel_url = $this->input->post('channel_url');
        $channel_name = $this->input->post('channel_name');
        $channel_link = $this->input->post('channel_link');

        // Generate a unique verification code
        $verification_code = uniqid();
        $data = [
            'user_id' => $this->session->userdata('user_id'), // Assume user_id is stored in session
            'channel_name' => $channel_name,
            'channel_url' => $channel_url,
            'channel_link' => $channel_link,
            'verification_code' => $verification_code,
            'is_verified' => 0
        ];

        $this->Channel_model->add_channel($data);

        // Instruct user to add verification code to their channel description
        $this->session->set_flashdata('success', "Please add the verification code: $verification_code to your YouTube channel description.");
        $userid = $this->session->userdata( 'user_id' );  
        $user_details = $this->session->userdata( 'user_details' );
        $data['verification_code'] = $verification_code;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view('verification_instructions', $data);
    }
    
  public function retry_verification() {
    $userid = $this->session->userdata('user_id'); 
    $channel_id = $this->input->post('channel_id');  

    // Fetch the user channel data using channel ID
    $user_channel = $this->generic_model->getInfo_channel('youtube_channels', 'id', $channel_id);
        
    $verification_code = $user_channel->verification_code; 
    $client = getGoogleClient();

    // Check if user is already authenticated
    if ($this->session->userdata('access_token')) {
        $client->setAccessToken($this->session->userdata('access_token'));
    }

    if ($client->isAccessTokenExpired()) {
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);
    }

    // Proceed with API call using YouTube service
    $service = new Google_Service_YouTube($client);
    
    // Get the channel ID from username/handle
    $channel_id = $this->get_channel_id_from_username($user_channel->channel_url); 

    if (!empty($channel_id)) {
        $response = $service->channels->listChannels('snippet', ['id' => $channel_id]);

        if (!empty($response->items)) {
            $channelDescription = $response->items[0]->snippet->description;
            if (strpos($channelDescription, $verification_code) !== false) {
                $this->Channel_model->update_verification_status($user_channel->id, 1);
                $this->session->set_flashdata('success', 'Channel successfully verified!');
            } else {
                $this->session->set_flashdata('error', 'Verification code not found. Please add it to your channel description. CODE: '.$user_channel->verification_code);
                redirect('channels/submit_channel');
            }
        } else {
            $this->session->set_flashdata('error', 'Unable to retrieve channel information. Please check the channel URL.');
            redirect('channels/submit_channel');
        }
    } else {
        $this->session->set_flashdata('error', 'Invalid YouTube channel URL.');
        redirect('channels/submit_channel');
    }

    redirect('channels/verified_channels');
}

    public function upgrade(){
        if ( $this->session->userdata( 'user_id' ) ) {
        $userid = $this->session->userdata( 'user_id' );
        $user_details = $this->session->userdata( 'user_details' );
        $channel_id = $this->input->post('channel_id');
        $current_plan = $this->input->post('youtube_plan');
        $new_plan = $this->input->post('upgrade_plan');
        
        //get old plan data
        $oldPlanData = $this->generic_model->getInfo('youtube_provider', 'user_id', $userid);
        $oldViewBalance = $oldPlanData->balance;
        
        //get new plan data
        $newPlanData = $this->generic_model->getInfo('youtube_plans', 'id', $new_plan);
        $newViews = $newPlanData->total_sub;
        $cost = $newPlanData->amount;
        
        //check if wallet can handle upgrade cost.
        $user = $this->generic_model->getInfo('users','id',$userid);
        $availableFunds = ($user->wallet + $user->spendable);
        if(bccomp($availableFunds, $cost, 2)  >= 0){
            $newWallet_balance = ($availableFunds - $cost);
            $update_user_data = array(
				'wallet' => $newWallet_balance,
    			);
            $user_table = 'users';
            $user_condition = array('id' => $userid);
            $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
            
            $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>$new_plan,
                            'transaction_type' => 'debit',
                            'amount' => $cost,  // Assuming you have the price for each item
                            'description' => 'Youtube Plan Upgrade',  // Add a relevant description
                            'status' => 'Successful'
                        );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
            
            //update the plan data
            $plan_table = 'youtube_provider';
            $update_plan_data = array(
				'balance' => ($newViews + $oldViewBalance),
				'youtube_plan' => $new_plan
    			);
            $plan_condition = array('user_id' => $userid);
            $plan_rows_affected = $this->generic_model->update_data($plan_table, $update_plan_data, $plan_condition);
            
            $this->session->set_flashdata('success', 'Upgrade was successful!');
            redirect('channels/verified_channels');
        }
        else{
            $this->session->set_flashdata('error', 'insufficient wallet balance, please top up your wallet before proceeding');
            redirect('channels/verified_channels');
        }   
        } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
           
    }


    public function subscribe() {
    $userid = $this->session->userdata('user_id');
    $channel_id = $this->input->post('channel_id');

    // Fetch channel details
    $channel = $this->generic_model->getInfo_channel('youtube_channels', 'id', $channel_id);

    if (!$channel || !$channel->is_verified) {
        $this->session->set_flashdata('error', 'Invalid or unverified channel.');
        redirect('channels/verified_channels');
        return;
    }

    // Check if user is already subscribed in your system
    $subscription = $this->generic_model->getInfoCondition('channel_subscriptions', 'user_id', $userid, array('channel_id' => $channel_id));

    if ($subscription) {
        $this->session->set_flashdata('info', 'You are already subscribed to this channel.');
        redirect('channels/verified_channels');
        return;
    }
    
    $this->Channel_model->add_subscription($userid, $channel_id);
    
    redirect('channels/verified_channels');

    // Initialize Google Client
    //$client = getGoogleClient();
/*
    // Check if user is authenticated
    if ($this->session->userdata('access_token')) {
    $client->setAccessToken($this->session->userdata('access_token'));

    // Check if the current access token has the required scope
    if (!in_array('https://www.googleapis.com/auth/youtube.force-ssl', $token_data['scope'])) {
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);  // Redirect to OAuth consent if insufficient scope
        return;
    }
    } 
    else {
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);  // Redirect to OAuth consent if not authenticated
        return;
    }

    // Check if access token is expired
    if ($client->isAccessTokenExpired()) {
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);  // Redirect to OAuth consent if token is expired
        return;
    }

    $channelId = $this->extract_channel_id($channel->channel_url);
    if (!$channelId) {
        $this->session->set_flashdata('error', 'Invalid YouTube channel URL or unable to extract channel ID.');
        redirect('channels/verified_channels');
        return;
    }

    // Proceed with YouTube API call to subscribe to the channel
    $service = new Google_Service_YouTube($client);

    $subscription = new Google_Service_YouTube_Subscription();
    $snippet = new Google_Service_YouTube_SubscriptionSnippet();
    $resourceId = new Google_Service_YouTube_ResourceId();

    $resourceId->setKind('youtube#channel');
    $resourceId->setChannelId($channelId);

    $snippet->setResourceId($resourceId);
    $subscription->setSnippet($snippet);

    try {
        $response = $service->subscriptions->insert('snippet', $subscription);

        if ($response && isset($response['id'])) {
            $this->db->trans_start();
            $this->Channel_model->add_subscription($userid, $channel_id);
            
            $this->db->trans_complete();

            if ($this->db->trans_status() === FALSE) {
                $this->session->set_flashdata('error', 'Transaction failed. Please try again.');
            } else {
                $this->session->set_flashdata('success', 'Subscription successful on YouTube and within the system.');
            }
        } else {
            $this->session->set_flashdata('error', 'Failed to subscribe to the YouTube channel. Please try again.');
        }
    } catch (Google_Service_Exception $e) {
        $this->session->set_flashdata('error', 'Failed to subscribe: ' . $e->getMessage());
    } catch (Exception $e) {
        $this->session->set_flashdata('error', 'An unexpected error occurred: ' . $e->getMessage());
    }*/

    
}
    
    public function claim(){
        $userid = $this->session->userdata('user_id');
        $channel_id = $this->input->post('channel_id');
        // Fetch channel details
        $channel = $this->generic_model->getInfo_channel('youtube_channels', 'id', $channel_id);
        
        $subscription = $this->generic_model->getInfoCondition('channel_subscriptions', 'user_id', $userid, array('channel_id' => $channel_id));
        
        $this->pay_user($userid, $channel_id);
        $status = 'paid';
        $this->Channel_model->update_subscription_status($subscription->id, $status);
        
        $provider = $this->generic_model->getInfo('youtube_provider', 'user_id', $channel->user_id);
        $provider_balance = $provider->balance;
        $newBalance = ($provider_balance - 1);
        $this->generic_model->update_data('youtube_provider', array('balance' => $newBalance), array('id' => $provider->id));
        
        $this->session->set_flashdata('success', 'Claim Processed Successfully');
        redirect('channels/verified_channels');

    }

    public function check_subscriptions() {
    $subscriptions = $this->Channel_model->get_pending_subscriptions();

    foreach ($subscriptions as $subscription) {
        $userid = $subscription->user_id;
        $client = getGoogleClient();
        $service = new Google_Service_YouTube($client);
        
        $response = $service->subscriptions->listSubscriptions('snippet', ['part' => 'snippet', 'mine' => true]);
        
        $subscribed = false;
        foreach ($response->items as $item) {
            if ($item->snippet->resourceId->channelId == $subscription->channel_id) {
                $subscribed = true;
                break;
            }
        }
        
        if ($subscribed) {
            // Payment logic here
            $this->pay_user($userid,$subscription->channel_id);
            $this->Channel_model->update_subscription_status($subscription->id, 'paid');
        } else {
            // Handle unsubscription
            $this->Channel_model->remove_subscription($subscription->id);
            $this->Channel_model->ban_user($subscription->user_id);
        }
    }
}
    
    public function pay_user($user_id,$channel_id) {
    $user_wallet = $this->generic_model->getInfo('users','id',$user_id);
    $oldwallet = $user_wallet->wallet;
    $newwallet = (40 + $oldwallet );
    $this->generic_model->update_data( 'users', array( 'wallet' => $newwallet ), array( 'id' => $user_id ));
    
    $transaction = array(
        'user_id' => $user_id,
        'order_id' => 0,
        'transaction_type' => 'credit',
        'amount' => 40,
        'description' => 'BPI Youtube Subscription Earnings',
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $transaction );
    
    $referrer = $this->generic_model->getInfo( 'referrals', 'user_id', $user_id )->referred_by;
    $referrer_info = $this->generic_model->getInfo( 'users', 'id', $referrer );
    $oldwallet_ref = $referrer_info->wallet;
    $newwallet_ref = ( 10 + $oldwallet_ref );
    $this->generic_model->update_data( 'users', array( 'wallet' => $newwallet_ref ), array( 'id' => $referrer ) );
        
    $transactionREf = array(
        'user_id' => $referrer_info->id,
        'order_id' => 0,
        'transaction_type' => 'credit',
        'amount' => 10,
        'description' => 'BPI Youtube Subscription Referral Earnings',
        'status' => 'Successful'
      );
      $trans_send_ref = $this->generic_model->insert_data( 'transaction_history', $transactionREf );
        
        //	
        $data = array(
           'user_id'=>$user_id,
            'channel_id'=>$channel_id,
            'amount'=>40,
            'is_paid'=>1,
            'created_at'=>date('Y-m-d H:i:s')
        );
        $this->Channel_model->add_user_earnings($data);
        
        $data_ref = array(
           'user_id'=>$referrer_info->id,
            'channel_id'=>$channel_id,
            'amount'=>10,
            'is_paid'=>1,
            'created_at'=>date('Y-m-d H:i:s')
        );
        $this->Channel_model->add_user_earnings($data_ref);

    }
    
    public function verified_channels() {
        $userid = $this->session->userdata( 'user_id' );        
        $this->reset_session();
        $user_details = $this->session->userdata( 'user_details' );
        //print_r($user_details);
        //exit;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $data['channels'] = $this->Channel_model->get_verified_channels();
        $this->load->view('verified_channels', $data);
    }
    
    public function verify_channel() {
     if ( $this->session->userdata( 'user_id' ) ) {
     $userid = $this->session->userdata( 'user_id' );
    $user_details = $this->session->userdata('user_details');
    $user_channel = $this->generic_model->getInfo_channel('youtube_channels', 'user_id', $userid);
    $verification_code = $user_channel->verification_code; 
    $client = getGoogleClient();

    // Check if user is already authenticated
    if ($this->session->userdata('access_token')) {
        $client->setAccessToken($this->session->userdata('access_token'));
    }

    // Check if access token is expired and redirect to authorization URL if needed
    if ($client->isAccessTokenExpired()) {
        // If token is expired or not set, redirect to authorization URL
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);
    }

    // Proceed with API call using YouTube service
    $service = new Google_Service_YouTube($client);

    // Extract Channel ID from URL
    $channel_id = $this->get_channel_id_from_username($user_channel->channel_url); //$this->extract_channel_id($user_channel->channel_url);  // Ensure this function is defined

    if (!empty($channel_id)) {  
        $response = $service->channels->listChannels('snippet', ['id' => $channel_id]);

        if (!empty($response->items)) {
            $channelSnippet = $response->items[0]->snippet;

            // Get channel description for verification
            $channelDescription = $channelSnippet->description;

            // Get the channel logo URL from the thumbnails
            $channelLogoUrl = $channelSnippet->thumbnails->high->url;  // Use 'default', 'medium', or 'high' depending on preferred size

            if (strpos($channelDescription, $verification_code) !== false) {
                // Update verification status and channel logo in the database
                $data = [
                    'is_verified' => 1,
                    'channel_logo' => $channelLogoUrl
                ];
                $this->Channel_model->update_channel_info($user_channel->id, $data);

                // Set success message
                $this->session->set_flashdata('success', 'Channel successfully verified!');
            } else {
                $this->session->set_flashdata('error', 'Verification code not found. Please add it to your channel description.');
                redirect('channels/submit_channel');
            }
        } else {
            $this->session->set_flashdata('error', 'Unable to retrieve channel information. Please check the channel URL.');
        }
    } else {
        $this->session->set_flashdata('error', 'Invalid YouTube channel URL.');
    }

    redirect('channels/verified_channels');
     } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
}

    
   /* public function verify_channel() {
    $userid = $this->session->userdata('user_id'); 
    $user_details = $this->session->userdata('user_details');
    $user_channel = $this->generic_model->getInfo_channel('youtube_channels', 'user_id', $userid);
    $verification_code = $user_channel->verification_code; 
    $client = getGoogleClient();

    // Check if user is already authenticated
    if ($this->session->userdata('access_token')) {
        $client->setAccessToken($this->session->userdata('access_token'));
    }

    // Check if access token is expired and redirect to authorization URL if needed
    if ($client->isAccessTokenExpired()) {
        // If token is expired or not set, redirect to authorization URL
        $authUrl = $client->createAuthUrl();
        redirect($authUrl);
    }

    // Proceed with API call using YouTube service
    $service = new Google_Service_YouTube($client);

    // Extract Channel ID from URL
    $channel_id = $this->extract_channel_id($user_channel->channel_url);  // Make sure this function is defined within the controller

    if (!empty($channel_id)) {  // Corrected the check from `empty` to `!empty`
        $response = $service->channels->listChannels('snippet', ['id' => $channel_id]);
        
        if (!empty($response->items)) {
            $channelDescription = $response->items[0]->snippet->description;
            if (strpos($channelDescription, $verification_code) !== false) {
                // Update verification status
                $this->Channel_model->update_verification_status($user_channel->id, 1);
                $this->session->set_flashdata('success', 'Channel successfully verified!');
            } else {
                $this->session->set_flashdata('error', 'Verification code not found. Please add it to your channel description.');
                redirect('channels/submit_channel');
            }
        } else {
            $this->session->set_flashdata('error', 'Unable to retrieve channel information. Please check the channel URL.');
        }
    } else {
        $this->session->set_flashdata('error', 'Invalid YouTube channel URL.');
    }

    redirect('channels/verified_channels');
}*/

    public function extract_channel_id($url) {
    // Regular expression patterns to match various YouTube URL formats
    $patterns = [
        '/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i',  // For Channel URLs
        '/youtube\.com\/c\/([a-zA-Z0-9_-]+)/i',        // For Custom URLs
        '/youtube\.com\/user\/([a-zA-Z0-9_-]+)/i'      // For User URLs
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            $id = $matches[1];  // Extracted ID
            
            // For 'channel' URL, return the ID directly
            if (strpos($url, '/channel/') !== false) {
                return $id;
            }

            // For 'user' or 'custom' URLs, use the API to get the actual channel ID
            return $this->get_channel_id_from_username_or_custom_url($id);
        }
    }

    // If no pattern matched, return null
    return null;
}

    public function get_channel_id_from_username_or_custom_url($identifier) {
    $client = getGoogleClient();
    $service = new Google_Service_YouTube($client);

    try {
        // Use the YouTube API to find the channel ID by username or custom URL
        $response = $service->channels->listChannels('id', [
            'forUsername' => $identifier,  // Will work for both username or custom URL
        ]);

        if (!empty($response->items)) {
            return $response->items[0]->id;  // Return CHANNEL_ID
        } else {
            $this->session->set_flashdata('error', 'Could not find the YouTube channel for the given identifier.');
            return null;
        }
    } catch (Google_Service_Exception $e) {
        $this->session->set_flashdata('error', 'YouTube API error: ' . $e->getMessage());
        return null;
    }
}

     // Callback function for OAuth2 verification
    public function verify_callback() {
    $client = getGoogleClient();
    
    // Check if the authorization code is in the URL
    if ($this->input->get('code')) {
        $authCode = $this->input->get('code');
        
        // Exchange authorization code for access token
        $token = $client->fetchAccessTokenWithAuthCode($authCode);
        
        if (isset($token['access_token'])) {
            // Save token in session
            $this->session->set_userdata('access_token', $token);
            
            // Redirect to verify_channel with access token set
            redirect('channels/verify_channel');
        } else {
            // Handle error and show error message
            $this->session->set_flashdata('error', 'Unable to fetch access token. Please try again.');
            redirect('channels/submit_channel');
        }
    } else {
        // Handle error and show error message
        $this->session->set_flashdata('error', 'Authorization code not found in the request.');
        redirect('channels/submit_channel');
    }
}

    public function reset_session() {
    $userid = $this->session->userdata( 'user_id' );
    //check if this user has set their address
    $user = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
    if ( empty( $user->address ) || empty( $user->city ) || empty( $user->state ) || empty( $user->country ) ) {
      $this->session->set_flashdata( 'error', 'Set your address details to continue' );
      redirect( 'settings' );
    } else {
      $this->session->unset_userdata( 'user_details' );
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
      $this->session->set_userdata( 'user_details', $user_details );
    }


  }
}
?>
