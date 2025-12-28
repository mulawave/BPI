<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Partners extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
        $this->load->model('user_model');
        $this->load->helper('string');
    }

    public function register() {
        $referral_code = $this->input->get('ref');
        if(!empty($referral_code)){
            $this->load->view('partner_reg', array('referral_code' => $referral_code));
        }else{
            $this->load->view('partner_reg');
        }
    }
    
    public function registration_success(){
        $this->load->view('partner_success');
    }

    public function process_registration() {
        $this->load->library('form_validation');
        $this->form_validation->set_rules('name', 'Name', 'required');
        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        $this->form_validation->set_rules('password', 'Password', 'required');
        $this->form_validation->set_rules('confirm_password', 'Confirm Password', 'required|matches[password]');
        $this->form_validation->set_rules('country', 'Country', 'required');
        $this->form_validation->set_rules('state', 'State', 'required');
		$this->form_validation->set_rules('city', 'City', 'required');

         if ($this->form_validation->run() === FALSE) {
                $this->load->view('part_reg');
         } 
		 else {
                
                //check database for duplicate
                $emailCheck = $this->generic_model->getInfo('philanthropy_partners','email',$this->input->post('email'));
                if(!empty($emailCheck)){
                    $this->session->set_flashdata('error', 'Duplicate record found for email, please login if you have registered with this email before');
                    redirect('part_reg');
                }
			    else{
                    $to = $this->input->post('email');
                    $subject = 'BPI Partners - Email Verification Required';
                    $verification_code = substr(md5(uniqid(mt_rand(), true)), 0, 9); // Generate a unique verification code
                    $trimmed_link = base_url('part_verify_email/'.$verification_code);
                    $title = 'Dear  '.$this->input->post('name');
                    $message = '<p>Thank you for registering with BeepAgro Palliative Initiative (BPI).<br> To complete your registration and gain access to our platform\'s features and services,<br> we need to verify your email address..</p>
                               <p>Please follow the steps below to verify your email:<br>Click on the button below to verify your email address:</p>
                               <p>
                               <a href="'.$trimmed_link.'" target="_blank">
                               <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Verify Your Email</button>
                               </a>
                               </p>
                               <br>
                               <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
                    			 Our support team is here to help you with any concerns you may have.<br>
                    			 Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
                    			 We look forward to having you as a valued member of our community.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';

                          $this->sendemail($title,$to,$subject,$message);
                    
                   
                        // Save the verification code and set verified to false in the database
                        $data = array(
                            'name' => $this->input->post('name'),
                            'email' => $this->input->post('email'),
                            'password' => password_hash($this->input->post('password'), PASSWORD_BCRYPT),
                            'country' => $this->input->post('country'),
                            'state'=>$this->input->post('state'),
							'city'=>$this->input->post('city'),
                            'verification_code' => $verification_code,
                            'ref_code' => $this->generate_referral_link(),
                            'verified' => 0,
							'status' => 0
                        );
                        $this->db->insert('philanthropy_partners', $data);
                        $user_id = $this->db->insert_id();
    
                        $created = date('Y-m-d H:i:s');
                        $referral_code = $this->input->post('ref');
                        if(empty($referral_code)){ 
                          	$referred_by = 1;	
                          	$level_1= 1; 	
                          	$level_2 = 1;	
                          	$level_3 = 1;	
                          	$level_4 = 1;	
                          	$level_5 = 1;	
                          	$level_6 = 1;	
                          	$level_7 = 1;	
                          	$level_8 = 1;	
                          	$level_9 = 1;	
                          	$level_10 = 1;
                          	
                          	$referralData = array(
                          	    'user_id' => $user_id, 	
                          	    'referred_by' => $referred_by,
                          	    'level_1'=> $level_1, 	
                              	'level_2' => $level_2,	
                              	'level_3' => $level_3,	
                              	'level_4' => $level_4,	
                              	'level_5' => $level_5,	
                              	'level_6' => $level_6,	
                              	'level_7' => $level_7,	
                              	'level_8' => $level_8,	
                              	'level_9' => $level_9,
                              	'level_10' => $level_10,
                              	'referral_date' => $created
                          	);
                          	$this->generic_model->insert_data('part_referrals', $referralData);
                          
                        }
					    else{
                            $isrefcode = $this->user_model->getReferralId($referral_code);
                            $referrer = $isrefcode->id;
                            $refGen = $this->user_model->getReferrerID($referrer);
                            
                            $referred_by = $referrer;	
                          	$level_1= $refGen->referred_by; 	
                          	$level_2 = $refGen->level_1;	
                          	$level_3 = $refGen->level_2;	
                          	$level_4 = $refGen->level_3;	
                          	$level_5 = $refGen->level_4;	
                          	$level_6 = $refGen->level_5;	
                          	$level_7 = $refGen->level_6;	
                          	$level_8 = $refGen->level_7;	
                          	$level_9 = $refGen->level_8;	
                          	$level_10 = $refGen->level_9;
                          	
                          	$referralData = array(
                          	    'user_id' => $user_id, 	
                          	    'referred_by' => $referred_by,
                          	    'level_1'=> $level_1, 	
                              	'level_2' => $level_2,	
                              	'level_3' => $level_3,	
                              	'level_4' => $level_4,	
                              	'level_5' => $level_5,	
                              	'level_6' => $level_6,	
                              	'level_7' => $level_7,	
                              	'level_8' => $level_8,	
                              	'level_9' => $level_9,
                              	'level_10' => $level_10,
                              	'referral_date' => $created
                          	);
                          	$this->generic_model->insert_data('part_referrals', $referralData);
                        }
                        redirect('partner_success');
                    
                }
            }
    }
        // Helper function to get the user by referral code
    private function get_user_by_referral_code($referral_code) {
        return $this->user_model->get_user_by_referral_code($referral_code);
    }
    
    // Helper function to generate a unique referral link
    private function generate_referral_link() {
        return $this->user_model->generate_unique_referral_link();
    }
	
	public function verify_ticket() {
    $user_id = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'code', 'Claim Code', 'required' ); 
    $product = $this->session->userdata( 'code' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', 'Claim Code is required' );
      redirect( 'part_dashboard' );
    } else {
      $code = $this->input->post( 'code' );
      //check if code is valid
      $code_check = $this->generic_model->getInfo( 'store_orders', 'note', $code );
      if ( empty( $code_check ) ) {
        $this->session->set_flashdata( 'error', 'The claim code you have provided is invalid' );
        redirect( 'part_dashboard' );
      } else {
        //settle the pickup center 
        $order_id = $code_check->id;
        $product_id = $code_check->product_id;
        $product_info = $this->generic_model->getInfo( 'store_products', 'id', $product_id );
        $pickup_reward = $product_info->pickup_reward;

        //add to pickup center wallet
        $user = $this->generic_model->getInfo( 'users', 'id', $user_id );
        $oldwallet_bal = $user->wallet;
        $newwallet_bal = ( $oldwallet_bal + $pickup_reward );
        $user_data = array( 'wallet' => $newwallet_bal );
        $condition = array( 'id' => $user_id );
        $this->generic_model->update_data( 'users', $user_data, $condition );

        //transaction history
        $claimRecord = array(
          'user_id' => $user_id,
          'order_id' => $order_id,
          'transaction_type' => 'credit',
          'amount' => $pickup_reward,
          'description' => 'Product claim pickup-center reward',
          'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data( 'transaction_history', $claimRecord );

        //delete the claim code and verify the claim
        $product_update = array( 'status' => 'delivered', 'note' => 'Verified' );
        $update_condition = array( 'id' => $order_id );
        $this->generic_model->update_data( 'store_orders', $product_update, $update_condition );
        redirect( 'part_dashboard/' . $order_id );
      }
    }
  }
	
	public function settings(){
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $user_details = $this->session->userdata('user_details');
            $data['bank_records'] = $this->user_model->get_partner_bank_records($userid);
            $data['user_details'] = $user_details;
            $data['category'] = $this->food_model->get_categories();
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $this->load->view('preference',$data);
        } else {
          redirect('partners'); // Redirect to login if not logged in
        }
    }
	
	public function transactions(){
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
            $transactions = $this->generic_model->select_where('partner_transaction_history',array('user_id'=>$userid));
            $data['results'] = $transactions;
            $data['user_details'] = $user_details;
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $this->load->view('business_transactions',$data);
        } else {
          redirect('partners'); // Redirect to login if not logged in
        }
    }
	
	public function update_bio() {
    // Validate the form input
    $user_id = $this->session->userdata( 'user_id' );
    $userDetails = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $user_id );
      $this->form_validation->set_rules( 'address', 'Business Address', 'required' );
      $this->form_validation->set_rules( 'category', 'Category', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
          $this->session->set_flashdata( 'address_error', 'You have errors in your form' );
          redirect( 'preference' );
    } else {
        $data = array(
          'address' => $this->input->post( 'address' ),
          'category_id' => $this->input->post( 'category' )
        );
		$condition = array('id'=>$user_id);

      // Update user profile
      $this->generic_model->update_data('philanthropy_partners',$data, $condition );

      //reset the session data
      $user_id = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'philanthropy_partners', array( 'id' => $user_id ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'address_success', 'Profile Information Updated Successfully!' );
      redirect( 'preference' );
    }
  }
	
	public function add_location() {
    // Validate the form input
    $user_id = $this->session->userdata( 'user_id' );
    $userDetails = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $user_id );
      $this->form_validation->set_rules( 'name', 'Business Address', 'required' );
      $this->form_validation->set_rules( 'address', 'Category', 'required' );
	  $this->form_validation->set_rules( 'country', 'Business Address', 'required' );
      $this->form_validation->set_rules( 'state', 'Category', 'required' );
	  $this->form_validation->set_rules( 'city', 'Business Address', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
          $this->session->set_flashdata( 'error', 'You have errors in your form' );
          redirect( 'part_dashboard' );
    } else {
        $data = array(
		  'partner_id'=>$user_id,
          'location' => $this->input->post( 'address' ),
          'name' => $this->input->post( 'name' ),
		  'country' => $this->input->post( 'country' ),
		  'state' => $this->input->post( 'state' ),
		  'city' => $this->input->post( 'city' ),
		  'status'=>1
        );
		  
		
      // Update user profile
      $this->generic_model->insert_data('philanthropy_franchise',$data);
      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Profile Information Updated Successfully!' );
      redirect('part_dashboard');
    }
  }
	
	public function update_pin(){
		$user_id = $this->session->userdata( 'user_id' );
    	$userDetails = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $user_id );
      	$this->form_validation->set_rules( 'pin', 'New Pin', 'required' );
		if ( $this->form_validation->run() === FALSE ) {
			$this->session->set_flashdata( 'pin_error', 'Please make sure you have entered a new pin' );
			redirect( 'preference' );
		}
		else{
			 $data = array(
			  'pin' => $this->input->post( 'pin' )
			);
			$condition = array('id'=>$user_id);

		    // Update user profile
		    $this->generic_model->update_data('philanthropy_partners',$data, $condition );

		    //reset the session data
		    $user_id = $this->session->userdata( 'user_id' );
		    $this->session->unset_userdata( 'user_details' );
		    // Fetch user details
		    $user_details = $this->db->get_where( 'philanthropy_partners', array( 'id' => $user_id ) )->row();

		    // Set user details in session (optional)
		    $this->session->set_userdata( 'user_details', $user_details );

		    // Redirect or display success message
		    $this->session->set_flashdata( 'pin_success', 'Pin Information Updated Successfully!' );
		    redirect( 'preference' );
		}
	}

    public function update_account() {

    $user_id = $this->session->userdata( 'user_id' );

    // Check if user records exist in the bank_records table
    $existing_records = $this->user_model->get_partner_bank_records( $user_id );

    // Validate the form input
    $this->form_validation->set_rules( 'account_name', 'Account Name', 'required' );
    $this->form_validation->set_rules( 'account_number', 'Account Number', 'required' );
    $this->form_validation->set_rules( 'bank_name', 'Bank Name', 'required' );
    $this->form_validation->set_rules( 'bvn', 'Bank Verification Number', 'required' );

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'bank_error', 'You have errors in your form' );
      redirect( 'preference' );
    } else {
      // Form validation passed, update user's bank records

      $data = array(
        'bank_account' => $this->input->post( 'account_name' ),
        'account_number' => $this->input->post( 'account_number' ),
        'bank_name' => $this->input->post( 'bank_name' ),
        'bvn' => $this->input->post( 'bvn' ),
      );

      if (!empty($existing_records )) {
        $this->user_model->update_partner_bank_records( $user_id, $data );
        $this->session->unset_userdata( 'user_details' );
        // Fetch user details
        $user_details = $this->db->get_where( 'philanthropy_partners', array( 'id' => $user_id ) )->row();

        // Set user details in session (must do!)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'bank_success', 'Bank Information Updated Successfully!' );
        redirect( 'preference' );

      } else {
        // User records don't exist, insert a new record
        $data[ 'user_id' ] = $user_id;
        $this->db->insert( 'partner_bank_records', $data );
        $this->session->unset_userdata( 'user_details' );
        // Fetch user details
        $user_details = $this->db->get_where( 'philanthropy_partners', array( 'id' => $user_id ) )->row();

        // Set user details in session (must do!)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'bank_success', 'Bank Information Updated Successfully!' );
        redirect( 'preference' );
      }


    }
  }

	public function upload_profile_picture(){
    // File upload configuration
    $config[ 'upload_path' ] = './uploads/profile_pictures/';
    $config[ 'allowed_types' ] = 'gif|jpg|png|jpeg';
    $config[ 'max_size' ] = 4096; // 4MB
    $config[ 'encrypt_name' ] = TRUE;

    $this->load->library( 'upload', $config );

    if ( !$this->upload->do_upload( 'userfile' ) ) {
      // Handle upload error
      $error = 'could not process your request, please choose a valid file';
      $this->session->set_flashdata( 'error', $error );
      redirect( 'preference' );
    } else {
      // Upload successful, update user's profile picture in the database
      $upload_data = $this->upload->data();
      $file_name = $upload_data[ 'file_name' ];
      $this->user_model->update_partner_picture( $this->session->userdata( 'user_id' ), $file_name );

      //reset the session data
      $user_id = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'philanthropy_partners', array( 'id' => $user_id ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Business Logo Uploaded Successfully!' );
      redirect( 'preference' );
    }
  
	}
	
	public function my_assets(){
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
			$bankDetails = $this->generic_model->getInfo('partner_bank_records', 'user_id', $userid);
	        $data[ 'withdrawals' ] = $this->generic_model->transaction_select_where( 'partner_withdrawal_history', array( 'user_id' => $userid ) );

			$data['bank'] = $bankDetails;
            $data['user_details'] = $user_details;
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_notifications($userid);
            $this->load->view('partner_wallet',$data);
        } else {
          redirect('partners'); // Redirect to login if not logged in
        }
    }
	
	function payout(){
        $user_id = $this->session->userdata('user_id');
        $user = $this->generic_model->getInfo('users','id',$user_id);
        $amount = $this->input->post('amount');
        $account_number = $this->input->post('account');
        $bankcode = $this->input->post('bank');
        $this->form_validation->set_rules('amount','Amount','trim|required|max_length[128]');
        $this->form_validation->set_rules('account','Bank Account','trim|required|max_length[128]');
        $this->form_validation->set_rules('bank','Bank Code','trim|required|max_length[128]');
            
            if($this->form_validation->run() == FALSE)
            {
                $this->session->set_flashdata('error', validation_errors());
                redirect('withdrawal');
            }
            else
            {
                $vat = number_format((7.5*$amount)/100,2);
                $amount = $this->input->post('amount', TRUE);
                if($amount <= 5000){
                    $charge = 20;
                }elseif($amount > 5000 AND $amount < 50000){
                    $charge = 37;
                }else{
                    $charge = 72;
                }
                $subCharge = ($charge + $vat);
                $totalDebitAmt = ($amount + $subCharge);

                $availableFunds =  $user->wallet;
                if(bccomp($availableFunds, $totalDebitAmt, 2) == 1){
                    //commence transfer
                   // $minimumWithdrawal = number_format((50/240),7);
                   // $maximumWithdrawal = $this->user_model->getUserInfo($availableFunds->user_id)->spend_limit;
                    //if(bccomp($minimumWithdrawal,$totalTokenValue, 7) == 1){
                   //    $this->session->set_flashdata('errors','Minimum Withdrawal is '.$minimumWithdrawal);
                   //    redirect('dashboard','refresh');
                    //}else{
                        //insert transfer_data
                        $withdrawal_data = array(	
                           'user_id' => $user_id,
                           'description' => 'Withdraw to Bank Account (Cash Wallet)',
                           'currency' => 'NGN',
                           'amount' => $amount,
                           'date' => date('Y-m-d H:i:s'),
                           'status' => 'processing'
                         );
                        $w_id = $this->generic_model->insert_data('partner_withdrawal_history', $withdrawal_data);
                        
                        $transactionWith = array(
                            'user_id' => $user_id,
                            'order_id' =>$w_id,
                            'transaction_type' => 'debit',
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'withdrawal of '.$amount.' to your bank account',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('partner_transaction_history', $transactionWith);
                        
                        $transactionVAT = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  // Assuming you have the price for each item
                            'description' => 'VAT charge for withdrawal of '.$amount,  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send1 = $this->generic_model->insert_data('partner_transaction_history', $transactionVAT);
                        
                        $transactionCharge = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'debit',
                            'amount' => $charge,  // Assuming you have the price for each item
                            'description' => 'Service charge for withdrawal of '.$amount,  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send2 = $this->generic_model->insert_data('partner_transaction_history', $transactionCharge);
                        
                                $dateTrans = date("Y-m-d H:i:s");
                                $statusfund = 'pending';
                                $ttype = 'withdrawal';
                                $currency = 'NGN';
                                $sender = 'BeepAgro Palliative';
                                $type = 'Bank Account';
                                $updated = 'used';
                                $raveSecretKey = $this->generic_model->getInfo('tbl_addons_api','source', 'FLWT')->secret_key;
                                $ravePublicKey = $this->generic_model->getInfo('tbl_addons_api','source', 'FLWT')->public_key;
                                $raveConfirmUrl = 'https://api.ravepay.co/flwv3-pug/getpaidx/api/v2/verify';
                                $ravePayUrl = 'https://api.ravepay.co/flwv3-pug/getpaidx/api/flwpbf-inline.js';
                                $reference = "BAP-rave-tf".time();
                                //debit wallet
                                
                         $ch = curl_init(); //http post to another server
                        curl_setopt($ch, CURLOPT_URL,"https://api.ravepay.co/v2/gpx/transfers/create");
                        curl_setopt($ch, CURLOPT_POST, 1);
                        $values = array(
                            'account_bank' => $bankcode,
                            'account_number' => $account_number,
                            'amount' => $amount,
                            'seckey' => $raveSecretKey,
                            'narration' => $sender,
                            'currency' => $currency,
                            'reference' => $reference
                        );
                        $params = http_build_query($values);
                        curl_setopt($ch, CURLOPT_POSTFIELDS,$params);
                        // receive server response
                        
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        $server_output = curl_exec ($ch);
                        $jd_orders = json_decode($server_output,true);
                        
                        //echo '<pre>';
                        //print_r($jd_orders);
                        //echo '</pre>';
                        //exit();
                        curl_close ($ch);
                        
                        
                        $chv = curl_init(); //http post to another server
                        curl_setopt($chv, CURLOPT_URL,"https://api.ravepay.co/v2/gpx/transfers?seckey=$raveSecretKey&id=$reference&q=$account_number");
                        curl_setopt($chv, CURLOPT_RETURNTRANSFER, true);
                        $server_outputv = curl_exec ($chv);
                        $jd_ordersv = json_decode($server_outputv,true);
                        
                        ///update user account to show withdrawal.....
                        $rave_message = $jd_ordersv['data']['transfers']['0']['complete_message'];
                        $rave_amount = $jd_ordersv['data']['transfers']['0']['amount'];
                        $rave_fee = $jd_ordersv['data']['transfers']['0']['fee'];
                        $rave_status = $jd_ordersv['data']['transfers']['0']['status'];
                        $transAmount = ($rave_amount + 145);
                        $cashed = 'successful';
                        $ptype = 'Bank Transfer';
                        $msg = 'Transfer Successful';
                        $status = 1;
                        $data = array('msg' => $msg, 'status' => $status, 'fee'=>$rave_fee);
                        
                        $transaction_data_upate = array(
                            'status'=>'Successful'    
                        );
                        $this->generic_model->update_data('withdrawal_history',$transaction_data_upate,array('id' => $w_id));
                        
                        $newWallet_balance = ($availableFunds - $totalDebitAmt);
                        $update_user_data = array(
                            'wallet' => $newWallet_balance,
                        );
                        $user_table = 'users';
                        $user_condition = array('id' => $user_id);
                        $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                        
                        $this->session->set_flashdata('success','Withdrawal processed successfully');
                        redirect('pwallet');
                        
                    //}
                }else{
                    $this->session->set_flashdata('error','Insufficient Asset Balance');
                    redirect('pwallet');
                    
                }
            }
        
    }
    
    // Helper function to handle the referral system
    private function handle_referral_system($referring_user, $referred_user_id) {
        if ($referring_user) {
            $this->user_model->update_referral_levels($referring_user->id, $referred_user_id);
        }
    }
    
    public function email_verified($message){
        $data['message'] = urldecode($message);
        $this->load->view('part_email_verified',$data);
    }
    
    public function verify_email($verification_code) {
        $user = $this->db->get_where('philanthropy_partners', array('verification_code' => $verification_code))->row();
    
        if ($user) {
            // Update user as verified
            $this->db->where('id', $user->id);
            $this->db->update('philanthropy_partners', array('verified' => 1, 'verification_code' => NULL));
            
            //send verified email confirmation......
             $title = 'Dear  '.$user->name;
             $to = $user->email;
             $subject = 'BPI Partner Account Verified (Tier 1)';
             $message = '<p>Thank you for verifying your email with BeepAgro Palliative Initiative (BPI).<br> Your account has achieved Tier 1 Verification Status<br><br>
             Next Step:<br>Login to your account and update your location settings to enable us match you with BPI activities, events and Pickup Centers closest to you.</p>
                               <p>
                               <a href="https://beepagro.com/app" target="_blank">
                               <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Login Here</button>
                               </a>
                               </p>
                               <br>
                               <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
                    			 Our support team is here to help you with any concerns you may have.<br>
                    			 Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
                    			 We look forward to having you as a valued member of our community.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';

                          $this->sendemail($title,$to,$subject,$message);
            
            $message = 'Email verification successful. You can now <a href="'.base_url('partners').'">Login</a>';
            $this->email_verified($message);
        } else {
            $message = 'Invalid verification code.';
            $this->email_verified($message);
        }
    }
    
    public function process_login() {
    $this->load->library('form_validation');

    $this->form_validation->set_rules('email', 'Email', 'trim|required|valid_email');
    $this->form_validation->set_rules('password', 'Password', 'trim|required');

    if ($this->form_validation->run() === FALSE) {
        $this->login();
    } else {
        $email = $this->input->post('email');
        $password = $this->input->post('password');

        $user = $this->db->get_where('philanthropy_partners', array('email' => $email, 'verified' => TRUE))->row();

        if ($user && password_verify($password, $user->password)) {
            // Set session data or perform other authentication logic
            $this->session->set_userdata('user_id', $user->id);

            // Fetch user details
            $user_details = $this->db->get_where('philanthropy_partners', array('id' => $user->id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $login_time = date("Y-m-d H:i:s"); 
            $user_agent = $_SERVER['HTTP_USER_AGENT'];
            $device = $this->getDeviceType($user_agent); 
            $user_ip = $_SERVER['REMOTE_ADDR'];
            $location = $this->getLocationFromIP($user_ip);
            
            //save tracker
            $login_activity = array(
                'user_id'=>$user->id,
                'login_time'=>$login_time,
                'location'=>$location,
                'device'=>$device    
            );
            $this->generic_model->insert_data('partner_login_activity',$login_activity);
            
            
            //send login confirmation
            $title = 'Dear  '.$user_details->name;
             $to = $user_details->email;
             $subject = 'BPI Partner Account Login Notification';
             $message = 
             '<p>
                We hope this email finds you well.<br>
                We wanted to inform you that there has been a recent login activity detected on your account.
                Your security is our top priority, and we want to ensure that you are aware of any activity
                related to your account for transparency and safety measures.<br><br>
                
                <strong>Login Details</strong>:
                <ul>
                <li>Date and Time: ['.$login_time.']</li>
                <li>Location: ['.$location.']</li>
                <li>Device: ['.$device.']</li>
                </ul>
                <br><br>
                If you recognize this login activity and it was indeed initiated by you, there is no further action needed on your part.
                However, if you suspect any unauthorized access or if this login was not initiated by you,
                please take immediate action to secure your account.<br><br>
                
                <strong>What Can You Do?</strong>:
                <ol>
                <li>Change your password immediately if you suspect unauthorized access.</li>
                <li>Enable two-factor authentication for an extra layer of security.</li>
                <li>Review your account activity regularly to ensure its integrity.</li>
                </ol>
                <br><br>
                If you have any concerns or questions regarding this login activity,
                please do not hesitate to contact our support team at [support@beepagro.com].
                We are here to assist you and ensure the security of your account.<br><br>
                Thank you for your attention to this matter.<br><br>

                Best regards,<br>
                BeepAgro Palliative Initiative (BPI) Team.</p>';

                $this->sendemail($title,$to,$subject,$message);

            // Pass user details to the dashboard view
            //$data['user_details'] = $user_details;
            //$data['unread_count'] = $this->generic_model->get_unread_count($user->id);
            redirect('part_dashboard');
        } else {
            //$data['error'] = 'Invalid email or password';
            $this->session->set_flashdata('error', 'Invalid email or password');
            $this->index();
        }
    }
}
	
	public function create_offer(){
		$userid = $this->session->userdata('user_id');
		$config[ 'upload_path' ] = './uploads/offers/';
		$config[ 'allowed_types' ] = 'gif|jpg|png|jpeg';
		$config[ 'max_size' ] = 4096; // 4MB
		$config[ 'encrypt_name' ] = TRUE;
		$this->load->library( 'upload', $config );
		if (!$this->upload->do_upload('userfile')) {
		  // Handle upload error
		  $error = 'could not process your request, please choose a valid file';
		  $this->session->set_flashdata( 'error', $error );
		  redirect( 'part_dashboard' );
		} else {
		  // Upload successful, update user's profile picture in the database
		  $upload_data = $this->upload->data();
		  $file_name = $upload_data[ 'file_name' ];
		  $data = array(
			  'image' => 'uploads/offers/'.$file_name,
			  'partner_id' => $userid,
			  'offer' => $this->input->post('offer'),
			  'amount' => $this->input->post('amount'),
			  'status' => 1 	
			  
		  );
		  $this->generic_model->insert_data('philanthropy_offers', $data);
		  // Redirect or display success message
      	  $this->session->set_flashdata( 'success', 'Offer added Successfully!' );
          redirect('part_dashboard');
		}

	}

    public function part_dashboard() {
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
            $transactions = $this->generic_model->transaction_select_where('partner_transaction_history',array('user_id'=>$userid));
            $referrals = $this->generic_model->select_where('part_referrals',array('referred_by'=>$userid));
			$data['total_offers'] = $this->generic_model->get_count('philanthropy_offers',array('partner_id'=>$userid));
			$data['total_tickets'] = $this->generic_model->get_count('philanthropy_tickets',array('created_by'=>$userid));
			$data['tickets_used'] = $this->generic_model->get_count('philanthropy_tickets',array('created_by'=>$userid,'status'=>'used'));
			$data['total_locations'] = $this->generic_model->get_count('philanthropy_franchise',array('partner_id'=>$userid));
            $data['referrals'] = $referrals;
            $data['results'] = $transactions;
            $data['user_details'] = $user_details;
            $data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_notifications($userid);
            $this->load->view('part_dashboard',$data);
        } else {
            redirect('partners'); // Redirect to login if not logged in
        }
    }

    public function index()	{
		$this->load->view('part_home');
	}
	
    public function logout() {
        $this->session->unset_userdata('user_id');
        redirect('partners');
    }
    
    public function send_reset_link() {
        $this->load->library('form_validation');
        $this->form_validation->set_rules('email', 'Email', 'trim|required|valid_email');
    
        if ($this->form_validation->run() === FALSE) {
            $this->load->view('part_forgot_password');
        } else {
            $email = $this->input->post('email');
    
            // Validate if the email exists in the database
            $user = $this->db->get_where('philanthropy_partners', array('email' => $email))->row();
    
            if ($user) {
                // Generate a unique token and store it in the database for this user
                $reset_token = bin2hex(random_bytes(32));
                $this->db->update('philanthropy_partners', array('reset_token' => $reset_token), array('id' => $user->id));
    
                // Send an email with the reset link (using CodeIgniter's Email library)
                    $to = $email;
                    $reset_link = base_url('partners/reset_password/' . $reset_token);
                    $subject = 'BPI - Password Reset Link';
                    $title = 'Dear  '.$user->firstname;
                    $message = '<p>We have received a request to reset the password associated with your account. <br>
                                To proceed with resetting your password, please follow the instructions below:</p>
                               <p>
                               <ol>
                                    <li>
                                        Click the button below to reset your password<br><br>
                                         <a href="'.$reset_link.'" target="_blank">
                                        <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Reset Password</button>
                                        </a>
                                    </li><br><br>

                                    <li>
                                        If the button above does not work, copy and paste the following URL into your web browser:<br>
                                        ['.$reset_link.']
                                    </li>
                                        
                               </ol>
                              
                               </p>
                               <br>
                               <p>Please note that this link is valid for a limited time period for security reasons. 
                               If you did not request a password reset or believe this was a mistake, please ignore this email. Your account remains secure.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';
                          $this->sendemail($title,$to,$subject,$message);
                          
                    // Display a success message or redirect to a success page
                    $data['message'] = 'A password reset link has been sent to your email address.';
                    $this->load->view('part_forgot_password_success', $data);
            } else {
                // Display an error message or redirect to the forgot password page with an error
                $data['error'] = 'Email not found. Please check your email address.';
                $this->load->view('part_forgot_password', $data);
            }
        }
    }

    public function reset_password() {
        $this->load->library('form_validation');
        $this->form_validation->set_rules('new_password', 'New Password', 'trim|required|min_length[6]');
        $this->form_validation->set_rules('confirm_password', 'Confirm Password', 'trim|required|matches[new_password]');
    
        if ($this->form_validation->run() === FALSE) {
            $this->load->view('reset_password');
        } else {
            $reset_token = $this->input->post('token');
    
            // Validate if the reset token exists in the database
            $user = $this->db->get_where('users', array('reset_token' => $reset_token))->row();
    
            if ($user) {
                // Update the user's password and clear the reset token
                $new_password = $this->input->post('new_password');
                $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    
                $this->db->update('users', array('password' => $hashed_password, 'reset_token' => NULL), array('id' => $user->id));
                
                    $to = $user->email;
                    $reset_link = base_url('authController/reset_password/' . $reset_token);
                    $subject = 'BPI - Password Reset Successful';
                    $title = 'Dear  '.$user->firstname;
                    $message = '<p>We are writing to inform you that your password has been successfully reset. You can now access your account using your new password.</p>
                               <p>
                               If you did not request this password reset or believe this was a mistake, please contact our support team immediately.<br><br>

                                Thank you for your attention to this matter.
                              
                               </p>
                               <br>
                               <p>Please note that this link is valid for a limited time period for security reasons. 
                               If you did not request a password reset or believe this was a mistake, please ignore this email. Your account remains secure.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';
                          $this->sendemail($title,$to,$subject,$message);
    
                // Display a success message or redirect to a success page
                $data['message'] = 'Password reset successful. You can now login with your new password.';
                $this->load->view('reset_password_success', $data);
            } else {
                // Display an error message or redirect to the forgot password page with an error
                $data['error'] = 'Invalid reset token.';
                $this->load->view('reset_password', $data);
            }
        }
    }
    
    public function forgot_password(){
        $this->load->view('part_forgot_password');
    }
    
    public function process_order() {
        // Process the submitted order form
        $selected_items = $this->input->post('selected_items', TRUE);

        if (!empty($selected_items)) {
            $total_price = 0;

            // Calculate the total price of selected items
            foreach ($selected_items as $item_id) {
                $item_price = $this->food_model->get_food_price($item_id);
                $total_price += $item_price;
            }

            // Check if the total price exceeds the user's quota
            if ($total_price <= 25000) {
                // Process the order (e.g., update database, show success message, etc.)
                // Deduct the total price from the user's quota

                $remaining_quota = 25000 - $total_price;

                // Optionally, you can update the user's quota in the database
                // Example: $this->update_user_quota($user_id, $remaining_quota);

                // Show a success message
                $this->session->set_flashdata('success', 'Order placed successfully!');
            } else {
                // Show an error message
                $this->session->set_flashdata('error', 'Order exceeds available quota!');
            }
        } else {
            // Show an error message
            $this->session->set_flashdata('error', 'No items selected!');
        }

        // Redirect back to the dashboard
        redirect('part_dashboard');
    }
    
    public function reset_session(){
        $userid = $this->session->userdata('user_id');
        //check if this user has set their address
        $user = $this->db->get_where('philanthropy_partners', array('id' => $userid))->row();
        $this->session->unset_userdata('user_details');
        $user_details = $this->db->get_where('philanthropy_partners', array('id' => $userid))->row();
        $this->session->set_userdata('user_details', $user_details);     
    }
    
    public function sendemail($title,$to,$subject,$message){
      $verification_code = substr(md5(uniqid(mt_rand(), true)), 0, 9); // Generate a unique verification code
      $trimmed_link = base_url('verify_email/'.$verification_code);
      
      $data['title'] =  $title;
      $data['message'] = $message;
	  
	  $mesg = $this->load->view('email_templates/index',$data,true);
	  
      $this->load->library('phpmailer_lib');
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
        $mail->addAddress($to);

        // Add cc or bcc 
       // $mail->addCC('quicksave01@gmail.com');
        //$mail->addBCC('bcc@example.com');

        // Email subject
        $mail->Subject = $subject;

        // Set email format to HTML
        $mail->isHTML(true);

        // Email body content
        $mail->Body = $mesg;

        // Send email
        if(!$mail->send()){
            $msg =  'Message could not be sent.' . $mail->ErrorInfo;
        }else{
            $msg =  1;
        }
        //return $msg;
    }
    
    // Function to get device type from user agent
    public function getDeviceType($user_agent) {
        $device_types = array(
            'iPhone' => 'iPhone',
            'iPad' => 'iPad',
            'Android' => 'Android',
            'Windows Phone' => 'Windows Phone',
            'Macintosh' => 'Mac',
            'Windows' => 'Windows',
            'Linux' => 'Linux'
        );
        foreach ($device_types as $type => $device) {
            if (strpos($user_agent, $type) !== false) {
                return $device;
            }
        }
        return 'Unknown';
    }
    
    public function getLocationFromIP($ip) {
        // Construct URL to ipinfo.io API endpoint
        $url = "https://ipinfo.io/$ip/json";

        // Fetch JSON response
        $response = file_get_contents($url);

        // Decode JSON response
        $data = json_decode($response, true);

        // Check if the request was successful
        if (!empty($data['city']) && !empty($data['region']) && !empty($data['country'])) {
            // Construct location string
            $city = $data['city'];
            $region = $data['region'];
            $country = $data['country'];
            return "$city, $region, $country";
        } else {
            return 'Unknown'; // Return 'Unknown' if location not found
        }
    }   
}

?>