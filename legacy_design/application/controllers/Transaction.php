<?php
defined('BASEPATH') OR exit('No direct script access allowed');


class Transaction extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
        $this->load->model('user_model');
        $this->load->library('pagination');
        $this->load->model('merchant_model');
        $this->load->helper('string');
        // Load necessary models, libraries, etc.
    }

    public function wallet_transfer(){
         $user_id = $this->session->userdata('user_id');
         $user = $this->generic_model->getInfo('users','id',$user_id);
         if($user->shelter_wallet == 1){
             $this->form_validation->set_rules('from', 'Source Wallet', 'required');
             $this->form_validation->set_rules('to', 'Destination Wallet', 'required');
             $this->form_validation->set_rules('amount', 'Amount', 'required');
             // Run form validation
             if ($this->form_validation->run() === FALSE) {
                // Set flash data with an error message
                $this->session->set_flashdata('error', 'make sure all the fields are filled');
                redirect('withdrawal'); 
             } else {
                 $from = $this->input->post('from');
                 $to = $this->input->post('to');
                 $amount = $this->input->post('amount');
                 //get user details
                 
                 $from_bal = $user->$from;
                 $to_bal = $user->$to;
                 if($from_bal > $amount){
                     $new_from_bal = ($from_bal - $amount);
                     $new_to_bal = ($to_bal + $amount);
                     $data = array(
                            $from => $new_from_bal,
                            $to => $new_to_bal
                        );
                    // Update user profile
                     $this->user_model->update_user_profile($user_id, $data);
                     //reset the session data
                     $user_id = $this->session->userdata('user_id');
                     $this->session->unset_userdata('user_details');
                     // Fetch user details
                     $user_details = $this->db->get_where('users', array('id' => $user_id))->row();
        
                     // Set user details in session (optional)
                     $this->session->set_userdata('user_details', $user_details); 
                     
                     //insert transfer_data
                     $transfer_data = array(
                       'user_id' => $user_id,
                       'from_wallet' => $from,
                       'to_wallet' => $to,
                       'amount' => $amount,
                       'date' => date('Y-m-d H:i:s'),
                       'status' => 1
                     );
                     $this->generic_model->insert_data('wallet_transfer', $transfer_data);
					 
					 //if this transfer is from the share holdings, we want to record that as well..................
					 if($from == 'shareholder'){
						$share_withdrawal = array(
                            'user_id' => $user_id, 	
                            'amount' => $amount,  // Assuming you have the price for each item
                            'date' => date('Y-m-d H:i:s'),
                            'status' => 'Successful'
                        );
                        $share_send1 = $this->generic_model->insert_data('share_withdrawal', $share_withdrawal); 
					 }
					 
                     $transactionTF = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'debit',
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Outgoing transfer of '.$amount.' from '.$from.' wallet to '.$to.' wallet',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionTF);
                    $transactionTF2 = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'credit',
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Incoming transfer of '.$amount.' from '.$from.' wallet to '.$to.' wallet',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send2 = $this->generic_model->insert_data('transaction_history', $transactionTF2);
                     $this->session->set_flashdata('success', 'Inter-Wallet transfer completed successfully');
                     redirect('withdrawal');  
                 }
                 else{
                    $this->session->set_flashdata('error', 'insufficient '.$from.' balance to complete this transaction');
                    redirect('withdrawal');  
                 }
             }
         }else{
             $this->session->set_flashdata('error', 'Transfer reversed, you must activate Shelter wallet to enable inter-wallet transfers');
             redirect('withdrawal');  
         }
    }
    
    public function bmt_transfer(){
         $user_id = $this->session->userdata('user_id');
         $this->form_validation->set_rules('address', 'Wallet Address', 'required');
         $this->form_validation->set_rules('amount', 'Amount', 'required');
         // Run form validation
         if ($this->form_validation->run() === FALSE) {
            // Set flash data with an error message
            $this->session->set_flashdata('error', 'make sure all the fields are filled');
            redirect('withdrawal'); 
         } else {
             $address = $this->input->post('address');
             $amount = $this->input->post('amount');
             //get user details
             $user = $this->generic_model->getInfo('users','id',$user_id);
             $from_bal = $user->token;
             if($from_bal > $amount){
                 $new_from_bal = ($from_bal - $amount);
                 $data = array(
                        'token' => $new_from_bal,
                    );
                // Update user profile
                 $this->user_model->update_user_profile($user_id, $data);
                 //reset the session data
                 $user_id = $this->session->userdata('user_id');
                 $this->session->unset_userdata('user_details');
                 // Fetch user details
                 $user_details = $this->db->get_where('users', array('id' => $user_id))->row();
    
                 // Set user details in session (optional)
                 $this->session->set_userdata('user_details', $user_details); 
                 
                 //insert transfer_data
                 $withdrawal_data = array(	
                   'user_id' => $user_id,
                   'description' => 'BPT withdrawal to external wallet',
                   'currency' => 'BPT',
                   'amount' => $amount,
                   'date' => date('Y-m-d H:i:s'),
                   'status' => 'pending approval'
                 );
                 $w_id = $this->generic_model->insert_data('withdrawal_history', $withdrawal_data);
                 
                 //insert into BPT withdrawal request
                 $bpt_request = array(
                    'user_id'=>$user_id,
                    'amount'=>$amount,
                    'address'=>$address,
                    'withdrawal_id'=>$w_id,   	
                    'status'=>0,
                    'date_requested'=>date('Y-m-d H:i:s')
                 );
                 $this->generic_model->insert_data('bpt_withdrawals', $bpt_request);
                 $this->session->set_flashdata('success', 'BPT Withdrawal submitted successfully');
                 redirect('withdrawal');  
             }
             else{
                $this->session->set_flashdata('error', 'insufficient BPT balance to complete this transaction');
                redirect('withdrawal');  
             }
         }
    }
    
    public function withdrawal(){
		//$this->session->set_flashdata('error', 'We are making some adjustments to real-time withdrawals.... please try again after 30 minuntes');
		//redirect('my_assets');
		
        $user_id = $this->session->userdata('user_id');
		
        $user = $this->generic_model->getInfo('users','id',$user_id);        
		if($user->kyc_pending == 1){
			$this->session->set_flashdata('error', 'Your KYC is pending approval, you cannot initiate withdrawal at the moment');
            redirect('my_assets');
			exit();
		}
		elseif($user->withdraw_ban == 1){
			$this->session->set_flashdata('error', 'You have been banned from making a withdrawal, contact support for further assistance');
            redirect('my_assets');
			exit();
		}else{
		
        $this->form_validation->set_rules('amount','Amount','trim|required|max_length[128]');
        $this->form_validation->set_rules('account_number','Bank Account','trim|required|max_length[128]');
        $this->form_validation->set_rules('bank','Bank Code','trim|required|max_length[128]');
            
            if($this->form_validation->run() == FALSE)
            {
                $this->session->set_flashdata('error', validation_errors());
                redirect('my_assets');
            }
            else
            {
				$amount = $this->input->post('amount');
        		$account_number = $this->input->post('account_number');
        		$bankcode = $this->input->post('bank');
				
                $vat = number_format((2*$amount)/100,2);
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
				
				if($user->shelter_wallet == 1){
					$availableFunds = ($user->wallet + $user->spendable);
				}else{
					$availableFunds =  $user->spendable;
				}
                
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
                        $w_id = $this->generic_model->insert_data('withdrawal_history', $withdrawal_data);
                        
                        $transactionWith = array(
                            'user_id' => $user_id,
                            'order_id' =>$w_id,
                            'transaction_type' => 'debit',
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'withdrawal of '.$amount.' to your bank account',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                        
                        $transactionVAT = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  // Assuming you have the price for each item
                            'description' => 'VAT charge for withdrawal of '.$amount,  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
                        
                        $transactionCharge = array(
                            'user_id' => $user_id,
                            'order_id' =>0,
                            'transaction_type' => 'debit',
                            'amount' => $charge,  // Assuming you have the price for each item
                            'description' => 'Service charge for withdrawal of '.$amount,  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send2 = $this->generic_model->insert_data('transaction_history', $transactionCharge);
                        
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
                                
                        $values = array(
                            'account_bank' => $bankcode,
                            'account_number' => $account_number,
                            'amount' => $amount,
                            'seckey' => $raveSecretKey,
                            'narration' => $sender,
                            'currency' => $currency,
                            'reference' => $reference,
							'debit_currency'=>$currency
                        );
    
                        
                        $jd_orders = $this->callFlutterwave($values);
                        
                       /* echo '<pre>';
                        print_r($jd_orders);
                        echo '</pre>';
                        exit(); 
						(
							[status] => success
							[message] => Transfer Queued Successfully
							[data] => Array
								(
									[id] => 74677378
									[account_number] => 0043957832
									[bank_code] => 232
									[full_name] => VICTORIA CHIMA KANMA
									[created_at] => 2024-05-03T12:12:26.000Z
									[currency] => NGN
									[debit_currency] => NGN
									[amount] => 100
									[fee] => 10.75
									[status] => NEW
									[reference] => BAP-rave-tf1714738345
									[meta] => 
									[narration] => BeepAgro Palliative
									[complete_message] => 
									[requires_approval] => 0
									[is_approved] => 1
									[bank_name] => STERLING BANK PLC
								)

						)*/
                                                
						$jd_ordersv = $this->getTransferById($jd_orders['data']['id'],$user_id,$w_id);
                       /* echo '<pre>';
                        print_r($response);
                        echo '</pre>';
                        exit(); 
						[status] => success
						[message] => Transfer fetched
						[data] => Array
							(
								[id] => 74679441
								[account_number] => 0043957832
								[bank_code] => 232
								[full_name] => VICTORIA CHIMA KANMA
								[created_at] => 2024-05-03T12:35:16.000Z
								[currency] => NGN
								[debit_currency] => NGN
								[amount] => 100
								[fee] => 10.75
								[status] => PENDING
								[reference] => BAP-rave-tf1714739715
								[meta] => 
								[narration] => BeepAgro Palliative
								[approver] => 
								[complete_message] => 
								[requires_approval] => 0
								[is_approved] => 1
								[bank_name] => STERLING BANK PLC
							)
					    */
                        
                        ///update user account to show withdrawal.....
                        $rave_amount = $jd_ordersv['data']['amount'];
                        $rave_fee = $jd_ordersv['data']['fee'];
                        $rave_status = $jd_ordersv['data']['status'];
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
                        
						if($user->shelter_wallet == 1){
							$newWallet_balance = ($availableFunds - $totalDebitAmt);
							$update_user_data = array(
								'wallet' => $newWallet_balance,
								'spendable'=>0
							);
						}else{
							$newWallet_balance = ($availableFunds - $totalDebitAmt);
							$update_user_data = array(
								'spendable' => $newWallet_balance,
							);
						}
                        $user_table = 'users';
                        $user_condition = array('id' => $user_id);
                        $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                        
                        $this->session->set_flashdata('success','Withdrawal processed successfully');
                        redirect('my_assets');
                        
                    //}
                }else{
                    $this->session->set_flashdata('error','Insufficient Asset Balance');
                    redirect('my_assets');
                    
                }
            }
		}
        
    }
	
	public function check_pin(){
	  $code = $this->input->post('code');
	  //check if this code is valid............
	  $user = $this->generic_model->getInfo('philanthropy_partners','pin',$code);
	  if(empty($user)){
		  echo 'We could not find any account with that PIN, Make sure you have entered it correctly';
	  }else{
		    $locations = select_all('philanthropy_franchise', $conditions = array('partner_id'=>$user->id));
		    $data = '<select class="form-control form-control-lg" id="state_id" name="state" onChange="getCities()">';
			$data .= '<option value="">Choose Your Location</option>';
			foreach ( $locations as $location ) {
			  $data .= '<option value="' . $location->id . '">' . $location->name . '('.$location->location.')</option> ';
			}
			$data .= '</select>';
			echo $data; 
	 }
	}
	
	public function callFlutterwave($values) {
    // Initialize CURL
    $curl = curl_init();
    
    // Set CURL options
    curl_setopt_array($curl, array(
      CURLOPT_URL => "https://api.flutterwave.com/v3/transfers",
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "POST",
      CURLOPT_POSTFIELDS => json_encode($values), // Send values as JSON data
      CURLOPT_HTTPHEADER => array(
        "Content-Type: application/json",
        "Authorization: Bearer ".$this->generic_model->getInfo('tbl_addons_api','source', 'FLWT')->secret_key
      ),
    ));

    // Execute CURL request
    $response = curl_exec($curl);
    
    // Close CURL
    curl_close($curl);
    
    // Decode JSON response
    $resp = json_decode($response, true);

    // Return response
    return $resp;
}
	
	public function getTransferById($transferId,$userid,$w_id) {
    // Initialize CURL
    $curl = curl_init();
    // Set the URL with the transfer ID
    $url = "https://api.flutterwave.com/v3/transfers/" . $transferId;
    // Set CURL options
    curl_setopt_array($curl, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
      CURLOPT_HTTPHEADER => array(
        "Content-Type: application/json",
        "Authorization: Bearer ".$this->generic_model->getInfo('tbl_addons_api','source', 'FLWT')->secret_key
      ),
    ));
    // Execute CURL request
    $response = curl_exec($curl);
    // Close CURL
    curl_close($curl);
    // Decode JSON response
    $resp = json_decode($response, true);
	$payload = array(
            'id' => $resp['data']['id'],
			'transfer_id' => $transferId,
			'user_id' => $userid,
			'withdrawal_id' => $w_id,
            'account_number' => $resp['data']['account_number'],
            'bank_code' =>$resp['data']['bank_code'],
            'full_name' => $resp['data']['full_name'],
            'created_at' => $resp['data']['created_at'],
            'currency' => $resp['data']['currency'],
            'debit_currency' => $resp['data']['debit_currency'],
            'amount' => $resp['data']['amount'],
            'fee' => $resp['data']['fee'],
            'status' => $resp['data']['status'],
            'reference' => $resp['data']['reference'],
            'meta' => $resp['data']['meta'],
            'narration' => $resp['data']['narration'],
            'complete_message' => $resp['data']['complete_message'],
            'requires_approval' => $resp['data']['requires_approval'],
            'is_approved' => $resp['data']['is_approved'],
            'bank_name' => $resp['data']['bank_name']
        );
	$this->generic_model->insert_data('transfers_payload',$payload);
    // Return response
    return $resp;
}
    
    public function crypto_transfer(){
         $user_id = $this->session->userdata('user_id');
         $user = $this->generic_model->getInfo('users','id',$user_id);        
		if($user->kyc_pending == 1){
			$this->session->set_flashdata('error', 'Your KYC is pending approval, you cannot initiate withdrawal at the moment');
            redirect('my_assets');
			exit();
		}
		elseif($user->withdraw_ban == 1){
			$this->session->set_flashdata('error', 'You have been banned from making a withdrawal, contact support for further assistance');
            redirect('my_assets');
			exit();
		}else{
         $this->form_validation->set_rules('address', 'Wallet Address', 'required');
         $this->form_validation->set_rules('crypto', 'Crypto Asset', 'required');
         $this->form_validation->set_rules('amount', 'Amount', 'required');
         // Run form validation
         if ($this->form_validation->run() === FALSE) {
            // Set flash data with an error message
            $this->session->set_flashdata('error', 'make sure all the fields are filled');
            redirect('my_assets'); 
         } else {
             //check if the same request is being made again so there are no multiple requests  	 	
             $address = $this->input->post('address');
             $amount = $this->input->post('amount');
             $asset_type = $this->input->post('crypto');
             
             
             //check if the user has enough to cover the cost.............................
             $total_wallet = $this->generic_model->convert_currency($user->default_currency,$user->wallet);
             $total_spendable = $this->generic_model->convert_currency($user->default_currency,$user->spendable);
             
             if($user->shelter_wallet == 1){
                $availableFunds = ($total_wallet + $total_spendable);
             }
             else{
                $availableFunds = $total_spendable;  
             }
             
             $total_withdrawal = ($amount + 2);
             
             if(bccomp($availableFunds, $total_withdrawal, 2) == 1){
                 
                 $amount_reversed = $this->generic_model->reset_currency($amount);
             
             $condition = array('user_id'=>$user_id,'amount'=>$amount,'crypto_asset'=>$asset_type);
             $checkRequest = $this->generic_model->get_by_condition('crypto_withdrawal', $condition);
             if(empty($checkRequest)){
                 $data = array(
                    'user_id'=> $user_id,
                     'crypto_asset'=> $asset_type,
                     'amount'=> $amount,
                     'wallet_address'=> $address,
                     'requested_date'=> date('Y-m-d H:i:s'),
                     'status'=> 0
                 );
                 
                 $this->generic_model->insert_data('crypto_withdrawal',$data);
                 
                  $withdrawal_data = array(	
                           'user_id' => $user_id,
                           'description' => 'Withdraw to Crypto wallet ('.$asset_type.')',
                           'currency' => 'USD',
                           'amount' => $amount,
                           'date' => date('Y-m-d H:i:s'),
                           'status' => 'processing'
                         );
                        $w_id = $this->generic_model->insert_data('withdrawal_history', $withdrawal_data);
                        
                        $transactionWith = array(
                            'user_id' => $user_id,
                            'order_id' =>$w_id,
                            'transaction_type' => 'debit',
                            'amount' => $amount_reversed,  // Assuming you have the price for each item
                            'description' => 'withdrawal of '.$amount_reversed.' USD to crypto wallet',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                        
                        $transactionVAT = array(
                            'user_id' => $user_id,
                            'order_id' =>$w_id,
                            'transaction_type' => 'debit',
                            'amount' => 1300,  // Assuming you have the price for each item
                            'description' => 'VAT charge for withdrawal of '.$amount_reversed.' USD',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
                        
                        $transactionCharge = array(
                            'user_id' => $user_id,
                            'order_id' =>$w_id,
                            'transaction_type' => 'debit',
                            'amount' => 1300,  // Assuming you have the price for each item
                            'description' => 'Service charge for withdrawal of '.$amount_reversed.' USD',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send2 = $this->generic_model->insert_data('transaction_history', $transactionCharge);
                 
                 if($user->shelter_wallet == 1){
							$newWallet_balance = ($availableFunds - $total_withdrawal);
                            $newWallet_balance_reversed = $this->generic_model->reset_currency($newWallet_balance);
							$update_user_data = array(
								'wallet' => $newWallet_balance_reversed,
								'spendable'=>0
							);
						}
                  else{
							$newWallet_balance = ($availableFunds - $total_withdrawal);
                            $newWallet_balance_reversed = $this->generic_model->reset_currency($newWallet_balance);
							$update_user_data = array(
								'spendable' => $newWallet_balance_reversed,
							);
						}
                 
                        $user_table = 'users';
                        $user_condition = array('id' => $user_id);
                        $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                 
                 //echo $newWallet_balance_reversed;
                 //exit();
                 
                 
                 
                 //notify the admin and the initiator 
             $recipient = $this->generic_model->getInfo('users','id',$user_id);
            //send email to student....
             $to_user = $recipient->email;
		     $title_user = 'Hello ' . $recipient->firstname;
             $subject_user = 'Request Received';
		     $message_user = nl2br(htmlspecialchars('This is to notify you that your withdrawal request was received successfully and is being processed. You will receive a notification as soon as it is approved.
             
             If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].
			                Our support team is here to help you with any concerns you may have.
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). 
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.
                            
			                Best regards,
			                BeepAgro Palliative Initiative (BPI) Team.')); 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );  
             
             $to_user_admin = 'quicksave01@gmail.com';
             $subject_user_admin = 'New Withdrawal Request (crypto)';
		     $title_user_admin = 'Hello Admin';
		     $message_user_admin = nl2br(htmlspecialchars('A new crypto withdrawal request is awaiting your review.
             
             If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].
			                Our support team is here to help you with any concerns you may have.
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). 
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.
                            
			                Best regards,
			                BeepAgro Palliative Initiative (BPI) Team.')); 
		     $this->sendemail( $title_user_admin, $to_user_admin, $subject_user_admin, $message_user_admin );  
             
             $this->session->set_flashdata( 'success', 'Withdrawal Request Sent Successfully' );
             redirect( 'my_assets' );
             }
             else{
                  $this->session->set_flashdata('error','You have a pending withdrawal request, Change the amount and try again');
                 redirect('my_assets');
                 exit();
             }
             
             }
             else{
                 $this->session->set_flashdata('error','Insufficient Asset Balance');
                 redirect('my_assets');
             }
         }
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
}


