<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class User extends CI_Controller {

  public function __construct() {
    parent::__construct();
    $this->load->helper( 'url' );
    $this->load->library( 'form_validation' );
    $this->load->library( 'session' );
    $this->load->database();
    $this->load->model( 'food_model' );
    $this->load->model( 'generic_model' );
    $this->load->model( 'user_model' );
    $this->load->library( 'pagination' );
    $this->load->model( 'merchant_model' );
    // Load necessary models, libraries, etc.
  }

  public function mark_as_read( $id ) {
    $userid = $this->session->userdata( 'user_id' );
    $this->generic_model->mark_as_read( $id, $userid );
    redirect( 'dashboard' ); // redirect to the appropriate page
  }

  public function testemail() {
    $verification_code = substr( md5( uniqid( mt_rand(), true ) ), 0, 9 ); // Generate a unique verification code
    $trimmed_link = base_url( 'verify_email/' . $verification_code );

    $data[ 'title' ] = 'Dear  Tester';
    $data[ 'message' ] = '<p>Thank you for registering with BeepAgro Palliative Initiative (BPI).<br> To complete your registration and gain access to our platform\'s features and services,<br> we need to verify your email address..</p>
           <p>Please follow the steps below to verify your email:<br>Click on the button below to verify your email address:</p>
           <p>
           <a href="' . $trimmed_link . '" target="_blank">
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

    $mesg = $this->load->view( 'email_templates/index', $data, true );

    $this->load->library( 'phpmailer_lib' );
    // PHPMailer object
    $mail = $this->phpmailer_lib->load();
    // SMTP configuration
    $mail->isSMTP();
    $mail->Host = 'mail.beepagro.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'notifications@beepagro.com';
    $mail->Password = 'PMGM38FrK@]V';
    $mail->SMTPSecure = 'ssl';
    $mail->Port = 465;

    $mail->setFrom( 'notifications@beepagro.com', 'BeepAgro Palliative Initiative' );
    $mail->addReplyTo( 'notifications@beepagro.com', 'BeepAgro Palliative Initiative' );

    // Add a recipient
    $mail->addAddress( 'richardobroh@gmail.com' );

    // Add cc or bcc 
    $mail->addCC( 'quicksave01@gmail.com' );
    //$mail->addBCC('bcc@example.com');

    // Email subject
    $mail->Subject = 'Email Function Test';

    // Set email format to HTML
    $mail->isHTML( true );

    // Email body content
    $mail->Body = $mesg;

    // Send email
    if ( !$mail->send() ) {
      echo 'Message could not be sent.';
      echo 'Mailer Error: ' . $mail->ErrorInfo;
    } else {
      echo 'Message has been sent';
    }
  }
  
  public function inter_transfer(){
      $userid = $this->session->userdata('user_id');
      $ssn = $this->input->post('ssn');
      $amount = $this->input->post('amount');
      $recipient = $this->generic_model->get_user_by_ssn($ssn);
      $user = $this->generic_model->getInfo('users','id',$userid);
      if($recipient->id == $userid){
          $this->session->set_flashdata('error', 'you cannot send cashback to yourself, any further attempt to abuse this service will result in a ban on your account');
          redirect('my_assets');
      }else{
      $availableFunds = $user->cashback;
      $vat = (7.5*$amount)/100;
      $debit = $amount;
      $charge = 100;
      $totalDebitAmt = ($debit + $vat + $charge);
      if(bccomp($availableFunds, $totalDebitAmt, 2) == 1){
             $newCashback_balance = ($availableFunds - $totalDebitAmt);
             $update_user_data = array(
				'cashback' => $newCashback_balance,
    			);
            $user_table = 'users';
            $user_condition = array('id' => $userid);
            $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
            
            $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>111,
                            'transaction_type' => 'debit',
                            'amount' => $debit,  
                            'description' => 'Inter-Wallet Transfer',  
                            'status' => 'Successful'
                        );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
          
            $transactioncharge = array(
                            'user_id' => $userid,
                            'order_id' =>111,
                            'transaction_type' => 'debit',
                            'amount' => $charge,  
                            'description' => 'Inter-Wallet Transfer Charge',  
                            'status' => 'Successful'
                        );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactioncharge);
          
            $transactionVAT = array(
                            'user_id' => $userid,
                            'order_id' =>111,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  
                            'description' => 'VAT charge for Inter-Wallet Transfer',  
                            'status' => 'Successful'
                        );
            $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
            
            //save in record tracking table for repair function 
             $transfer_data = array(
                'from_user' => $userid,
                'to_user' =>$recipient->id,
                'amount'=>$amount,
             );
             $this->generic_model->insert_data('inter_wallet', $transfer_data);
            
            //credit recipient...........................
            $rec_availableFunds = $recipient->cashback;
            $newRecCashback_balance = ($rec_availableFunds + $debit);
            $update_rec_data = array(
				'cashback' => $newRecCashback_balance,
    			);
            $user_table_rec = 'users';
            $user_condition_rec = array('id' => $recipient->id);
            $this->generic_model->update_data($user_table_rec, $update_rec_data, $user_condition_rec);
            $transaction_rec = array(
                            'user_id' => $recipient->id,
                            'order_id' =>111,
                            'transaction_type' => 'credit',
                            'amount' => $debit, 
                            'description' => 'Inter-Wallet Transfer',  
                            'status' => 'Successful'
                        );
            $this->generic_model->insert_data('transaction_history', $transaction_rec);
            
            //send email............
            $to_user = $recipient->email;
            $subject_user = 'Credit Alert! BPI Inter-Wallet Transfer';
		    $title_user = 'Hello ' . $recipient->firstname;
		    $message_user = 'You just recieved a cashback inter-wallet transfer on BPI from '.$user->firstname.' '.$user->lastname.'<br><br>
			                <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
			                Our support team is here to help you with any concerns you may have.<br>
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
			                Best regards,<br>
			                BeepAgro Palliative Initiative (BPI) Team.</p>'; 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
            
            $this->reset_session();
            $this->session->set_flashdata('success', 'Transfer Successful');
            redirect('my_assets');
        }
        else{
            $this->session->set_flashdata('error', 'insufficient asset balance');
            redirect('my_assets');
        }
      }
  }
  
  public function epc_transfer(){
      $userid = $this->session->userdata('user_id');
      $amount = $this->input->post('amount');
      $to_location = $this->input->post('to_account');
      $user = $this->generic_model->getInfo('users','id',$userid);
        
          //withdraw to cash balance;
          $availableFunds = $user->mdc;
          $rate = $this->generic_model->getInfo('currency_management','id',1)->rate;
          $nairaBalance = ($availableFunds / $rate);
          $naira_equiv = ($amount / $rate);
          
          //check kyc first
          if($user->kyc_pending == 1){
			$this->session->set_flashdata('error', 'Your KYC is pending approval, you cannot initiate withdrawal at the moment');
            redirect('extension');
			exit();
    		}
    		elseif($user->withdraw_ban == 1){
    			$this->session->set_flashdata('error', 'You have an existing ban on withdrawals, contact support for further assistance');
                redirect('extension');
    			exit();
    		}elseif($naira_equiv < 1000){
    		    $this->session->set_flashdata('error', 'Minimal Withdrawal is $'.number_format((1000 * $rate),2));
                redirect('extension');
    			exit();
    		}else{
               if(bccomp($nairaBalance, $naira_equiv, 2) == 1){
                   $newMdc_balance = ($availableFunds - $amount);
                   $update_user_data = array(
    				'mdc' => $newMdc_balance,
        			);
                    $user_table = 'users';
                    $user_condition = array('id' => $userid);
                    $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                    
                    if($to_location == 'cash'){
                        $oldWallet = $user->wallet;
                        $newWallet = ($oldWallet + $naira_equiv);
                        
                        $update_user_data_wal = array(
        				    'wallet' => $newWallet,
            			);
                        $user_condition_wal = array('id' => $userid);
                        $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data_wal, $user_condition_wal);
                        
                        $transactionWith_wal = array(
                            'user_id' => $userid,
                            'order_id' =>114,
                            'transaction_type' => 'credit',
                            'amount' => $naira_equiv,  
                            'description' => 'EPC - Withdrawal',  
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith_wal);
                    }
                    else{
                          //transfer to bank...
                      $bank_records = $this->user_model->get_bank_records( $userid );
                      if(!empty($bank_records)){
            		    $account_number = $bank_records->account_number;
            		    $bankcode = $bank_records->bank_name;
            		    
            		    $vat = number_format((7.5*$naira_equiv)/100,2);
            		    
                        if($naira_equiv <= 5000){
                            $charge = 20;
                        }elseif($naira_equiv > 5000 AND $naira_equiv < 50000){
                            $charge = 37;
                        }else{
                            $charge = 72;
                        }
                        
                        $subCharge = ($charge + $vat);
                        $totalDebitAmt = ($naira_equiv - $subCharge);
                        
                        //insert transfer_data
                            $withdrawal_data = array(	
                               'user_id' => $userid,
                               'description' => 'Withdraw to Bank Account (EPC Wallet)',
                               'currency' => 'USD',
                               'amount' => $amount,
                               'date' => date('Y-m-d H:i:s'),
                               'status' => 'processing'
                             );
                            $w_id = $this->generic_model->insert_data('withdrawal_history', $withdrawal_data);
                            
                            $transactionWith = array(
                                'user_id' => $userid,
                                'order_id' =>$w_id,
                                'transaction_type' => 'credit',
                                'amount' => $naira_equiv,  
                                'description' => 'withdrawal of '.$naira_equiv.'converted from USD'.$amount.' to your bank account', 
                                'status' => 'Successful'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                            
                            $transactionVAT = array(
                                'user_id' => $userid,
                                'order_id' =>0,
                                'transaction_type' => 'debit',
                                'amount' => $vat,  
                                'description' => 'VAT charge for withdrawal of '.$naira_equiv, 
                                'status' => 'Successful'
                            );
                            $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
                            
                            $transactionCharge = array(
                                'user_id' => $userid,
                                'order_id' =>0,
                                'transaction_type' => 'debit',
                                'amount' => $charge,  
                                'description' => 'Service charge for withdrawal of '.$naira_equiv, 
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
    
                            $values = array(
                                'account_bank' => $bankcode,
                                'account_number' => $account_number,
                                'amount' => $naira_equiv,
                                'seckey' => $raveSecretKey,
                                'narration' => $sender,
                                'currency' => $currency,
                                'reference' => $reference,
    							'debit_currency'=>$currency
                            );
        
                            $jd_orders = $this->callFlutterwave($values);
                            
                            $jd_ordersv = $this->getTransferById($jd_orders['data']['id'],$user_id,$w_id);
                            
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
                            
                      }
                      else{
                          $this->session->set_flashdata('error','There are no bank withdrawal records on your profile, please add a bank account to your profile to use this feature');
                          redirect('extension');
                      }
                              
                    }
                    
                     $transWith = array(
                        'user_id' => $userid, 	 	 	
                        'amount' => $amount,   
                        'withdraw_date' => date('Y-m-d H:i:s')
                       );
                      $trans_send = $this->generic_model->insert_data('epc_withdrawals', $transWith);
                                
                    //send email............
                    $to_user = $user->email;
                    $subject_user = 'Transaction Alert! BPI EPC Withdrawal';
        		    $title_user = 'Hello ' . $user->firstname;
        		    $message_user = 'This is just to inform you that an EPC Withdrawal of $'.$amount.' occured in your account, if you do not recognize this activity, contact support now!!<br><br>
        			                <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
        			                Our support team is here to help you with any concerns you may have.<br>
        			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
        			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
        			                Best regards,<br>
        			                BeepAgro Palliative Initiative (BPI) Team.</p>'; 
        		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
        		     
        		    $this->reset_session(); 
                    $this->session->set_flashdata('success','Withdrawal processed successfully');
                    redirect('extension');
    
               }
               else{
                   $this->session->set_flashdata('error','unable to process this order, What went wrong? Reduce the amount you are trying to withdraw and try again!');
                   redirect('extension');
           }
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
    
  public function generate_card(){
      $this->load->library( 'form_validation' );
      $this->form_validation->set_rules( 'wallet', 'Payment Source', 'required' );
      if ( $this->form_validation->run() == FALSE ) {
          $this->session->set_flashdata( 'card_error', validation_errors() );
          redirect( 'profile' );
      } else {
          $payment_source = $this->input->post('wallet', TRUE);
          $userid = $this->session->userdata('user_id');
          $user = $this->generic_model->getInfo('users','id',$userid);
          
          $amount = 5000;
          $availableFunds = $user->$payment_source;
          $vat = (7.5*$amount)/100;
          $totalDebitAmt = ($amount + $vat);
          
          if(bccomp($availableFunds, $totalDebitAmt, 2) == 1){
              $new_balance = ($availableFunds - $totalDebitAmt);
              $update_user_data = array(
				$payment_source => $new_balance,
    			);
              $user_table = 'users';
              $user_condition = array('id' => $userid);
              $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
              
               $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>112,
                            'transaction_type' => 'debit',
                            'amount' => $amount,  
                            'description' => 'Card Generation Fee',  
                            'status' => 'Successful'
                        );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
          
            $transactionVAT = array(
                            'user_id' => $userid,
                            'order_id' =>112,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  
                            'description' => 'VAT charge for Card Generation',  
                            'status' => 'Successful'
                        );
            $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
              
              //create card  	
              $data_card = array(
                'user_id'=>$userid,
                'card_name'=>$user->ssc,
                'card_number'=>$user->ssc,
                'card_amount'=>0,
                'card_status'=>'active',
                'picture_id'=>1
              );
              $this->generic_model->insert_data('cards',$data_card);
              
              
            //send email............
            $to_user = $user->email;
            $subject_user = 'Debit Alert! BPI SMART CARD';
		    $title_user = 'Hello ' . $user->firstname;
		    $message_user = 'This is to inform you that a debit transaction occured on your account towards the generation of a BPI SMART CARD<br><br>
			                <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
			                Our support team is here to help you with any concerns you may have.<br>
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
			                Best regards,<br>
			                BeepAgro Palliative Initiative (BPI) Team.</p>'; 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
            
            $this->reset_session();
            $this->session->set_flashdata('card_success', 'Congratulations on your new BPI Smart Card');
            redirect('profile');

              
          }else{
            $this->session->set_flashdata( 'card_error', 'Insufficient Balance in the chosen wallet, Please Top-up your account balance' );
            redirect( 'profile' );
          }
      }
  }
	
  public function update_business(){
	$this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'biz_name', 'Business Name', 'required' );
    $this->form_validation->set_rules( 'rc_number', 'Registration Number', 'required' );
    $this->form_validation->set_rules( 'tax_id', 'Tax Id', 'required' );  
	if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'biz_error', validation_errors() );
      redirect( 'profile' );
    } else {
	  $biz_name = $this->input->post('biz_name', TRUE);
      $rc_number = $this->input->post('rc_number', TRUE);
      $tax_id = $this->input->post('tax_id', TRUE);
	  $config[ 'upload_path' ] = './biz/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $userInfo = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
		//upload certificate.....
		$this->upload->do_upload('biz_certificate');
        $upload_data1 = $this->upload->data();
        $file_path1 = 'biz/' . $upload_data1['file_name'];
		
		$this->upload->do_upload('biz_doc');
        $upload_data2 = $this->upload->data();
        $file_path2 = 'biz/' . $upload_data2['file_name'];
		
		 $data = array( 						
            'user_id'=>$userId,
            'biz_name'=>$biz_name,
            'rc_number'=>$rc_number,
            'biz_certificate'=>$file_path1,
            'tax_id'=>$tax_id,
            'biz_doc'=>$file_path2,
            'date_submitted'=>date('Y-m-d H:i:s'),
            'status'=>0
          );
          $this->generic_model->insert_data('business_info',$data);
	  $this->session->set_flashdata( 'biz_success', 'Business Info uploaded successfully, validation is in progress');
      redirect( 'profile' );
	}
  }
	
  public function submit_claim(){
	  $config[ 'upload_path' ] = './claims/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $userInfo = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
		//upload certificate.....
		$this->upload->do_upload('cert');
        $upload_data1 = $this->upload->data();
        $file_path1 = 'claims/' . $upload_data1['file_name'];
	  $benefactor = $this->input->post('benefactor', TRUE);
		$data = array( 											
            'submitted_by'=>$userId,
			'benefactor'=>$benefactor,
            'cert'=>$file_path1,
            'date_submitted'=>date('Y-m-d H:i:s'),
            'status'=>0
          );
          $this->generic_model->insert_data('kin_claims',$data);
	  	  $this->session->set_flashdata( 'success', 'Claim request submitted successfully, validation is in progress');
          redirect( 'profile' );
  }
	
  public function update_beneficiary(){
	$this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'ssc', 'Business Name', 'required' );
    $this->form_validation->set_rules( 'relationship', 'Registration Number', 'required' );
    $this->form_validation->set_rules( 'percent', 'Tax Id', 'required' );  
	if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'ben_error', validation_errors() );
      redirect( 'profile' );
    } else {
	  $ssc = $this->input->post('ssc', TRUE);
      $relationship = $this->input->post('relationship', TRUE);
      $percent = $this->input->post('percent', TRUE);
	  $userId = $this->session->userdata( 'user_id' );
	  $userInfo = $this->generic_model->getInfo('users','id',$userId);
		
	  if($userInfo->ssc == $ssc){
		  $this->session->set_flashdata( 'ben_error', 'You cannot add yourself as a beneficiary' );
      	  redirect( 'profile' );
	  }else{
		  //check total percentile share....
		  $total_shared = $this->generic_model->getSum('beneficiary_info','percent',array('user_id'=>$userId));
		  $total_left = (100 - $total_shared);
		  if($percent > $total_left){
			  $this->session->set_flashdata( 'ben_error', 'Your set percentage is greater than your available percentage, your available percent is '.$total_left.'%' );
      	  	  redirect( 'profile' ); 
		  }else{
			  $data = array( 						
					'user_id'=>$userId,
					'ssc'=>$ssc,
					'percent'=>$percent,
					'relationship'=>$relationship,
					'date_submitted'=>date('Y-m-d H:i:s'),
					'status'=>1
				  );
				  $this->generic_model->insert_data('beneficiary_info',$data);
			  	$this->session->set_flashdata( 'ben_success', 'Beneficiary Info updated successfully');
			  	redirect( 'profile' );
		  }
	  }		 
	}
  }
    
  public function course_application(){
    $this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'firstname', 'First Name', 'required' );
    $this->form_validation->set_rules( 'lastname', 'Last Name', 'required' );
    $this->form_validation->set_rules( 'email', 'Email', 'required' );  
    $this->form_validation->set_rules( 'phone', 'Phone', 'required' );  
    $this->form_validation->set_rules( 'gender', 'Gender', 'required' ); 
    $this->form_validation->set_rules( 'program', 'Program', 'required' ); 
    $this->form_validation->set_rules( 'course', 'Course', 'required' ); 
    if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'errors', validation_errors() );
      redirect( 'bsc_apply' );
    } else {
      $firstname = $this->input->post('firstname', TRUE);
      $lastname = $this->input->post('lastname', TRUE);
      $email = $this->input->post('email', TRUE);
      $phone = $this->input->post('phone', TRUE);
      $gender = $this->input->post('gender', TRUE);
      $program = $this->input->post('program', TRUE);
      $course = $this->input->post('course', TRUE);
      //handle upload
      $config[ 'upload_path' ] = './receipts/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $recipient = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
      if($program == 'bsc'){
          $this->upload->do_upload('file1');
          $upload_data1 = $this->upload->data();
          $file_path1 = 'receipts/' . $upload_data1['file_name'];
          //store information
          $data = array(
            'user_id'=>$userId,
            'firstname'=>$firstname,
            'lastname'=>$lastname,
            'email'=>$email,
            'phone'=>$phone,
            'gender'=>$gender,
            'program'=>$program,
            'course'=>$course,
            'file_1'=>$file_path1,
            'date_submitted'=>date('Y-m-d H:i:s'),
            'status'=>0
          );
          $this->generic_model->insert_data('bsc_application',$data);
          $this->session->set_flashdata( 'success', 'Application submitted successfully' );
          redirect( 'bsc_apply' );          
      }else{
          $this->upload->do_upload('file1');
          $upload_data1 = $this->upload->data();
          $file_path1 = 'receipts/' . $upload_data1['file_name'];
          $this->upload->do_upload('file1');
          $upload_data2 = $this->upload->data();
          $file_path2 = 'receipts/' . $upload_data2['file_name'];
          $this->upload->do_upload('file1');
          $upload_data3 = $this->upload->data();
          $file_path3 = 'receipts/' . $upload_data3['file_name'];
          $data = array(
            'user_id'=>$userId,
            'firstname'=>$firstname,
            'lastname'=>$lastname,
            'email'=>$email,
            'phone'=>$phone,
            'gender'=>$gender,
            'program'=>$program,
            'course'=>$course,
            'file_1'=>$file_path1,
            'file_2'=>$file_path2,
            'file_3'=>$file_path3,
            'date_submitted'=>date('Y-m-d H:i:s'),
            'status'=>0
          );
          $this->generic_model->insert_data('bsc_application',$data);
          $this->session->set_flashdata( 'success', 'Application submitted successfully' );
          redirect( 'bsc_apply' );
      }
    }
  }
  
  public function check_ssn() {
        $ssn = $this->input->post('ssn');
        $user = $this->generic_model->get_user_by_ssn($ssn);
        if ($user) {
            // User found, return success response
            $response = [
                'success' => true,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
            ];
        } else {
            $response = ['success' => false];
        }
        echo json_encode($response);
    }
    
  public function ict_application(){
    $this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'firstname', 'First Name', 'required' );
    $this->form_validation->set_rules( 'lastname', 'Last Name', 'required' );
    $this->form_validation->set_rules( 'email', 'Email', 'required' );  
    $this->form_validation->set_rules( 'phone', 'Phone', 'required' );  
    $this->form_validation->set_rules( 'gender', 'Gender', 'required' ); 
    $this->form_validation->set_rules( 'program1', 'Program', 'required' ); 
    $this->form_validation->set_rules( 'program2', 'Course', 'required' ); 
    if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'errors', validation_errors() );
      redirect( 'ict_form' );
    } else {
      $firstname = $this->input->post('firstname', TRUE);
      $lastname = $this->input->post('lastname', TRUE);
      $email = $this->input->post('email', TRUE);
      $phone = $this->input->post('phone', TRUE);
      $gender = $this->input->post('gender', TRUE);
      $program1 = $this->input->post('program1', TRUE);
      $program2 = $this->input->post('program2', TRUE);
      //handle upload
      $config[ 'upload_path' ] = './receipts/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $recipient = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
      
          $this->upload->do_upload('file1');
          $upload_data1 = $this->upload->data();
          $file_path1 = 'receipts/' . $upload_data1['file_name'];
          //store information
          $data = array(
            'parent_id'=>$userId,
            'firstname'=>$firstname,
            'lastname'=>$lastname,
            'email'=>$email,
            'phone'=>$phone,
            'gender'=>$gender,
            'program1'=>$program1,
            'program2'=>$program2,
            'file_1'=>$file_path1,
            'date_submitted'=>date('Y-m-d H:i:s'),
            'status'=>0
          );
          $this->generic_model->insert_data('ict_application',$data);
        //delete 
          $this->db->where( 'user_id', $userId );
          $this->db->delete( 'ict_tickets' );
        
          $this->session->set_flashdata( 'success', 'Application submitted successfully' );
          redirect( 'dashboard' );          
      
    }
  }
    
  public function pal_eligibility(){
    $this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'school', 'School', 'required' );
    $this->form_validation->set_rules( 'matric', 'Matric Number', 'required' );
    $this->form_validation->set_rules( 'dept', 'Department', 'required' );
    if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'errors', validation_errors() );
      redirect( 'palliative' );
    } else {
      $school = $this->input->post( 'school', TRUE );
      $matric_number = $this->input->post( 'matric', TRUE );
      $department = $this->input->post( 'dept', TRUE );
      $config[ 'upload_path' ] = './receipts/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $recipient = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
      $amount = $this->input->post( 'amount' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = $amount * $percentage;
      if (!$this->upload->do_upload('payment')) {
          // Handle upload error
          $error = $this->upload->display_errors();
          $this->session->set_flashdata('errors',$error);
          redirect('palliative');
        } else {
      // Upload successful, get file info
      $upload_data1 = $this->upload->data();
      $this->upload->do_upload('card');
      $upload_data2 = $this->upload->data();
      
          
          
      $file_path1 = 'receipts/' . $upload_data1['file_name'];
      $file_path2 = 'receipts/' . $upload_data2['file_name'];
      $type = 'Bank';
      $this->generic_model->studentReceiptPath( $file_path1, $file_path2, $userId, $type, $amount );
      
      $update_user_data = array(
        'pending_activation' => 1,
      );
      $user_condition = array('id' => $userId);
      $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
      $this->reset_session();
      $transactionStudent = array(
                                'user_id' => $userId,
                                'order_id' =>634,
                                'transaction_type' => 'subscription',
                                'amount' => $amount,  
                                'description' => 'Student Palliative',  
                                'status' => 'Successful'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionStudent);      
      $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'Student Palliative',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
          
    $student_data = array(
        'school_id' =>	$school,
        'user_id'=> $userId,
        'matric_number' => $matric_number,	
        'department' =>	$department,
        'id_card' 	=> $file_path2
    );
    $this->generic_model->insert_data('student_data',$student_data);
          
    //send email to student....
    $to_user = $recipient->email;
		     $title_user = 'Hello ' . $recipient->firstname;
		     $message_user = nl2br(htmlspecialchars('Your Student Palliative Registration was recieved successfully, we are currently validating this request, you will get a notification via email once it is approved. 
             
             If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
			                Our support team is here to help you with any concerns you may have.<br>
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
			                Best regards,<br>
			                BeepAgro Palliative Initiative (BPI) Team.')); 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );      
          
            $this->generic_model->insert_data('vat_data',$vat_data);
                $_SESSION['item'] = 'Student Palliative Registration';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            // Handle success (redirect, display message, etc.)
            redirect('payment_success_page');
      }
        
    }
    
  }

  function bank_verify() {
    $this->load->library( 'form_validation' );
    $this->form_validation->set_rules( 'account_number', 'Account NUmber', 'trim|required|min_length[10]' );
    $this->form_validation->set_rules( 'bank', 'Bank Code', 'trim|required|min_length[3]' );
    if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'errors', validation_errors() );
      redirect( 'settings' );
    } else {
      $acn = $this->input->post( 'account_number', TRUE );
      $bkc = $this->input->post( 'bank', TRUE );
      $curl = curl_init();
      curl_setopt_array( $curl, array(
        CURLOPT_URL => "https://api.paystack.co/bank/resolve?account_number=" . $acn . "&bank_code=" . $bkc . "",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_HTTPHEADER => array(
          "Authorization: Bearer sk_live_e544b3ba06ac88ed3e828713de8e0b1ef5dbe919",
          "Cache-Control: no-cache",
        ),
      ) );
      $response = curl_exec( $curl );
      $err = curl_error( $curl );
      curl_close( $curl );
      if ( $err ) {
        //echo "cURL Error #:" . $err;
      } else {
        $jd_orders = json_decode( $response, true );
        if ( $jd_orders[ "status" ] == 'success' ) {
          $acctname = $jd_orders[ "data" ][ "account_name" ];
          echo $acctname;
        } else {
          $this->session->set_flashdata( 'error', $jd_orders[ "message" ] . ' ' . $jd_orders[ "status" ] . ', ' . $acn . ' ' . $bkc );
          redirect( 'settings' );
        }
      }
    }
  }

  public function upload_profile_picture() {
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
      redirect( 'settings' );
    } else {
      // Upload successful, update user's profile picture in the database
      $upload_data = $this->upload->data();
      $file_name = $upload_data[ 'file_name' ];

      // Update the user's profile picture in the database (adjust the database update logic as needed)

      $this->user_model->update_profile_picture( $this->session->userdata( 'user_id' ), $file_name );

      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Profile Picture Uploaded Successfully!' );
      redirect( 'settings' );
    }
  }

  public function upload_store_picture() {
    // File upload configuration
    $config[ 'upload_path' ] = './uploads/merchant_pictures/';
    $config[ 'allowed_types' ] = 'gif|jpg|png|jpeg';
    $config[ 'max_size' ] = 4096; // 4MB
    $config[ 'encrypt_name' ] = TRUE;

    $this->load->library( 'upload', $config );

    if ( !$this->upload->do_upload( 'userfile' ) ) {
      // Handle upload error
      $error = 'could not process your request, please choose a valid file';
      $this->session->set_flashdata( 'error', $error );
      redirect( 'apply_pickup' );
    } else {
      // Upload successful, update user's profile picture in the database
      $upload_data = $this->upload->data();
      $file_name = $upload_data[ 'file_name' ];

      // Update the user's profile picture in the database (adjust the database update logic as needed)

      $this->user_model->update_merchant_picture( $this->session->userdata( 'user_id' ), $file_name );

      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Pickup Center Logo Uploaded Successfully!' );
      redirect( 'apply_pickup' );
    }
  }

  public function notif_index() {
    if ( $this->session->userdata( 'user_id' ) ) {
      // Display notifications for the current user
      $userid = $this->session->userdata( 'user_id' );
      $userDetails = $this->generic_model->getInfo( 'users', 'id', $userid );
      // Get all notifications for the current user
      $data[ 'notifications' ] = $this->generic_model->select_all_data('notifications');
      $data['page_notifications'] = $this->generic_model->select_all('notifications',array('type'=>'bulletin'));
      // Get the count of unread notifications
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'announcements' ] = $this->generic_model->select_all_data( 'announcements' );
	  $data['recent_blog'] = $this->generic_model->get_blog_limit();
      $data[ 'user_details' ] = $userDetails;
      // Load the view with the data
      $this->load->view( 'notifications_view', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function read_notif( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $notification_detail = $this->generic_model->getInfo( 'admin_notification', 'id', $id );
      $userid = $this->session->userdata( 'user_id' );
      $userDetails = $this->generic_model->getInfo( 'users', 'id', $userid );
      //update the notification to read
      $this->generic_model->mark_as_read( $id );
      $data[ 'user_details' ] = $userDetails;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'notification_detail' ] = $notification_detail;
      $this->load->view( 'notification_detail', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function update_profile() {
    // Validate the form input
    $userid = $this->session->userdata( 'user_id' );
    $userDetails = $this->generic_model->getInfo( 'users', 'id', $userid );
    if ( empty( $userDetails->country ) && empty( $userDetails->state ) && empty( $userDetails->city ) ) {
      $this->form_validation->set_rules( 'firstname', 'First Name', 'required' );
      $this->form_validation->set_rules( 'lastname', 'Last Name', 'required' );
      $this->form_validation->set_rules( 'username', 'Username', 'required' );
      $this->form_validation->set_rules( 'email', 'Email', 'required|valid_email' );
      $this->form_validation->set_rules( 'phone', 'Phone Number', 'required' );
      $this->form_validation->set_rules( 'address', 'House Address', 'required' );
      $this->form_validation->set_rules( 'city', 'City', 'required' );
      $this->form_validation->set_rules( 'state', 'State', 'required' );
      $this->form_validation->set_rules( 'country', 'State', 'required' );
      $this->form_validation->set_rules( 'currency', 'Currency', 'required' );
    } else {
      $this->form_validation->set_rules( 'firstname', 'First Name', 'required' );
      $this->form_validation->set_rules( 'lastname', 'Last Name', 'required' );
      $this->form_validation->set_rules( 'username', 'Username', 'required' );
      $this->form_validation->set_rules( 'email', 'Email', 'required|valid_email' );
      $this->form_validation->set_rules( 'phone', 'Phone Number', 'required' );
      $this->form_validation->set_rules( 'address', 'House Address', 'required' );
      $this->form_validation->set_rules( 'currency', 'Currency', 'required' );
    }

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'settings' );
    } else {
      if ( empty( $userDetails->country ) && empty( $userDetails->state ) && empty( $userDetails->city ) ) {
        $data = array(
          'firstname' => $this->input->post( 'firstname' ),
          'lastname' => $this->input->post( 'lastname' ),
          'username' => $this->input->post( 'username' ),
          'email' => $this->input->post( 'email' ),
          'mobile' => $this->input->post( 'phone' ),
          'address' => $this->input->post( 'address' ),
          'city' => $this->input->post( 'city' ),
          'state' => $this->input->post( 'state' ),
          'zip' => $this->input->post( 'zip' ),
          'country' => $this->input->post( 'country' ),
          'default_currency' => $this->input->post( 'currency' )
        );
      } else {
        $data = array(
          'firstname' => $this->input->post( 'firstname' ),
          'lastname' => $this->input->post( 'lastname' ),
          'username' => $this->input->post( 'username' ),
          'email' => $this->input->post( 'email' ),
          'mobile' => $this->input->post( 'phone' ),
          'address' => $this->input->post( 'address' ),
          'zip' => $this->input->post( 'zip' ),
          'default_currency' => $this->input->post( 'currency' )
        );
      }

      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );

      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Profile Information Updated Successfully!' );
      redirect( 'settings' );
    }
  }

  public function update_account() {

    $userid = $this->session->userdata( 'user_id' );

    // Check if user records exist in the bank_records table
    $existing_records = $this->user_model->get_bank_records( $userid );

    // Validate the form input
    $this->form_validation->set_rules( 'account_name', 'Account Name', 'required' );
    $this->form_validation->set_rules( 'account_number', 'Account Number', 'required' );
    $this->form_validation->set_rules( 'bank', 'Bank Name', 'required' );
    // $this->form_validation->set_rules( 'bvn', 'Bank Verification Number', 'required' );

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'settings' );
    } else {
      // Form validation passed, update user's bank records

      $data = array(
        'bank_account' => $this->input->post( 'account_name' ),
        'account_number' => $this->input->post( 'account_number' ),
        'bank_name' => $this->input->post( 'bank' ),
        'bvn' => '000000000000',
      );

      if ( $existing_records ) {
        $this->user_model->update_bank_records( $userid, $data );
        $this->session->unset_userdata( 'user_details' );
        // Fetch user details
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

        // Set user details in session (must do!)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'success', 'Bank Information Updated Successfully!' );
        redirect( 'settings' );

      } else {
        // User records don't exist, insert a new record
        $data[ 'user_id' ] = $userid;
        $this->db->insert( 'bank_records', $data );
        $this->session->unset_userdata( 'user_details' );
        // Fetch user details
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

        // Set user details in session (must do!)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'success', 'Bank Information Updated Successfully!' );
        redirect( 'settings' );
      }


    }
  }

  public function change_password() {
    $this->form_validation->set_rules( 'old_password', 'Old Password', 'required' );
    $this->form_validation->set_rules( 'new_password', 'New Password', 'required|min_length[6]' );
    $this->form_validation->set_rules( 'repeat_password', 'Repeat Password', 'required|matches[new_password]' );

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed
      $this->session->set_flashdata( 'pass_error', 'please make sure all the fields are filled correctly!' );
      redirect( 'settings' );
    } else {
      // Form validation passed, process the change password logic
      $userid = $this->session->userdata( 'user_id' );
      $old_password = $this->input->post( 'old_password' );
      $new_password = password_hash( $this->input->post( 'new_password' ), PASSWORD_BCRYPT );
      // Check if old password is correct
      if ( $this->user_model->verify_old_password( $userid, $old_password ) ) {
        // Update the password
        $this->user_model->update_password( $userid, $new_password );

        // Fetch user details
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $this->session->unset_userdata( 'user_details' );
        // Set user details in session (must do!)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'pass_success', 'Login Information Updated Successfully!' );
        redirect( 'settings' );

      } else {
        $this->session->set_flashdata( 'pass_error', 'incorrect Old Password!' );
        redirect( 'settings' );
      }
    }
  }

  public function start_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
  
  public function start_vip_pro() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_vip_pro', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function start_vip_plus() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_vip_plus', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
    
  public function start_vip_plus_dual() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_vip_plus_dual', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function send_notification() {
    $this->form_validation->set_rules( 'title', 'Title', 'required' );
    $this->form_validation->set_rules( 'message', 'Message', 'required' );
    $this->form_validation->set_rules('type', 'Notification Type', 'required');
    if ( $this->form_validation->run() === FALSE ) {
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'admin_notification' );
    } else {
      $userid = $this->session->userdata( 'user_id' );
        
      if(!empty($this->input->post( 'link' ))){
          $link = $this->input->post( 'link' );
      }else{
          $link = 0;
      }    
        
      $segment = $this->input->post('notif_segment');
        
      $notification = array(
        'user_id' => $userid,
        'title' => $this->input->post( 'title' ),
        'message' => $this->input->post( 'message' ),
        'type' => $this->input->post( 'type' ),
        'segment'=> $this->input->post('notif_segment'),
        'link' => $link,
        'created_at' => date( 'Y-m-d H:i:s' ),
        'read_status' => 0
      );
      $message = "This is a new notification message.";
      $notification_id = $this->generic_model->insert_data( 'notifications', $notification );

      // Assuming you have a way to get all user IDs
      if($segment == 'all'){      
          $userids = $this->get_all_user_ids();
      }elseif($segment == 'none_active'){
          $userids = $this->get_all_user_ids_condition(array('is_vip'=>0));
      }elseif($segment == 'all_active'){
          $userids = $this->get_all_user_ids_condition(array('is_vip'=>1));  
      }elseif($segment == 'regular'){
          $userids = $this->generic_model->get_vip_users_in_active_shelters_ids(10000);
      }elseif($segment == 'regular_pro'){
          $userids = $this->generic_model->get_vip_users_in_active_shelters_ids(23000);
      }elseif($segment == 'regular_plus'){
          $userids = $this->generic_model->get_vip_users_in_active_shelters_ids(50000);
      }elseif($segment == 'gold'){
          $userids = $this->generic_model->get_vip_users_in_active_shelters_ids(210000);
      }elseif($segment == 'platinum'){
          $userids = $this->generic_model->get_vip_users_in_active_shelters_ids(310000);
      }else{
          $this->session->set_flashdata( 'error', 'missing user segment field');
          redirect( 'admin_notification' );
      }
        
      $this->generic_model->assign_notification_to_users( $notification_id, $userids );

      $this->session->set_flashdata( 'success', 'Notification sent successfully' );
      redirect( 'admin_notification' );
    }
  }
	
  public function save_blog() {
    $this->form_validation->set_rules( 'blog_title', 'Title', 'required' );
    $this->form_validation->set_rules( 'blog_message', 'Message', 'required' );
    if ( $this->form_validation->run() === FALSE ) {
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'admin_notification' );
    } else {
	  $config['upload_path'] ='./blog/';
      $config['allowed_types'] = 'gif|jpg|png|jpeg|pdf';
      $config['max_size'] = 81860; // 8MB max size (adjust as needed)
      $config['encrypt_name'] = true; // Encrypt file name for uniqueness
      $this->load->library('upload', $config);

        if (!$this->upload->do_upload('file1')) {
            // Handle upload error
			$this->session->set_flashdata( 'error', $this->upload->display_errors());
      		redirect( 'admin_notification' );
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'blog/' . $upload_data['file_name'];			
		    $userid = $this->session->userdata( 'user_id' );
		    $blog = array(
				'publisher' => $userid,  	 	 	 	 	 	
				'title' => $this->input->post( 'blog_title' ),
				'message' => $this->input->post( 'blog_message' ),
				'tags' => $this->input->post( 'tag' ),
				'image' => $file_path,
				'date' => date( 'Y-m-d H:i:s' ),
		    );
			$blog_id = $this->generic_model->insert_data( 'tbl_blog', $blog);			
			$this->session->set_flashdata( 'success', 'Blog Published successfully' );
			redirect( 'admin_notification' );
		}
    }
  }
	
  public function save_newsletter() {
    $this->form_validation->set_rules( 'news_title', 'Subject', 'required' );
    $this->form_validation->set_rules( 'news_message', 'Message', 'required' );
	$this->form_validation->set_rules( 'users', 'Users', 'required' );
    if ( $this->form_validation->run() === FALSE ) {
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'admin_notification' );
    } else {
	  //$config['upload_path'] ='./blog/';
      //$config['allowed_types'] = 'gif|jpg|png|jpeg|pdf';
     // $config['max_size'] = 81860; // 8MB max size (adjust as needed)
     // $config['encrypt_name'] = true; // Encrypt file name for uniqueness
      //$this->load->library('upload', $config);

      //  if (!$this->upload->do_upload('file1')) {
            // Handle upload error
		//	$this->session->set_flashdata( 'error', $this->upload->display_errors());
      		//redirect( 'admin_notification' );
    //    } else {
            // Upload successful, get file info
           // $upload_data = $this->upload->data();
          //  $file_path = 'blog/' . $upload_data['file_name'];	
	
	  $user_group = $this->input->post('users');
	  if($user_group == 'all'){
		  $members = $this->generic_model->select_all_data('users');
	  }
	  elseif($user_group == 'inactive'){
		  $members = $this->get_all_user_ids_condition(array('is_vip'=>0)); //$this->generic_model->transaction_select_where('users', array('is_vip'=>0));
	  }elseif($user_group == 'activated'){
          $segment = $this->input->post('segment');
          if($segment == 'all_activated'){
              $members = $this->get_all_user_ids_condition(array('is_vip'=>1));
          }elseif($segment == 'regular'){
              $members = $this->generic_model->get_vip_users_in_active_shelters(10000);
          }elseif($segment == 'regular_pro'){
              $members = $this->generic_model->get_vip_users_in_active_shelters(23000);
          }elseif($segment == 'regular_plus'){
              $members = $this->generic_model->get_vip_users_in_active_shelters(50000);
          }elseif($segment == 'gold'){
              $members = $this->generic_model->get_vip_users_in_active_shelters(210000);
          }elseif($segment == 'platinum'){
              $members = $this->generic_model->get_vip_users_in_active_shelters(310000);
          }
		  
	  }else{
		  $members = $this->generic_model->select_all_data('users');
	  }
		
	  //send the emails....................
		
	  foreach($members as $recipient){
		  $subject_user = $this->input->post('news_title');
          if(!empty($recipient->firstname)){
              $firstname = $recipient->firstname;
          }else{
              $firstname = 'user';
          }
          
          if(!empty($recipient->email)){
             $to_user = $recipient->email;
		     $title_user = 'Hello ' . $firstname;
		     $message_user = nl2br(htmlspecialchars($this->input->post('news_message'))).' <br>
			                <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
			                Our support team is here to help you with any concerns you may have.<br>
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
			                Best regards,<br>
			                BeepAgro Palliative Initiative (BPI) Team.</p>'; 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
          }
	  }
		
		    $userid = $this->session->userdata( 'user_id' );
		    $blog = array(
				'publisher' => $userid,  	 	 	 	 	 	
				'title' => $this->input->post( 'news_title' ),
				'message' => $this->input->post( 'news_message' ),
				'date' => date( 'Y-m-d H:i:s' ),
		    );
		
				
		
			$blog_id = $this->generic_model->insert_data( 'tbl_newsletter', $blog);			
			$this->session->set_flashdata( 'success', 'Newsletter Published successfully' );
			redirect( 'admin_notification' );
	//	}
    }
  }
  
  public function processVip_pro() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_vip_pro' );
    } else {
      //check if the user is already in the database..........
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = 23000 * $percentage;

      $data = array(
        'vip_pending' => 1,
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => 23000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );

        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 7,
          'amount' => 23000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = 23000;
        $data[ 'vat' ] = $vat;
        $this->load->view( 'vip_pro_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 7,
          'amount' => 23000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'pro',
          'active_shelter_id' => $active_shelter,
          'amount' => 23000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = 23000;
        $data[ 'vat' ] = $vat;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'vip_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => 23000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 7,
          'amount' => 23000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = 23000; //$this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;
        //crypto payment
        $this->load->view( 'vip_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_vip_pro' );
      }
    }
  }

  private function get_all_user_ids() {
    // Fetch all user IDs from the users table
    $this->db->select( 'id' );
    $query = $this->db->get( 'users' );
    $users = $query->result_array();
    return array_column( $users, 'id' );
  }
    
  private function get_all_user_ids_condition($condition) {
    // Ensure the condition is not empty
    if (empty($condition)) {
        return []; // Return an empty array if condition is not valid
    }

    // Fetch all user IDs from the users table
    $this->db->select('id');
    $this->db->where($condition);
    
    $query = $this->db->get('users');

    // Check if the query was successful
    if (!$query) {
        log_message('error', 'Failed to fetch user IDs: ' . $this->db->last_query());
        return []; // Return an empty array if the query fails
    }

    $users = $query->result_array();
    
    return array_column($users, 'id');
}

  public function start_platinum_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_platinum_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function start_gold_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $shelters = $this->user_model->getAllData( 'shelter_program' );
      $shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
      // Pass the data to the view
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'shelter' ] = $shelters;
      $data[ 'shelter_type' ] = $shelter_type;
      $this->load->view( 'start_gold_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function reg_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'card_details' ] = $card_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'reg_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function silver_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'card_details' ] = $card_details;
      $this->load->view( 'silver_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function gold_vip() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $user_details = $this->session->userdata( 'user_details' );
      $card_details = $this->generic_model->getInfo( 'cards', 'user_id', $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'card_details' ] = $card_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'gold_vip', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function invite() {
    $this->form_validation->set_rules( 'email', 'Member Email', 'required|valid_email' );
    $this->form_validation->set_rules( 'firstname', 'firstname', 'required' );
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'dashboard' );
    } else {
      $email = $this->input->post( 'email' );
      $fname = $this->input->post( 'firstname' );

      $userid  = $this->session->userdata( 'user_id' );
      $userData = $this->generic_model->getInfo( 'users', 'id', $userid );
      $invite_check = $this->generic_model->getInfo( 'users', 'email', $email );
      if ( !empty( $invite_check ) ) {
        $this->session->set_flashdata( 'error', 'The person you are trying to invite is already a BPI member' );
        redirect( 'dashboard' );
      } else {
        $trimmed_link = base_url( 'register?ref=' . $userData->referral_link );
        $to = $email;
        $subject = $userData->firstname . ' has invited you to join BPI!';
        $title = 'Hello ' . $fname;
        $message = '<p>We hope this email finds you well.<br><br>
			We are excited to inform you that your friend, ' . $userData->firstname . ' ' . $userData->lastname . ', has invited you to join their network on BPI (BeepAgro Palliative Initiative). As a valued member of their network, they believe that you would be a great addition to our community of change makers!.<br> <br>
			
			Joining BPI is quick, easy, and free! Simply click on the button below to create your account and connect with your friend:
			</p>
			<p>
			<a href="' . $trimmed_link . '" target="_blank">
            <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Join ' . $userData->firstname . ' on BPI</button>
            </a>
			</p>
    		<p>
			We look forward to welcoming you to the BPI community and seeing how you willll contribute to our vibrant network. If you have any questions or need assistance getting started, please don\'t hesitate to contact us.<br><br>
			Thank you for considering our invitation. We can\'t wait to see you on BPI!
			<br><br>
    		Warmest Regards,<br>
    		BPI Team.</p>';
        $this->sendemail( $title, $to, $subject, $message );
        $this->session->set_flashdata( 'success', 'Your invitation was sent successfully!' );
        redirect( 'dashboard' );
      }

    }

  }

  public function sponsor_pal() {
    $sponsor_id = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'email', 'Member Email', 'required|valid_email' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'refer' );
    } else {
      $email = $this->input->post( 'email' );
      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $shelter_amount = $this->generic_model->getInfo( 'shelter_palliative_types', 'id', $shelter_type )->amount;
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = $shelter_amount * $percentage;

      ///let us verify that this email actually belongs to one of us
      $emailcheck = $this->generic_model->getInfo( 'users', 'email', $email );
      if ( empty( $emailCheck ) ) {
        $this->session->set_flashdata( 'error', 'The email you provided does not belong to anyone in our community' );
        redirect( 'refer' );
      } else {
        $userid = $emailCheck->id;
        $data = array(
          'vip_pending' => 1,
        );
        // Update user profile
        $this->user_model->update_user_profile( $userid, $data );

        if ( $payment_option == 'local_bank_transfer' ) {
          //save shelter and vip data
          $paymentData = array(
            'amount' => $shelter_amount,
            'vat' => $vat,
            'beneficiary' => $userid
          );

          $this->session->set_userdata( $paymentData );
          $save_shelter = array(
            'user_id' => $userid,
            'shelter_package' => $shelter_type,
            'shelter_option' => $shelter_option,
            'starter_pack' => 4,
            'amount' => $shelter_amount,
            'status' => 'Pending',
            'activated_date' => date( 'Y-m-d H:i:s' )

          );
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );

          $table_name = 'bank_accounts';
          $conditions = array( 'status' => 'active' );

          $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
          $data[ 'amount' ] = $shelter_amount;
          $data[ 'vat' ] = $vat;
          $data[ 'beneficiary' ] = $userid;
          $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $sponsor_id );
          $data[ 'notifications' ] = $this->generic_model->get_notifications( $sponsor_id );
          $this->load->view( 'sponsor_bank_transfer', $data );

        } elseif ( $payment_option == 'card_payment' ) {
          $save_shelter = array(
            'user_id' => $userid,
            'shelter_package' => $shelter_type,
            'shelter_option' => $shelter_option,
            'starter_pack' => 4,
            'amount' => $shelter_amount,
            'status' => 'Pending',
            'activated_date' => date( 'Y-m-d H:i:s' )

          );
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );

          //card payment
          $txref = 'BA-FLW-' . time();
          $paymentData = array(
            'txref' => $txref,
            'package_name' => 'silver',
            'active_shelter_id' => $active_shelter,
            'amount' => $shelter_amount,
            'vat' => $vat,
            'beneficiary' => $userid
          );

          $this->session->set_userdata( $paymentData );
          $user_details = $this->db->get_where( 'users', array( 'id' => $sponsor_id ) )->row();
          $data[ 'amount' ] = $shelter_amount;
          $data[ 'vat' ] = $vat;
          $data[ 'user_details' ] = $user_details;
          $data[ 'beneficiary' ] = $userid;
          $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $sponsor_id );
          $data[ 'notifications' ] = $this->generic_model->get_notifications( $sponsor_id );
          $this->load->view( 'sponsor_card_pay', $data );

        } elseif ( $payment_option == 'crypto' ) {
          $paymentData = array(
            'amount' => $shelter_amount,
            'vat' => $vat,
            'beneficiary' => $userid
          );

          $this->session->set_userdata( $paymentData );
          $save_shelter = array(
            'user_id' => $userid,
            'shelter_package' => $shelter_type,
            'shelter_option' => $shelter_option,
            'starter_pack' => 4,
            'amount' => $shelter_amount,
            'status' => 'Pending',
            'activated_date' => date( 'Y-m-d H:i:s' )

          );
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
          $user_details = $this->db->get_where( 'users', array( 'id' => $sponsor_id ) )->row();
          $data[ 'user_details' ] = $user_details;
          $data[ 'amount' ] = $shelter_amount;
          $data[ 'beneficiary' ] = $userid;
          $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $sponsor_id );
          $data[ 'notifications' ] = $this->generic_model->get_notifications( $sponsor_id );
          $data[ 'vat' ] = $vat;
          //crypto payment
          $this->load->view( 'vip_crypto_pay', $data );
        }
        else {
          $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
          redirect( 'refer' );
        }
      }
    }
  }

  public function processVip() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_vip' );
    } else {
      //check if the user is already in the database..........
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = 10000 * $percentage;

      $data = array(
        'vip_pending' => 1,
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => 10000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );

        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 1,
          'amount' => 10000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'user_details' ] = $user_details;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;
        $this->load->view( 'vip_bank_transfer', $data );

      } 
      elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 1,
          'amount' => 10000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'regular',
          'active_shelter_id' => $active_shelter,
          'amount' => 10000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'vip_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => 10000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 1,
          'amount' => 10000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;
        //crypto payment
        $this->load->view( 'vip_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_vip' );
      }
    }
  }

  public function processVip_plus() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_vip_plus' );
    } else {
      //check if the user is already in the database..........
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = 50000 * $percentage;

      $data = array(
        'vip_pending' => 1,
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => 50000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );

        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = 50000;
        $data[ 'vat' ] = $vat;
        $this->load->view( 'vip_plus_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )
        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'plus',
          'active_shelter_id' => $active_shelter,
          'amount' => 50000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = 50000;
        $data[ 'vat' ] = $vat;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'vip_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => 50000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 5,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = 50000;//$this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;
        //crypto payment
        $this->load->view( 'vip_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_vip_plus' );
      }
    }
  }
    
  public function processVip_plus_dual() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_dual_act' );
    } else {
      //check if the user is already in the database..........
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = 4500;

      $data = array(
        'vip_pending' => 1,
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => 60000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );

        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'user_details' ] = $user_details;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = 60000;
        $data[ 'vat' ] = $vat;
        $this->load->view( 'vip_plus_bank_transfer_dual', $data );

      } 
      elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )
        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'plus',
          'active_shelter_id' => $active_shelter,
          'amount' => 60000,
          'vat' => 4500
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = 60000;
        $data[ 'vat' ] = $vat;
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'vip_card_pay_dual', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => 60000,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 50000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = 60000;//$this->generic_model->getInfo( 'packages', 'package_name', 'Pallative VIP Club program' )->package_price;
        $data[ 'vat' ] = $vat;
        //crypto payment
        $this->load->view( 'vip_crypto_pay_dual', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_vip_plus' );
      }
    }
  }

  public function upgrade_processVip() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    $this->form_validation->set_rules( 'shelter_type', 'Shelter Package', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'upgrade_bpi' );
    } else {
      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      //get amount dynamically
      $shelter_amount = $this->generic_model->getInfo( 'upgrade_shelter_palliative_types', 'id', $shelter_type )->amount;
      $vat = $shelter_amount * $percentage;
      $data = array(
        'vip_pending' => 1,
        'is_vip' => 0,
        'is_shelter' => 0,
        'shelter_pending' => 1,
        'bpi_upgrade' => 1
      );
      // Update user profile
      $this->generic_model->update_data( 'users', $data, array( 'id' => $userid ) );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => $shelter_amount,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => $shelter_type,
          'amount' => $shelter_amount,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );
        $condition_up = array(
          'user_id' => $userid
        );
        $active_shelter = $this->generic_model->update_data( 'active_shelters', $save_shelter, $condition_up );
        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'user_details' ] = $user_details;
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = $shelter_amount;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'vat' ] = $vat;
        $this->load->view( 'upgrade_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => $shelter_type,
          'amount' => $shelter_amount,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        $condition_up = array(
          'user_id' => $userid
        );
        $active_shelter = $this->generic_model->update_data( 'active_shelters', $save_shelter, $condition_up );

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'active_shelter_id' => $active_shelter,
          'amount' => $shelter_amount,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = $shelter_amount;
        $data[ 'user_details' ] = $user_details;
        $data[ 'vat' ] = $vat;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'upgrade_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => $shelter_amount,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => $shelter_type,
          'amount' => $shelter_amount,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        $condition_up = array(
          'user_id' => $userid
        );
        $active_shelter = $this->generic_model->update_data( 'active_shelters', $save_shelter, $condition_up );

        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $shelter_amount;
        $data[ 'user_details' ] = $user_details;
        $data[ 'vat' ] = $vat;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        //crypto payment
        $this->load->view( 'upgrade_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'upgrade_bpi' );
      }
    }

  }

  public function upgrade_flutterwaveCallback_vip() {
    $txref = $_SESSION[ 'txref' ];
    $userid = $this->session->userdata( 'user_id' );
    $user_email = $this->generic_model->getInfo( 'users', 'id', $userid )->email;
    $date = date( 'Y-m-d H:i:s' );
    $transaction_id = $this->input->get( 'transaction_id', TRUE );
    $currentDate = new DateTime();
    $curl = curl_init();

    curl_setopt_array( $curl, array(
      CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/" . $transaction_id . "/verify",
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
      CURLOPT_HTTPHEADER => array(
        "Content-Type: application/json",
        "Authorization: Bearer " . $this->generic_model->getInfo( 'tbl_addons_api', 'source', 'FLWT' )->secret_key
      ),
    ) );

    $response = curl_exec( $curl );
    $resp = json_decode( $response, true );

    $paymentStatus = $resp[ 'status' ];
    $paymentMessage = $resp[ 'message' ];
    $paymentStatId = $resp[ 'data' ][ 'id' ];
    $paymentTxRef = $resp[ 'data' ][ 'tx_ref' ];
    $flwref = $resp[ 'data' ][ 'flw_ref' ];
    $chargeAmountPlain = $resp[ 'data' ][ 'amount' ];
    $chargeAmount = $resp[ 'data' ][ 'charged_amount' ];
    $chargeCurrency = $resp[ 'data' ][ 'currency' ];
    $appFee = $resp[ 'data' ][ 'app_fee' ];
    $merchantFee = $resp[ 'data' ][ 'merchant_fee' ];
    $provider_response = $resp[ 'data' ][ 'processor_response' ];
    $auth_model = $resp[ 'data' ][ 'auth_model' ];
    $chargeIp = $resp[ 'data' ][ 'ip' ];
    $narration = $resp[ 'data' ][ 'narration' ];
    $dataStatus = $resp[ 'data' ][ 'status' ];
    $chargePaymentType = $resp[ 'data' ][ 'payment_type' ];
    $account_id = $resp[ 'data' ][ 'account_id' ];
    $createdAt = $resp[ 'data' ][ 'created_at' ];

    $metadata = $resp[ 'data' ][ 'meta' ];
    $amount_settled = $resp[ 'data' ][ 'amount_settled' ];
    $custid = $resp[ 'data' ][ 'customer' ][ 'id' ];
    $custPhone = $resp[ 'data' ][ 'customer' ][ 'phone_number' ];
    $custEmail = $resp[ 'data' ][ 'customer' ][ 'email' ];

    $data = array(
      'paymentStatus' => $paymentStatus,
      'paymentMessage' => $paymentMessage,
      'paymentStatId' => $paymentStatId,
      'paymentTxRef' => $paymentTxRef,
      'flwref' => $flwref,
      'chargeAmountPlain' => $chargeAmountPlain,
      'chargeAmount' => $chargeAmount,
      'chargeCurrency' => $chargeCurrency,
      'appFee' => $appFee,
      'merchantFee' => $merchantFee,
      'provider_response' => $provider_response,
      'auth_model' => $auth_model,
      'chargeIp' => $chargeIp,
      'narration' => $narration,
      'dataStatus' => $dataStatus,
      'chargePaymentType' => $chargePaymentType,
      'account_id' => $account_id,
      'createdAt' => $createdAt,
      'metadata' => json_encode( $metadata ),
      'amount_settled' => $amount_settled,
      'custid' => $custid,
      'custPhone' => $custPhone,
      'custEmail' => $custEmail
    );
    $this->db->insert( 'flutterwave_payments', $data );

    if ( $paymentStatus == "success" ) {
      //Give Value and return to Success page

      //for creating the txn code
      $this->load->helper( 'string' );

      //Variables
      $method = 'flutterwave';
      $date = date( 'Y-m-d H:i:s' );
      $datetime = date( 'Y-m-d H:i:s' );
      $finalDeposit = $chargeAmountPlain;

      //Deposit Array
      $depositInfo = array(
        'userId' => $userid,
        'txnCode' => $_SESSION[ 'txref' ],
        'amount' => $finalDeposit,
        'paymentMethod' => $method,
        'createdDtm' => $datetime
      );
      $this->generic_model->insert_data( 'deposits', $depositInfo );


      $payment_amount = $_SESSION[ 'amount' ];
       $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
      $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $userid);
      $direct_ref = $ref_tree->referred_by;
      $lev1 = $ref_tree->level_1;
      $lev2 = $ref_tree->level_2;
      $lev3 = $ref_tree->level_3;
      $lev4 = $ref_tree->level_4;
      $lev5 = $ref_tree->level_5;
      $lev6 = $ref_tree->level_6;
      $lev7 = $ref_tree->level_7;
      $lev8 = $ref_tree->level_8;
      $lev9 = $ref_tree->level_9;
      
      //now we get the package info
      $package_id = $this->generic_model->getInfo( 'upgrade_shelter_palliative_types', 'amount', $payment_amount )->package_id;
      //let us get the distributables
      $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
       if ( $package_id == 5 ) {
          $starter = 3;
        //this this a 40k upgrade..............
        $spendable_commissions = $this->generic_model->getInfo( 'commissions_spendable', 'package_id', $package_id );
        $spend_direct = $spendable_commissions->Direct;
        $spend_level_1 = $spendable_commissions->level_1;
        $spend_level_2 = $spendable_commissions->level_2;
        $spend_level_3 = $spendable_commissions->level_3;
        //pay spendable

        $this->paySpendable( $spend_direct, $direct_ref, $package_id );
        $this->paySpendable( $spend_level_1, $lev1, $package_id );
        $this->paySpendable( $spend_level_2, $lev2, $package_id );
        $this->paySpendable( $spend_level_3, $lev3, $package_id );

        //start resetting the data, first the user table
        $user_data = array(
          'vip_pending' => 0,
          'shelter_pending' => 0,
          'bpi_upgrade' => 0,
          'is_vip' => 1,
          'is_shelter' => 1
        );
        $condition = array( 'id' => $userid );
        $this->generic_model->update_data( 'users', $user_data, $condition );
      }
       else {
         $starter = 2;
        //this is a gold upgrade........
        $user_data = array(
          'vip_pending' => 0,
          'shelter_pending' => 0,
          'bpi_upgrade' => 0,
          'is_vip' => 1,
          'is_shelter' => 1,
          'shelter_wallet' => 1
        );
        $condition = array( 'id' => $userid );
        $this->generic_model->update_data( 'users', $user_data, $condition );

        //payouts minus regular 
        //distribute the rewards from the shelter activation...
        $regular_vip_commission = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 2 );
        $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', $package_id );
        $direct = ( $vip_commissions->Direct - $regular_vip_commission->Direct );
        $level_1 = ( $vip_commissions->level_1 - $regular_vip_commission->level_1 );
        $level_2 = ( $vip_commissions->level_2 - $regular_vip_commission->level_2 );
        $level_3 = ( $vip_commissions->level_3 - $regular_vip_commission->level_3 );

        //cashback commissions
        $regular_wal_commission = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 2 );
        $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', $package_id );
        $direct_wallet = ( $vip_commissions_wallet->Direct - $regular_wal_commission->Direct );
        $level_1_wallet = ( $vip_commissions_wallet->level_1 - $regular_wal_commission->level_1 );
        $level_2_wallet = ( $vip_commissions_wallet->level_2 - $regular_wal_commission->level_2 );
        $level_3_wallet = ( $vip_commissions_wallet->level_3 - $regular_wal_commission->level_3 );

        //bmt commissions
        $regular_bpt_commission = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 2 );
        $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', $package_id );
        $direct_bmt = ( $vip_commissions_bmt->Direct - $regular_bpt_commission->Direct );
        $level_1_bmt = ( $vip_commissions_bmt->level_1 - $regular_bpt_commission->level_1 );
        $level_2_bmt = ( $vip_commissions_bmt->level_2 - $regular_bpt_commission->level_2 );
        $level_3_bmt = ( $vip_commissions_bmt->level_3 - $regular_bpt_commission->level_3 );

        //shelter_commissions
        $vip_commissions_shelter = $this->generic_model->getInfo( 'commissions_shelter', 'package_id', $package_id );
        $direct_shelter = $vip_commissions_shelter->Direct;
        $level_1_shelter = $vip_commissions_shelter->level_1;
        $level_2_shelter = $vip_commissions_shelter->level_2;
        $level_3_shelter = $vip_commissions_shelter->level_3;
        $level_4_shelter = $vip_commissions_shelter->level_4;
        $level_5_shelter = $vip_commissions_shelter->level_5;
        $level_6_shelter = $vip_commissions_shelter->level_6;
        $level_7_shelter = $vip_commissions_shelter->level_7;
        $level_8_shelter = $vip_commissions_shelter->level_8;
        $level_9_shelter = $vip_commissions_shelter->level_9;

        //fund the ref_tree_cartel BMT.........
        $this->convertBMT( $package_id, $direct_bmt, $price, $direct_ref, $direct_wallet, $direct );
        $this->convertBMT( $package_id, $level_1_bmt, $price, $lev1, $level_1_wallet, $level_1 );
        $this->convertBMT( $package_id, $level_2_bmt, $price, $lev2, $level_2_wallet, $level_2 );
        $this->convertBMT( $package_id, $level_3_bmt, $price, $lev3, $level_3_wallet, $level_3 );

        //fund the silver and gold shelter holders
        $this->silver_or_gold( $direct_ref, $direct_shelter );
        $this->silver_or_gold( $lev1, $level_1_shelter );
        $this->silver_or_gold( $lev2, $level_2_shelter );
        $this->silver_or_gold( $lev3, $level_3_shelter );
        $this->silver_or_gold( $lev4, $level_4_shelter );
        $this->silver_or_gold( $lev5, $level_5_shelter );
        $this->silver_or_gold( $lev6, $level_6_shelter );
        $this->silver_or_gold( $lev7, $level_7_shelter );
        $this->silver_or_gold( $lev8, $level_8_shelter );
        $this->silver_or_gold( $lev9, $level_9_shelter );

      } 
      
       //set the wallet activation as well for other package
			  if ( $package_id == 4 || $package_id == 6 ) {
			  	$user_data = array(
				  'shelter_wallet' => 1
				);
				$u_condition = array( 'id' => $userid );
				$this->generic_model->update_data( 'users', $user_data, $u_condition );
			  }

      //return the shelter to active	
      $shelter_data = array(
        'status' => 'active',
        'starter_pack' => $starter,
		'amount' => $payment_amount
      );

      $shelter_condition = array( 'user_id' =>$userid );
      $this->generic_model->update_data( 'active_shelters', $shelter_data, $shelter_condition );

      
      $this->session->unset_userdata( 'user_details' );

      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      $this->session->set_flashdata( 'success', 'transaction successful' );
      redirect( 'payment_success_page' );
    } else {
      $this->session->set_flashdata( 'error', 'unable to process this transaction at the moment, try again in a few minutes' );
      redirect( 'dashboard' );
    }

  }

  public function upgrade_bank_confirm() {
    $userid = $this->session->userdata( 'user_id' );
    $data[ 'amount' ] = $_SESSION[ 'amount' ];
    $data[ 'vat' ] = $_SESSION[ 'vat' ];
    $user_details = $this->session->userdata( 'user_details' );
    $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
    $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
    $this->load->view( 'upgrade_bank_confirm', $data );
  }

  public function process_merchant() {
    $userid = $this->session->userdata( 'user_id' );
    $merchant_fee = $this->generic_model->getInfo( 'pickup_reg_fee', 'id', 1 )->amount;
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'You must select a payment option' );
      redirect( 'merchant_fee' );
    } else {
      $payment_option = $this->input->post( 'payment_option' );
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = $merchant_fee * $percentage;
      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $paymentData = array(
          'amount' => $merchant_fee,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = $merchant_fee;
        $data[ 'vat' ] = $vat;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'merchant_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {

        //card payment
        $txref = 'BA-FLW-PUA' . time();
        $paymentData = array(
          'txref' => $txref,
          'amount' => $merchant_fee,
          'vat' => $vat
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = $merchant_fee;
        $data[ 'vat' ] = $vat;
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'merchant_card_pay', $data );

      } elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => $merchant_fee,
          'vat' => $vat
        );
        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $merchant_fee;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'vat' ] = $vat;
        $this->load->view( 'merchant_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'You must select a payment option from the list' );
        redirect( 'merchant_fee' );
      }
    }
  }

  public function processPlatinumVip() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_platinum_vip' );
    } else {
      //check if the user is already in the database..........
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );

      $data = array(
        'vip_pending' => 1,
        'shelter_pending' => 1
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        //save shelter and vip data
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 2,
          'amount' => 310000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );
        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $paymentData = array(
          'amount' => 310000,
          'vat' => 23250
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $data[ 'user_details' ] = $user_details;
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative Platinum program' )->package_price;
        $data[ 'vat' ] = 23250;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'vip_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 2,
          'amount' => 310000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'silver',
          'active_shelter_id' => $active_shelter
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative Platinum program' )->package_price;
        $data[ 'vat' ] = 23250;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'vip_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {

        $paymentData = array(
          'amount' => 310000,
          'vat' => 23250
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 2,
          'amount' => 310000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Pallative Platinum program' )->package_price;
        $data[ 'vat' ] = 23250;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        //crypto payment
        $this->load->view( 'vip_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_platinum_vip' );
      }
    }
  }

  public function processGoldVip() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'shelter_option', 'Shelter Palliative Plan', 'required' );
    $this->form_validation->set_rules( 'payment_option', 'Payment Option', 'required' );
    // Run form validation
    if ( $this->form_validation->run() === FALSE ) {
      // Set flash data with an error message
      $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
      redirect( 'start_gold_vip' );
    } else {
      $check_condition = array(
        'user_id' => $userid,
        'status' => 'Pending'
      );
      $get_active = $this->generic_model->get_by_condition( 'active_shelters', $check_condition );

      $shelter_option = $this->input->post( 'shelter_option' );
      $shelter_type = $this->input->post( 'shelter_type' );
      $payment_option = $this->input->post( 'payment_option' );

      $data = array(
        'vip_pending' => 1,
        'shelter_pending' => 1
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      if ( $payment_option == 'local_bank_transfer' ) {
        $paymentData = array(
          'amount' => 210000,
          'vat' => 15750
        );

        $this->session->set_userdata( $paymentData );
        //save shelter and vip data
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 2,
          'amount' => 210000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );
        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );
        $data[ 'vat' ] = 15750;
        $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Shelter Pallative Gold' )->package_price;
        $this->load->view( 'vip_bank_transfer', $data );

      } elseif ( $payment_option == 'card_payment' ) {
        $paymentData = array(
          'amount' => 210000,
          'vat' => 15750
        );

        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 210000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }

        //card payment
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'package_name' => 'gold',
          'active_shelter_id' => $active_shelter
        );

        $this->session->set_userdata( $paymentData );
        // 'item' will be erased after 30000 seconds
        $this->session->mark_as_temp( array( 'txref' ), 30000 );
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Shelter Pallative Gold' )->package_price;
        $data[ 'user_details' ] = $user_details;
        $data[ 'vat' ] = 15750;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'vip_card_pay', $data );

      }
      elseif ( $payment_option == 'crypto' ) {
        $paymentData = array(
          'amount' => 210000,
          'vat' => 15750
        );
        $this->session->set_userdata( $paymentData );
        $save_shelter = array(
          'user_id' => $userid,
          'shelter_package' => $shelter_type,
          'shelter_option' => $shelter_option,
          'starter_pack' => 3,
          'amount' => 210000,
          'status' => 'Pending',
          'activated_date' => date( 'Y-m-d H:i:s' )

        );

        if ( empty( $get_active ) ) {
          $active_shelter = $this->generic_model->insert_data( 'active_shelters', $save_shelter );
        }
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $this->generic_model->getInfo( 'packages', 'package_name', 'Shelter Pallative Gold' )->package_price;
        $data[ 'vat' ] = 15750;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        //crypto payment
        $this->load->view( 'vip_crypto_pay', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
        redirect( 'start_gold_vip' );
      }
    }
  }

  public function withdrawal() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $bankDetails = $this->generic_model->getInfo( 'bank_records', 'user_id', $userid );
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;
      $data[ 'withdrawals' ] = $this->generic_model->transaction_select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
      $data[ 'bank' ] = $bankDetails;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'withdrawal', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function kyc_start() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $bankDetails = $this->generic_model->getInfo( 'bank_records', 'user_id', $userid );
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;
      $data[ 'bank' ] = $bankDetails;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'kyc_start', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function upload_kyc() {
    $userid = $this->session->userdata( 'user_id' );
    // File upload configuration
    $config[ 'upload_path' ] = './uploads/kyc/';
    $config[ 'allowed_types' ] = 'gif|jpg|png|jpeg|pdf';
    $config[ 'max_size' ] = 4096; // 4MB
    $config[ 'encrypt_name' ] = TRUE;

    $this->load->library( 'upload', $config );

    $file_columns = array( 'file1', 'file2' );
    $file_data = array_fill_keys( $file_columns, '' );

    $kyc_check = $this->generic_model->getInfo( 'kyc_data', 'user_id', $userid );
    if ( !empty( $kyc_check ) ) {
      $this->session->set_flashdata( 'error', 'You have a pending KYC verification in progress, please do not upload another request' );
      redirect( 'settings' );
    } else {
      foreach ( $file_columns as $field_name ) {
        if ( $this->upload->do_upload( $field_name ) ) {
          // Upload successful, update user's profile picture in the database
          $upload_data = $this->upload->data();

          // Set the file name/path in the $file_data array
          $file_data[ $field_name ] = $upload_data[ 'file_name' ]; // Adjust if storing paths

          // Reset the upload library to clear previous upload data
          $this->upload->initialize( $config );
        } else {
          // Handle upload error
          $error = 'Could not process your request, please choose valid files';
          $this->session->set_flashdata( 'error', $error );
          redirect( 'settings' );
        }
      }

      $data_kyc = array(
        'user_id' => $userid,
        'file1' => $file_data[ 'file1' ],
        'file2' => $file_data[ 'file2' ],
        'file3' => $file_data[ 'file1' ],
        'file4' => $file_data[ 'file2' ],
        'date_uploaded' => date( 'Y-m-d H:i:s' ), // Current date and time
        'status' => 1 // Assuming files are initially in a pending state
      );

      $this->db->insert( 'kyc_data', $data_kyc );
      $data = array(
        'kyc_pending' => 1,
      );
      // Update user profile
      $this->user_model->update_user_profile( $userid, $data );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      $to = 'admin@beepagro.com';
      $subject = 'BPI - KYC Verification Request';
      $title = 'Hello Admin';
      $message = '<p>A new KYC verification request has been submitted.</p>
		<p>Please logon to the admin portal to authenticate and approve this request</p>
		<p>
		<br><br>
		BPI Alert,<br>
		Admin Notifications.</p>';

      $this->sendemail( $title, $to, $subject, $message );

      //send the user his or her own email
      $to_user = $user_details->email;
      $subject_user = 'BPI - KYC Verification Request';
      $title_user = 'Hello ' . $user_details->firstname;
      $message_user = '<p>Your KYC Verification Request is been processed</p>
		<p>You will be notified on the status of your request via email.</p>

		<br>
		<p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
		Our support team is here to help you with any concerns you may have.<br>
		Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
		We look forward to having you as a valued member of our community.<br><br>
		Best regards,<br>
		BeepAgro Palliative Initiative (BPI) Team.</p>';

      $this->sendemail( $title_user, $to_user, $subject_user, $message_user );

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );
      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'KYC data Updated Successfully!' );
      redirect( 'settings' );
    }
  }

  public function addComment() {
    // Validate the form input
    $this->form_validation->set_rules( 'comment', 'Comment', 'required' );
    $product = $this->input->post( 'product_id' );

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', 'Comment is required' );
      redirect( 'details/' . $product );
    } else {
      $userid = $this->session->userdata( 'user_id' );
      $rating = $this->input->post( 'rating' );

      $data = array(
        'product_id' => $product,
        'user_id' => $userid,
        'comment' => $this->input->post( 'comment' ),
        'comment_date' => date( 'Y-m-d H:i:s' ),
      );
      // add comment
      $this->db->insert( 'product_comments', $data );

      //check for rating
      if ( !empty( $rating ) ) {
        //check if this person has rated before
        $has_rated = $this->generic_model->get_by_condition( 'product_rating', array( 'product_id' => $product, 'user_id' => $userid ) );
        if ( !empty( $has_rated ) ) {
          //update the post
          $data = array(
            'star' => $rating,
            'rating_date' => date( 'Y-m-d H:i:s' ),
          );
          $this->generic_model->update_data( 'product_rating', $data, array( 'product_id' => $product, 'user_id' => $userid ) );
          $this->session->set_flashdata( 'success', 'Comment Added and Rating Updated Successfully!' );
          redirect( 'details/' . $product );
        } else {
          //insert ratings...
          $data = array(
            'product_id' => $product,
            'user_id' => $userid,
            'star' => $rating,
            'rating_date' => date( 'Y-m-d H:i:s' ),
          );
          // add rating
          $this->db->insert( 'product_rating', $data );
        }
      }

      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Comment Added Successfully!' );
      redirect( 'details/' . $product );
    }
  }

  public function addtocart() {
    // Validate the form input
    $this->form_validation->set_rules( 'quantity', 'Quantity', 'required' );
    $product = $this->session->userdata( 'product_id' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'main_error', 'Quantity is required' );
      redirect( 'details/' . $product );
    } else {
      $userid = $this->session->userdata( 'user_id' );

      //check for dupliate entry

      //check if this person has same product in cart before
      $has_carted = $this->generic_model->get_by_condition( 'product_cart', array( 'product_id' => $product, 'user_id' => $userid ) );
      if ( !empty( $has_carted ) ) {
        //update the post
        $data = array(
          'quantity' => $this->input->post( 'quantity' ),
          'date_added' => date( 'Y-m-d H:i:s' ),
        );
        $this->generic_model->update_data( 'product_cart', $data, array( 'quantity' => $this->input->post( 'quantity' ) ) );
        $this->session->set_flashdata( 'main_success', 'Cart Updated Successfully!' );
        redirect( 'details/' . $product );
      } else {
        //insert ratings...
        $data = array(
          'product_id' => $product,
          'user_id' => $userid,
          'quantity' => $this->input->post( 'quantity' ),
          'date_added' => date( 'Y-m-d H:i:s' ),
        );
        // add comment
        $this->db->insert( 'product_cart', $data );
      }

      //reset the session data
      $userid = $this->session->userdata( 'user_id' );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

      // Set user details in session (optional)
      $this->session->set_userdata( 'user_details', $user_details );

      // Redirect or display success message
      $this->session->set_flashdata( 'main_success', 'Product Added  To Cart Successfully!' );
      redirect( 'details/' . $product );
    }
  }

  public function buy_product() {
    // Validate the form input
    $this->form_validation->set_rules( 'quantity_claim', 'Quantity', 'required' );
    $product = $this->session->userdata( 'product_id' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'main_error', 'Quantity is required' );
      redirect( 'details/' . $product );
    } else {
      $userid = $this->session->userdata( 'user_id' );

      //check for dupliate entry

      //check if this person has same product in cart before
      $has_ordered = $this->generic_model->get_by_condition( 'store_orders', array( 'product_id' => $product, 'user_id' => $userid, 'status' => 'pending' ) );
      if ( !empty( $has_ordered ) ) {
        //update the post
        $data = array(
          'quantity' => $this->input->post( 'quantity_claim' ),
          'order_date' => date( 'Y-m-d H:i:s' ),
        );
        $this->generic_model->update_data( 'store_orders', $data, array( 'quantity' => $this->input->post( 'quantity_claim' ) ) );
        $this->session->set_flashdata( 'success', 'Cart Updated Successfully!' );
        redirect( 'checkout' );
      } else {
        //get product data
        $qty = $this->input->post( 'quantity_claim' );
        $product_data = $this->generic_model->getInfo( 'store_products', 'id', $product );
        $total = ( $product_data->price * $qty );
        $note = $this->input->post( 'note' );

        //insert order...
        $data = array(
          'product_id' => $product,
          'user_id' => $userid,
          'quantity' => $qty,
          'note' => $note,
          'amount' => $total,
          'status' => 'pending',
          'order_date' => date( 'Y-m-d H:i:s' ),
        );
        // add comment
        $this->db->insert( 'store_orders', $data );
        //reset the session data
        $userid = $this->session->userdata( 'user_id' );
        $this->session->unset_userdata( 'user_details' );
        // Fetch user details
        $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();

        // Set user details in session (optional)
        $this->session->set_userdata( 'user_details', $user_details );

        // Redirect or display success message
        $this->session->set_flashdata( 'success', 'Cart Updated Successfully!' );
        redirect( 'checkout' );
      }
    }
  }

  public function delete_order( $id ) {
    $this->db->where( 'id', $id );
    $this->db->delete( 'store_orders' );
    $this->session->set_flashdata( 'success', 'Order Deleted Successfully!' );
    redirect( 'checkout' );
  }

  public function claim_product() {
    //bring down everything in the order pending
    $userid = $this->session->userdata( 'user_id' );
    $user = $this->generic_model->getInfo( 'users', 'id', $userid );
    $sum_total = $this->generic_model->getSum( 'store_orders', 'amount', array( 'user_id' => $userid, 'status' => 'pending' ) );
    //check that the cashback wallet can work it
    if ( $user->cashback > $sum_total ) {
      //now render the foreach product bonuses
      $products = $this->generic_model->select_where( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      foreach ( $products as $product ) {
        //treat the bonuses
        $product_info = $this->generic_model->getInfo( 'store_products', 'id', $product->product_id );
        //palliatives
        $p_direct = $product_info->Direct;
        $p_level_1 = $product_info->level_1;
        $p_level_2 = $product_info->level_2;
        $p_level_3 = $product_info->level_3;
        $p_level_4 = $product_info->level_4;
        //cashbacks
        $c_direct = $product_info->cashback_direct;
        $c_level_1 = $product_info->cashback_level1;
        $c_level_2 = $product_info->cashback_level2;
        $c_level_3 = $product_info->cashback_level3;
        $c_level_4 = $product_info->cashback_level4;

        //get referrers
        $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
        $direct_ref = $ref_tree->referred_by;
        $lev1 = $ref_tree->level_1;
        $lev2 = $ref_tree->level_2;
        $lev3 = $ref_tree->level_3;
        $lev4 = $ref_tree->level_4;

        //palliatives credit time...
        $this->payout_bonuses( $direct_ref, $p_direct, 'palliative' );
        $this->payout_bonuses( $lev1, $p_level_1, 'palliative' );
        $this->payout_bonuses( $lev2, $p_level_2, 'palliative' );
        $this->payout_bonuses( $lev3, $p_level_3, 'palliative' );
        $this->payout_bonuses( $lev4, $p_level_4, 'palliative' );

        //cashback credit time...
        $this->payout_bonuses( $direct_ref, $c_direct, 'palliative' );
        $this->payout_bonuses( $lev1, $c_level_1, 'cashback' );
        $this->payout_bonuses( $lev2, $c_level_2, 'cashback' );
        $this->payout_bonuses( $lev3, $c_level_3, 'cashback' );
        $this->payout_bonuses( $lev4, $c_level_4, 'cashback' );

        //update the product to processing
        $ranumber = rand( 985773, 998877 );
        $note = 'BPI-' . $ranumber . '-PC';
        $product_update = array( 'status' => 'processing', 'note' => $note );
        $update_condition = array( 'id' => $product->id );
        $this->generic_model->update_data( 'store_orders', $product_update, $update_condition );

      }

      //debit the wallet
      $new_cashback = ( $user->cashback - $sum_total );
      $sh_data = array(
        'cashback' => $new_cashback,
      );
      $sh_condition = array( 'id' => $userid );
      $sh_save = $this->generic_model->update_data( 'users', $sh_data, $sh_condition );
      $claimRecord = array(
        'user_id' => $userid,
        'order_id' => 0,
        'transaction_type' => 'debit',
        'amount' => $sum_total, 
        'description' => 'BeepAgro Global Store Products Claim', 
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $claimRecord );
      $this->session->set_flashdata( 'success', 'Checked out successfully!' );
      redirect( 'my_items' );

    }


  }
	
  public function top_up_wallet(){
	  if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
	  $this->form_validation->set_rules( 'method', 'Payment Method', 'required' );
	  $this->form_validation->set_rules( 'amount', 'Funding Amount', 'required' );
	  if ( $this->form_validation->run() === FALSE ) {
		  // Set flash data with an error message
		  $this->session->set_flashdata( 'error', 'make sure all the fields are filled' );
		  redirect( 'my_assets' );
      } else {
		  $amount = $this->input->post( 'amount' );
      	  $method = $this->input->post( 'method' );
		  $percentage = 7.5 / 100; // Converting percentage to decimal
      	  $vat = $amount * $percentage;
		  
		  $save_fund_history = array(
			  'user_id' => $userid,  	
			  'type' => $method,
			  'description' => 'Wallet Funding',
			  'currency' => 'NGN',
			  'amount' => $amount,
			  'status' => 'Pending',
			  'date' => date( 'Y-m-d H:i:s' )

			);
		  
		  $history_condition = array('user_id'=>$userid,'amount'=>$amount,'status'=>'Pending');
		  
		  //check if the record was created before and this is a refresh
		  $funding = $this->generic_model->get_by_condition('funding_history',$history_condition);
		  if(empty($funding)){
		   	  $funding_id  =  $this->generic_model->insert_data('funding_history',$save_fund_history);
		  }else{
			  $funding_id = $funding->id;
		  }
		  
		 // echo $funding_id;
		 // exit;
		  
		  
		   if ($method == 'bank') {

			   $paymentData = array(
				  'amount' => $amount,
				  'vat' => $vat,
				  'funding_id' => $funding_id
				);
			   
				$this->session->set_userdata( $paymentData );
				$table_name = 'bank_accounts';
				$conditions = array('status' => 'active'); // Optional conditions
				$user_details = $this->session->userdata( 'user_details' );
				$data['unread_count'] = $this->generic_model->get_unread_count($userid);
			    $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
				$data['result'] = $this->generic_model->select_all($table_name, $conditions);
			    $data['amount'] = $amount;
			    $data['vat'] = $vat;
				$data[ 'user_details' ] = $user_details;
				$this->load->view( 'top_up', $data );
		   }
		  
		   elseif($method == 'card'){
			   $txref = 'WF-FLW-' . time();
			   $paymentData = array(
				  'amount' => $amount,
				  'txref'=>$txref,
				  'vat' => $vat,
				  'currency'=>'NGN',
				  'funding_id' => $funding_id
				);
			   
			  $this->session->set_userdata( $paymentData );
			  $table_name = 'bank_accounts';
				$conditions = array('status' => 'active'); // Optional conditions
				$user_details = $this->session->userdata( 'user_details' );
				$data['unread_count'] = $this->generic_model->get_unread_count($userid);
			    $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
				$data['result'] = $this->generic_model->select_all($table_name, $conditions);
				$data[ 'user_details' ] = $user_details;
			    $data['amount'] = $amount;
			    $data['vat'] = $vat;
			    $data['funding_id'] = $funding_id;
				$this->load->view( 'top_up_card', $data );
		  }
	  }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
	  
  }
	
  public function claim_wallet() {
    //bring down everything in the order pending
    $userid = $this->session->userdata( 'user_id' );
    $user = $this->generic_model->getInfo( 'users', 'id', $userid );
    $sum_total = $this->generic_model->getSum( 'store_orders', 'amount', array( 'user_id' => $userid, 'status' => 'pending' ) );
    //check that the cashback wallet can work it
    if ( $user->cashback > $sum_total ) {
      //now render the foreach product bonuses
      $products = $this->generic_model->select_where( 'store_orders', array( 'user_id' => $userid, 'status' => 'pending' ) );
      foreach ( $products as $product ) {
        //treat the bonuses
        $product_info = $this->generic_model->getInfo( 'store_products', 'id', $product->product_id );
        //palliatives
        $p_direct = $product_info->Direct;
        $p_level_1 = $product_info->level_1;
        $p_level_2 = $product_info->level_2;
        $p_level_3 = $product_info->level_3;
        $p_level_4 = $product_info->level_4;
        //cashbacks
        $c_direct = $product_info->cashback_direct;
        $c_level_1 = $product_info->cashback_level1;
        $c_level_2 = $product_info->cashback_level2;
        $c_level_3 = $product_info->cashback_level3;
        $c_level_4 = $product_info->cashback_level4;

        //get referrers
        $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
        $direct_ref = $ref_tree->referred_by;
        $lev1 = $ref_tree->level_1;
        $lev2 = $ref_tree->level_2;
        $lev3 = $ref_tree->level_3;
        $lev4 = $ref_tree->level_4;

        //palliatives credit time...
        $this->payout_bonuses( $direct_ref, $p_direct, 'palliative' );
        $this->payout_bonuses( $lev1, $p_level_1, 'palliative' );
        $this->payout_bonuses( $lev2, $p_level_2, 'palliative' );
        $this->payout_bonuses( $lev3, $p_level_3, 'palliative' );
        $this->payout_bonuses( $lev4, $p_level_4, 'palliative' );

        //cashback credit time...
        $this->payout_bonuses( $direct_ref, $c_direct, 'palliative' );
        $this->payout_bonuses( $lev1, $c_level_1, 'cashback' );
        $this->payout_bonuses( $lev2, $c_level_2, 'cashback' );
        $this->payout_bonuses( $lev3, $c_level_3, 'cashback' );
        $this->payout_bonuses( $lev4, $c_level_4, 'cashback' );

        //update the product to processing
        $ranumber = rand( 985773, 998877 );
        $note = 'BPI-' . $ranumber . '-PC';
        $product_update = array( 'status' => 'processing', 'note' => $note );
        $update_condition = array( 'id' => $product->id );
        $this->generic_model->update_data( 'store_orders', $product_update, $update_condition );

      }

      //debit the wallet
      $new_wallet = ( $user->wallet - $sum_total );
      $sh_data = array(
        'wallet' => $new_cashback,
      );
      $sh_condition = array( 'id' => $userid );
      $sh_save = $this->generic_model->update_data( 'users', $sh_data, $sh_condition );
      $claimRecord = array(
        'user_id' => $userid,
        'order_id' => 0,
        'transaction_type' => 'debit',
        'amount' => $sum_total, 
        'description' => 'BeepAgro Global Store Products Claim', 
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $claimRecord );
      $this->session->set_flashdata( 'success', 'Checked out successfully!' );
      redirect( 'my_items' );

    }


  }

  public function complete_order( $id ) {
    $product_update = array( 'status' => 'completed', 'note' => 'Claimed' );
    $update_condition = array( 'id' => $id );
    $this->generic_model->update_data( 'store_orders', $product_update, $update_condition );
    $this->session->set_flashdata( 'success', 'Order Marked as Completed' );
    redirect( 'my_items' );
  }

  public function payout_bonuses( $payto, $amount, $wallet ) {
    $user = $this->generic_model->getInfo( 'users', 'id', $payto );
    $oldwallet_bal = $user->$wallet;
    $newwallet_bal = ( $amount + $oldwallet_bal );
    $update = array( $wallet => $newwallet_bal );
    $condition = array( 'id' => $payto );
    $this->generic_model->update_data( 'users', $update, $condition );

    //transaction history
    $claimRecord = array(
      'user_id' => $payto,
      'order_id' => 0,
      'transaction_type' => 'credit',
      'amount' => $amount, 
      'description' => 'Products Claim ' . $wallet . ' Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $claimRecord );
  }

  public function verify_pickup() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'code', 'Claim Code', 'required' );
    $product = $this->session->userdata( 'code' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', 'Claim Code is required' );
      redirect( 'dashboard' );
    } else {
      $code = $this->input->post( 'code' );
      //check if code is valid
      $code_check = $this->generic_model->getInfo( 'store_orders', 'note', $code );
      if ( empty( $code_check ) ) {
        $this->session->set_flashdata( 'error', 'The claim code you have provided is invalid' );
        redirect( 'dashboard' );
      } else {
        //settle the pickup center 
        $order_id = $code_check->id;
        $product_id = $code_check->product_id;
        $product_info = $this->generic_model->getInfo( 'store_products', 'id', $product_id );
        $pickup_reward = $product_info->pickup_reward;

        //add to pickup center wallet
        $user = $this->generic_model->getInfo( 'users', 'id', $userid );
        $oldwallet_bal = $user->wallet;
        $newwallet_bal = ( $oldwallet_bal + $pickup_reward );
        $user_data = array( 'wallet' => $newwallet_bal );
        $condition = array( 'id' => $userid );
        $this->generic_model->update_data( 'users', $user_data, $condition );

        //transaction history
        $claimRecord = array(
          'user_id' => $userid,
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
        redirect( 'claim_dashboard/' . $order_id );
      }
    }
  }

  public function verify_student_pickup() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'code', 'Claim Code', 'required' );
    $product = $this->session->userdata( 'code' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', 'Claim Code is required' );
      redirect( 'dashboard' );
    } else {
      $code = $this->input->post( 'code' );
      //check if code is valid
      $code_check = $this->generic_model->getInfo( 'student_palliative_locator', 'code', $code );
      if ( empty( $code_check ) ) {
        $this->session->set_flashdata( 'error', 'The claim code you have provided is invalid' );
        redirect( 'dashboard' );
        //}elseif(!empty($code_check) && $code_check->pick_up_center_id != $userid){
        //  $this->session->set_flashdata('error', 'You are not authorized to verify this code, you are not the designated Pickup Center');
        // redirect('dashboard');
      } else {
        //settle the pickup center 
        $order_id = $code_check->id;
        $product_id = $code_check->pack_id;
        $product_info = $this->generic_model->getInfo( 'food_items', 'id', $product_id );
        //$pickup_reward = $product_info->pickup_reward;

        //add to pickup center wallet
        //$user = $this->generic_model->getInfo('users','id',$userid);
        //$oldwallet_bal = $user->wallet;
        //$newwallet_bal = ($oldwallet_bal + $pickup_reward);
        // $user_data = array('wallet'=>$newwallet_bal);
        // $condition = array('id'=>$userid);
        // $this->generic_model->update_data('users',$user_data,$condition);

        //transaction history
        /*$claimRecord = array(
            'user_id' => $userid,
            'order_id' =>$order_id,
            'transaction_type' => 'credit',
            'amount' => $pickup_reward,  
            'description' => 'Product claim pickup-center reward',  
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $claimRecord);*/

        //delete the claim code and verify the claim
        $product_update = array( 'status' => 'delivered', 'code' => 'Verified' );
        $update_condition = array( 'id' => $order_id );
        $this->generic_model->update_data( 'student_palliative_locator', $product_update, $update_condition );
        $this->session->set_flashdata( 'success', 'verification sucessful, please provide item for recipient' );
        redirect( 'dashboard' );
      }
    }
  }

  public function move_to_cart( $id ) {
    //get the cart details
    $cart_details = $this->generic_model->getInfo( 'product_cart', 'id', $id );
    $buyer = $cart_details->user_id;
    $product = $cart_details->product_id;
    $quantity = $cart_details->quantity;
    $product_data = $this->generic_model->getInfo( 'store_products', 'id', $product );
    $total = ( $product_data->price * $quantity );
    $data = array(
      'product_id' => $product,
      'user_id' => $buyer,
      'quantity' => $quantity,
      'amount' => $total,
      'status' => 'pending',
      'order_date' => date( 'Y-m-d H:i:s' ),
    );
    // add order
    $this->db->insert( 'store_orders', $data );

    //delete from cart
    $this->db->where( 'id', $id );
    $this->db->delete( 'product_cart' );

    // Redirect or display success message
    $this->session->set_flashdata( 'success', 'Cart Updated Successfully!' );
    redirect( 'checkout' );


  }

  public function claim_edu_pal( $id ) {
    $userid = $this->session->userdata( 'user_id' );
    //check if claim exist
    $claim_stats = $this->generic_model->get_by_condition( 'active_milestone_claims', array( 'user_id' => $userid, 'shelter_program_id' => 6 ) );
    if ( empty( $claim_stats ) ) {
      //insert claims record
      $mile_stone = array(
        'user_id' => $userid,
        'shelter_program_id' => 6,
        'last_milestone' => $id,
        'date_claimed' => date( 'Y-m-d H:i:s' )

      );
      $this->generic_model->insert_data( 'active_milestone_claims', $mile_stone );
      //insert claims history   
      $milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => $id, 'wallet_package' => 6 ) );
      $claims_history = array(
        'user_id' => $userid,
        'package_id' => 6,
        'buyer_id' => $userid,
        'amount' => 2000000,
        'transaction_type' => 'Palliative Claim',
        'description' => 'Education Palliative Milestone',
        'transaction_date' => date( 'Y-m-d H:i:s' ),
        'status' => 'pending'
      );
      $this->generic_model->insert_data( 'palliative_transaction_history', $claims_history );

      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Education Palliative Milestone Claimed successfully, pending approval!' );
      redirect( 'dashboard' );

    } else {
      //update to latest milestone
      $mile_stone = array(
        'last_milestone' => $id,
        'date_claimed' => date( 'Y-m-d H:i:s' )
      );
      $condition = array( 'user_id' => $userid, 'shelter_program_id' => 6 );
      $this->generic_model->update_data( 'active_milestone_claims', $mile_stone, $condition );
      //insert claims history   
      $milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => $id, 'wallet_package' => 6 ) );
      $claims_history = array(
        'user_id' => $userid,
        'package_id' => 6,
        'buyer_id' => $userid,
        'amount' => 2000000,
        'transaction_type' => 'Palliative Claim',
        'description' => 'Education Palliative Milestone',
        'transaction_date' => date( 'Y-m-d H:i:s' ),
        'status' => 'pending'
      );
      $this->generic_model->insert_data( 'palliative_transaction_history', $claims_history );
      // Redirect or display success message
      $this->session->set_flashdata( 'success', 'Education Palliative Milestone Claimed successfully, pending approval!' );
      redirect( 'dashboard' );
    }
  }

  public function car_claim() {
    $userid = $this->session->userdata( 'user_id' );
    //insert claims record
    $mile_stone = array(
      'user_id' => $userid,
      'shelter_program_id' => 7,
      'last_milestone' => 1,
      'date_claimed' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'active_milestone_claims', $mile_stone );
    //insert claims history   
    $claims_history = array(
      'user_id' => $userid,
      'package_id' => 7,
      'buyer_id' => $userid,
      'amount' => 10000000,
      'transaction_type' => 'Palliative Claim',
      'description' => 'Car Palliative Completed',
      'transaction_date' => date( 'Y-m-d H:i:s' ),
      'status' => 'pending'
    );
    $this->generic_model->insert_data( 'palliative_transaction_history', $claims_history );
    $this->reset_pal( $id );

    // Redirect or display success message
    $this->session->set_flashdata( 'success', 'Car Palliative Claimed successfully, pending approval!' );
    redirect( 'dashboard' );
  }

  public function claim_shelter_pal( $id ) {
    $userid = $this->session->userdata( 'user_id' );
    $shelter_option = $this->generic_model->getInfo( 'shelter_program', 'id', $id );
    //insert claims record
    $mile_stone = array(
      'user_id' => $userid,
      'shelter_program_id' => $id,
      'last_milestone' => 1,
      'date_claimed' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'active_milestone_claims', $mile_stone );
    //insert claims history   
    $claims_history = array(
      'user_id' => $userid,
      'package_id' => $id,
      'buyer_id' => $userid,
      'amount' => $shelter_option->amount,
      'transaction_type' => 'Palliative Claim',
      'description' => $shelter_option->name,
      'transaction_date' => date( 'Y-m-d H:i:s' ),
      'status' => 'pending'
    );
    $this->generic_model->insert_data( 'palliative_transaction_history', $claims_history );
    $this->reset_pal( $id );

    // Redirect or display success message
    $this->session->set_flashdata( 'success', $shelter_option->name . ' Claimed successfully, pending approval!' );
    redirect( 'dashboard' );
  }

  public function reset_pal( $id ) {
    $userid = $this->session->userdata( 'user_id' );
    if ( $id == 6 ) {
      $wallet = 'education';
    } elseif ( $id == 7 ) {
      $wallet = 'car';
    } elseif ( $id == 8 ) {
      $wallet = 'land';
    } elseif ( $id == 9 ) {
      $wallet = 'business';
    } else {
      $wallet = 'shelter';
    }
    $user_detail = array(
      'shelter_wallet' => 0,
      $wallet => 0,
      'is_vip' => 0,
      'is_shelter' => 0
    );
    $update_condition = array( 'id' => $userid );
    $this->generic_model->update_data( 'users', $user_detail, $update_condition );

    //delete active shelters
    $this->db->where( 'user_id', $userid );
    $this->db->delete( 'active_shelters' );

  }

  public function shelter_claim() {
    $userid = $this->session->userdata( 'user_id' );
    //insert claims record
    $mile_stone = array(
      'user_id' => $userid,
      'shelter_program_id' => 7,
      'last_milestone' => 1,
      'date_claimed' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'active_milestone_claims', $mile_stone );
    //insert claims history   
    $claims_history = array(
      'user_id' => $userid,
      'package_id' => 7,
      'buyer_id' => $userid,
      'amount' => 10000000,
      'transaction_type' => 'Palliative Claim',
      'description' => 'Car Palliative Completed',
      'transaction_date' => date( 'Y-m-d H:i:s' ),
      'status' => 'pending'
    );
    $this->generic_model->insert_data( 'palliative_transaction_history', $claims_history );

    // Redirect or display success message
    $this->session->set_flashdata( 'success', 'Car Palliative Claimed successfully, pending approval!' );
    redirect( 'dashboard' );
  }

  function check_link_contains_url( $submitted_link, $url_to_check ) {
    // Check if the submitted link contains the exact URL stored in $url_to_check
    if ( strpos( $submitted_link, $url_to_check ) !== false ) {
      return 1; // The submitted link contains the exact URL stored in $url_to_check
    } else {
      return 0; // The submitted link does not contain the exact URL stored in $url_to_check
    }
  }

  public function link_builder() {
    $userid = $this->session->userdata( 'user_id' );
    $this->form_validation->set_rules( 'link_name', 'Link Name', 'required' );
    $this->form_validation->set_rules( 'link', 'Link', 'required' );
    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'refer' );
    } else {
      $link_val = $this->input->post( 'link_name' );
      $ref_link = $this->input->post( 'link' );
      $link_val_name = $this->generic_model->getInfo( 'link_enforcer', 'id', $link_val )->link;

      $check_link = $this->check_link_contains_url( $ref_link, $link_val_name );
      if ( !empty( $check_link ) ) {
        $link_array = array(
          'user_id' => $userid,
          'link' => $this->input->post( 'link' ),
          'name' => $this->input->post( 'link_name' ),
          'date' => date( 'Y-m-d H:i:s' )
        );
        $this->generic_model->insert_data( 'link_builder', $link_array );
        $this->session->set_flashdata( 'success', 'Link Shared Successfully' );
        redirect( 'refer' );
      } else {
        $this->session->set_flashdata( 'error', 'You are trying to add an invalid link, please use the approved links' );
        redirect( 'refer' );
      }


    }
  }

  public function delete_link( $id ) {
    $this->db->where( 'id', $id );
    $this->db->delete( 'link_builder' );
    $this->session->set_flashdata( 'ref_success', 'Link Deleted Successfully!' );
    redirect( 'refer' );
  }

  public function claim_student_pal() {
    $userid = $this->session->userdata( 'user_id' );
    $this->db->where( 'user_id', $userid );
    $this->db->delete( 'activation_countdown' );

    //update the user table to start all over
    $user_data = array( 'activated' => 0 );
    $condition = array( 'id' => $userid );
    $this->generic_model->update_data( 'users', $user_data, $condition );

    //delete the order from the order table
    $this->db->where( 'user_id', $userid );
    $this->db->delete( 'orders' );
    redirect( 'my_items' );
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

  public function donor() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $tickets = $this->generic_model->select_where( 'philanthropy_tickets', array( 'created_by' => $userid ) );
      $partner_offers = $this->generic_model->select_all_data( 'philanthropy_offers' );
      $user_details = $this->session->userdata( 'user_details' );
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $data[ 'tickets' ] = $tickets;
      $data[ 'partner_offers' ] = $partner_offers;
      $this->load->view( 'donor', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function pal_donate() {
    $this->form_validation->set_rules( 'quantity', 'Quantity', 'required' );
    $this->form_validation->set_rules( 'offer', 'Quantity', 'required' );
    $this->form_validation->set_rules( 'payment', 'Payment Option', 'required' );
    $product = $this->session->userdata( 'product_id' );

    if ( $this->form_validation->run() === FALSE ) {
      // Form validation failed, reload the form
      $this->session->set_flashdata( 'error', 'make sure all fields are filled' );
      redirect( 'donor' );
    } else {
      $userid = $this->session->userdata( 'user_id' );
      $offer = $this->input->post( 'offer' );
      $offer_details = $this->generic_model->getInfo( 'philanthropy_offers', 'id', $offer );
      $partner_details = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $offer_details->partner_id );
      $quantity = $this->input->post( 'quantity' );
      $payment_option = $this->input->post( 'payment' );
      $total = ( $offer_details->amount * $quantity );
      $user = $this->generic_model->getInfo( 'users', 'id', $userid );
      if ( $payment_option == 'wallet' ) {
        if ( $user->wallet > $total ) {
          //make we commot the mula first
          $oldMula = $user->wallet;
          $newMula = ( $user->wallet - $total );
          $user_data = array(
            'wallet' => $newMula
          );
          $this->generic_model->update_data( 'users', $user_data, array( 'id' => $userid ) );

          //transaction details
          $claimRecord = array(
            'user_id' => $userid,
            'order_id' => 0,
            'transaction_type' => 'debit',
            'amount' => $total, 
            'description' => 'BPI Meal & Healthcare Palliative', 
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $claimRecord );

          $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          $numbers = '0123456789';
          $random_chars = '';
          for ( $i = 0; $i < 3; $i++ ) {
            $random_chars .= $characters[ rand( 0, strlen( $characters ) - 1 ) ];
          }

          // Generate random numbers
          $random_numbers = '';
          for ( $i = 0; $i < 5; $i++ ) {
            $random_numbers .= $numbers[ rand( 0, strlen( $numbers ) - 1 ) ];
          }
          // Combine random characters and numbers
          $random_code = $random_chars . '-' . $random_numbers . '-BPI';


          //time to insert into the database
          for ( $i = 0; $i < $quantity; $i++ ) {
            $data = array(
              'created_by' => $userid,
              'offer_id' => $offer,
              'code' => $random_code . $i,
              'partner_id' => $offer_details->partner_id,
              'category_id' => $partner_details->category_id,
              'ticket_amount' => $offer_details->amount,
              'activated_date' => date( 'Y-m-d H:i:s' ),
              'status' => 'active'
            );
            $this->generic_model->insert_data( 'philanthropy_tickets', $data );
          }

          //send the user his or her own email
          $to_user = $user->email;
          $subject_user = 'Thank You for Your Generous Donation! (BPI)';
          $title_user = 'Hello ' . $user->firstname;
          $message_user = '<p>
	We hope this email finds you well. We are writing to express our heartfelt gratitude for your recent donation to BPI Meal Palliative. Your generous contribution will make a significant impact on our mission to provide decent meals to the deserving.
	</p><br>
	<p>
	We are truly grateful for your kindness and generosity. Your donation not only provides us with the resources we need but also serves as a source of inspiration for our team and the community we serve.
	</p>
    
    <br>
    <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
    Our support team is here to help you with any concerns you may have.<br>
    Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
    Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
    Best regards,<br>
    BeepAgro Palliative Initiative (BPI) Team.</p>';

          $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
          $this->session->set_flashdata( 'success', 'Your donation was successful, you can track the beneficiary when it is claimed' );
          redirect( 'donor' );
        } else {
          $this->session->set_flashdata( 'error', 'Insufficient Wallet balance for this transaction' );
          redirect( 'donor' );
        }
      } elseif ( $payment_option == 'card' ) {
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'offer' => $offer,
          'quantity' => $quantity,
          'category_id' => $partner_details->category_id,
          'ticket_amount' => $offer_details->amount
        );

        $this->session->set_userdata( $paymentData );
        $user_details = $this->session->userdata( 'user_details' );
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $total;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'donor_card_pay', $data );

      }
      elseif ( $payment_option == 'bank' ) {
        $txref = 'BA-FLW-' . time();
        $paymentData = array(
          'txref' => $txref,
          'offer' => $offer,
          'quantity' => $quantity,
          'location_id' => $offer_details->partner_id,
          'category_id' => $partner_details->category_id,
          'ticket_amount' => $offer_details->amount,
          'amount' => $total
        );

        $this->session->set_userdata( $paymentData );

        $table_name = 'bank_accounts';
        $conditions = array( 'status' => 'active' ); // Optional conditions
        $user_details = $this->session->userdata( 'user_details' );
        $data[ 'user_details' ] = $user_details;
        $data[ 'amount' ] = $total;
        $data[ 'result' ] = $this->generic_model->select_all( $table_name, $conditions );$data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $this->load->view( 'donor_bank_transfer', $data );
      }
      else {
        $this->session->set_flashdata( 'error', 'there are errors in your form' );
        redirect( 'donor' );
      }
    }
  }

  public function donor_bank_confirm() {
    $userid = $this->session->userdata( 'user_id' );
    $user_details = $this->session->userdata( 'user_details' );
    $data[ 'user_details' ] = $user_details;
    $data[ 'amount' ] = $_SESSION[ 'amount' ];
    $data[ 'offer' ] = $_SESSION[ 'offer' ];
    $data[ 'quantity' ] = $_SESSION[ 'quantity' ];
    $data[ 'location_id' ] = $_SESSION[ 'location_id' ];
    $data[ 'category_id' ] = $_SESSION[ 'category_id' ];
    $data[ 'ticket_amount' ] = $_SESSION[ 'ticket_amount' ];$data['unread_count'] = $this->generic_model->get_unread_count($userid);
	$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
    $this->load->view( 'donor_bank_confirm', $data );
  }
	
  public function bank_wallet_confirm(){
    $user_id = $this->session->userdata( 'user_id' );
    $amount = $_SESSION['amount'];
    $percentage = 7.5 / 100; // Converting percentage to decimal
    $vat = $amount * $percentage;
    $data['unread_count'] = $this->generic_model->get_unread_count($user_id);
    $data['notifications'] = $this->generic_model->get_notifications($user_id);
    $data['amount'] = $amount;
    $data['vat'] = $vat;
	$data['funding_id'] = $_SESSION['funding_id'];
    $data['user_details'] = $this->db->get_where( 'users', array( 'id' => $user_id ) )->row();
    $this->load->view('wallet_confirm', $data);
  }

  public function donor_processPayment() {
    // Upload receipt image
    $config[ 'upload_path' ] = './receipts/';
    $config[ 'allowed_types' ] = 'gif|jpg|png|jpeg|pdf';
    $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
    $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
    $userId = $this->session->userdata( 'user_id' );
    $this->load->library( 'upload', $config );
    $amount = $this->input->post( 'amount' );
    $offer = $this->input->post( 'offer' );
    $quantity = $this->input->post( 'quantity' );
    $location_id = $this->input->post( 'location_id' );
    $category_id = $this->input->post( 'category_id' );
    $ticket_amount = $this->input->post( 'ticket_amount' );

    if ( !$this->upload->do_upload( 'receipt_image' ) ) {
      // Handle upload error
      $error = $this->upload->display_errors();
      echo $error;
    } else {
      // Upload successful, get file info
      $upload_data = $this->upload->data();
      $file_path = 'receipts/' . $upload_data[ 'file_name' ];
      $type = 'Bank';
      $this->generic_model->saveReceiptPath_donor( $file_path, $userId, $type, $amount );

      //add the vat data
      $donor_data = array(
        'user_id' => $userId,
        'amount' => $amount,
        'offer' => $offer,
        'quantity' => $quantity,
        'location_id' => $location_id,
        'category_id' => $category_id,
        'ticket_amount' => $ticket_amount,
        'date' => date( 'Y-m-d H:i:s' )
      );
      $this->generic_model->insert_data( 'donor_bank_data', $donor_data );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userId ) )->row();
      // Set user details in session (optional)

      $to = 'admin@beepagro.com';
      $subject = 'BPI - Donation Approval Request (Bank Payment)';
      $title = 'Hello Admin';
      $message = '<p>A new Donation Approval Request for Bank Payment has been submitted.</p>
    <p>Please logon to the admin portal to authenticate and approve this request. You will find it in Donor Bank Bank Data, under Transaction Management</p>
    <p>
	<br><br>
    BPI Alert,<br>
    Admin Notifications.</p>';

      $this->sendemail( $title, $to, $subject, $message );

      //send the user his or her own email
      $to_user = $user_details->email;
      $subject_user = 'BPI - Donation Approval Request (Bank Payment)';
      $title_user = 'Hello ' . $user_details->firstname;
      $message_user = '<p>Your Donation Approval Request for Bank Payment is been processed</p>
    <p>You will be notified on the status of your request via email.</p>
    
    <br>
    <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
    Our support team is here to help you with any concerns you may have.<br>
    Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
    We look forward to having you as a valued member of our community.<br><br>
    Best regards,<br>
    BeepAgro Palliative Initiative (BPI) Team.</p>';

      $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
      $this->session->set_userdata( 'user_details', $user_details );
      $_SESSION[ 'item' ] = 'BPI Donations';
      $_SESSION[ 'amount' ] = $amount;
      $_SESSION[ 'vat' ] = 0;
      $_SESSION[ 'qty' ] = $quantity;
      // Handle success (redirect, display message, etc.)
      redirect( 'payment_success_page' );
    }
  }

  public function upgrade_processPayment() {
    // Upload receipt image
    $config[ 'upload_path' ] = './receipts/';
    $config[ 'allowed_types' ] = 'gif|jpg|png|jpeg|pdf';
    $config[ 'max_size' ] = 40960; // 4MB max size (adjust as needed)
    $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
    $userId = $this->session->userdata( 'user_id' );
    $this->load->library( 'upload', $config );
    $amount = $this->input->post( 'amount' );
    $vat = $this->input->post( 'vat' );
    if ( !$this->upload->do_upload( 'receipt_image' ) ) {
      // Handle upload error
      $error = $this->upload->display_errors();
      echo $error;
    } else {
      // Upload successful, get file info
      $upload_data = $this->upload->data();
      $file_path = 'receipts/' . $upload_data[ 'file_name' ];
      $type = 'Bank';
      $this->generic_model->saveReceiptPath_upgrade( $file_path, $userId, $type, $amount );

      //add the vat data
      //add the vat data
      $vat_data = array(
        'user_id' => $userId,
        'amount' => $amount,
        'activity' => 'BPI Activation',
        'vat' => $vat,
        'date' => date( 'Y-m-d H:i:s' )
      );
      $this->generic_model->insert_data( 'vat_data', $vat_data );
      $this->session->unset_userdata( 'user_details' );
      // Fetch user details
      $user_details = $this->db->get_where( 'users', array( 'id' => $userId ) )->row();
      // Set user details in session (optional)

      $to = 'admin@beepagro.com';
      $subject = 'BPI Package Upgrade Request (Bank Payment)';
      $title = 'Hello Admin';
      $message = '<p>A new BPI Package Upgrade Request for Bank Payment has been submitted.</p>
    <p>Please logon to the admin portal to authenticate and approve this request. You will find it in Upgrade Payment, under Transaction Management</p>
    <p>
	<br><br>
    BPI Alert,<br>
    Admin Notifications.</p>';

      $this->sendemail( $title, $to, $subject, $message );

      //send the user his or her own email
      $to_user = $user_details->email;
      $subject_user = 'BPI Package Upgrade Request (Bank Payment)';
      $title_user = 'Hello ' . $user_details->firstname;
      $message_user = '<p>Your BPI Package Upgrade Request for Bank Payment is been processed</p>
    <p>You will be notified on the status of your request via email.</p>
    
    <br>
    <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
    Our support team is here to help you with any concerns you may have.<br>
    Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
    We look forward to having you as a valued member of our community.<br><br>
    Best regards,<br>
    BeepAgro Palliative Initiative (BPI) Team.</p>';

      $this->sendemail( $title_user, $to_user, $subject_user, $message_user );
      $this->session->set_userdata( 'user_details', $user_details );
      $_SESSION[ 'item' ] = 'BPI Upgrade';
      $_SESSION[ 'amount' ] = $amount;
      $_SESSION[ 'vat' ] = $vat;
      $_SESSION[ 'qty' ] = 1;
      // Handle success (redirect, display message, etc.)
      redirect( 'payment_success_page' );
    }

  }

  public function donor_flutterwaveCallback() {
    $txref = $_SESSION[ 'txref' ];
    $userid = $this->session->userdata( 'user_id' );
    $user_email = $this->generic_model->getInfo( 'users', 'id', $userid )->email;
    $date = date( 'Y-m-d H:i:s' );
    $transaction_id = $this->input->get( 'transaction_id', TRUE );
    $currentDate = new DateTime();
    $curl = curl_init();

    curl_setopt_array( $curl, array(
      CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/" . $transaction_id . "/verify",
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
      CURLOPT_HTTPHEADER => array(
        "Content-Type: application/json",
        "Authorization: Bearer " . $this->generic_model->getInfo( 'tbl_addons_api', 'source', 'FLWT' )->secret_key
      ),
    ) );

    $response = curl_exec( $curl );
    $resp = json_decode( $response, true );

    $paymentStatus = $resp[ 'status' ];
    $paymentMessage = $resp[ 'message' ];
    $paymentStatId = $resp[ 'data' ][ 'id' ];
    $paymentTxRef = $resp[ 'data' ][ 'tx_ref' ];
    $flwref = $resp[ 'data' ][ 'flw_ref' ];
    $chargeAmountPlain = $resp[ 'data' ][ 'amount' ];
    $chargeAmount = $resp[ 'data' ][ 'charged_amount' ];
    $chargeCurrency = $resp[ 'data' ][ 'currency' ];
    $appFee = $resp[ 'data' ][ 'app_fee' ];
    $merchantFee = $resp[ 'data' ][ 'merchant_fee' ];
    $provider_response = $resp[ 'data' ][ 'processor_response' ];
    $auth_model = $resp[ 'data' ][ 'auth_model' ];
    $chargeIp = $resp[ 'data' ][ 'ip' ];
    $narration = $resp[ 'data' ][ 'narration' ];
    $dataStatus = $resp[ 'data' ][ 'status' ];
    $chargePaymentType = $resp[ 'data' ][ 'payment_type' ];
    $account_id = $resp[ 'data' ][ 'account_id' ];
    $createdAt = $resp[ 'data' ][ 'created_at' ];
    $metadata = $resp[ 'data' ][ 'meta' ];
    $amount_settled = $resp[ 'data' ][ 'amount_settled' ];
    $custid = $resp[ 'data' ][ 'customer' ][ 'id' ];
    $custPhone = $resp[ 'data' ][ 'customer' ][ 'phone_number' ];
    $custEmail = $resp[ 'data' ][ 'customer' ][ 'email' ];

    $data = array(
      'paymentStatus' => $paymentStatus,
      'paymentMessage' => $paymentMessage,
      'paymentStatId' => $paymentStatId,
      'paymentTxRef' => $paymentTxRef,
      'flwref' => $flwref,
      'chargeAmountPlain' => $chargeAmountPlain,
      'chargeAmount' => $chargeAmount,
      'chargeCurrency' => $chargeCurrency,
      'appFee' => $appFee,
      'merchantFee' => $merchantFee,
      'provider_response' => $provider_response,
      'auth_model' => $auth_model,
      'chargeIp' => $chargeIp,
      'narration' => $narration,
      'dataStatus' => $dataStatus,
      'chargePaymentType' => $chargePaymentType,
      'account_id' => $account_id,
      'createdAt' => $createdAt,
      'metadata' => json_encode( $metadata ),
      'amount_settled' => $amount_settled,
      'custid' => $custid,
      'custPhone' => $custPhone,
      'custEmail' => $custEmail
    );

    $this->db->insert( 'flutterwave_payments', $data );

    if ( $paymentStatus == "success" ) {
      //Give Value and return to Success page

      //for creating the txn code
      $this->load->helper( 'string' );

      //Variables
      $method = 'flutterwave';
      $date = date( 'Y-m-d H:i:s' );
      $datetime = date( 'Y-m-d H:i:s' );
      $finalDeposit = $chargeAmountPlain;

      //Deposit Array
      $depositInfo = array(
        'userId' => $userid,
        'txnCode' => $_SESSION[ 'txref' ],
        'amount' => $finalDeposit,
        'paymentMethod' => $method,
        'createdDtm' => $datetime
      );
      $this->generic_model->insert_data( 'deposits', $depositInfo );
      $user_table = 'users';
      //check if it is part pay and what state it is...
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $quantity = $_SESSION[ 'quantity' ];
      //get partner id from the offer

      $partner_info = $this->generic_model->getInfo( 'philanthropy_offers', 'id', $_SESSION[ 'offer' ] );

      $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      $numbers = '0123456789';
      $random_chars = '';
      for ( $i = 0; $i < 3; $i++ ) {
        $random_chars .= $characters[ rand( 0, strlen( $characters ) - 1 ) ];
      }

      // Generate random numbers
      $random_numbers = '';
      for ( $i = 0; $i < 5; $i++ ) {
        $random_numbers .= $numbers[ rand( 0, strlen( $numbers ) - 1 ) ];
      }
      // Combine random characters and numbers
      $random_code = $random_chars . '-' . $random_numbers . '-BPI';


      for ( $i = 0; $i < $quantity; $i++ ) {
        $data = array(
          'created_by' => $userid,
          'offer_id' => $_SESSION[ 'offer' ],
          'code' => $random_code . $i,
          'partner_id' => $partner_info->partner_id,
          'category_id' => $_SESSION[ 'category_id' ],
          'ticket_amount' => $_SESSION[ 'ticket_amount' ],
          'activated_date' => date( 'Y-m-d H:i:s' ),
          'status' => 'active'
        );
        $this->generic_model->insert_data( 'philanthropy_tickets', $data );
      }

      $to_user = $user->email;
      $subject_user = 'Thank You for Your Generous Donation! (BPI)';
      $title_user = 'Hello ' . $user->firstname;
      $message_user = '<p>
	We hope this email finds you well. We are writing to express our heartfelt gratitude for your recent donation to BPI Meal Palliative. Your generous contribution will make a significant impact on our mission to provide decent meals to the deserving.
	</p><br>
	<p>
	We are truly grateful for your kindness and generosity. Your donation not only provides us with the resources we need but also serves as a source of inspiration for our team and the community we serve.
	</p>
    
    <br>
    <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
    Our support team is here to help you with any concerns you may have.<br>
    Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
    Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
    Best regards,<br>
    BeepAgro Palliative Initiative (BPI) Team.</p>';

      $this->sendemail( $title_user, $to_user, $subject_user, $message_user );

      $this->session->set_flashdata( 'success', 'Your donation was successful, you can track the beneficiary when it is claimed' );
      redirect( 'donor' );
    } else {
      $this->session->set_flashdata( 'error', 'unable to process this transaction at the moment, try again in a few minutes' );
      redirect( 'dashboard' );
    }
  }

  public function claim_ticket() {
    $id = $this->input->post( 'ticket_id' );
    //get creator, you can't claim as long as you have a ticket created or claim your own ticket.
    $ticket = $this->generic_model->getInfo( 'philanthropy_tickets', 'id', $id );
    $userid = $this->session->userdata( 'user_id' );
    if ( $ticket->created_by == $userid ) {
      $this->session->set_flashdata( 'error', 'You cannot claim your own ticket' );
      redirect( 'dashboard' );
    } else {
      $ticket_data = array(
        'used_by' => $userid,
        'status' => 'claimed',
        'date_claimed' => date( 'Y-m-d H:i:s' )
      );
      $this->generic_model->update_data( 'philanthropy_tickets', $ticket_data, array( 'id' => $id ) );
      $this->session->set_flashdata( 'success', 'Claim Successful, your ticket will become valid after 24 hours.' );
      redirect( 'dashboard' );
    }
  }

  public function part_getCities() {
    $stateId = $this->input->post( 'code', TRUE );
    $city_list = $this->generic_model->get_cities( $stateId );
    $data = '<select class="form-control form-control-lg" id="city_id" name="city">';
    $data .= '<option value="">Select City</option>';
    $data .= '<option value="all">All</option>';
    foreach ( $city_list as $city ) {
      $data .= '<option value="' . $city->id . '">' . $city->name . '</option> ';
    }
    $data .= '</select>';
    echo $data;
  }

  public function getCities() {
    $stateId = $this->input->post( 'code', TRUE );
    $city_list = $this->generic_model->get_cities( $stateId );
    $data = '<select class="form-control form-control-lg" id="city_id" name="city">';
    $data .= '<option value="">Select City</option>';
    $data .= '<option value="all">All</option>';
    foreach ( $city_list as $city ) {
      $data .= '<option value="' . $city->id . '">' . $city->name . '</option> ';
    }
    $data .= '</select>';
    echo $data;
  }

  public function getStates() {
    $country = $this->input->post( 'code', TRUE );
    //echo $countryCode;
    //exit;
    $state_list = $this->generic_model->get_states( $country );
    $data = '<select class="form-control form-control-lg" id="state_id" name="state" onChange="getCities()">';
    $data .= '<option value="">Select State</option>';
    $data .= '<option value="all">All</option>';
    foreach ( $state_list as $state ) {
      $data .= '<option value="' . $state->id . '">' . $state->name . '</option> ';
    }
    $data .= '</select>';
    echo $data;

  }

  public function apply_pickup() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'user_details' ] = $user_details;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $this->load->view( 'apply_merchant', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function start_application() {
    $userid = $this->session->userdata( 'user_id' );
    $user = $this->generic_model->getInfo( 'users', 'id', $userid );
    if ( empty( $user->merchant_pic ) ) {
      $this->session->set_flashdata( 'address_error', 'You must first upload a Pickup Center Logo before sumbitting this application form' );
      redirect( 'apply_pickup' );
    } else {
      $this->form_validation->set_rules( 'center_name', 'Center Name', 'required' );
      $this->form_validation->set_rules( 'email', 'Center Email', 'required' );
      $this->form_validation->set_rules( 'phone', 'Center Phone', 'required' );
      $this->form_validation->set_rules( 'address', 'Center Address', 'required' );
      $this->form_validation->set_rules( 'city', 'Center City', 'required' );
      $this->form_validation->set_rules( 'state', 'Center State', 'required' );
      $this->form_validation->set_rules( 'country', 'Center Country', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
        // Form validation failed, reload the form
        $this->session->set_flashdata( 'address_error', 'Claim Code is required' );
        redirect( 'apply_pickup' );
      } else {
        $merchant_data = array(
          'user_id' => $userid,
          'merchant_name' => $this->input->post( 'center_name' ),
          'merchant_rank' => $this->input->post( 'address' ),
          'merchant_city' => $this->input->post( 'city' ),
          'merchant_state' => $this->input->post( 'state' ),
          'merchant_country' => $this->input->post( 'country' ),
          'merchant_phone' => $this->input->post( 'phone' ),
          'merchant_email' => $this->input->post( 'email' ),
          'merchant_link' => $user->username,
          'datejoined' => date( 'Y-m-d H:i:s' ),
          'status' => 'pending'
        );
        $this->generic_model->insert_data( 'merchants', $merchant_data );
        $this->session->set_flashdata( 'address_success', 'Application submitted successfully, pending approval' );
        redirect( 'apply_pickup' );
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

  public function convertBMT( $package_id, $amount, $price, $userid, $cashback, $palliavtive ) {
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
    //get the tax settings
    $palliative_meal_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 1 )->percentage;
    $palliative_env_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 3 )->percentage;

    //we handle calculations for tax settings
    $percentageAmount_pmt = ( $palliative_meal_tax / 100 ) * $palliavtive;
    $percentageAmount_pet = ( $palliative_env_tax / 100 ) * $palliavtive;

    $total_deductable = ( $percentageAmount_pmt + $percentageAmount_pet );
    $palliavtive = ( $palliavtive - $total_deductable );

    //save tax details... 	
    $tax_pmt_array = array(
      'user_id' => $userid,
      'wallet' => 'palliative',
      'amount' => $percentageAmount_pmt,
      'activity' => 'Palliative Meal Tax',
      'percentage' => $palliative_meal_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_pmt_array );

    $tax_pet_array = array(
      'user_id' => $userid,
      'wallet' => 'palliative',
      'amount' => $percentageAmount_pet,
      'activity' => 'Environmental Protection Tax',
      'percentage' => $palliative_env_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_pet_array );


    $package = $this->generic_model->getInfo( 'packages', 'id', $package_id );
    $bmtConvert = number_format( ( $amount / $price ), 8 );
    $user = $this->generic_model->getInfo( 'users', 'id', $userid );
    $oldBMT = $user->token;
    $oldCashback = $user->cashback;
    $oldPalliative = $user->palliative;
    $newBMT = number_format( ( $bmtConvert + $oldBMT ), 8 );
    $newCashback = ( $cashback + $oldCashback );
    $palliative_tax =
      $newPalliative = ( $palliavtive + $oldPalliative );

    //check if the shelter is activated if not activate it if the amount in palliative wallet has reached the required amount.
    $is_shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
    if ( !empty( $is_shelter ) ) {
      //what is their level?
      $package_level = $is_shelter->shelter_package;
      if ( $package_level == 1 ) {
        //silver subscriber........
        //if the user balance has exceeded limiit or it's time to activate shelter wallet
        if ( $newPalliative > 100000 ) {
          $user_shelter_status = $user->shelter_wallet;
          if ( empty( $user_shelter_status ) ) {
            //activate the shelter wallet and add balance to the palliative wallet.
            $walletBalance = ( $newPalliative - 100000 );
            $sh_data = array(
              'palliative' => $walletBalance,
              'is_shelter' => 1,
              'shelter_wallet' => 1,
              'shelter_pending' => 0
            );
            $sh_condition = array( 'id' => $userid );
            $sh_save = $this->generic_model->update_data( 'users', $sh_data, $sh_condition );

            //save transaction history .........
            $transactionDataShelter1 = array(
              'user_id' => $userid,
              'order_id' => $package_level,
              'transaction_type' => 'debit',
              'amount' => 100000, 
              'description' => 'Silver Shelter Wallet activation', 
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter1 );
            //send debit email
            $to = $userInfo->email;
            $subject = 'Debit Transaction Notification (BPI)!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'This is to notify you that a debit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN100,000.00]</li>
							<li>Description: [Silver Shelter Wallet activation]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						If you recognize this transaction, there is no further action needed on your part. However, if you do not recognize this transaction or believe it to be unauthorized, please contact our support team immediately at [support@beepagro.com].
						<br>
						<br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );

            $shelter_active = array(
              'user_id' => $userid,
              'amount' => 100000,
              'type' => 'Silver Shelter Wallet',
              'status' => 'Completed',
              'activated_date' => date( 'Y-m-d H:i:s' )
            );
            $this->generic_model->insert_data( 'shelter_wallet_activation', $shelter_active );
            //save the money paid for tracking....
            $shelter_type = $is_shelter->shelter_option;
            $shelter_type_name = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_type )->name;
            $ref_data = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
            $sponsor_data = $this->generic_model->getInfo( 'users', 'id', $ref_data->id );
            //send email
            $to = $userInfo->email;
            $subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
					<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: ' . $userInfo->firstname . ' ' . $userInfo->lastname . '</li>
						<li>Username: ' . $userInfo->username . '</li>
						<li>Sponsor Name: ' . $sponsor_data->firstname . ' ' . $sponsor_data->lastname . '</li>
						<li>Sponsor Email: ' . $sponsor_data->email . '</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref=' . $userInfo->referral_link . '</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>' . $shelter_type_name . '</li>
						<li>BPI Annual First Year payment membership (Silver Plus subscription)</li>
						<li>BPI Activation Details: As an active member, you have access to our palliative focus areas, including shelter, education, car, land, and agro products.</li>
						<li>Referral Link</li>
					</ul>
					<br>
					<br>
					As an active member of BPI, we have some important requirements for you:<br>
					<ol>
						<li>Start your journey with a desire to benefit from any of our palliative focuses</li>
						<li>Be an active member always, to continuously enjoy our palliative reward benefits./li>
						<li>Identify and refer between 20 to 100 individuals who have needs for our palliative reward (shelter, education, car, land, or agro products) using your unique BPI referral link.</li>
						<li>Work towards achieving this goal within 4 weeks of your membership activation.</li>
					</ol>
					<br>
					<br>
					Please remember, if you are unable to meet these terms and conditions, there is no need to join BPI. 
					<br>
					Additionally, as an active BPI member, you have access to the following BPI Training Telegram Channels:
					<br><br>
						1. Environmental Protection Training (Waste to wealth) powered by Corsair/Amplivo.<br>
						2. Become An Advertising Consultant (Watch & Earn) powered by Vizualize Club.<br>
						3. Blockchain & Cryptocurrency Education (Blockchain wealth) powered by BPI & Baca Digital.<br>
						4. Information Communication Technology: Career & Skills development (Basic ICT Skills: Eg: Data Analyst)
					<br>
					<br>
					Before joining these communities, please visit the Referral section in your BPI Account and complete your registration process by signing up with all the approved Third-party programs and updating your third-party referral link in your BPI Account.
					<br>
					<br>
					We are thrilled to have you as a part of our community and look forward to making a positive impact together. <br>If you have any questions or need assistance, feel free to reach out to us at [support@beepagro.com].
					<br>
					<br>
                    Best regards,
					<br>
                    BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );


            //distribute the rewards from the shelter activation...
            $regular_vip_commission = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 2 );
            $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 3 );
            $direct = ( $vip_commissions->Direct - $regular_vip_commission->Direct );
            $level_1 = ( $vip_commissions->level_1 - $regular_vip_commission->level_1 );
            $level_2 = ( $vip_commissions->level_2 - $regular_vip_commission->level_2 );
            $level_3 = ( $vip_commissions->level_3 - $regular_vip_commission->level_3 );

            //cashback commissions
            $regular_wal_commission = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 2 );
            $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 3 );
            $direct_wallet = ( $vip_commissions_wallet->Direct - $regular_wal_commission->Direct );
            $level_1_wallet = ( $vip_commissions_wallet->level_1 - $regular_wal_commission->level_1 );
            $level_2_wallet = ( $vip_commissions_wallet->level_2 - $regular_wal_commission->level_2 );
            $level_3_wallet = ( $vip_commissions_wallet->level_3 - $regular_wal_commission->level_3 );

            //bmt commissions
            $regular_bpt_commission = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 2 );
            $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 3 );
            $direct_bmt = ( $vip_commissions_bmt->Direct - $regular_bpt_commission->Direct );
            $level_1_bmt = ( $vip_commissions_bmt->level_1 - $regular_bpt_commission->level_1 );
            $level_2_bmt = ( $vip_commissions_bmt->level_2 - $regular_bpt_commission->level_2 );
            $level_3_bmt = ( $vip_commissions_bmt->level_3 - $regular_bpt_commission->level_3 );

            //shelter_commissions
            $vip_commissions_shelter = $this->generic_model->getInfo( 'commissions_shelter', 'package_id', 3 );
            $direct_shelter = $vip_commissions_shelter->Direct;
            $level_1_shelter = $vip_commissions_shelter->level_1;
            $level_2_shelter = $vip_commissions_shelter->level_2;
            $level_3_shelter = $vip_commissions_shelter->level_3;
            $level_4_shelter = $vip_commissions_shelter->level_4;
            $level_5_shelter = $vip_commissions_shelter->level_5;
            $level_6_shelter = $vip_commissions_shelter->level_6;
            $level_7_shelter = $vip_commissions_shelter->level_7;
            $level_8_shelter = $vip_commissions_shelter->level_8;
            $level_9_shelter = $vip_commissions_shelter->level_9;

            //get referrers
            $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
            $direct_ref = $ref_tree->referred_by;
            $lev1 = $ref_tree->level_1;
            $lev2 = $ref_tree->level_2;
            $lev3 = $ref_tree->level_3;
            $lev4 = $ref_tree->level_4;
            $lev5 = $ref_tree->level_5;
            $lev6 = $ref_tree->level_6;
            $lev7 = $ref_tree->level_7;
            $lev8 = $ref_tree->level_8;
            $lev9 = $ref_tree->level_9;

            //fund the ref_tree_cartel BMT.........
            $this->convertBMT2( $package->id, $direct_bmt, $price, $direct_ref, $direct_wallet, $direct );
            $this->convertBMT2( $package->id, $level_1_bmt, $price, $lev1, $level_1_wallet, $level_1 );
            $this->convertBMT2( $package->id, $level_2_bmt, $price, $lev2, $level_2_wallet, $level_2 );
            $this->convertBMT2( $package->id, $level_3_bmt, $price, $lev3, $level_3_wallet, $level_3 );

            //fund the silver and gold shelter holders
            $this->silver_or_gold( $direct_ref, $direct_shelter );
            $this->silver_or_gold( $lev1, $level_1_shelter );
            $this->silver_or_gold( $lev2, $level_2_shelter );
            $this->silver_or_gold( $lev3, $level_3_shelter );
            $this->silver_or_gold( $lev4, $level_4_shelter );
            $this->silver_or_gold( $lev5, $level_5_shelter );
            $this->silver_or_gold( $lev6, $level_6_shelter );
            $this->silver_or_gold( $lev7, $level_7_shelter );
            $this->silver_or_gold( $lev8, $level_8_shelter );
            $this->silver_or_gold( $lev9, $level_9_shelter );

          } else {
            //credit the palliative wallet...............
            $update_user_data = array(
              'palliative' => $newPalliative,
            );
            $user_condition = array( 'id' => $userid );
            $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

            //save transaction history BMT.........
            $transactionDataShelter = array(
              'user_id' => $userid,
              'order_id' => $package_level,
              'transaction_type' => 'credit',
              'amount' => $palliavtive, 
              'description' => 'Pallative Reward', 
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
            //send debit email
            $to = $userInfo->email;
            $subject = 'BPI Palliative Bonus Reward Alert!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						<br>
						This reward is our way of expressing gratitude for your ongoing support and commitment to our mission.
						Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
						<br>
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

          }
        } else {

          $update_user_data = array(
            'palliative' => $newPalliative,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

          //save transaction history BMT.........
          $transactionDataShelter = array(
            'user_id' => $userid,
            'order_id' => $package_level,
            'transaction_type' => 'credit',
            'amount' => $palliavtive, 
            'description' => 'Pallative Reward', 
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
          //send email
          $to = $userInfo->email;
          $subject = 'BPI Palliative Bonus Reward Alert!';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						<br>
						This reward is our way of expressing gratitude for your ongoing support and commitment to our mission.
						Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
						<br>
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

        }
      } else {
        //gold shelter
        //if the user balance has exceeded limiit or it's time to activate shelter wallet
        if ( $newPalliative > 200000 ) {
          $user_shelter_status = $user->shelter_wallet;
          if ( empty( $user_shelter_status ) ) {
            //activate the shelter wallet and add balance to the palliative wallet.
            $walletBalance = ( $newPalliative - 200000 );
            $sh_data = array(
              'palliative' => $walletBalance,
              'is_shelter' => 1,
              'shelter_wallet' => 1,
              'shelter_pending' => 0
            );
            $sh_condition = array( 'id' => $userid );
            $sh_save = $this->generic_model->update_data( 'users', $sh_data, $sh_condition );

            //save transaction history .........
            $transactionDataShelter1 = array(
              'user_id' => $userid,
              'order_id' => $package_level,
              'transaction_type' => 'debit',
              'amount' => 200000, 
              'description' => 'Gold Shelter Wallet activation', 
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter1 );
            //send debit email
            $to = $userInfo->email;
            $subject = 'Debit Transaction Notification (BPI)!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'This is to notify you that a debit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN200,000.00]</li>
							<li>Description: [Gold Shelter Wallet activation]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						If you recognize this transaction, there is no further action needed on your part. However, if you do not recognize this transaction or believe it to be unauthorized, please contact our support team immediately at [support@beepagro.com].
						<br>
						<br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );

            $shelter_active = array(
              'user_id' => $userid,
              'amount' => 200000,
              'type' => 'Gold Shelter Wallet',
              'status' => 'Completed',
              'activated_date' => date( 'Y-m-d H:i:s' )
            );
            $this->generic_model->insert_data( 'shelter_wallet_activation', $shelter_active );
            //save the money paid for tracking....
            $shelter_type = $is_shelter->shelter_option;
            $shelter_type_name = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_type )->name;
            $ref_data = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
            $sponsor_data = $this->generic_model->getInfo( 'users', 'id', $ref_data->id );
            //send email
            $to = $userInfo->email;
            $subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
					<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: ' . $userInfo->firstname . ' ' . $userInfo->lastname . '</li>
						<li>Username: ' . $userInfo->username . '</li>
						<li>Sponsor Name: ' . $sponsor_data->firstname . ' ' . $sponsor_data->lastname . '</li>
						<li>Sponsor Email: ' . $sponsor_data->email . '</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref=' . $userInfo->referral_link . '</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>' . $shelter_type_name . '</li>
						<li>BPI Annual First Year payment membership (Gold Plus subscription)</li>
						<li>BPI Activation Details: As an active member, you have access to our palliative focus areas, including shelter, education, car, land, and agro products.</li>
						<li>Referral Link</li>
					</ul>
					<br>
					<br>
					As an active member of BPI, we have some important requirements for you:<br>
					<ol>
						<li>Start your journey with a desire to benefit from any of our palliative focuses</li>
						<li>Be an active member always, to continuously enjoy our palliative reward benefits./li>
						<li>Identify and refer between 20 to 100 individuals who have needs for our palliative reward (shelter, education, car, land, or agro products) using your unique BPI referral link.</li>
						<li>Work towards achieving this goal within 4 weeks of your membership activation.</li>
					</ol>
					<br>
					<br>
					Please remember, if you are unable to meet these terms and conditions, there is no need to join BPI. 
					<br>
					Additionally, as an active BPI member, you have access to the following BPI Training Telegram Channels:
					<br><br>
						1. Environmental Protection Training (Waste to wealth) powered by Corsair/Amplivo.<br>
						2. Become An Advertising Consultant (Watch & Earn) powered by Vizualize Club.<br>
						3. Blockchain & Cryptocurrency Education (Blockchain wealth) powered by BPI & Baca Digital.<br>
						4. Information Communication Technology: Career & Skills development (Basic ICT Skills: Eg: Data Analyst)
					<br>
					<br>
					Before joining these communities, please visit the Referral section in your BPI Account and complete your registration process by signing up with all the approved Third-party programs and updating your third-party referral link in your BPI Account.
					<br>
					<br>
					We are thrilled to have you as a part of our community and look forward to making a positive impact together. <br>If you have any questions or need assistance, feel free to reach out to us at [support@beepagro.com].
					<br>
					<br>
                    Best regards,
					<br>
                    BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );


            //distribute the rewards from the shelter activation...
            $regular_vip_commission = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 2 );
            $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 4 );
            $direct = ( $vip_commissions->Direct - $regular_vip_commission->Direct );
            $level_1 = ( $vip_commissions->level_1 - $regular_vip_commission->level_1 );
            $level_2 = ( $vip_commissions->level_2 - $regular_vip_commission->level_2 );
            $level_3 = ( $vip_commissions->level_3 - $regular_vip_commission->level_3 );

            //cashback commissions
            $regular_wal_commission = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 2 );
            $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 4 );
            $direct_wallet = ( $vip_commissions_wallet->Direct - $regular_wal_commission->Direct );
            $level_1_wallet = ( $vip_commissions_wallet->level_1 - $regular_wal_commission->level_1 );
            $level_2_wallet = ( $vip_commissions_wallet->level_2 - $regular_wal_commission->level_2 );
            $level_3_wallet = ( $vip_commissions_wallet->level_3 - $regular_wal_commission->level_3 );

            //bmt commissions
            $regular_bpt_commission = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 2 );
            $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 4 );
            $direct_bmt = ( $vip_commissions_bmt->Direct - $regular_bpt_commission->Direct );
            $level_1_bmt = ( $vip_commissions_bmt->level_1 - $regular_bpt_commission->level_1 );
            $level_2_bmt = ( $vip_commissions_bmt->level_2 - $regular_bpt_commission->level_2 );
            $level_3_bmt = ( $vip_commissions_bmt->level_3 - $regular_bpt_commission->level_3 );


            //shelter_commissions
            $vip_commissions_shelter = $this->generic_model->getInfo( 'commissions_shelter', 'package_id', 4 );
            $direct_shelter = $vip_commissions_shelter->Direct;
            $level_1_shelter = $vip_commissions_shelter->level_1;
            $level_2_shelter = $vip_commissions_shelter->level_2;
            $level_3_shelter = $vip_commissions_shelter->level_3;
            $level_4_shelter = $vip_commissions_shelter->level_4;
            $level_5_shelter = $vip_commissions_shelter->level_5;
            $level_6_shelter = $vip_commissions_shelter->level_6;
            $level_7_shelter = $vip_commissions_shelter->level_7;
            $level_8_shelter = $vip_commissions_shelter->level_8;
            $level_9_shelter = $vip_commissions_shelter->level_9;

            //get referrers
            $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
            $direct_ref = $ref_tree->referred_by;
            $lev1 = $ref_tree->level_1;
            $lev2 = $ref_tree->level_2;
            $lev3 = $ref_tree->level_3;
            $lev4 = $ref_tree->level_4;
            $lev5 = $ref_tree->level_5;
            $lev6 = $ref_tree->level_6;
            $lev7 = $ref_tree->level_7;
            $lev8 = $ref_tree->level_8;
            $lev9 = $ref_tree->level_9;

            //fund the ref_tree_cartel BMT.........
            $this->convertBMT2( $package->id, $direct_bmt, $price, $direct_ref, $direct_wallet, $direct );
            $this->convertBMT2( $package->id, $level_1_bmt, $price, $lev1, $level_1_wallet, $level_1 );
            $this->convertBMT2( $package->id, $level_2_bmt, $price, $lev2, $level_2_wallet, $level_2 );
            $this->convertBMT2( $package->id, $level_3_bmt, $price, $lev3, $level_3_wallet, $level_3 );

            //fund the silver and gold shelter holders
            $this->silver_or_gold( $direct_ref, $direct_shelter );
            $this->silver_or_gold( $lev1, $level_1_shelter );
            $this->silver_or_gold( $lev2, $level_2_shelter );
            $this->silver_or_gold( $lev3, $level_3_shelter );
            $this->silver_or_gold( $lev4, $level_4_shelter );
            $this->silver_or_gold( $lev5, $level_5_shelter );
            $this->silver_or_gold( $lev6, $level_6_shelter );
            $this->silver_or_gold( $lev7, $level_7_shelter );
            $this->silver_or_gold( $lev8, $level_8_shelter );
            $this->silver_or_gold( $lev9, $level_9_shelter );
          } else {
            //credit the palliative wallet...............
            $update_user_data = array(
              'palliative' => $newPalliative,
            );
            $user_condition = array( 'id' => $userid );
            $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

            //save transaction history BMT.........
            $transactionDataShelter = array(
              'user_id' => $userid,
              'order_id' => $package_level,
              'transaction_type' => 'credit',
              'amount' => $palliavtive, 
              'description' => 'Pallative Reward', 
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
            //send email
            $to = $userInfo->email;
            $subject = 'BPI Palliative Bonus Reward Alert!';
            $title = 'Dear  ' . $userInfo->firstname;
            $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						<br>
						This reward is our way of expressing gratitude for your ongoing support and commitment to our mission.
						Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
						<br>
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
          }
        } else {

          $update_user_data = array(
            'palliative' => $newPalliative,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

          //save transaction history BMT.........
          $transactionDataShelter = array(
            'user_id' => $userid,
            'order_id' => $package_level,
            'transaction_type' => 'credit',
            'amount' => $palliavtive, 
            'description' => 'Pallative Reward', 
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
          //send email
          $to = $userInfo->email;
          $subject = 'BPI Palliative Bonus Reward Alert!';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						<br>
						This reward is our way of expressing gratitude for your ongoing support and commitment to our mission.
						Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
						<br>
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

        }
      }
    } else {
      $update_user_data = array(
        'palliative' => $newPalliative
      );
      $user_condition = array( 'id' => $userid );
      $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

      //save transaction history Palliative.........
      $transactionDataPalliative = array(
        'user_id' => $userid,
        'order_id' => $package->id,
        'transaction_type' => 'credit',
        'amount' => $palliavtive, 
        'description' => 'BPI Palliative Reward', 
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataPalliative );
      $to = $userInfo->email;
      $subject = 'BPI Palliative Bonus Reward Alert!';
      $title = 'Dear  ' . $userInfo->firstname;
      $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
						We appreciate your dedication and contribution to the BPI community. 
						<br>
						This reward is our way of expressing gratitude for your ongoing support and commitment to our mission.
						Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
						<br>
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


    }

    $update_user_data = array(
      'token' => $newBMT,
      'cashback' => $newCashback,
    );
    $user_condition = array( 'id' => $userid );
    $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

    //save transaction history BMT.........
    $transactionDataBMT = array(
      'user_id' => $userid,
      'order_id' => $package->id,
      'transaction_type' => 'credit',
      'amount' => $bmtConvert, 
      'description' => 'BPI pallative BPT Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataBMT );
    $to = $userInfo->email;
    $subject = 'BPI BPT Bonus Reward Alert!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
			<li>Amount: [' . number_format( $bmtConvert, 8 ) . 'BPT]</li>
			<li>Description: [BPI Palliative BPT Reward]</li>
			<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
		</ul>
		<br>
		We appreciate your dedication and contribution to the BPI community. 
		<br>
		This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
		<br>
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

    //save transaction history Cashback.........
    $transactionDataCashback = array(
      'user_id' => $userid,
      'order_id' => $package->id,
      'transaction_type' => 'credit',
      'amount' => $cashback, 
      'description' => 'BPI Pallative Cashback Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataCashback );
    $to = $userInfo->email;
    $subject = 'BPI Palliative Cashback Reward Alert!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
			<li>Amount: [NGN' . number_format( $cashback, 2 ) . ']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
		</ul>
		<br>
		We appreciate your dedication and contribution to the BPI community. 
		<br>
		This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
		<br>
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

  }

  public function silver_or_gold( $userid, $amount ) {
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
    $is_shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
    $shelter_meal_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 2 )->percentage;
    $shelter_env_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 4 )->percentage;

    //we handle calculations for tax settings
    $percentageAmount_smt = ( $shelter_meal_tax / 100 ) * $amount;
    $percentageAmount_set = ( $shelter_env_tax / 100 ) * $amount;

    $total_deductable = ( $percentageAmount_smt + $percentageAmount_set );
    $amount = ( $amount - $total_deductable );

    //save tax details... 	
    $tax_smt_array = array(
      'user_id' => $userid,
      'wallet' => 'shelter',
      'amount' => $percentageAmount_smt,
      'activity' => 'Shelter Meal Tax',
      'percentage' => $shelter_meal_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_smt_array );

    $tax_set_array = array(
      'user_id' => $userid,
      'wallet' => 'palliative',
      'amount' => $percentageAmount_set,
      'activity' => 'Shelter Environmental Protection Tax',
      'percentage' => $shelter_env_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_set_array );

    if ( !empty( $is_shelter ) ) {
      //what is their level?
      $package_level = $is_shelter->shelter_package;
      $package_option = $is_shelter->shelter_option;
      if ( $package_level == 1 ) {
        //silver subscriber..................
        //check which wallet to credit whether car or education
        if ( $package_option == 6 ) {
          $wallet = 'educatioin';
        } elseif ( $package_option == 7 ) {
          $wallet = 'car';
        } elseif ( $package_option == 8 ) {
          $wallet = 'land';
        } elseif ( $package_option == 9 ) {
          $wallet = 'business';
        } else {
          $wallet = 'shelter';
        }

        $user = $this->generic_model->getInfo( 'users', 'id', $userid );
        $old_shelter = $user->$wallet;
        $new_shelter = ( $old_shelter + $amount );

        //check for wallet limit and extension......
        $shelter_option = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid )->shelter_option;
        //get shelter option amount
        $shelter_option_amount = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_option )->amount;
        $shelter_option_name = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_option )->name;
        if ( $new_shelter >= $shelter_option_amount ) {
          //check if there is an extended wallet priviledge............

          //trim it down and then set the balance
          $update_user_data = array(
            $wallet => $shelter_option_amount,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
          $shelter_mature_data = array(
            'user_id' => $userid,
            'shelter_option' => $shelter_option,
            'shelter_package' => $package_level,
            'date_completed' => date( 'Y-m-d H:i:s' ),
          );
          $shelter_send = $this->generic_model->insert_data( 'shelter_maturity', $shelter_mature_data );
          //send email
          $to = $userInfo->email;
          $subject = 'Congratulations! BPI Shelter Palliative Claim';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'We are pleased to inform you that you have successfully completed your BPI Shelter Palliative Threshold, and you are now eligible to claim your shelter palliative benefit listed below.
					<br>
					<br>
					<strong>Claim Details:</strong>:
					<br>
					<ul>
						<li>Threshold Completion Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
						<li>Threshold Amount Reached: [NGN' . number_format( $shelter_option_amount, 2 ) . ']</li>
						<li>Benefit Eligibility: [' . $shelter_option_name . ' Claim]</li>
					</ul>
					<br><br>
					To proceed with your claim, please follow the instructions provided below:<br>
					<ol>
						<li>Login to your account</li>
						<li>Select My Assets from the menu options</li>
						<li>Click the claim button on your corresponding wallet</li>
					</ol>
					<br><br>
					Our team will review your claim promptly, and you will receive further communication regarding the status of your claim.<br><br>
					Congratulations on reaching this milestone, and we hope this benefit brings you comfort during this challenging time.<br>
					We appreciate your dedication and contribution to the BPI community. 					
					<br>
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

          //save overflow
          $overflow = array(
            'user_id' => $userid,
            'amount' => ( $new_shelter - $shelter_option_amount ),
            'date' => date( 'Y-m-d H:i:s' )
          );
          $this->generic_model->insert_data( 'account_overflow', $overflow );

        } else {
          $update_user_data = array(
            $wallet => $new_shelter,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

          //save transaction history BMT.........
          $transactionDataShelter = array(
            'user_id' => $userid,
            'order_id' => $package_level,
            'transaction_type' => 'credit',
            'amount' => $amount, 
            'description' => 'Silver Shelter Pallative Reward', 
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
          $to = $userInfo->email;
          $subject = 'BPI Silver Shelter Pallative Reward Alert!';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
							<br>
							<br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
								<li>Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
								<li>Description: [BPI Silver Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
							</ul>
							<br>
							We appreciate your dedication and contribution to the BPI community. 
							<br>
							This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
							<br>
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
        }

        /** else{
             //check for wallet limit and extension...
             $shelter_option = $this->generic_model->getInfo('active_shelters','user_id',$userid)->shelter_option;
             
             //get shelter option amount
             $shelter_option_amount = $this->model_payment->getInfo('shelter_program','id',$shelter_option)->amount;
             if($new_shelter >= $shelter_option_amount){
                    $update_user_data = array(
                       'shelter'=>$shelter_option_amount,
                     );
                     $user_condition = array('id' => $userid);  
                     $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                     $shelter_mature_data = array(
                     'user_id'=>$userid,
                     'shelter_option'=>$shelter_option,
                     'shelter_package'=>$package_level,
                     'date_completed'=>date('Y-m-d H:i:s')
                    );
                     $shelter_send = $this->generic_model->insert_data('shelter_maturity', $shelter_mature_data); 
             }else{
                 $update_user_data = array(
                         'shelter'=>$new_shelter,
                 );
                 $user_condition = array('id' => $userid);  
                 $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                 
                 //save transaction history BMT.........
                 $transactionDataShelter = array(
                     'user_id' => $userid,
                     'order_id' =>$package_level,
                     'transaction_type' => 'credit',
                     'amount' => $amount,  
                     'description' => 'Silver Shelter Pallative Reward',  
                     'status' => 'Successful'
                 );
                 $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
             }
         } **/
      } else {
        //this is a gold package
        //check which wallet to credit whether car or education
        if ( $package_option == 6 ) {
          $wallet = 'education';
        } elseif ( $package_option == 7 ) {
          $wallet = 'car';
        } elseif ( $package_option == 8 ) {
          $wallet = 'land';
        } elseif ( $package_option == 9 ) {
          $wallet = 'business';
        } else {
          $wallet = 'shelter';
        }
        $user = $this->generic_model->getInfo( 'users', 'id', $userid );
        $old_shelter = $user->$wallet;
        $new_shelter = ( $old_shelter + $amount );
        //check for wallet limit and extension......
        $shelter_option = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid )->shelter_option;
        //get shelter option amount
        $shelter_option_amount = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_option )->amount;
        $shelter_option_name = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_option )->name;

        if ( $new_shelter >= $shelter_option_amount ) {
          //check if there is an extended wallet priviledge............

          //trim it down and then set the balance
          $update_user_data = array(
            $wallet => $shelter_option_amount,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
          $shelter_mature_data = array(
            'user_id' => $userid,
            'shelter_option' => $shelter_option,
            'shelter_package' => $package_level,
            'date_completed' => date( 'Y-m-d H:i:s' ),
          );
          $shelter_send = $this->generic_model->insert_data( 'shelter_maturity', $shelter_mature_data );
          //send email
          $to = $userInfo->email;
          $subject = 'Congratulations! BPI Shelter Palliative Claim';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'We are pleased to inform you that you have successfully completed your BPI Shelter Palliative Threshold, and you are now eligible to claim your shelter palliative benefit listed below.
					<br>
					<br>
					<strong>Claim Details:</strong>:
					<br>
					<ul>
						<li>Threshold Completion Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
						<li>Threshold Amount Reached: [NGN' . number_format( $shelter_option_amount, 2 ) . ']</li>
						<li>Benefit Eligibility: [' . $shelter_option_name . ' Claim]</li>
					</ul>
					<br><br>
					To proceed with your claim, please follow the instructions provided below:<br>
					<ol>
						<li>Login to your account</li>
						<li>Select My Assets from the menu options</li>
						<li>Click the claim button on your corresponding wallet</li>
					</ol>
					<br><br>
					Our team will review your claim promptly, and you will receive further communication regarding the status of your claim.<br><br>
					Congratulations on reaching this milestone, and we hope this benefit brings you comfort during this challenging time.<br>
					We appreciate your dedication and contribution to the BPI community. 					
					<br>
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

          //save overflow
          $overflow = array(
            'user_id' => $userid,
            'amount' => ( $new_shelter - $shelter_option_amount ),
            'date' => date( 'Y-m-d H:i:s' )
          );
          $this->generic_model->insert_data( 'account_overflow', $overflow );
          $overflow_user = $this->generic_model->getInfo( 'users', 'id', $userid );
          $ref = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
          $overflow_refer = $this->generic_model->getInfo( 'users', 'id', $ref->referred_by );
          $to = 'admin@beepagro.com';
          $subject = 'Shelter Pallative Overflow Alert!';
          $title = 'Dear  Admin';
          $message = 'This is to notify you that an overflow has occured on a shelter palliative Maturity transaction.
							<br>
							<br>
							The following user has completed their Shelter Palliative Program:
							<br>
							' . $overflow_user->firstname . ' ' . $overflow_user->lastname . ' - ' . $overflow_user->email . ' <br>
							Referred By<br>
							' . $overflow_refer->firstname . ' ' . $overflow_refer->lastname . ' - ' . $overflow_refer->email . '<br><br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
								<li>Amount: [NGN' . number_format( ( $new_shelter - $shelter_option_amount ), 2 ) . ']</li>
								<li>Description: [Shelter Maturity Overflow]</li>
								<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
							</ul>
							<br>
							<br>
							Application Manager,
							<br>
							
							BPI Admin Alerts.</p>';
          $this->sendemail( $title, $to, $subject, $message );


        } else {
          $update_user_data = array(
            $wallet => $new_shelter,
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

          //save transaction history BMT.........
          $transactionDataShelter = array(
            'user_id' => $userid,
            'order_id' => $package_level,
            'transaction_type' => 'credit',
            'amount' => $amount, 
            'description' => 'Gold Shelter Pallative Reward', 
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataShelter );
          $to = $userInfo->email;
          $subject = 'BPI Gold Shelter Pallative Reward Alert!';
          $title = 'Dear  ' . $userInfo->firstname;
          $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
							<br>
							<br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
								<li>Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
								<li>Description: [BPI Gold Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
							</ul>
							<br>
							We appreciate your dedication and contribution to the BPI community. 
							<br>
							This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
							<br>
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

        }

      }
    } else {
      //save overflow
      $overflow = array(
        'user_id' => $userid,
        'amount' => $amount,
        'date' => date( 'Y-m-d H:i:s' )
      );
      $overflow_user = $this->generic_model->getInfo( 'users', 'id', $userid );
      $ref = $this->generic_model->getInfo( 'referrals', 'user_id', $userid );
      $overflow_refer = $this->generic_model->getInfo( 'users', 'id', $ref->referred_by );
      $this->generic_model->insert_data( 'account_overflow', $overflow );
      $to = 'admin@beepagro.com';
      $subject = 'Shelter Pallative Overflow Alert!';
      $title = 'Dear  Admin';
      $message = 'This is to notify you that an overflow has occured on a shelter palliative credit transaction.
							<br>
							<br>
							No Shelter wallet was found activated for the following user:
							<br>
							' . $overflow_user->firstname . ' ' . $overflow_user->lastname . ' - ' . $overflow_user->email . ' <br>
							Referred By<br>
							' . $overflow_refer->firstname . ' ' . $overflow_refer->lastname . ' - ' . $overflow_refer->email . '<br><br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
								<li>Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
								<li>Description: [BPI Silver Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
							</ul>
							<br>
							<br>
							Application Manager,
							<br>
							
							BPI Admin Alerts.</p>';
      $this->sendemail( $title, $to, $subject, $message );
    }
  }

  public function convertBMT2( $package_id, $amount, $price, $userid, $cashback, $palliavtive ) {
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
    $palliative_meal_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 1 )->percentage;
    $palliative_env_tax = $this->generic_model->getInfo( 'palliative_tax_settings', 'id', 3 )->percentage;

    //we handle calculations for tax settings
    $percentageAmount_pmt = ( $palliative_meal_tax / 100 ) * $palliavtive;
    $percentageAmount_pet = ( $palliative_env_tax / 100 ) * $palliavtive;

    $total_deductable = ( $percentageAmount_pmt + $percentageAmount_pet );
    $palliavtive = ( $palliavtive - $total_deductable );
    //save tax details... 	
    $tax_pmt_array = array(
      'user_id' => $userid,
      'wallet' => 'palliative',
      'amount' => $percentageAmount_pmt,
      'activity' => 'Palliative Meal Tax',
      'percentage' => $palliative_meal_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_pmt_array );

    $tax_pet_array = array(
      'user_id' => $userid,
      'wallet' => 'palliative',
      'amount' => $percentageAmount_pet,
      'activity' => 'Environmental Protection Tax',
      'percentage' => $palliative_env_tax,
      'date' => date( 'Y-m-d H:i:s' )
    );
    $this->generic_model->insert_data( 'palliative_tax', $tax_pet_array );


    $package = $this->generic_model->getInfo( 'packages', 'id', $package_id );
    $bmtConvert = number_format( ( $amount / $price ), 8 );
    $user = $this->generic_model->getInfo( 'users', 'id', $userid );
    $oldBMT = $user->token;
    $oldCashback = $user->cashback;
    $oldPalliative = $user->palliative;
    $newBMT = number_format( ( $bmtConvert + $oldBMT ), 8 );
    $newCashback = ( $cashback + $oldCashback );
    $palliative_tax =
      $newPalliative = ( $palliavtive + $oldPalliative );

    $update_user_data = array(
      'palliative' => $newPalliative
    );
    $user_condition = array( 'id' => $userid );
    $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

    //save transaction history Palliative.........
    $transactionDataPalliative = array(
      'user_id' => $userid,
      'order_id' => $package->id,
      'transaction_type' => 'credit',
      'amount' => $palliavtive, 
      'description' => 'BPI Palliative Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataPalliative );
    $to = $userInfo->email;
    $subject = 'BPI Palliative Reward Alert!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
			<li>Amount: [NGN' . number_format( $palliavtive, 2 ) . ']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
		</ul>
		<br>
		We appreciate your dedication and contribution to the BPI community. 
		<br>
		This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
		<br>
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

    $update_user_data = array(
      'token' => $newBMT,
      'cashback' => $newCashback,
    );
    $user_condition = array( 'id' => $userid );
    $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

    //save transaction history BMT.........
    $transactionDataBMT = array(
      'user_id' => $userid,
      'order_id' => $package->id,
      'transaction_type' => 'credit',
      'amount' => $bmtConvert, 
      'description' => 'BPI pallative BPT Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataBMT );
    $to = $userInfo->email;
    $subject = 'BPI BPT Bonus Reward Alert!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
			<li>Amount: [' . number_format( $bmtConvert, 8 ) . 'BPT]</li>
			<li>Description: [BPI Palliative BPT Reward]</li>
			<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
		</ul>
		<br>
		We appreciate your dedication and contribution to the BPI community. 
		<br>
		This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
		<br>
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

    //save transaction history Cashback.........
    $transactionDataCashback = array(
      'user_id' => $userid,
      'order_id' => $package->id,
      'transaction_type' => 'credit',
      'amount' => $cashback, 
      'description' => 'BPI Pallative Cashback Reward', 
      'status' => 'Successful'
    );
    $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataCashback );
    $to = $userInfo->email;
    $subject = 'BPI Palliative Cashback Reward Alert!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
			<li>Amount: [NGN' . number_format( $cashback, 2 ) . ']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
		</ul>
		<br>
		We appreciate your dedication and contribution to the BPI community. 
		<br>
		This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
		<br>
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
  }
	 
  public function paySpendable( $amount, $userid, $id ) {
    //payment and
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $userid );
    //check the package level..........
    $user_package = $this->generic_model->getInfo( 'active_shelters', 'user_id', $userid );
    $package = $this->generic_model->getInfo( 'packages', 'id', $id );

    //first check if the user shelter wallet is activated
    if ( $userInfo->shelter_wallet == 1 || $user_package->starter_pack == 2 ) {
      //this user has activated the topmost layer, they can get all bonuses as is
      $oldspendable = $userInfo->spendable;
      $newSpendable = ( $oldspendable + $amount );
      $update_user_data = array(
        'spendable' => $newSpendable
      );
      $user_condition = array( 'id' => $userid );
      $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
      $transactionDataspendable = array(
        'user_id' => $userid,
        'order_id' => 2,
        'transaction_type' => 'credit',
        'amount' => $amount, 
        'description' => 'BPI Spendable Cash Reward', 
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataspendable );
      $to = $userInfo->email;
      $subject = 'BPI Spendable Cash Alert!';
      $title = 'Dear  ' . $userInfo->firstname;
      $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
			<br>
			<br>
			<strong>Transaction Details</strong>:
			<br>
			<ul>
				<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
				<li>Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
				<li>Description: [BPI Spendable Cash Reward]</li>
				<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
			</ul>
			<br>
			We appreciate your dedication and contribution to the BPI community. 
			<br>
			This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
			<br>
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
    } else {
      //check what package they are from the amount they paid
      if ( $user_package->starter_pack == 3 ) {
        //this user has activated the same layer, they can get all bonuses as is
        $oldspendable = $userInfo->spendable;
        $newSpendable = ( $oldspendable + $amount );
        $update_user_data = array(
          'spendable' => $newSpendable
        );
        $user_condition = array( 'id' => $userid );
        $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
        $transactionDataspendable = array(
          'user_id' => $userid,
          'order_id' => 2,
          'transaction_type' => 'credit',
          'amount' => $amount, 
          'description' => 'BPI Spendable Cash Reward', 
          'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataspendable );
        $to = $userInfo->email;
        $subject = 'BPI Spendable Cash Alert!';
        $title = 'Dear  ' . $userInfo->firstname;
        $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
				<br>
				<br>
				<strong>Transaction Details</strong>:
				<br>
				<ul>
					<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
					<li>Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
					<li>Description: [BPI Spendable Cash Reward]</li>
					<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
				</ul>
				<br>
				We appreciate your dedication and contribution to the BPI community. 
				<br>
				This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
				<br>
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

      }
      if ( $user_package->starter_pack == 1 ) {
        //we split the bonuses into 2 parts, 50% for the palliative wallet, 50% for the spendable wallet
        $oldspendable = $userInfo->spendable;
        $oldPalliative = $userInfo->palliative;

        $spendable_half = ( $amount / 2 );
        $newSpendable = ( $oldspendable + $spendable_half );
        $newPalliative = ( $oldPalliative + $spendable_half );

        $update_user_data = array(
          'spendable' => $newSpendable,
          'palliative' => $newPalliative
        );

        $user_condition = array( 'id' => $userid );
        $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );

        $transactionDataspendable = array(
          'user_id' => $userid,
          'order_id' => 2,
          'transaction_type' => 'credit',
          'amount' => $spendable_half, 
          'description' => 'BPI Spendable Cash Reward', 
          'status' => 'Successful'
        );

        $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataspendable );

        $transactionDatapall = array(
          'user_id' => $userid,
          'order_id' => 2,
          'transaction_type' => 'credit',
          'amount' => $spendable_half, 
          'description' => 'BPI Palliative Reward', 
          'status' => 'Successful'
        );

        $trans_send2 = $this->generic_model->insert_data( 'transaction_history', $transactionDatapall );

        $to = $userInfo->email;
        $subject = 'BPI Spendable Cash Alert!';
        $title = 'Dear  ' . $userInfo->firstname;
        $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
				<br>
				<br>
				<strong>Transaction Details</strong>:
				<br>
				<ul>
					<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
					<li>Total Amount: [NGN' . number_format( $amount, 2 ) . ']</li>
					<li>50% Spendable Reward, 50% Palliative Reward
					<li>Description: [BPI Spendable Cash Reward and BPI Palliative Reward]</li>
					<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
				</ul>
				<br>
				To earn 100% Spendable Reward, upgrade your BPI Membership Package Now <br>
				We appreciate your dedication and contribution to the BPI community. 
				<br>
				This reward is our way of expressing gratitude for your ongoing support and commitment to our mission. Once again, congratulations on your Palliative Reward Bonus! We look forward to continuing our journey together with you.
				<br>
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
      }
    }


  }

}