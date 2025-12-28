<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class SiteController extends CI_Controller {

  public function __construct() {
     parent::__construct();
    $this->load->helper( 'url' );
    $this->load->model(['pool_model', 'contribution_model']);
    $this->load->library( 'form_validation' );
    $this->load->library( 'session' );
    $this->load->database();
    $this->load->model( 'food_model' );
    $this->load->model( 'generic_model' );
    $this->load->model( 'user_model' );
    $this->load->library( 'pagination' );
    $this->load->model( 'merchant_model' );
    require_once APPPATH . 'libraries/fpdf.php';
  }

  public function my_assets() {
    // Check if the user is logged in (you can use session data)
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
      $data[ 'withdrawals' ] = $this->generic_model->select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
	  $data[ 'funding' ] = $this->generic_model->select_where( 'funding_history', array( 'user_id' => $userid ) );
      $data[ 'shelter_option' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
      $data[ 'bank_records' ] = $this->user_model->get_bank_records( $userid );
      $data[ 'results' ] = $transactions;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'wallets', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
  
  public function sendemail( $title, $to, $subject, $message ) {
    $data[ 'title' ] = $title;
    $data[ 'message' ] = $message;

    $mesg = $this->load->view( 'email_templates/index', $data, true );

    $this->load->library( 'phpmailer_lib' );
    // PHPMailer object
    $mail = $this->phpmailer_lib->load();
    // SMTP configuration
     $mail->isSMTP();
        $mail->Host     = 'smtp-relay.brevo.com';
        $mail->SMTPAuth = true;
        $mail->Username = '94a534002@smtp-brevo.com';
        $mail->Password = 'yhFRT3NEpUa6m2fG';
        $mail->SMTPSecure = 'tsl';
        $mail->Port     = 587;
        
        $mail->setFrom('info@beepagro.com', 'BeepAgro Palliative Initiative');
        $mail->addReplyTo('info@beepagro.com', 'BeepAgro Palliative Initiative');

    // Add a recipient
    $mail->addAddress( $to );

    // Add cc or bcc 
    // $mail->addCC('quicksave01@gmail.com');
    //$mail->addBCC('bcc@example.com');

    // Email subject
    $mail->Subject = $subject;

    // Set email format to HTML
    $mail->isHTML( true );

    // Email body content
    $mail->Body = $mesg;

    // Send email
    if ( !$mail->send() ) {
      $msg = 'Message could not be sent.' . $mail->ErrorInfo;
    } else {
      $msg = 1;
    }
    //return $msg;
  }
  
  public function pecv_dashboard() {
    if ($this->session->userdata('user_id')) {
        $userid = $this->session->userdata('user_id');
        $this->reset_session(); 
        $user_details = $this->session->userdata('user_details');
        $data['global_requests'] = $this->generic_model->select_all('bpi_support_requests', array('level'=>'global'));
        $data['national_requests'] = $this->generic_model->select_all('bpi_support_requests', array('level'=>'national'));
        $data['summary'] = $this->generic_model->get_my_support_summary($userid);
        $data['my_requests'] = $this->generic_model->select_all('bpi_support_requests', array('user_id'=> $userid));
        $data['donations'] = $this->generic_model->get_donations_by_user($userid);
        $data['leaderboard'] = $this->generic_model->get_top_donors($limit = 10);
        $data['support_received'] = $this->generic_model->get_support_received($userid);

        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data['user_details'] = $user_details;

        // Call the eligibility function and get the result array
        $eligibility_result = $this->_is_eligible_to_apply($userid);

        // Pass the status and message to the view
        $data['eligible'] = $eligibility_result['status'];
        $data['eligibility_message'] = $eligibility_result['message'];
        $data['eligibility_remark'] = $eligibility_result['remark'];

        $this->load->view('pevc_dashboard', $data);
    } else {
        redirect('login');
    }
}

 public function cs_donate($id) {
    if ($this->session->userdata('user_id')) {
        $userid = $this->session->userdata('user_id');
        $this->reset_session(); 
        $user_details = $this->session->userdata('user_details');
        $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
        
        $data['support_request'] = $this->generic_model->getInfo('bpi_support_requests', 'id', $id);

        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data['user_details'] = $user_details;

        // Call the eligibility function and get the result array
        $eligibility_result = $this->_is_eligible_to_apply($userid);

        // Pass the status and message to the view
        $data['eligible'] = $eligibility_result['status'];
        $data['eligibility_message'] = $eligibility_result['message'];
        $data['eligibility_remark'] = $eligibility_result['remark'];

        $this->load->view('donate_dashboard', $data);
    } else {
        redirect('login');
    }
}
  
   // 1. APPLY FOR COMMUNITY EMPOWERMENT
  public function apply_for_support() {
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
            $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );

            // Check eligibility
            $eligibility_result = $this->_is_eligible_to_apply($userid);
    
            if (!$eligibility_result['status']) {
                $this->session->set_flashdata('error', $eligibility_result['message']);
                redirect('pecv_dashboard');
            }

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $purpose = $this->input->post('purpose');
                $amount = $this->input->post('amount');
                $media_url = $this->handle_upload();

                // Determine level
                $support_level = $this->get_support_level($userid);
                
                //get default timeframe from total donated to and total amount donated
                $total_donated_amount = $this->generic_model->getSum('bpi_support_donations','amount',array('donor_id'=>$userid));
                $total_donated_to = $this->generic_model->get_count('bpi_support_donations','amount',array('donor_id'=>$userid));
                
                if($support_level == 'national'){
                    if($total_donated_amount >=40000 && $total_donated_amount <=60001){
                         $timer = 72;
                    }elseif($total_donated_amount > 60001 && $total_donated_amount <=80001){
                         $timer = 96;
                    }elseif($total_donated_amount > 80001 && $total_donated_amount <=100001){
                         $timer = 120;
                    }elseif($total_donated_amount > 100001){
                         $timer = 212;
                    }else{
                         $timer = 48;
                    }
                }else{
                    if($total_donated_amount >=40000 && $total_donated_amount <= 60001){
                         $timer = 96;
                    }elseif($total_donated_amount > 60001 && $total_donated_amount <= 80001){
                         $timer = 120;
                    }elseif($total_donated_amount > 80001 && $total_donated_amount <= 1000001){
                         $timer = 144;
                    }elseif($total_donated_amount > 100001){
                         $timer = 240;
                    }else{
                         $timer = 72;
                    }
                }


                $formdata = array(
                    'user_id' => $userid,
                    'amount_requested' => $amount,
                    'purpose' => $purpose,
                    'media_url' => $media_url,
                    'level' => $support_level,
                    'timer' => $timer,
                    'status' => 'pending',
                );
                
                $data['eligible'] = $eligibility_result['status'];
                $data['eligibility_message'] = $eligibility_result['message'];
                $data['eligibility_remark'] = $eligibility_result['remark'];
                $this->generic_model->insert('bpi_support_requests', $formdata);
                
                //send email
            $to = $userInfo->email;
            $subject = 'BPI Community Support Alert!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'This is to notify you that your community support application was recieved and is currently being reviewed.
						<br>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						
						<br>
						If you have any questions or need assistance regarding your reward, please feel free to contact our support team at [support@beepagro.com].
						<br>
						<br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );

                $this->session->set_flashdata('success', 'Application submitted successfully.');
                redirect('pecv_dashboard');
            }

            $data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
            $data['user_details'] = $user_details;

            $this->load->view('support_apply_form', $data);
        } else {
            redirect('login');
        }
    }
    
     // 2. DONATE TO MEMBER
  public function donate_to_member() {
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
            $support_request_id = $this->input->post('support_request_id');
            $request = $this->generic_model->get_support_request_by_id($support_request_id);
             $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );

            if (!$request || $request->status !== 'active') {
                $this->session->set_flashdata('error', 'Support request not available.');
                redirect('pecv_dashboard');
            }

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $amount = $this->input->post('amount');

                // Check wallet + spendable total balance
                $user = $this->generic_model->get_user_by_id($userid);
                $balance = $user->wallet + $user->spendable;
                if ($balance < $amount) {
                    $this->session->set_flashdata('error', 'Insufficient wallet balance.');
                    redirect('pecv_dashboard');
                }

                // Perform transaction
                $donation_data = array(
                    'donor_id' => $userid,
                    'recipient_id' => $request->user_id,
                    'support_request_id' => $request->id,
                    'amount' => $amount,
                );

                $this->generic_model->transfer_funds_and_log($donation_data);
                
                $to = $userInfo->email;
            $subject = 'New Donation Alert!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'You have received a new donation towards your Community Support Request. Login to your account to know more
						<br>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						
						<br>
						If you have any questions or need assistance regarding your reward, please feel free to contact our support team at [support@beepagro.com].
						<br>
						<br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );

                
                $this->session->set_flashdata('success', 'Donation successful. Thank you for your support.');
                redirect('pecv_dashboard');
            }

            $data['support_request'] = $request;
            $data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
            $data['user_details'] = $user_details;

            $this->load->view('support/donate', $data);
        } else {
            redirect('login');
        }
    }

 // --- PRIVATE HELPERS ---

   private function _is_eligible_to_apply($userid) {
    // Condition 1: Check last support request
    $last_request = $this->generic_model->get_last_support_request($userid);
    if ($last_request && strtotime($last_request->created_at) > strtotime('-365 days')) {
        if($last_request->status == 'pending'){
            return [
                'status' => false,
                'remark'=>$last_request->status,
                'message' => 'You have a pending request that is being reviewed.'
            ];
        }elseif($last_request->status == 'declined'){
            return [
                'status' => false,
                'remark'=>$last_request->status,
                'message' => $last_request->remarks
            ];
        }elseif($last_request->status == 'active'){
            return [
                'status' => false,
                'remark'=>$last_request->status,
                'message' => $last_request->remarks
            ];
        }else{
            return [
                'status' => false,
                'remark'=>$last_request->status,
                'message' => 'You have made a support request within the last 365 days. Please wait until one year has passed since your last request.'
            ];
        }
    }

    // Condition 2: Check direct referral count
   $referral_count = $this->generic_model->count_direct_referrals($userid);
    if ($referral_count < 10) {
        return [
            'status' => false,
            'remark'=>'Criteria Not Met',
            'message' => 'You need at least 10 direct referrals to be eligible for support. You currently have ' . $referral_count . ' referrals.'
        ];
    }

    // Condition 3: Check if user is VIP
    $user = $this->generic_model->get_user_by_id($userid);
    if (!$user || $user->is_vip != 1) {
        $message = !$user ? 'User details could not be retrieved.' : 'You must be a VIP member to be eligible for support.';
        return [
            'status' => false,
            'remark'=>'Criteria Not Met',
            'message' => $message
        ];
    }

    // Condition 4: Check active shelter starter pack
    $shelter = $this->generic_model->get_active_shelter_by_user($userid);
    if (!$shelter || !in_array($shelter->starter_pack, [2, 3, 4, 5])) {
        $message = !$shelter ? 'No active shelter found for your account.' : 'Your active shelter\'s starter pack does not meet the eligibility requirements.';
        return [
            'status' => false,
            'remark'=>'Criteria Not Met',
            'message' => $message
        ];
    }
    
    //condition 5: check if user has donated a minimum of 10k to atleast 10 persons
    $total_donated_amount = $this->generic_model->getSum('bpi_support_donations','amount',array('donor_id'=>$userid));
    $total_donated_to = $this->generic_model->get_count('bpi_support_donations','amount',array('donor_id'=>$userid));
    
    if($total_donated_amount < 10000 && $total_donated_to <10){
         return [
             'status' => false,
             'remark'=>'All Criteria are not met',
             'message' => 'You must have donated not less than NGN10,000.00 in total to atleast 10 requests'
             ];
    }

    // If all conditions passed, return true status with a success message (optional, but good for consistency)
    return [
        'status' => true,
        'remark'=>'All Criteria are met',
        'message' => 'You are eligible to apply for support!'
    ];
   }

   private function get_support_level($userid) {
        $direct_refs = $this->generic_model->count_direct_referrals($userid);
        $shelter = $this->generic_model->get_active_shelter_by_user($userid);
       
        if ($shelter->starter_pack == 2 && $direct_refs >= 20) {
            return 'global';
            
        } elseif (in_array($shelter->starter_pack, [3,4,5]) && $direct_refs >= 10) {
            return 'national';
        }

        return 'none';
    }

   private function handle_upload() {
        if (!empty($_FILES['media_url']['name'])) {
            $config['upload_path'] = './uploads/support_media/';
            $config['allowed_types'] = 'jpg|jpeg|png|pdf|doc|docx';
            $config['max_size'] = 2048;
            $this->load->library('upload', $config);

            if ($this->upload->do_upload('media_url')) {
                $upload_data = $this->upload->data();
                return 'uploads/support_media/' . $upload_data['file_name'];
            }
        }
        return null;
    }
  
   public function solar()
    {
      if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
          $data[ 'withdrawals' ] = $this->generic_model->select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
    	  $data[ 'funding' ] = $this->generic_model->select_where( 'funding_history', array( 'user_id' => $userid ) );
          $data[ 'shelter_option' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
          $data[ 'bank_records' ] = $this->user_model->get_bank_records( $userid );
          $data[ 'results' ] = $transactions;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['states'] = $this->generic_model->get_solar_states();
          $data['products'] = $this->generic_model->get_solar_products();
          $this->load->view('solar_assessment', $data);
      } else {
        redirect( 'login' ); // Redirect to login if not logged in
      }
    }
    
    public function solar_submit() {
        $config['upload_path'] = './uploads/';
        $config['allowed_types'] = 'jpg|jpeg|png';
        $config['max_size'] = 2048; // 2MB
        $this->load->library('upload', $config);

        if (!$this->upload->do_upload('paymentReceipt')) {
            $error = array('error' => $this->upload->display_errors());
            echo json_encode(array('status' => 'error', 'message' => $error['error']));
            return;
        }

        $upload_data = $this->upload->data();
        $payment_receipt_path = 'uploads/' . $upload_data['file_name'];

        $data = array(
            'installer_ssc' => $this->input->post('installer_ssc'),
            'ssc' => $this->input->post('ssc'),
            'client_name' => $this->input->post('client_name'),
            'client_email' => $this->input->post('client_email'),
            'region' => $this->input->post('region'),
            'state' => $this->input->post('state'),
            'total_load' => $this->input->post('total_load'),
            'inverter_capacity' => $this->input->post('inverter_capacity'),
            'battery_capacity' => $this->input->post('battery_capacity'),
            'solar_panels' => $this->input->post('solar_panels'),
            'is_bpi_member' => $this->input->post('is_bpi_member'),
            'installation_type' => $this->input->post('installation_type'),
            'installation_address' => $this->input->post('installation_address'),
            'contact_person' => $this->input->post('contact_person'),
            'contact_phone' => $this->input->post('contact_phone'),
            'preferred_installation_date' => $this->input->post('preferred_installation_date'),
            'payment_receipt_path' => $payment_receipt_path,
            'status' => $this->input->post('installation_type') == 'bpi_corporate' ? 'Pending Installation' : 'Completed',
            'amount_paid' => $this->input->post('amount_paid')
        );

        if ($this->generic_model->save_solar_assessment($data)) {
            echo json_encode(array('status' => 'success', 'message' => 'Assessment submitted successfully'));
        } else {
            echo json_encode(array('status' => 'error', 'message' => 'Failed to save assessment'));
        }
    }
    
    public function get_assessments() {
        // Read raw JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        log_message('info', 'Received raw input: ' . print_r($input, true)); // Log the received data for debugging
    
        // Extract values with fallback to empty string if not set
        $installer_ssc = $input['installer_ssc'] ?? '';
        $page = $input['page'] ? (int)$input['page'] : 1;
        $limit = 10; // Number of records per page
        $offset = ($page - 1) * $limit;
    
        if (empty($installer_ssc)) {
            echo json_encode(['status' => 'error', 'message' => 'Installer SSC is required']);
            exit;
        }
    
        $assessments = $this->generic_model->get_assessments_by_installer($installer_ssc, $limit, $offset);
        $total_records = $this->generic_model->get_assessments_count($installer_ssc);
        $total_pages = ceil($total_records / $limit);
    
        $response = [
            'status' => 'success',
            'data' => $assessments,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $total_pages,
                'total_records' => $total_records,
                'limit' => $limit
            ]
        ];
        echo json_encode($response);
        exit;
    }
    
    public function update_assessment_status() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? '';
        $installer_ssc = $input['installer_ssc'] ?? '';
        $status = $input['status'] ?? '';
    
        log_message('info', 'Received update request - id: ' . $id . ', installer_ssc: ' . $installer_ssc . ', status: ' . $status);
    
        if (empty($id) || empty($installer_ssc) || empty($status)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
            exit;
        }
    
        $this->db->where('id', $id);
        $this->db->where('installer_ssc', $installer_ssc);
        $update_data = ['status' => $status];
        if ($this->db->update('assessments', $update_data)) {
            echo json_encode(['status' => 'success', 'message' => 'Status updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update status']);
        }
        exit;
    }

    public function solar_calculate() {
        $userid = $this->session->userdata( 'user_id' );
        $user_details = $this->session->userdata( 'user_details' );
        // Form validation rules
        $this->form_validation->set_rules('client_name', 'Client Name', 'required');
        $this->form_validation->set_rules('client_email', 'Client Email', 'required|valid_email');
        //$this->form_validation->set_rules('ssc_code', 'SSC Code', 'required');
        $this->form_validation->set_rules('region', 'Region', 'required');
        $this->form_validation->set_rules('state', 'State', 'required');
        $this->form_validation->set_rules('daily_runtime', 'Daily Runtime', 'required|numeric');
        $this->form_validation->set_rules('inverter_id', 'Inverter', 'required');
        $this->form_validation->set_rules('battery_id', 'Battery', 'required');
        $this->form_validation->set_rules('panel_id', 'Solar Panel', 'required');
        $this->form_validation->set_rules('installation_option', 'Installation Option', 'required');
        $this->form_validation->set_rules('installation_address', 'Installation Address', 'required');
        $this->form_validation->set_rules('contact_person', 'Contact Person', 'required');
        $this->form_validation->set_rules('contact_phone', 'Contact Phone', 'required');
        $this->form_validation->set_rules('installation_date', 'Installation Date', 'required');

        if ($this->form_validation->run() == FALSE) {
            $this->session->set_flashdata('error',validation_error());
            redirect('solarassessment');
        }

        // Get form data
        $appliances = $this->input->post('appliances');
        $daily_runtime = floatval($this->input->post('daily_runtime'));
        $inverter_id = $this->input->post('inverter_id');
        $battery_id = $this->input->post('battery_id');
        $panel_id = $this->input->post('panel_id');
        $installation_option = $this->input->post('installation_option');
        $client_name = $this->input->post('client_name');

        // Validate and normalize appliances
        if (!is_array($appliances) || empty($appliances)) {
            log_message('error', 'Appliances is not an array or is empty');
            $appliances = [];
            $this->session->set_flashdata('error', 'No valid appliances provided. Please add at least one appliance.');
            redirect('solarassessment');
        }

        // Normalize single appliance
        if (!isset($appliances[0]) && !empty($appliances['name'])) {
            $appliances = [$appliances];
            log_message('debug', 'Normalized single appliance: ' . json_encode($appliances));
        }

        // Validate each appliance
        $valid_appliances = [];
        foreach ($appliances as $index => $appliance) {
            if (isset($appliance['name'], $appliance['wattage'], $appliance['unit'], $appliance['quantity'], $appliance['hours']) &&
                !empty($appliance['name']) && is_numeric($appliance['wattage']) && is_numeric($appliance['quantity']) && is_numeric($appliance['hours'])) {
                $valid_appliances[] = $appliance;
            } else {
                log_message('error', 'Invalid appliance at index ' . $index . ': ' . json_encode($appliance));
            }
        }

        if (empty($valid_appliances)) {
            $this->session->set_flashdata('error', 'No valid appliances provided. Please ensure all appliance fields are filled correctly.');
            redirect('solarassessment');
        }

        // Calculate total watt-hours
        $total_watts = 0;
        foreach ($appliances as $appliance) {
            // Validate appliance data
            if (!isset($appliance['name'], $appliance['wattage'], $appliance['unit'], $appliance['quantity'], $appliance['hours'])) {
                continue; // Skip invalid appliances
            }
            $wattage = floatval($appliance['wattage']);
            if ($appliance['unit'] === 'HP') {
                $wattage *= 746; // Convert HP to Watts
            }
            $quantity = intval($appliance['quantity']);
            $hours = floatval($appliance['hours']);
            $total_watts += $wattage * $quantity * $hours;
        }

        $total_load_kwh = $total_watts / 1000; // Convert to kWh

        // Get product details
        $products = $this->generic_model->get_solar_products();
        $inverter = $products['inverters'][$inverter_id] ?? null;
        $battery = $products['batteries'][$battery_id] ?? null;
        $panel = $products['panels'][$panel_id] ?? null;

        if (!$inverter || !$battery || !$panel) {
            $this->session->set_flashdata('error', 'Invalid product selection.');
            redirect('solarassessment');
        }

        // Calculate system requirements
        $inverter_capacity = $total_load_kwh * 1.2; // 20% buffer
        $battery_capacity = ($total_load_kwh * 1000) / 12; // Assuming 12V batteries
        $number_of_batteries = ceil($battery_capacity / ($battery['capacity'] ?? 200)); // Default 200Ah
        $panel_watts = $total_load_kwh * 1000 * 1.3; // 30% buffer for losses
        $panel_size = floatval($panel['wattage'] ?? 0);
        $number_of_panels = ($panel_size > 0) ? ceil($panel_watts / $panel_size) : 0;

        // Costs
        $inverter_cost = $inverter['bpi_price'] ?? 0;
        $battery_cost = ($battery['bpi_price'] ?? 0) * $number_of_batteries; 
        $panel_cost = ($panel['bpi_price'] ?? 0) * $number_of_panels;
        $additional_costs = 10000; // Example fixed cost for accessories
        $installation_cost = ($installation_option === 'Corporate') ? 50000 : 0; // Example cost
        $assessment_fee = 2000; // Fixed assessment fee
        $total_cost = $inverter_cost + $battery_cost + $panel_cost + $additional_costs + $installation_cost + $assessment_fee;

        // Runtime
        $runtime_hours = $daily_runtime;
         if(!empty($this->input->post('ssc_code'))){
                $scc_code = $this->input->post('ssc_code');
            }else{
                $scc_code = 0;
            }

        // Save assessment to database
        $assessment_data = [
            'client_name' => $client_name,
            'client_email' => $this->input->post('client_email'),
            'ssc_code'=> $scc_code,
            'region' => $this->input->post('region'),
            'state' => $this->input->post('state'),
            'total_load_kwh' => $total_load_kwh,
            'inverter_capacity' => $inverter_capacity,
            'battery_capacity' => $battery_capacity,
            'number_of_batteries' => $number_of_batteries,
            'panel_watts' => $panel_watts,
            'number_of_panels' => $number_of_panels,
            'runtime_hours' => $runtime_hours,
            'inverter_cost' => $inverter_cost,
            'battery_cost' => $battery_cost,
            'panel_cost' => $panel_cost,
            'additional_costs' => $additional_costs,
            'installation_cost' => $installation_cost,
            'assessment_fee' => $assessment_fee,
            'total_cost' => $total_cost,
            'installation_option' => $installation_option,
            'installation_address' => $this->input->post('installation_address'),
            'contact_person' => $this->input->post('contact_person'),
            'contact_phone' => $this->input->post('contact_phone'),
            'installation_date' => $this->input->post('installation_date'),
            'created_at' => date('Y-m-d H:i:s')
        ];

        // Handle file upload
        if (!empty($_FILES['proof_of_payment']['name'])) {
            $config['upload_path'] = './uploads/';
            $config['allowed_types'] = 'jpg|png|pdf';
            $config['max_size'] = 2048; // 2MB
            $this->load->library('upload', $config);

            if ($this->upload->do_upload('proof_of_payment')) {
                $assessment_data['proof_of_payment'] = $this->upload->data('file_name');
            } else {
                $this->session->set_flashdata('error', $this->upload->display_errors());
                redirect('solarassessment');
            }
        }

        $assessment_id = $this->generic_model->save_solar_assessment($assessment_data);

        // Pass data to view
        $data = array_merge($assessment_data, [
            'states' => $this->generic_model->get_solar_states(),
            'products' => $products,
            'assessment_id' => $assessment_id,
            'notifications' => $this->generic_model->get_unread_notifications($userid),
            'unread_count' => $this->generic_model->get_unread_count($userid)
        ]);

        $this->load->view('solar_assessment', $data);
    }

    private function get_sunlight_hours($region)
    {
        // Sample sunlight hours based on region (in hours)
        $sunlight_hours = array(
            'North' => 5.0,
            'South' => 5.5,
            'East' => 5.2,
            'West' => 5.3
        );
        return isset($sunlight_hours[$region]) ? $sunlight_hours[$region] : 5.0;
    }
    
    public function download_pdf($assessment_id = null) {
        if (!$assessment_id) {
            $this->session->set_flashdata('error', 'Invalid assessment ID.');
            redirect('solar_assessment');
        }

        // Fetch assessment data
        $assessment = $this->generic_model->get_solar_assessment($assessment_id);
        if (!$assessment) {
            $this->session->set_flashdata('error', 'Assessment not found.');
            redirect('solar_assessment');
        }

        // Create PDF
        $pdf = new FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'BPI Solar Energy Assessment Report', 0, 1, 'C');
        $pdf->Ln(10);

        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 10, 'Client: ' . $assessment['client_name'], 0, 1);
        $pdf->Cell(0, 10, 'Email: ' . $assessment['client_email'], 0, 1);
        $pdf->Cell(0, 10, 'SSC Code: ' . $assessment['ssc_code'], 0, 1);
        $pdf->Cell(0, 10, 'Region: ' . $assessment['region'], 0, 1);
        $pdf->Cell(0, 10, 'State: ' . $assessment['state'], 0, 1);
        $pdf->Ln(5);

        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 10, 'System Requirements', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 8, 'Total Load: ' . number_format($assessment['total_load_kwh'], 2) . ' kWh/day', 0, 1);
        $pdf->Cell(0, 8, 'Inverter Capacity: ' . number_format($assessment['inverter_capacity'], 2) . ' kVA', 0, 1);
        $pdf->Cell(0, 8, 'Battery Capacity: ' . number_format($assessment['battery_capacity'], 2) . ' Ah (' . $assessment['number_of_batteries'] . ' units)', 0, 1);
        $pdf->Cell(0, 8, 'Solar Panels: ' . number_format($assessment['panel_watts'], 2) . ' W (' . $assessment['number_of_panels'] . ' panels)', 0, 1);
        $pdf->Cell(0, 8, 'Estimated Runtime: ' . number_format($assessment['runtime_hours'], 2) . ' hours', 0, 1);
        $pdf->Ln(5);

        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 10, 'Cost Summary (NGN)', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 8, 'Inverter Cost: N' . number_format($assessment['inverter_cost'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Battery Cost: N' . number_format($assessment['battery_cost'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Solar Panel Cost: N' . number_format($assessment['panel_cost'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Additional Costs: N' . number_format($assessment['additional_costs'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Installation Cost: N' . number_format($assessment['installation_cost'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Assessment Fee: N' . number_format($assessment['assessment_fee'], 2), 0, 1);
        $pdf->Cell(0, 8, 'Total Cost: N' . number_format($assessment['total_cost'], 2), 0, 1);

        // Output PDF
        $filename = 'BPI_Assessment_' . $assessment_id . '.pdf';
        $pdf->Output('D', $filename);
    }

    private function send_email_summary($data)
    {
        $this->email->from('info@beepagro.com', 'BPI Solar Assessment');
        $this->email->to($data['client_email']);
        $this->email->subject('Solar Assessment Summary for ' . $data['client_name']);
        $message = "Dear {$data['client_name']},\n\n";
        $message .= "Here is your solar energy assessment:\n\n";
        $message .= "System Requirements:\n";
        $message .= "- Total Load: " . number_format($data['total_load_kwh'], 2) . " kWh/day\n";
        $message .= "- Inverter Capacity: " . number_format($data['inverter_capacity'], 2) . " kVA\n";
        $message .= "- Battery Capacity: " . number_format($data['battery_capacity'], 2) . " Ah ({$data['number_of_batteries']} units)\n";
        $message .= "- Solar Panels: " . number_format($data['panel_watts'], 2) . " W ({$data['number_of_panels']} panels)\n";
        $message .= "- Estimated Runtime: " . number_format($data['runtime_hours'], 2) . " hours\n\n";
        $message .= "Cost Summary (NGN):\n";
        $message .= "- Inverter Cost: N" . number_format($data['inverter_cost'], 2) . "\n";
        $message .= "- Battery Cost: N" . number_format($data['battery_cost'], 2) . "\n";
        $message .= "- Solar Panel Cost: N" . number_format($data['panel_cost'], 2) . "\n";
        $message .= "- Additional Costs: N" . number_format($data['additional_costs'], 2) . "\n";
        $message .= "- Installation Cost: N" . number_format($data['installation_cost'], 2) . "\n";
        $message .= "- Assessment Fee: N" . number_format($data['assessment_fee'], 2) . "\n";
        $message .= "- Total Cost: N" . number_format($data['total_cost'], 2) . "\n\n";
        $message .= "Thank you for using Naijapoly Solar Assessment Tool!";
        $this->email->message($message);
        $this->email->send();
    }
  
    public function investments() {
    // Check if the user is logged in (you can use session data)
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
      $data[ 'withdrawals' ] = $this->generic_model->select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
	  $data[ 'funding' ] = $this->generic_model->select_where( 'funding_history', array( 'user_id' => $userid ) );
      $data[ 'shelter_option' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
      $data[ 'bank_records' ] = $this->user_model->get_bank_records( $userid );
      $data[ 'results' ] = $transactions;
      $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data['contributions'] = $this->contribution_model->get_user_contributions($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'investments', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
    
    public function bsc_msc(){
      if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $pending_application = $this->generic_model->getInfo('bsc_application','user_id',$userid);
          $pending_ict = $this->generic_model->getInfo('ict_tickets','user_id',$userid);
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['is_pending'] = $pending_application;
          $data['ict_pending'] = $pending_ict;
          $this->load->view( 'bsc_msc', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
  public function ict_pay_wallet(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $pending_application = $this->generic_model->getInfo('ict_tickets','user_id',$userid);
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['is_pending'] = $pending_application;
          $this->load->view( 'ict_pay_wallet', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
  public function pay_wallet(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $pending_application = $this->generic_model->getInfo('ict_tickets','user_id',$userid);
          $user = $this->generic_model->getInfo('users','id',$userid);
          
          if($user->shelter_wallet == 1){
              $availableFunds = ($user->wallet + $user->spendable);
          }else{
              $availableFunds =  $user->spendable;
          }
          if(bccomp($availableFunds, 20000, 2) == 1){
              $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>334,
                            'transaction_type' => 'purchase',
                            'amount' => 20000,  // Assuming you have the price for each item
                            'description' => 'Purchase of Single ICT Skill Acquisition Ticket',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
              if($user->shelter_wallet == 1){
							$newWallet_balance = ($availableFunds - 20000);
							$update_user_data = array(
								'wallet' => $newWallet_balance,
								'spendable'=>0
							);
						}
          else{
							$newWallet_balance = ($availableFunds - 20000);
							$update_user_data = array(
								'spendable' => $newWallet_balance,
							);
						}
          $user_table = 'users';
          $user_condition = array('id' => $userid);
          $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
              
              //share allocation........
              $share_allocation = array(
                  'user_id'=>$userid,
                  'partner'=>7500,
                  'revenue'=>10000,
                  'cashback'=>500,
                  'commission'=>2000
              );
            $this->generic_model->insert_data('ict_revenue_share',$share_allocation);
                        
          //create ticket
            $ticket_data = array(
                'user_id'=>$userid,
                'ticket_status'=>0
            );
            $this->generic_model->insert_data('ict_tickets',$ticket_data);
            
           $this->session->set_flashdata('success','Payment processed successfully');
           redirect('ict_form');
              
          }
          else{
              $this->session->set_flashdata('error','Insufficient Cash Wallet Balance');
              redirect('ict_pay_wallet');
          }
          
        } 
        else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
	
  public function delete_beneficiary($id){
		$userid = $this->session->userdata( 'user_id' );
		$this->db->where( 'id', $id );
        $this->db->delete( 'beneficiary_info' );
		$this->session->set_flashdata('success','Beneficiary Removed');
        redirect('profile');
	}
    
  public function ict_form(){
       if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $pending_application = $this->generic_model->getInfo('ict_tickets','user_id',$userid);
          if(!empty($pending_application)){   
              if($pending_application->ticket_status == 0){
                  $user_details = $this->session->userdata( 'user_details' );
                  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
                  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
                  $data[ 'user_details' ] = $user_details;
                  $this->load->view( 'ict_form', $data );
              }else{
                  $this->session->set_flashdata('error','You need a Ticket to access the Form! You are required to make your payment first.');
                  redirect('ict_pay_wallet');
              }
          }else{
                  $this->session->set_flashdata('error','You need a Ticket to access the Form! You are required to make your payment first.');
                  redirect('ict_pay_wallet');
          }
          
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }   
    }
    
  public function ict_pay_cashback(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
         // $pending_application = $this->generic_model->getInfo('bsc_application','user_id',$userid);
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          //$data['is_pending'] = $pending_application;
          $this->load->view( 'ict_pay_cashback', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
  public function bsc_apply(){
      if ( $this->session->userdata('user_id')) {
          $userid = $this->session->userdata('user_id');
          $this->reset_session();
          $user_details = $this->session->userdata('user_details');
          $pending_application = $this->generic_model->getInfo('bsc_application','user_id',$userid);
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data['is_pending'] = $pending_application;
          $data[ 'user_details' ] = $user_details;
          $this->load->view( 'bsc_apply', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
  public function msc_apply(){
      if ( $this->session->userdata('user_id')) {
          $userid = $this->session->userdata('user_id');
          $this->reset_session();
          $user_details = $this->session->userdata('user_details');
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $this->load->view( 'msc_apply', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }

  public function leaderboard() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
      $data[ 'withdrawals' ] = $this->generic_model->select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
      $data[ 'shelter_option' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
      $data[ 'bank_records' ] = $this->user_model->get_bank_records( $userid );
      $data[ 'results' ] = $transactions;
      $data[ 'leader100' ] = $this->generic_model->getTop100();
      $data[ 'getTop100_winner' ] = $this->generic_model->getTop100_winner();
      //$data['leader500'] = $this->generic_model->getTop500();
      //$data['leader1000'] = $this->generic_model->getTop1000();
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
	  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'leaderboard', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function refer() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $referrals = $this->generic_model->select_where( 'referrals', array( 'referred_by' => $userid ) );
      $referrals1 = $this->generic_model->select_where( 'referrals', array( 'level_1' => $userid ) );
      $referrals2 = $this->generic_model->select_where( 'referrals', array( 'level_2' => $userid ) );
      $referrals3 = $this->generic_model->select_where( 'referrals', array( 'level_3' => $userid ) );
      $link_builder = $this->generic_model->select_where( 'link_builder', array( 'user_id' => $userid ) );
      $active_links = $this->generic_model->select_where( 'link_enforcer', array( 'status' => 'active' ) );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      $data[ 'shelter' ] = $shelters;
      $data[ 'active_link' ] = $active_links;
      $data[ 'shelter_type' ] = $shelter_type;
      $data[ 'linkBuilder' ] = $link_builder;
      $data[ 'referrals' ] = $referrals;
      $data[ 'referrals1' ] = $referrals1;
      $data[ 'referrals2' ] = $referrals2;
      $data[ 'referrals3' ] = $referrals3;
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'refer', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function merchants( $page = 1 ) {
    if ( $this->session->userdata( 'user_id' ) ) {

      // Configuration for pagination
      $config[ 'base_url' ] = base_url( 'merchants' );
      $config[ 'total_rows' ] = $this->db->count_all( 'merchants' );
      $config[ 'per_page' ] = 10;
      $config[ 'uri_segment' ] = 3;
      $this->pagination->initialize( $config );

      // Calculate the offset
      $offset = ( $page - 1 ) * $config[ 'per_page' ];

      $data[ 'merchants' ] = $this->merchant_model->getMerchants( $config[ 'per_page' ], $offset );

      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'is_merchant' ] = $this->generic_model->getInfo( 'merchants', 'user_id', $userid );$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'merchants', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function club() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      if ( $user_details->vip_pending == 1 && empty( $user_details->bpi_upgrade ) ) {
        //confirm that payment was made...
        $paid = $this->generic_model->get_by_condition( 'payments', array( 'user_id' => $userid, 'status' => 0 ) );
        if ( !empty( $paid ) ) {
          $this->reset_session();
          $data[ 'user_details' ] = $user_details;
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $this->load->view( 'club', $data );
        } else {
          $user_info = array( 'vip_pending' => 0, 'shelter_pending' => 0 );
          $this->generic_model->update_data( 'users', $user_info, array( 'id' => $userid ) );
          //delete the data from active_shelter...
          $this->db->where( 'user_id', $userid );
          $this->db->delete( 'active_shelters' );
          $this->reset_session();
          $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $this->load->view( 'club', $data );
        }
      }
    elseif(!empty($user_details->bpi_upgrade)){
		  $paid_up = $this->generic_model->get_by_condition( 'upgrade_payments', array( 'user_id' => $userid, 'status' => 0 ) );
		  if ( !empty( $paid_up ) ) {
          $this->reset_session();
          $data[ 'user_details' ] = $user_details;
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $this->load->view( 'club', $data );
        } else {
          $user_info = array( 'vip_pending' => 0, 'is_vip'=>1, 'is_shelter'=>1, 'shelter_pending' => 0, 'bpi_upgrade'=>0 );
          $this->generic_model->update_data( 'users', $user_info, array( 'id' => $userid ) );
          //revert the data from active_shelter...
		  $shelter_info = array( 'status' => 'active', 'starter_pack' => 1, 'shelter_package'=>1, 'amount'=>10000 );
          $this->generic_model->update_data( 'active_shelters', $shelter_info, array( 'user_id' => $userid ) );
		  //delete the upgrade payments
		  $this->db->where( 'user_id', $userid );
          $this->db->delete( 'upgrade_payments' );
          $this->reset_session();
          $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $this->load->view( 'club', $data );
        }
	  }
    else {
        $this->reset_session();
        $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
        $data[ 'active_plan' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'club', $data );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function extension() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
	  $ecp = $this->generic_model->select_all('export_packages', array('status'=>1));
          $this->reset_session();
          $data['payout_history'] = $this->generic_model->select_all('export_code_payouts',array('user_id'=>$userid));
          $data['withdraw_history'] = $this->generic_model->select_all('epc_withdrawals',array('user_id'=>$userid));
          $data[ 'user_details' ] = $user_details;
		  $data['export_users'] = $this->generic_model->getInfo('export_code_users','user_id',$userid);
		  $data['export_codes'] = $ecp;
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $this->load->view( 'extension', $data );     
	}
    else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function view_exc($id){
	 $exc_package = $this->generic_model->getInfo('export_packages','id',$id);
	 $userid = $this->session->userdata( 'user_id' );
     $user_details = $this->session->userdata( 'user_details' );
	 $data[ 'user_details' ] = $user_details;
	 $data['export_package'] = $exc_package;
     $data['unread_count'] = $this->generic_model->get_unread_count($userid);
     $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
     $this->load->view( 'extension_view', $data );   
 }
 
  public function generateCouponCode($length = 10, $prefix = '', $suffix = '') {
    // Define the characters to use in the coupon code
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $charactersLength = strlen($characters);
    $randomCode = '';

    // Generate a random string of the specified length
    for ($i = 0; $i < $length; $i++) {
        $randomCode .= $characters[rand(0, $charactersLength - 1)];
    }

    // Return the final coupon code with optional prefix and suffix
    return $prefix . $randomCode . $suffix;
    }

  public function generateCouponPayload($addedBy, $couponType, $couponBearer, $sellerId, $customerId, $title, $code, $startDate, $minPurchase, $maxDiscount, $discount, $discountType, $status, $limit) {
    // Calculate the expire_date as 1 year from start_date
    $expireDate = date('Y-m-d', strtotime('+1 year', strtotime($startDate)));
    // Prepare the payload as an associative array
    $payload = [
        'added_by'      => $addedBy,
        'coupon_type'   => $couponType,
        'coupon_bearer' => $couponBearer,
        'seller_id'     => $sellerId,
        'customer_id'   => $customerId,
        'title'         => $title,
        'code'          => $code,
        'start_date'    => $startDate,
        'expire_date'   => $expireDate,
        'min_purchase'  => $minPurchase,
        'max_discount'  => $maxDiscount,
        'discount'      => $discount,
        'discount_type' => $discountType,
        'status'        => $status,
        'created_at'    => date('Y-m-d H:i:s'),
        'updated_at'    => date('Y-m-d H:i:s'),
        'limit'         => $limit
    ];

    // Convert the payload to JSON format
    return json_encode($payload);
    }
    
  public function sendPayloadToServer($url, $payload) {
    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Get the response
    curl_setopt($ch, CURLOPT_POST, true);          // Use POST method
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

    $response = curl_exec($ch); // Execute the cURL request

    if (curl_errno($ch)) {
        // Return error details in case of failure
        $error = [
            'success' => false,
            'error'   => curl_error($ch),
        ];
        curl_close($ch);
        return json_encode($error);
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // Get HTTP status code
    curl_close($ch);

    // Return a structured response
    return json_encode([
        'success' => $httpCode >= 200 && $httpCode < 300, // True if HTTP status code indicates success
        'http_code' => $httpCode,
        'response' => $response,
    ]);
}

  public function activate_exc($id){
	 $exc_package = $this->generic_model->getInfo('export_packages','id',$id);
	 $userid = $this->session->userdata( 'user_id' );
	 $user_details = $this->session->userdata( 'user_details' );
	 $user = $this->generic_model->getInfo('users','id',$userid);
	 $oldcashback = $user->cashback;
	 $newcashback = ($oldcashback + $exc_package->code_activation);
	 
	 $percentage = 7.5 / 100;
	 //check if this is an upgrade
	 $export_users = $this->generic_model->getInfo('export_code_users','user_id',$userid);
	 if(!empty($export_users)){
		if($user->shelter_wallet == 1){
						  $availableFunds = ($user->wallet + $user->spendable);
		}elseif($user->is_vip == 1){
					      $availableFunds = ($user->wallet + $user->spendable);
		}else{
						  $availableFunds =  $user->spendable;
					}
		 			
		//previous package amount
		$priv_pack = $export_users->export_package_id;
		$priv_pack_amount = $this->generic_model->getInfo('export_packages','id',$priv_pack)->membership_activation;
		$new_pack_amount = $exc_package->membership_activation;
		$total_due = ($new_pack_amount - $priv_pack_amount );
		$vat = ($total_due * $percentage);
		$main_total = ($total_due + $vat);
		if(bccomp($availableFunds, $main_total, 2) == 1){
							  $transactionWith = array(
											'user_id' => $userid,
											'order_id' =>334,
											'transaction_type' => 'debit',
											'amount' => $total_due,  // Assuming you have the price for each item
											'description' => 'Upgrade of BPI Export Code Membership Extension',  // Add a relevant description
											'status' => 'Successful'
										);
							  $transactionWith2 = array(
											'user_id' => $userid,
											'order_id' =>334,
											'transaction_type' => 'debit',
											'amount' => $vat,  // Assuming you have the price for each item
											'description' => 'Vat for Upgrade of BPI Export Code Membership Extension',  // Add a relevant description
											'status' => 'Successful'
										);
							  $this->generic_model->insert_data('transaction_history', $transactionWith);
							  $this->generic_model->insert_data('transaction_history', $transactionWith2);

							  if($user->shelter_wallet == 1){
									 $newWallet_balance = ($availableFunds - $main_total);
									 $update_user_data = array(
										'wallet' => $newWallet_balance,
										'spendable'=>0
										);
									}
							  else{
									$newWallet_balance = ($availableFunds - $main_total);
									$update_user_data = array(
										'spendable' => $newWallet_balance,
									);
								}
							  $user_table = 'users';
							  $user_condition = array('id' => $userid);
							  $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition); 

							 $data = array(
								"user_id"=>$userid,
								"export_package_id"=>$id,
								"start_date" => date('Y-m-d H:i:s'),
								"end_date" => date('Y-m-d H:i:s', strtotime('+30 days')),
								"status"=> 1); 
							 $table = 'export_code_users';
							 $condition = array('user_id' => $userid);
							 $this->generic_model->update_data($table, $data, $condition);
							 
							 //save company revenue...
							 $save_rev = array(
								'user_id' => $userid,
								'package_id' =>$id,
								'amount' => $total_due,  // Assuming you have the price for each item
								'date' => date('Y-m-d H:i:s')
							  );
							 $this->generic_model->insert_data('bec_revenue', $save_rev);

							 $this->session->set_flashdata( 'success', 'Extension Upgraded Successfully' );
							 redirect( 'extension' );    
						 }
		else{
						 $this->session->set_flashdata( 'error', 'Insufficient Wallet Balance, Top up your cash wallet from the Assets Page then try again' );
        				redirect( 'extension' ); 
					 }
	  }
	 else{
	       //is this the free package activation?
	       if($id == 1){
	           $assigned_code = $this->generateCouponCode(12, 'BPI-', '-2025');
    			 //prepare the coupon code to be sent across the servers......
    			 $payload = $this->generateCouponPayload(
                'admin',        // added_by
                'discount_on_purchase',     // coupon_type
                'seller',     // coupon_bearer
                0,          // seller_id
                0,          // customer_id
                'BPI-EPC-Promo', // title
                $assigned_code,          // code
                date('Y-m-d H:i:s'),   // start_date
                2,            // min_purchase
                500,            // max_discount
                10,             // discount
                'percentage',   // discount_type
                1,       // status
                100             // limit
            );
                            
         //send the payload across....
                             $apiUrl = 'https://api.bpimarket.com/coupons/';
                             $response = $this->sendPayloadToServer($apiUrl, $payload);
                             
                             $responseData = json_decode($response, true);
                            
                             if ($responseData['success']) {
                                  $code_users_data = array(
                        			  	"user_id"=>$userid,
                        				"export_package_id"=>$id,
                        				"code"=>$assigned_code,
                        				"start_date" => date('Y-m-d H:i:s'),
                        				"end_date" => date('Y-m-d H:i:s', strtotime('+30 days')),
                        				"status"=> 1
                        			  ); 	
                    		 	  $this->generic_model->insert_data('export_code_users',$code_users_data);
        						  $this->session->set_flashdata( 'success', 'Extension Activated Successfully' );
                				  redirect( 'extension' ); 
                             } else {
                                    $this->session->set_flashdata( 'error', 'Something went wrong, we could not complete this transaction, our tech team has been notified' );
                            		redirect( 'extension' ); 
                                } 
        				 
	       }else{
		 	  	//findout which package the user is on
					$active_shelter = $this->generic_model->getInfo('active_shelters','user_id',$user_details->id);
					$shelter_package = $active_shelter->starter_pack;
					if($shelter_package == 1){
						$amount = $exc_package->amount;
						$vat = (($exc_package->amount + $exc_package->charge)* $percentage);
						$total = ($exc_package->amount + $vat + $exc_package->charge);
					}
					elseif($shelter_package == 2){
						$amount = $exc_package->code_activation;
						$vat = (($exc_package->code_activation + $exc_package->charge) * $percentage);
						$total = ($exc_package->code_activation + $vat + $exc_package->charge);
					}
					else{
						$amount = $exc_package->code_activation;
						$vat = (($exc_package->code_activation + $exc_package->charge) * $percentage);
						$total = ($exc_package->code_activation + $vat + $exc_package->charge);
					}

					//check if wallet can cover payment
					if($user->shelter_wallet == 1){
						  $availableFunds = ($user->wallet + $user->spendable);
					}elseif($user->is_vip == 1){
					      $availableFunds = ($user->wallet + $user->spendable);
					}else{
						  $availableFunds =  $user->spendable;
					}
					if(bccomp($availableFunds, $total, 2) == 1){
					    
					    //now get code for user and create record
                		  $assigned_code = $this->generateCouponCode(12, 'BPI-', '-2025');
                			 // $code_id = $assigned_code->id;
                			 
                			 //prepare the coupon code to be sent across the servers......
                			 $payload = $this->generateCouponPayload(
                                'admin',        // added_by
                                'discount_on_purchase',     // coupon_type
                                'seller',     // coupon_bearer
                                0,          // seller_id
                                0,          // customer_id
                                'BPI-EPC-Promo', // title
                                $assigned_code,          // code
                                date('Y-m-d H:i:s'),   // start_date
                                2,            // min_purchase
                                500,            // max_discount
                                10,             // discount
                                'percentage',   // discount_type
                                1,       // status
                                100             // limit
                            );
                            
                             //send the payload across....
                             $apiUrl = 'https://api.bpimarket.com/coupons/';
                             $response = $this->sendPayloadToServer($apiUrl, $payload);
                             
                             $responseData = json_decode($response, true);
                            
                             if ($responseData['success']) {
                                  $code_users_data = array(
                        			  	"user_id"=>$userid,
                        				"export_package_id"=>$id,
                        				"code"=>$assigned_code,
                        				"start_date" => date('Y-m-d H:i:s'),
                        				"end_date" => date('Y-m-d H:i:s', strtotime('+30 days')),
                        				"status"=> 1
                        			  ); 	
                    		 	  $this->generic_model->insert_data('export_code_users',$code_users_data);

        						  $transactionWith = array(
        										'user_id' => $userid,
        										'order_id' =>334,
        										'transaction_type' => 'debit',
        										'amount' => $amount,  // Assuming you have the price for each item
        										'description' => 'Purchase of BPI Export Code Membership Extension',  // Add a relevant description
        										'status' => 'Successful'
        									);
        						  $transactionWith2 = array(
        										'user_id' => $userid,
        										'order_id' =>334,
        										'transaction_type' => 'debit',
        										'amount' => $vat,  // Assuming you have the price for each item
        										'description' => 'Vat for Purchase of BPI Export Code Membership Extension',  // Add a relevant description
        										'status' => 'Successful'
        									);
        						  $this->generic_model->insert_data('transaction_history', $transactionWith);
        						  $this->generic_model->insert_data('transaction_history', $transactionWith2);
        						  
        						  if($user->shelter_wallet == 1 || $user->is_vip == 1){
        								 $newWallet_balance = ($availableFunds - $total);
        								 $update_user_data = array(
        									'wallet' => $newWallet_balance,
        									'cashback'=> $newcashback,
        									'spendable'=>0
        									);
        }
        						  else{
        								$newWallet_balance = ($availableFunds - $total);
        								$update_user_data = array(
        									'spendable' => $newWallet_balance,
        									'cashback'=> $newcashback,
        								);
       }
        						 
        						  if($exc_package->charge == 0 || empty($exc_package->charge)){
        							  //do nothing
        						  }else{
        							  $save_rev = array(
        								'user_id' => $userid,
        								'package_id' =>$id,
        								'amount' => $exc_package->charge,  // Assuming you have the price for each item
        								'date' => date('Y-m-d H:i:s')
        							  );
        							  $this->generic_model->insert_data('bec_revenue', $save_rev);
        							  
        							   $transactionWith4 = array(
        										'user_id' => $userid,
        										'order_id' =>334,
        										'transaction_type' => 'debit',
        										'amount' => $exc_package->charge,  // Assuming you have the price for each item
        										'description' => 'Charge of BPI Export Code Membership Extension',  // Add a relevant description
        										'status' => 'Successful'
        									);
        							  $this->generic_model->insert_data('transaction_history', $transactionWith4);
        						  }
        						  $user_table = 'users';
        						  $user_condition = array('id' => $userid);
        						  $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition); 
        						  
        						  $this->session->set_flashdata( 'success', 'Extension Activated Successfully' );
                				  redirect( 'extension' ); 
                             } else {
                                    $this->session->set_flashdata( 'error', 'Something went wrong setting up your Extension, our tech team has been notified' );
                            		redirect( 'extension' ); 
                                } 
        				 
					  }
					else{
						 $this->session->set_flashdata( 'error', 'Insufficient Wallet Balance, Top up your cash wallet from the Assets Page then try again' );
        				redirect( 'extension' ); 
					 }
	       }
		 }
 }
	
  public function upgrade_exc(){
	if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
	  $export_users = $this->generic_model->getInfo('export_code_users','user_id',$userid);
	  $ecp = $this->generic_model->select_all('export_packages', array('id >'=>$export_users->export_package_id));
          $this->reset_session();
          $data[ 'user_details' ] = $user_details;
		  $data['export_codes'] = $ecp;
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $this->load->view( 'upgrade_exc', $data );     
	}
    else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function calculator() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'calculator', $data );
    } else {
      redirect( 'login' );
    }
  }

  public function meal_claim( $id ) {
    date_default_timezone_set( 'Africa/Lagos' );
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $myticket = $this->generic_model->getInfo( 'philanthropy_tickets', 'id', $id );
      $claimed_date = $myticket->date_claimed;
      $startDate = strtotime( $claimed_date );
      $endDate = strtotime( '+1 day', $startDate );
      $currentTimestamp = strtotime( date( 'Y-m-d H:i:s' ) ); // Current Unix timestamp
      if ( $currentTimestamp > $endDate ) {
        $ticket_details = array(
          'date_used' => date( 'Y-m-d H:i:s' ),
          'status' => 'used'
        );
        $condition = array( 'id' => $id );
        $this->generic_model->update_data( 'philanthropy_tickets', $ticket_details, $condition );
        $this->session->set_flashdata( 'success', 'Your ticket is marked as used!' );
        redirect( 'dashboard' );
      } else {
        $this->session->set_flashdata( 'error', 'You have to wait 24 hours before ticket becomes available to use' );
        redirect( 'dashboard' );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function store() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $products = $this->generic_model->select_where( 'store_products', array( 'in_stock' => 1 ) );
      $data[ 'store_products' ] = $products;
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'others' ] = $this->generic_model->select_all_random( 'store_products' );
      $data[ 'merchants' ] = $this->generic_model->select_where( 'merchants', array( 'status' => 'active' ) );
      $this->load->view( 'store', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function billing() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'billing', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function profile() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
	  $my_nextofkin = $this->generic_model->select_all('beneficiary_info', array('user_id'=>$userid));
      $user_details = $this->generic_model->getInfo( 'users', 'id', $userid );
	  $is_nextofkin = $this->generic_model->getInfo( 'beneficiary_info', 'ssc', $user_details->ssc );
      $data['direct_invite'] = $this->generic_model->get_total_referrals_for_user($userid, 50000);
      $data['level1_invite'] = $this->generic_model->get_total_referrals_for_user_level($userid, 50000);
      $data[ 'user_details' ] = $user_details;
      $data['unread_count'] = $this->generic_model->get_unread_count($userid);
	  $data['nextofkin'] = $my_nextofkin;
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data['is_card'] = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
	  $data['is_beneficiary'] = $this->generic_model->getInfo( 'beneficiary_info', 'ssc', $user_details->ssc );
      $data['company_details'] = $this->generic_model->getInfo( 'business_info', 'user_id', $userid );
      $this->load->view( 'profile', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function view_profile( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $view_details = $this->generic_model->getInfo( 'users', 'id', $id );
      $data[ 'user_details' ] = $user_details;
      $data[ 'view_details' ] = $view_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'view_profile', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function security() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'logs' ] = $this->generic_model->select_where( 'login_activity', array( 'user_id' => $userid ) );
      $this->load->view( 'security', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function campaigns() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $campaigns = $this->generic_model->select_all_data( 'campaings' );
      $products = $this->generic_model->select_where( 'store_products', array( 'in_stock' => 1 ) );
      $data[ 'campaigns' ] = $campaigns;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'campaigns', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function announcements() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $news = $this->generic_model->select_all_data( 'bulletin' );$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'news' ] = $news;
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'bulletin', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function merchant_fee() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $merchant_fee = $this->generic_model->getInfo( 'pickup_reg_fee', 'id', 1 );
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;
      $data[ 'merchant_fee' ] = $merchant_fee;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'merchant_fee', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function settings() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $banks = $this->generic_model->select_all_data( 'nigerian_banks' );
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'bank_records' ] = $this->user_model->get_bank_records( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'banks' ] = $banks;
      $data[ 'countries' ] = $this->generic_model->get_countries();$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'currency' ] = $this->food_model->get_currencies();
      $this->load->view( 'settings', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function transactions() {
    if ( $this->session->userdata('user_id') ) {
      $userid = $this->session->userdata('user_id');
      $this->reset_session();
      $user_details = $this->session->userdata('user_details');
      $transactions = $this->generic_model->transaction_select_where('transaction_history', array('user_id' => $userid));
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data['results'] = $transactions;
      $data['user_details'] = $user_details;
      $this->load->view('transactions', $data);
    } else {
      redirect('login'); // Redirect to login if not logged in
    }
  }

  public function analytics() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $tickets = $this->generic_model->select_where( 'philanthropy_tickets', array( 'status' => 'active' ) );
      $login_logs = $this->generic_model->select_where( 'login_activity', array( 'user_id' => $userid ) );
      $shelter_active = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
      if ( !empty( $shelter_active ) ) {
        $package = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_active->shelter_option )->name;
      } else {
        $package = 'No Package Found';
      }
      $year = date( "Y" );
      $month = date( "m" );
      $total_referred_ids = $this->generic_model->get_total_referred_ids_by_month_and_user( $year, $month, $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'downlines' ] = $this->generic_model->get_count( 'referrals', array( 'referred_by' => $userid ) );
      $data[ 'last_refer' ] = $this->generic_model->transaction_select_where_limit( 'referrals', array( 'referred_by' => $userid ), 1, 'referral_id' );
      $data[ 'third_party' ] = $this->generic_model->count_referral_matches( 'referrals', 'link_builder', $userid );$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'refQuota' ] = $total_referred_ids;
      $data[ 'tickets' ] = $tickets;
      $data[ 'package' ] = $package;
      $data[ 'logs' ] = $login_logs;
      $this->load->view( 'analytics', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function palliative() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      //check the payment status and order status... 
      $pendingOrder = $this->generic_model->get_by_condition( 'orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $pendingPayment = $this->generic_model->get_by_condition( 'payments', array( 'user_id' => $userid, 'status' => 0 ) );
      if ( !empty( $pendingOrder ) && !empty( $pendingPayment ) ) {
        $payment_option = $pendingOrder->payment_option;
        $paymentPlan = $pendingOrder->payment_plan;
        $percentage = 7.5 / 100; // Converting percentage to decimal
        $vat = $pendingOrder->amount * $percentage;

        if ( $payment_option == 'local_bank_transfer' ) {
          //local bank transfer redirection
          $this->session->set_userdata( 'orderid', $pendingOrder->id );
          $this->session->set_userdata( 'amount', $pendingOrder->amount );
          $this->session->set_userdata( 'vat', $vat );
          redirect( 'bank_transfer' );

        } 
        
        elseif ( $payment_option == 'card_payment' ) {
          //card payment
          $this->session->set_userdata( 'orderid', $pendingOrder->id );
          $this->session->set_userdata( 'amount', $pendingOrder->amount );
          $this->session->set_userdata( 'vat', $vat );
          redirect( 'card_pay' );

        } 
          
        elseif ( $payment_option == 'crypto' ) {
          //crypto payment
          $this->session->set_userdata( 'orderid', $pendingOrder->id );
          $this->session->set_userdata( 'amount', $pendingOrder->amount );
          $this->session->set_userdata( 'vat', $vat );
          redirect( 'crypto_pay' );

        }
          
      } 
    
      else {
        $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
        $this->reset_session();
        $user_details = $this->session->userdata( 'user_details' );
        $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
        $referrals = $this->generic_model->select_where( 'referrals', array( 'referred_by' => $userid ) );
        $merchants = $this->generic_model->getInfo( 'merchants', 'merchant_city', $userInfo->city );
          
        if ( !empty( $merchants ) ) {
          $merchant_ids = $merchants->id;
          $data[ 'food_items' ] = $this->generic_model->select_where( 'food_items', array( 'quantity >' => 5, 'pickup_center_id' => $merchant_ids ) );
        } 
          
        else {
          $merchants = 0;
          $merchant_ids = 0;
          $data[ 'food_items' ] = '';
        }

        $countdownData = $this->generic_model->getInfo( 'activation_countdown', 'user_id', $userid );
        // Get the current date and time
        $currentDate = new DateTime();

        if ( !empty( $countdownData ) ) {
          $startDate = strtotime( $countdownData->activated_date );
          $endDate = strtotime( $countdownData->end_date );

          // Calculate the difference between end date and current date
          $interval = $endDate - $startDate;
          $daysLeft = floor( $interval / ( 60 * 60 * 24 ) );;
        } 
          
        else {
          $startDate = 0;
          $endDate = 0;
          $interval = 0;
          $daysLeft = 0;
        }

        $year = date( "Y" );
        $month = date( "m" );
        $total_referred_ids = $this->generic_model->get_total_referred_ids_by_month_and_user( $year, $month, $userid );

        // Pass the data to the view
        $data[ 'daysLeft' ] = $daysLeft;
        // Pass the data to the view
        $data[ 'totalRef' ] = $total_referred_ids;
        $data[ 'plan' ] = $this->generic_model->select_by_id( 'market_prices', 1 )->palliative_price;
        $data[ 'countdownData' ] = $countdownData;
        $data[ 'referrals' ] = $referrals;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'results' ] = $transactions;
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'student_palliative', $data );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function product_details( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->session->set_userdata( 'product_id', $id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $product_details = $this->generic_model->getInfo( 'store_products', 'id', $id );
      $orders = $this->generic_model->select_where( 'store_orders', array( 'product_id' => $id ) );
      $comments = $this->generic_model->select_where( 'product_comments', array( 'product_id' => $id ) );
      $ratings = $this->generic_model->select_where( 'product_rating', array( 'product_id' => $id ) );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $product_details->pickup_center_id );
      $data[ 'store_details' ] = $store_details;
      $data[ 'orders' ] = $orders;
      $data[ 'ratings' ] = $ratings;
      $data[ 'comments' ] = $comments;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $data[ 'product_info' ] = $product_details;
      $this->load->view( 'details', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
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

  public function checkout() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $cart = $this->generic_model->select_where( 'store_orders', array( 'user_id' => $userid ) );
      $orders = $this->generic_model->select_where( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $total_cart = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid ) );
      $total_pending_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $total_completed_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'completed' ) );
      $sum_total = $this->generic_model->getSum( 'store_orders', 'amount', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $data[ 'total_sum' ] = $sum_total;
      $data[ 'pending_orders' ] = $orders;
      $data[ 'total_cart' ] = $total_cart;
      $data[ 'total_pending' ] = $total_pending_orders;
      $data[ 'total_completed' ] = $total_completed_orders;
      $data[ 'cart' ] = $cart;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'checkout', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function my_items() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $cart = $this->generic_model->select_where( 'product_cart', array( 'user_id' => $userid ) );
      $orders = $this->generic_model->select_where( 'store_orders', array( 'user_id' => $userid ) );
      $total_cart = $this->generic_model->get_count( 'product_cart', array( 'user_id' => $userid ) );
      $total_pending_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $total_completed_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'completed' ) );
      $sum_total = $this->generic_model->getSum( 'store_orders', 'amount', array( 'user_id' => $userid, 'status' => 'pending' ) );
      //get the pack items for this user
      $pal_order = $this->generic_model->getInfo( 'orders', 'user_id', $userid );
      $pickup_data = $this->generic_model->select_where( 'student_palliative_locator', array( 'user_id' => $userid ) );
      $is_counting = $this->generic_model->getInfo( 'activation_countdown', 'user_id', $userid );

      $data[ 'order' ] = $pal_order;
      $data[ 'countdown_on' ] = $is_counting;
      $data[ 'pickup_data' ] = $pickup_data;
      $data[ 'total_sum' ] = $sum_total;
      $data[ 'orders' ] = $orders;
      $data[ 'total_cart' ] = $total_cart;
      $data[ 'total_pending' ] = $total_pending_orders;
      $data[ 'total_completed' ] = $total_completed_orders;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'cart' ] = $cart;
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'myitems', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function claim_dashboard( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $order_details = $this->generic_model->getInfo( 'store_orders', 'id', $id );
      $product_details = $this->generic_model->getInfo( 'store_products', 'id', $order_details->product_id );
      $user_info = $this->generic_model->getInfo( 'users', 'id', $order_details->user_id );

      $data[ 'user_details' ] = $user_details;
      $data[ 'customer_details' ] = $user_info;
      $data[ 'product_info' ] = $product_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'order_info' ] = $order_details;
      $this->load->view( 'claim_dashboard', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function local_store( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $products = $this->generic_model->select_where( 'store_products', array( 'in_stock' => 1, 'pickup_center_id' => $id ) );
      $store = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $data[ 'store_info' ] = $store;
      $data[ 'store_products' ] = $products;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'local_store', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function wishlist() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $orders = $this->generic_model->select_where( 'product_cart', array( 'user_id' => $userid ) );
      $total_cart = $this->generic_model->get_count( 'product_cart', array( 'user_id' => $userid ) );
      $total_pending_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $total_completed_orders = $this->generic_model->get_count( 'store_orders', array( 'user_id' => $userid, 'status' => 'completed' ) );
      $sum_total = $this->generic_model->getSum( 'store_orders', 'amount', array( 'user_id' => $userid, 'status' => 'pending' ) );
      $data[ 'total_sum' ] = $sum_total;
      $data[ 'pending_orders' ] = $orders;
      $data[ 'total_cart' ] = $total_cart;
      $data[ 'total_pending' ] = $total_pending_orders;
      $data[ 'total_completed' ] = $total_completed_orders;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'wishlist', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function aid_tickets() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $tickets = $this->generic_model->select_where( 'philanthropy_tickets', array( 'status' => 'active' ) );
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'tickets' ] = $tickets;
      $this->load->view( 'aid_tickets', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function upgrade_bpi() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
	  $user_package = $this->generic_model->getInfo('active_shelters','user_id',$userid);
      $shelters = $this->user_model->getAllData( 'shelter_program' );
	  if($user_package->starter_pack == 1){
		  $shelter_type = $this->user_model->getAllData( 'upgrade_shelter_palliative_types');
	  }elseif($user_package->starter_pack == 3){
		 $shelter_type = $this->user_model->getAllData( 'upgrade_shelter_palliative_types', $user_package->starter_pack ); 
	  }else{
		  $shelter_type = '';
	  }
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'bpi_upgrade', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function validator() {
    $data[ 'error' ] = '';
    $this->load->view( 'validator', $data );
  }
}