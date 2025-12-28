<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class PaymentController extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->helper('string');
        $this->load->helper('url');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
    } 
    
    public function bank_transfer(){
        $orderId = $this->session->userdata('orderid');
        $amount = $this->session->userdata('amount');
        $percentage = 7.5 / 100; // Converting percentage to decimal
        $vat = $amount * $percentage;
        $userid = $this->session->userdata('user_id'); 
        $table_name = 'bank_accounts';
        $conditions = array('status' => 'active'); // Optional conditions
        $user_details = $this->session->userdata('user_details');
        $data['user_details'] = $user_details;
		$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_notifications($userid);
        $data['result'] = $this->generic_model->select_all($table_name, $conditions);
        $data['order'] = $this->generic_model->getInfo('orders','id',$orderId);
        $data['vat'] = $vat;
        $this->load->view('bank_transfer', $data);
        
    }
    
    public function sponsor_bank_transfer(){
        $orderId = $this->session->userdata('orderid');
        $amount = $this->session->userdata('amount');
		$userid = $this->session->userdata('user_id'); 
        $percentage = 7.5 / 100; // Converting percentage to decimal
        $vat = $amount * $percentage;
        $userid = $this->session->userdata('user_id'); 
        $table_name = 'bank_accounts';
        $conditions = array('status' => 'active'); // Optional conditions
        $user_details = $this->session->userdata('user_details');
        $data['user_details'] = $user_details;
		$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_notifications($userid);
        $data['result'] = $this->generic_model->select_all($table_name, $conditions);
        $data['order'] = $this->generic_model->select_all('orders', array('id' => $orderId));
        $data['vat'] = $vat;
        $this->load->view('sponsor_bank_transfer', $data);
        
    }
    
    public function crypto_pay(){
        $orderId = $this->session->userdata('orderid');
        $amount = $this->session->userdata('amount');
		$userid = $this->session->userdata('user_id'); 
        $percentage = 7.5 / 100; // Converting percentage to decimal
        $vat = $amount * $percentage;
        $table_name = 'bank_accounts';
        $conditions = array('status' => 'active'); // Optional conditions
        $user_details = $this->session->userdata('user_details');
        $data['amount'] = $amount;
        $data['user_details'] = $user_details;
        $data['vat'] = $vat;
		$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_notifications($userid);
        $data['result'] = $this->generic_model->select_all($table_name, $conditions);
        $data['order'] = $this->generic_model->select_all('orders', array('id' => $orderId));
        $this->load->view('crypto_pay', $data);
    }
    
    public function card_pay(){
		$userid = $this->session->userdata('user_id'); 
        $orderId = $this->session->userdata('orderid');
        $txref = 'BA-FLW-'.time();
        $paymentData = array(
            'txref'  => $txref
            );
            
        $this->session->set_userdata($paymentData);
        $data['order'] = $this->generic_model->getInfo('orders', 'id',$orderId);
        $user_details = $this->session->userdata('user_details');
        $data['user_details'] = $user_details;
		$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_notifications($userid);
        $this->load->view('card_pay', $data);
    }
    
    public function bank_confirm(){
		$user_id = $this->session->userdata( 'user_id' );
        if(empty($_SESSION['amount'])){
            $this->session->set_flashdata('error', 'Payment Session Expired!');
            redirect('dashboard');
        }else{
            $amount = $_SESSION['amount'];
            $percentage = 7.5 / 100; // Converting percentage to decimal
            $vat = $amount * $percentage;
			$data['unread_count'] = $this->generic_model->get_unread_count($user_id);
            $data['notifications'] = $this->generic_model->get_notifications($user_id);
            $data['amount'] = $amount;
            $data['vat'] = $vat;
			$data['user_details'] = $this->db->get_where( 'users', array( 'id' => $user_id ) )->row();
            $this->load->view('bank_confirm', $data);
        }
    }
    
    public function bank_confirm_dual(){
		$user_id = $this->session->userdata( 'user_id' );
        if(empty($_SESSION['amount'])){
            $this->session->set_flashdata('error', 'Payment Session Expired!');
            redirect('dashboard');
        }else{
            $amount = 60000;
            $percentage = 7.5 / 100; // Converting percentage to decimal
            $vat = 4500;
			$data['unread_count'] = $this->generic_model->get_unread_count($user_id);
            $data['notifications'] = $this->generic_model->get_notifications($user_id);
            $data['amount'] = $amount;
            $data['vat'] = $vat;
			$data['user_details'] = $this->db->get_where( 'users', array( 'id' => $user_id ) )->row();
            $this->load->view('bank_confirm_dual', $data);
        }
    }
    
    public function merchantbank_confirm(){
		$userid = $this->session->userdata('user_id');
        if(empty($_SESSION['amount'])){
            $this->session->set_flashdata('error', 'Payment Session Expired!');
            redirect('dashboard');
        }else{
            $amount = $_SESSION['amount'];
            $percentage = 7.5 / 100; // Converting percentage to decimal
            $vat = $amount * $percentage;
            $data['amount'] = $amount;
            $data['vat'] = $vat;
			$data['user_details'] = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_notifications($userid);
            $this->load->view('merchantbank_confirm', $data);
        }
    }
    
    public function sponsor_bank_confirm(){
		$userid = $this->session->userdata('user_id');
        if(empty($_SESSION['amount'])){
            $this->session->set_flashdata('error', 'Payment Session Expired!');
            redirect('dashboard');
        }else{
            $amount = $_SESSION['amount'];
            $percentage = 7.5 / 100; // Converting percentage to decimal
            $vat = $amount * $percentage;

            $data['amount'] = $amount;
            $data['vat'] = $vat;
            $data['beneficiary'] = $_SESSION['beneficiary'];
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['notifications'] = $this->generic_model->get_notifications($userid);
            $this->load->view('sponsor_bank_confirm', $data);
        }
    }
    
    public function processPayment() {
        // Upload receipt image
        $config['upload_path'] ='./receipts/';
        $config['allowed_types'] = 'gif|jpg|png|jpeg|pdf|PDF';
        $config['max_size'] = 40960; // 4MB max size (adjust as needed)
        $config['encrypt_name'] = true; // Encrypt file name for uniqueness
        $userId = $this->session->userdata('user_id');
        $this->load->library('upload', $config);
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');

        if (!$this->upload->do_upload('receipt_image')) {
            // Handle upload error
            $error = $this->upload->display_errors();
            echo $error.' You are seeing this error because the image you uploaded is bad or is of a forbidden format, click the back button to return to the previous page to upload your receipt again!';
			
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'receipts/' . $upload_data['file_name'];
            $type = 'Bank';
            $this->generic_model->saveReceiptPath($file_path,$userId,$type,$amount);
            
            //add the vat data
            $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'BPI Activation',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
            $this->generic_model->insert_data('vat_data',$vat_data);
            $this->session->unset_userdata('user_details');
             // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $userId))->row();
            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
			
			$_SESSION['item'] = 'BPI Activation';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            // Handle success (redirect, display message, etc.)
            redirect('payment_success_page');
        }
    }
    
    public function processPayment_dual() {
        // Upload receipt image
        $config['upload_path'] ='./receipts/';
        $config['allowed_types'] = 'gif|jpg|png|jpeg|pdf|PDF';
        $config['max_size'] = 40960; // 4MB max size (adjust as needed)
        $config['encrypt_name'] = true; // Encrypt file name for uniqueness
        $userId = $this->session->userdata('user_id');
        $this->load->library('upload', $config);
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');

        if (!$this->upload->do_upload('receipt_image')) {
            // Handle upload error
            $error = $this->upload->display_errors();
            echo $error.' You are seeing this error because the image you uploaded is bad or is of a forbidden format, click the back button to return to the previous page to upload your receipt again!';
			
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'receipts/' . $upload_data['file_name'];
            $type = 'Bank';
            $this->generic_model->saveReceiptPath($file_path,$userId,$type,$amount);
            
            //add the vat data
            $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'BPI Activation',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
            $this->generic_model->insert_data('vat_data',$vat_data);
            
            
            //insert cng payment...........
            $qwik_data = array(
                'user_id'=>$userId,
                'amount'=>10000,
                'vat'=>750,
                'date'=>date('Y-m-d H:i:s'),
                'status'=>'pending'
            );
            
           // print_r($qwik_data );
           // exit;
            
            $this->generic_model->insert_data('qwik_data',$qwik_data);
            
            $this->session->unset_userdata('user_details');
             // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $userId))->row();
            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
			
			$_SESSION['item'] = 'BPI Dual Activation';
				$_SESSION['amount']= 60000;
				$_SESSION['vat'] = 4500;
				$_SESSION['qty'] = 1;
			
            // Handle success (redirect, display message, etc.)
            redirect('payment_success_page');
        }
    }
	
	public function wallet_processPayment() {
        // Upload receipt image
        $config['upload_path'] ='./receipts/';
        $config['allowed_types'] = 'gif|jpg|png|jpeg|pdf|PDF';
        $config['max_size'] = 40960; // 4MB max size (adjust as needed)
        $config['encrypt_name'] = true; // Encrypt file name for uniqueness
        $userId = $this->session->userdata('user_id');
        $this->load->library('upload', $config);
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');
		$funding_id = $this->input->post('funding_id');

        if (!$this->upload->do_upload('receipt_image')) {
            // Handle upload error
            $error = $this->upload->display_errors();
            echo $error.' You are seeing this error because the image you uploaded is bad or is of a forbidden format, click the back button to return to the previous page to upload your receipt again!';
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'receipts/' . $upload_data['file_name'];
            $type = 'Bank';
            $this->generic_model->saveWalletReceiptPath($file_path,$userId,$type,$amount,$funding_id);
            
            //add the vat data
            $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'Wallet Funding',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
            $this->generic_model->insert_data('vat_data',$vat_data);
            $this->session->unset_userdata('user_details');
             // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $userId))->row();
            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
			
			    $_SESSION['item'] = 'Wallet Funding';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            // Handle success (redirect, display message, etc.)
            redirect('payment_success_page');
        }
    }
    
    public function process_merch_payment() {
        // Upload receipt image
        $config['upload_path'] ='./receipts/';
        $config['allowed_types'] = 'gif|jpg|png|jpeg|pdf|PDF';
        $config['max_size'] = 40960; // 4MB max size (adjust as needed)
        $config['encrypt_name'] = true; // Encrypt file name for uniqueness
        $userId = $this->session->userdata('user_id');
        $this->load->library('upload', $config);
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');

        if (!$this->upload->do_upload('receipt_image')) {
            // Handle upload error
            $error = $this->upload->display_errors();
            echo $error.'You are seeing this error because the image you uploaded is bad or is of a forbidden format, click the back button to return to the previous page to upload your receipt again!';
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'receipts/' . $upload_data['file_name'];
            $type = 'Bank';
            $this->generic_model->saveReceiptPathMerch($file_path,$userId,$type,$amount);
            
            //add the vat data
            $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'Pickup Center Activation Fee',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
            $this->generic_model->insert_data('vat_data',$vat_data);
            $this->session->unset_userdata('user_details');
             // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $userId))->row();
            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            // Handle success (redirect, display message, etc.)
			
			$data = array('status'=>'paid');
	  		$condition = array('user_id'=>$userId);
	  		$this->generic_model->update_data('merchants', $data, $condition);
			
			$_SESSION['item'] = 'Pickup center Activation';
			$_SESSION['amount']= $amount;
			$_SESSION['vat'] = $vat;
			$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }
    }
    
    public function sponsor_processPayment() {
        // Upload receipt image
        $config['upload_path'] ='./receipts/';
        $config['allowed_types'] = 'gif|jpg|png|jpeg';
        $config['max_size'] = 40960; // 4MB max size (adjust as needed)
        $config['encrypt_name'] = true; // Encrypt file name for uniqueness
        $userId = $this->input->post('beneficiary');
        $this->load->library('upload', $config);
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');

        if (!$this->upload->do_upload('receipt_image')) {
            // Handle upload error
            $error = $this->upload->display_errors();
            echo $error;
        } else {
            // Upload successful, get file info
            $upload_data = $this->upload->data();
            $file_path = 'receipts/' . $upload_data['file_name'];
            $type = 'Bank';
            $this->generic_model->saveReceiptPath($file_path,$userId,$type,$amount);
            //add the vat data
            $vat_data = array(
                'user_id'=>$userId,
                'amount'=>$amount,
                'activity'=>'BPI Activation Sponsorship',
                'vat'=>$vat,
                'date'=>date('Y-m-d H:i:s')
            );
            $this->generic_model->insert_data('vat_data',$vat_data);
            // Handle success (redirect, display message, etc.)
			
				$_SESSION['item'] = 'BPI Activation Sponsorship';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }
    }
    
    public function success(){
		$userid = $this->session->userdata('user_id');
        $user_details = $this->session->userdata('user_details');
        $data['item'] = $_SESSION['item'];
		$data['amount'] = $_SESSION['amount'];
		$data['vat'] = $_SESSION['vat'];
		$data['qty'] = $_SESSION['qty'];
		$data['user_details'] = $user_details;
		$data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_notifications($userid);
        $this->load->view('success',$data);
    }
    
    public function flutterwaveCallback(){
        $txref = $_SESSION['txref'];
        $user_id = $this->session->userdata('user_id');
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $id = $this->generic_model->getInfo('orders','user_id',$user_id)->id;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );

        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Variables
            $method = 'flutterwave';
            $date = date('Y-m-d H:i:s');
            $datetime = date('Y-m-d H:i:s');
            $finalDeposit = $chargeAmountPlain;

            //Deposit Array
            $depositInfo = array(
                'userId'=>$user_id, 
                'txnCode'=>$_SESSION['txref'],
                'amount'=>$finalDeposit, 
                'paymentMethod'=> $method, 
                'createdDtm'=>$datetime
            );
            $this->generic_model->insert_data('deposits', $depositInfo);
            $user_table = 'users';
            //check if it is part pay and what state it is...
            $user = $this->generic_model->getInfo($user_table,'id', $user_id);
            
             if($user->is_part_pay == 1){
                     $userOrder = $this->generic_model->get_by_condition('orders', array('user_id'=>$user_id));
                             //Variables
                        $method = 'Bank Transfer';
                        $date = date('Y-m-d H:i:s');
                        $datetime = date('Y-m-d H:i:s');
                        $finalDeposit = $userOrder->amount;
                        
                        //Deposit Array
                        $depositInfo = array(
                            'userId'=>$user_id, 
                            'txnCode'=>'BA-BT-345'.$userOrder->id,
                            'amount'=>$userOrder->amount, 
                            'paymentMethod'=> $method, 
                            'createdDtm'=>$datetime
                        );
                        $this->generic_model->insert_data('deposits', $depositInfo);
                        
                
                //now check which stage....
                if($user->first_pay == 0 && $user->second_pay == 0 && $user->third_pay == 0){
                    //first payment
                    $update_user_data = array(
                        'pending_activation' => 1,
                        'first_pay'=> 1
                    );
                    $user_condition = array('id' => $user_id);
                    $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                    
                    //update the order table
                    $order_table = 'orders';
                    $update_order_data = array(
                        'status' => 'first installment'
                        // Add more columns and values as needed
                    );
                    $order_condition = array('id' => $userOrder->id); 
                    $user_rows_affected = $this->generic_model->update_data($order_table, $update_order_data, $order_condition); 
                    
                }
                elseif($user->first_pay == 1 && $user->second_pay == 0 && $user->third_pay == 0){
                    //second payment
                    $update_user_data = array(
                        'second_pay'=> 1
                    );
                    $user_condition = array('id' => $user_id);  
                    $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                    
                   
                    //update the order table
                    $order_table = 'orders';
                    
                     //get previous order balance
                    $paid = $this->generic_model->getInfo($order_table,'id', $userOrder->id);
                    $prev_balance = $paid->amount;
                    $new_balance = ($prev_balance + $userOrder->amount);
                    
                    $update_order_data = array(
                        'status' => 'Second installment',
                        'amount' => $new_balance
                    );
                    $order_condition = array('id' => $userOrder->id); 
                    $user_rows_affected = $this->generic_model->update_data($order_table, $update_order_data, $order_condition);
                    
                }
                elseif($user->first_pay == 1 && $user->second_pay == 1 && $user->third_pay == 0){
                    //last payment
                    
                    
                    $bmt_price = $this->generic_model->getInfo('bmt_price','id',1)->amount;
                    $share_allocation = $this->generic_model->getInfo('financial_data','id',1);
                    $share_allocation_bmt = $share_allocation->bmt;
                    $share_allocation_sug = $share_allocation->sug;
                    $share_allocation_funding = $share_allocation->palliative_funds;
                    $share_allocation_revenue = $share_allocation->revenue;
                    
                    //start bmt share
                    $bmtConvert = number_format(($share_allocation_bmt / $bmt_price),8);
                    $oldBMT = $user->token;
                    $newBMT = number_format(($bmtConvert + $oldBMT),8);
                    
                    $update_user_data = array(
                        'pending_activation' => 0,
                        'third_pay'=> 1,
                        'activated'=>1,
                        'is_part_pay'=>0,
                        'token'=>$newBMT
                    );
                    $user_condition = array('id' => $user_id);  
                    $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                    
                    $transactionBMT = array(
                        'user_id' => $user_id,
                        'order_id' =>$id,
                        'transaction_type' => 'credit',
                        'amount' => $newBMT,  // Assuming you have the price for each item
                        'description' => 'Palliative activation BPT Bonus',  // Add a relevant description
                        'status' => 'Successful'
                    );
                    $trans_send = $this->generic_model->insert_data('transaction_history', $transactionBMT);
                    
                     //remittance share
                    $revenue_data = array('user_id'=>$user_id,'amount'=>$share_allocation_revenue,'date'=>date('Y-m-d H:i:s'));
                    $this->generic_model->insert_data('revenue', $revenue_data);
                 
                    //sug remittance
                    $sug_data = array('user_id'=>$user_id,'sug_id'=>1,	'amount'=>$share_allocation_sug,'date'=>date('Y-m-d H:i:s'));
                    $this->generic_model->insert_data('sug', $sug_data);
                    
                     //palliative funds remittance
                    $palliative_data = array('user_id'=>$user_id,'amount'=>$share_allocation_funding,'date'=>date('Y-m-d H:i:s'));
                    $this->generic_model->insert_data('palliative_funds', $palliative_data);
                    
                    //update the order table
                    $order_table = 'orders';
                    
                     //get previous order balance
                    $paid = $this->generic_model->getInfo($order_table,'id', $userOrder->id);
                    $new_balance = $this->generic_model->select_by_id('market_prices', 1)->palliative_price;
                    
                    $update_order_data = array(
                        'status' => 'Paid',
                        'amount' => $new_balance
                    );
                    $order_condition = array('user_id' => $user_id); 
                    $user_rows_affected = $this->generic_model->update_data($order_table, $update_order_data, $order_condition);
                    
                    //insert activation countdown.
                    $activated_entry = array(
                        'user_id' => $user_id,
                        'activated_date' => date('Y-m-d H:i:s'),
                        'end_date' => date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s') . ' +30 days'))
                    );
                    
                    $this->generic_model->insert_data('activation_countdown', $activated_entry);
                 
                    
                }
                
             }
			else{
                     //it is not part pay so we want to check if this payment is for vip package
                     if($user->vip_pending){
                        //get the amount of the payment
                        $payment_amount = $this->generic_model->getInfo('payments','id',$id)->amount;
                        
                        //get package via amount
                        $package = $this->generic_model->getInfo('packages','package_price',$payment_amount);
                        $bmt_price = $this->generic_model->getInfo('bmt_price','id',1)->amount;
                        
                        $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package->id);
                        $direct = $vip_commissions->Direct;
                        $level_1 = $vip_commissions->level_1;
                        $level_2 = $vip_commissions->level_2;
                        $level_3 = $vip_commissions->level_3;
                        
                        //cashback commissions
                        $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package->id);
                        $direct_wallet = $vip_commissions_wallet->Direct;
                        $level_1_wallet = $vip_commissions_wallet->level_1;
                        $level_2_wallet = $vip_commissions_wallet->level_2;
                        $level_3_wallet = $vip_commissions_wallet->level_3;
                        
                        //bmt commissions
                        $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package->id);
                        $direct_bmt = $vip_commissions_bmt->Direct;
                        $level_1_bmt = $vip_commissions_bmt->level_1;
                        $level_2_bmt = $vip_commissions_bmt->level_2;
                        $level_3_bmt = $vip_commissions_bmt->level_3;
                        
                        //shelter_commissions
                        $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package->id);
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
                        $ref_tree = $this->generic_model->getInfo('referrals','user_id',$user_id);
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
                        $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
                        $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
                        $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
                        $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3);
                        
                        //fund the silver and gold shelter holders
                        $this->silver_or_gold($direct_ref,$direct_shelter);
                        $this->silver_or_gold($lev1,$level_1_shelter);
                        $this->silver_or_gold($lev2,$level_2_shelter);
                        $this->silver_or_gold($lev3,$level_3_shelter);
                        $this->silver_or_gold($lev4,$level_4_shelter);
                        $this->silver_or_gold($lev5,$level_5_shelter);
                        $this->silver_or_gold($lev6,$level_6_shelter);
                        $this->silver_or_gold($lev7,$level_7_shelter);
                        $this->silver_or_gold($lev8,$level_8_shelter);
                        $this->silver_or_gold($lev9,$level_9_shelter);
                        
                        //update the active shelter to active
                        $shelterData = array('status'=>'active','activated_date'=>date('Y-m-d H:i:s'));
                        $shelter_condition = array('user_id'=>$user_id);
                        $this->generic_model->update_data('active_shelters', $shelterData, $shelter_condition);
                        $update_user_data = array(
                            'vip_pending'=>0,
                            'is_vip'=>1,
                            'shelter_pending'=>0,
                            'is_shelter'=>1
                        );
                        $user_condition = array('id' => $user_id);  
                        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                        
                        //set the wallet activation as well for other packages
                        if($package->id > 2){
                            $user_data = array(
                                'shelter_wallet'=>1
                            );
                            $u_condition = array('id' => $user_id);  
                            $this->generic_model->update_data('users', $user_data, $u_condition);
                              
                        }
                        
                     }else{
                        $userOrder = $this->generic_model->get_by_condition('orders',array('user_id'=>$user_id, 'status' => 'pending'));
                        //Variables
                        $method = 'Card Payment';
                        $date = date('Y-m-d H:i:s');
                        $datetime = date('Y-m-d H:i:s');
                        $finalDeposit = $userOrder->amount;
                        
                        $percentage = 7.5 / 100; // Converting percentage to decimal
                        $vat = $finalDeposit * $percentage;
                        
                        //add the vat data
                        $vat_data = array(
                            'user_id'=>$user_id,
                            'amount'=>$finalDeposit,
                            'activity'=>'Student Palliative Activation',
                            'vat'=>$vat,
                            'date'=>date('Y-m-d H:i:s')
                        );
                        $this->generic_model->insert_data('vat_data',$vat_data);
                        
                        //Deposit Array
                        $depositInfo = array(
                            'userId'=>$user_id, 
                            'txnCode'=>'BA-BT-345'.$userOrder->id,
                            'amount'=>$userOrder->amount, 
                            'paymentMethod'=> $method, 
                            'createdDtm'=>$datetime
                        );
                        $this->generic_model->insert_data('deposits', $depositInfo);
                         
                         //this is a one time payment, let us get the distributables
                         $bmt_price = $this->generic_model->getInfo('bmt_price','id',1)->amount;
                         $share_allocation = $this->generic_model->getInfo('financial_data','id',1);
                         $share_allocation_bmt = $share_allocation->bmt;
                         $share_allocation_sug = $share_allocation->sug;
                         $share_allocation_funding = $share_allocation->palliative_funds;
                         $share_allocation_revenue = $share_allocation->revenue;
                         
                          //start bmt share
                         $bmtConvert = number_format(($share_allocation_bmt / $bmt_price),8);
                         $oldBMT = $user->token;
                         $newBMT = number_format(($bmtConvert + $oldBMT),8);
                         
                         $update_user_data = array(
                                'pending_activation' => 0,
                                'activated'=>1,
                                'token'=>$newBMT
                                
                            );
                         $user_condition = array('id' => $user_id);  
                         $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                         
                         //save transaction history BMT.........
                            $transactionBMT = array(
                                'user_id' => $user_id,
                                'order_id' =>$userOrder->id,
                                'transaction_type' => 'credit',
                                'amount' => $newBMT,  // Assuming you have the price for each item
                                'description' => 'Palliative activation BPT Bonus',  // Add a relevant description
                                'status' => 'Successful'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionBMT);
                             //remittance share
                             $revenue_data = array('user_id'=>$user_id,'amount'=>$share_allocation_revenue,'date'=>date('Y-m-d H:i:s'));
                             $this->generic_model->insert_data('revenue', $revenue_data);
                             
                             //sug remittance
                             $sug_data = array('user_id'=>$user_id,'sug_id'=>1,	'amount'=>$share_allocation_sug,'date'=>date('Y-m-d H:i:s'));
                             $this->generic_model->insert_data('sug', $sug_data);
                             
                             //palliative funds remittance
                             $palliative_data = array('user_id'=>$user_id,'amount'=>$share_allocation_funding,'date'=>date('Y-m-d H:i:s'));
                             $this->generic_model->insert_data('palliative_funds', $palliative_data);
                             
                             
                             $order_table = 'orders';
                             $update_order_data = array(
                                    'status' => 'Paid',
                                );
                             $order_condition = array('id' => $userOrder->id); 
                             $user_rows_affected = $this->generic_model->update_data($order_table, $update_order_data, $order_condition);
                             
                             //insert activation countdown.
                              $activated_entry = array(
                                    'user_id' => $user_id,
                                    'activated_date' => date('Y-m-d H:i:s'),
                                    'end_date' => date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s') . ' +30 days'))
                                );
                              $this->generic_model->insert_data('activation_countdown', $activated_entry);
                                         
                     }
              }
            
            
            //send email to user
            $this->email->from('notifications@beepagro.com', 'BeepAgro Palliative');
            $this->email->to($user_email);
            $this->email->subject('BeepAgro Payment Confirmation');
            $this->email->message("Your Palliative Packages Payment was successful,");
            $this->email->send();
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			
			$_SESSION['item'] = 'BPI Activation';
				$_SESSION['amount']= $finalDeposit;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('dashboard');
        }
    }
	
	public function flutterwaveCallback_wallet(){
        $txref = $_SESSION['txref'];
		$funding_id = $_SESSION['funding_id'];
        $user_id = $this->session->userdata('user_id');
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $id = $this->generic_model->getInfo('orders','user_id',$user_id)->id;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );

        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Variables
            $method = 'flutterwave';
            $date = date('Y-m-d H:i:s');
            $datetime = date('Y-m-d H:i:s');
            $finalDeposit = $chargeAmountPlain;

            //Deposit Array
            $depositInfo = array(
                'userId'=>$user_id, 
                'txnCode'=>$_SESSION['txref'],
                'amount'=>$finalDeposit, 
                'paymentMethod'=> $method, 
                'createdDtm'=>$datetime
            );
            $this->generic_model->insert_data('deposits', $depositInfo);
            $user_table = 'users';
            //check if it is part pay and what state it is...
            $user = $this->generic_model->getInfo($user_table,'id', $user_id);
			
			//credit wallet and add to transaction list
			$amount = $this->generic_model->getInfo('funding_history','id',$funding_id)->amount;
			$old_wallet = $user->wallet;
			$new_wallet = ($old_wallet + $amount);
			
			$update_user_data = array(
              'wallet' => $new_wallet,
            );
            $user_condition = array('id' => $user_id);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                    
            $transactionWallet = array(
              'user_id' => $user_id,
              'order_id' =>$funding_id,
              'transaction_type' => 'credit',
              'amount' => $amount,  
              'description' => 'Wallet Funding',  // Add a relevant description
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWallet);
			
			//update funding_history to successful
			$data_fh = array('status'=>'Successful');
			$this->generic_model->update_data('funding_history',$data_fh,array('id'=>$funding_id));
            
            //send email to user
            $this->email->from('notifications@beepagro.com', 'BeepAgro Palliative');
            $this->email->to($user_email);
            $this->email->subject('BeepAgro Wallet Funding');
            $this->email->message("Your Wallet Funding was successful,");
            $this->email->send();
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			$percentage = 7.5 / 100; $vat = $finalDeposit * $percentage;
			    $_SESSION['item'] = 'Wallet Funding';
				$_SESSION['amount']= $finalDeposit;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('my_assets');
        }
    }
    
    public function merchant_flutterwaveCallback(){
        $txref = $_SESSION['txref'];
        $user_id = $this->session->userdata('user_id');
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );

        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Deposit Array
            $user_table = 'users';
            //check if it is part pay and what state it is...
            $user = $this->generic_model->getInfo($user_table,'id', $user_id);
            
            //it is not part pay so we want to check if this payment is for vip package
                $method = 'Card Payment';
                $date = date('Y-m-d H:i:s');
                $datetime = date('Y-m-d H:i:s');
                $finalDeposit = $this->session->userdata('amount');
                    
                $percentage = 7.5 / 100; // Converting percentage to decimal
                $vat = $finalDeposit * $percentage;
                        
                //add the vat data
                $vat_data = array(
                  'user_id'=>$user_id,
                  'amount'=>$finalDeposit,
                  'activity'=>'Pickup Center Activation Fee',
                  'vat'=>$vat,
                  'date'=>date('Y-m-d H:i:s')
                 );
                $this->generic_model->insert_data('vat_data',$vat_data);
                
                $merchshare = $this->generic_model->getInfo('pickup_reg_fee','id',1);
                $share_allocation_revenue = ($merchshare->amount - $merchshare->referrer_percent);
            
                $update_user_data = array(
                                'status' => 'active',

                            );
                         $user_condition = array('user_id' => $user_id);  
                         $user_rows_affected = $this->generic_model->update_data('merchants', $update_user_data, $user_condition);
                         
                         //save transaction history BMT.........
                            $transactionBMT = array(
                                'user_id' => $user_id,
                                'order_id' =>0,
                                'transaction_type' => 'payment',
                                'amount' => $finalDeposit, 
                                'description' => 'Pickup Center Activation Fee', 
                                'status' => 'Successful'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionBMT);
                             //remittance share
                            $revenue_data = array('user_id'=>$user_id,'amount'=>$share_allocation_revenue,'date'=>date('Y-m-d H:i:s'));
                            $this->generic_model->insert_data('revenue', $revenue_data);
                             
                            //referrer...
                            $referrer = $this->generic_model->getInfo('referrals','user_id',$user_id)->referred_by;
                            $referrer_info = $this->generic_model->getInfo('users','id',$referrer);
                            $oldwallet = $referrer_info->wallet;
                            $newwallet = ($merchshare->referrer_percent + $oldwallet);
                            $this->generic_model->update_data('users',array('wallet'=>$newwallet), array('id'=>$referrer));
              
            
            
            //send email to user
            $this->email->from('notifications@beepagro.com', 'BeepAgro Palliative');
            $this->email->to($user_email);
            $this->email->subject('BeepAgro Payment Confirmation');
            $this->email->message("Your Pickup Center Activation Payment was successful,");
            $this->email->send();
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			
			$_SESSION['item'] = 'Pickup Center Activation';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('dashboard');
        }
    }
    
    public function flutterwaveCallback_vip(){
        $txref = $_SESSION['txref'];
        $package_name = $_SESSION['package_name'];
		$base_amount = $_SESSION['amount'];
        $active_shelter_id = $_SESSION['active_shelter_id'];
        $user_id = $this->session->userdata('user_id');
        $user = $this->generic_model->getInfo('users','id',$user_id);
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $oldSpendable = $this->generic_model->getInfo('users','id',$user_id)->spendable;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );
        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Variables
            $method = 'flutterwave';
            $date = date('Y-m-d H:i:s');
            $datetime = date('Y-m-d H:i:s');
            $finalDeposit = $base_amount;

            //Deposit Array
            $depositInfo = array(
                'userId'=>$user_id, 
                'txnCode'=>$_SESSION['txref'],
                'amount'=>$finalDeposit, 
                'paymentMethod'=> $method, 
                'createdDtm'=>$datetime
            );
            $this->generic_model->insert_data('deposits', $depositInfo);
            
            //update the active shelter to active
            $shelterData = array('status'=>'active','activated_date'=>date('Y-m-d H:i:s'));
            $shelter_condition = array('user_id'=>$user_id);
            $this->generic_model->update_data('active_shelters', $shelterData, $shelter_condition);
            
            $update_user_data = array(
                'vip_pending'=>0,
                'is_vip'=>1,
                'shelter_pending'=>0,
                'is_shelter'=>1
            );
            $user_condition = array('id' => $user_id);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
            if($package_name = 'silver'){
                $cName = 'Shelter Pallative Silver';
            }elseif($package_name = 'plus'){
                $cName = 'Pallative VIP Plus program';
            }elseif($package_name = 'gold'){
				$cName = 'Shelter Pallative Gold';
			}else{
                $cName = 'Pallative VIP Club program';
            }
			
			$payment_amount = $base_amount;

            $package = $this->generic_model->getInfo( 'packages', 'package_price', $payment_amount );
            $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
            
            //get commisions of palliative
            $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package->id);
            $direct = $vip_commissions->Direct;
            $level_1 = $vip_commissions->level_1;
            $level_2 = $vip_commissions->level_2;
            $level_3 = $vip_commissions->level_3;
            
            //cashback commissions
            $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package->id);
            $direct_wallet = $vip_commissions_wallet->Direct;
            $level_1_wallet = $vip_commissions_wallet->level_1;
            $level_2_wallet = $vip_commissions_wallet->level_2;
            $level_3_wallet = $vip_commissions_wallet->level_3;
            
            //bmt commissions
            $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package->id);
            $direct_bmt = $vip_commissions_bmt->Direct;
            $level_1_bmt = $vip_commissions_bmt->level_1;
            $level_2_bmt = $vip_commissions_bmt->level_2;
            $level_3_bmt = $vip_commissions_bmt->level_3;
            
            //shelter_commissions
            $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package->id);
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
            $ref_tree = $this->generic_model->getInfo('referrals','user_id',$user_id);
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
			
			$spendable_commissions = $this->generic_model->getInfo('commissions_spendable','package_id',$package->id);
            $spend_direct  = $spendable_commissions->Direct;
            $spend_level_1 = $spendable_commissions->level_1;
            $spend_level_2 = $spendable_commissions->level_2;
            $spend_level_3 = $spendable_commissions->level_3;
			//pay spendable
				
			$this->paySpendable($spend_direct,$direct_ref,$package->id);
			$this->paySpendable($spend_level_1,$lev1,$package->id);
			$this->paySpendable($spend_level_2,$lev2,$package->id);
			$this->paySpendable($spend_level_3,$lev3,$package->id);
			
            //fund the ref_tree_cartel BMT.........
            $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
            $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
            $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
            $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3);
            
            //fund the silver and gold shelter holders
            $this->silver_or_gold($direct_ref,$direct_shelter);
            $this->silver_or_gold($lev1,$level_1_shelter);
            $this->silver_or_gold($lev2,$level_2_shelter);
            $this->silver_or_gold($lev3,$level_3_shelter);
            $this->silver_or_gold($lev4,$level_4_shelter);
            $this->silver_or_gold($lev5,$level_5_shelter);
            $this->silver_or_gold($lev6,$level_6_shelter);
            $this->silver_or_gold($lev7,$level_7_shelter);
            $this->silver_or_gold($lev8,$level_8_shelter);
            $this->silver_or_gold($lev9,$level_9_shelter);
            
			
			//update the active shelter to active
          	$shelterData = array( 'status' => 'active', 'activated_date' => date( 'Y-m-d H:i:s' ) );
          	$shelter_condition = array( 'user_id' => $user_id );
          	$this->generic_model->update_data( 'active_shelters', $shelterData, $shelter_condition );
			
			
			  //set the wallet activation as well for other package
			  if ( $package->id == 4 || $package->id == 6 ) {
				$user_data = array(
				  'shelter_wallet' => 1
				);
				$u_condition = array( 'id' => $user_id );
				$this->generic_model->update_data( 'users', $user_data, $u_condition );
			  }
			  
			if($package->id == 7 ){
              //credit the user start off bonus.......................
              $newSpendable = ($oldSpendable + 3000);
              $spendData = array('spendable'=>$newSpendable);
              $this->generic_model->update_data('users',$spendData,array('id'=>$user_id));
              
               //save transaction history .........
            $transactionWelcome = array(
              'user_id' => $user_id,
              'order_id' => 0,
              'transaction_type' => 'credit',
              'amount' => 3000, 
              'description' => 'Welcome Bonus!!',
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionWelcome );
            
             //insert bonus record
            $bonus_data = array(
                'user_id'=>$user_id,
                'amount'=>3000,
                'payment_date'=>date('Y-m-d H:i:s') 	
            );
            $save_bonus = $this->generic_model->insert_data('welcome_bonus',$bonus_data);
                
            
            //send debit email
            $to = $user->email;
            $subject = 'Credit Transaction Notification (BPI)!';
            $title = 'Dear  ' . $user->firstname;
            $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN3,000.00]</li>
							<li>Description: [BPI Membership Welcome Bonus]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
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
            
            //send email to user
			$shelter_type = $is_shelter->shelter_option;
			  		$sponsor_data = $this->generic_model->getInfo('users','id',$direct_ref);
					$userInfo = $this->generic_model->getInfo('users','id',$user_id);
			  		//send email
					$title = 'Dear  '.$userInfo->firstname;
					$to = $userInfo->email;
					$subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
                    $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
				<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: '.$userInfo->firstname.' '.$userInfo->lastname.'</li>
						<li>Username: '.$userInfo->username.'</li>
						<li>Sponsor Name: '.$sponsor_data->firstname.' '.$sponsor_data->lastname.'</li>
						<li>Sponsor Email: '.$sponsor_data->email.'</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref='.$userInfo->referral_link.'</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>'.$package->package_name.'</li>
						<li>BPI Annual First Year payment membership</li>
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

                    $this->sendemail($title,$to,$subject,$message);
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			
			$_SESSION['item'] = 'BPI Activation';
				$_SESSION['amount']= $finalDeposit;
				$_SESSION['vat'] = ' ';
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('dashboard');
        }
    }
    
    public function flutterwaveCallback_vip_dual(){
        $txref = $_SESSION['txref'];
        $package_name = $_SESSION['package_name'];
		$base_amount = $_SESSION['amount'];
        $active_shelter_id = $_SESSION['active_shelter_id'];
        $user_id = $this->session->userdata('user_id');
        $user = $this->generic_model->getInfo('users','id',$user_id);
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $oldSpendable = $this->generic_model->getInfo('users','id',$user_id)->spendable;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );
        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Variables
            $method = 'flutterwave';
            $date = date('Y-m-d H:i:s');
            $datetime = date('Y-m-d H:i:s');
            $finalDeposit = $base_amount;

            //Deposit Array
            $depositInfo = array(
                'userId'=>$user_id, 
                'txnCode'=>$_SESSION['txref'],
                'amount'=>$finalDeposit, 
                'paymentMethod'=> $method, 
                'createdDtm'=>$datetime
            );
            $this->generic_model->insert_data('deposits', $depositInfo);
            
            //update the active shelter to active
            $shelterData = array('status'=>'active','activated_date'=>date('Y-m-d H:i:s'));
            $shelter_condition = array('user_id'=>$user_id);
            $this->generic_model->update_data('active_shelters', $shelterData, $shelter_condition);
            
            $update_user_data = array(
                'vip_pending'=>0,
                'is_vip'=>1,
                'shelter_pending'=>0,
                'is_shelter'=>1
            );
            $user_condition = array('id' => $user_id);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
             //insert cng payment...........
            $qwik_data = array(
                'user_id'=>$userId,
                'amount'=>10000,
                'vat'=>750,
                'date'=>date('Y-m-d H:i:s'),
                'status'=>'confirmed'
            );
            $this->generic_model->insert_data('qwik_data',$qwik_data);
            
            
            $cName = 'Pallative VIP Plus program';
           
			$payment_amount = 50000;

            $package = $this->generic_model->getInfo( 'packages', 'package_price', $payment_amount );
            $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
            
            //get commisions of palliative
            $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package->id);
            $direct = $vip_commissions->Direct;
            $level_1 = $vip_commissions->level_1;
            $level_2 = $vip_commissions->level_2;
            $level_3 = $vip_commissions->level_3;
            
            //cashback commissions
            $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package->id);
            $direct_wallet = $vip_commissions_wallet->Direct;
            $level_1_wallet = $vip_commissions_wallet->level_1;
            $level_2_wallet = $vip_commissions_wallet->level_2;
            $level_3_wallet = $vip_commissions_wallet->level_3;
            
            //bmt commissions
            $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package->id);
            $direct_bmt = $vip_commissions_bmt->Direct;
            $level_1_bmt = $vip_commissions_bmt->level_1;
            $level_2_bmt = $vip_commissions_bmt->level_2;
            $level_3_bmt = $vip_commissions_bmt->level_3;
            
            //shelter_commissions
            $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package->id);
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
            $ref_tree = $this->generic_model->getInfo('referrals','user_id',$user_id);
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
			
			$spendable_commissions = $this->generic_model->getInfo('commissions_spendable','package_id',$package->id);
            $spend_direct  = $spendable_commissions->Direct;
            $spend_level_1 = $spendable_commissions->level_1;
            $spend_level_2 = $spendable_commissions->level_2;
            $spend_level_3 = $spendable_commissions->level_3;
			//pay spendable
				
			$this->paySpendable($spend_direct,$direct_ref,$package->id);
			$this->paySpendable($spend_level_1,$lev1,$package->id);
			$this->paySpendable($spend_level_2,$lev2,$package->id);
			$this->paySpendable($spend_level_3,$lev3,$package->id);
			
            //fund the ref_tree_cartel BMT.........
            $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
            $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
            $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
            $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3);
            
            //fund the silver and gold shelter holders
            $this->silver_or_gold($direct_ref,$direct_shelter);
            $this->silver_or_gold($lev1,$level_1_shelter);
            $this->silver_or_gold($lev2,$level_2_shelter);
            $this->silver_or_gold($lev3,$level_3_shelter);
            $this->silver_or_gold($lev4,$level_4_shelter);
            $this->silver_or_gold($lev5,$level_5_shelter);
            $this->silver_or_gold($lev6,$level_6_shelter);
            $this->silver_or_gold($lev7,$level_7_shelter);
            $this->silver_or_gold($lev8,$level_8_shelter);
            $this->silver_or_gold($lev9,$level_9_shelter);
            
			
			//update the active shelter to active
          	$shelterData = array( 'status' => 'active', 'activated_date' => date( 'Y-m-d H:i:s' ) );
          	$shelter_condition = array( 'user_id' => $user_id );
          	$this->generic_model->update_data( 'active_shelters', $shelterData, $shelter_condition );
			
			
			  //set the wallet activation as well for other package
			  if ( $package->id == 4 || $package->id == 6 ) {
				$user_data = array(
				  'shelter_wallet' => 1
				);
				$u_condition = array( 'id' => $user_id );
				$this->generic_model->update_data( 'users', $user_data, $u_condition );
			  }
			  
			if($package->id == 7 ){
              //credit the user start off bonus.......................
              $newSpendable = ($oldSpendable + 3000);
              $spendData = array('spendable'=>$newSpendable);
              $this->generic_model->update_data('users',$spendData,array('id'=>$user_id));
              
               //save transaction history .........
            $transactionWelcome = array(
              'user_id' => $user_id,
              'order_id' => 0,
              'transaction_type' => 'credit',
              'amount' => 3000, 
              'description' => 'Welcome Bonus!!',
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionWelcome );
            
             //insert bonus record
            $bonus_data = array(
                'user_id'=>$user_id,
                'amount'=>3000,
                'payment_date'=>date('Y-m-d H:i:s') 	
            );
            $save_bonus = $this->generic_model->insert_data('welcome_bonus',$bonus_data);
                
            
            //send debit email
            $to = $user->email;
            $subject = 'Credit Transaction Notification (BPI)!';
            $title = 'Dear  ' . $user->firstname;
            $message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN3,000.00]</li>
							<li>Description: [BPI Membership Welcome Bonus]</li>
							<li>Transaction ID: [BPI-TXID-' . $trans_send . ']</li>
						</ul>
						<br>
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
            
            //send email to user
			$shelter_type = $is_shelter->shelter_option;
			  		$sponsor_data = $this->generic_model->getInfo('users','id',$direct_ref);
					$userInfo = $this->generic_model->getInfo('users','id',$user_id);
			  		//send email
					$title = 'Dear  '.$userInfo->firstname;
					$to = $userInfo->email;
					$subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
                    $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
				<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: '.$userInfo->firstname.' '.$userInfo->lastname.'</li>
						<li>Username: '.$userInfo->username.'</li>
						<li>Sponsor Name: '.$sponsor_data->firstname.' '.$sponsor_data->lastname.'</li>
						<li>Sponsor Email: '.$sponsor_data->email.'</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref='.$userInfo->referral_link.'</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>'.$package->package_name.'</li>
						<li>BPI Annual First Year payment membership</li>
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

                    $this->sendemail($title,$to,$subject,$message);
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			
			$_SESSION['item'] = 'BPI Dual Activation';
				$_SESSION['amount']= $finalDeposit;
				$_SESSION['vat'] = ' ';
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('dashboard');
        }
    }
    
    public function sponsor_flutterwaveCallback_vip(){
        $txref = $_SESSION['txref'];
        $package_name = $_SESSION['package_name'];
        $active_shelter_id = $_SESSION['active_shelter_id'];
        $user_id = $_SESSION['beneficiary'];
        $user_email = $this->generic_model->getInfo('users','id',$user_id)->email;
        $date = date('Y-m-d H:i:s');
        $transaction_id = $this->input->get('transaction_id',TRUE);
        $currentDate = new DateTime();
        $curl = curl_init();
        
        curl_setopt_array($curl, array(
          CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transaction_id."/verify",
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
        
        $response = curl_exec($curl);
        $resp = json_decode($response, true);
        
       // echo '<pre>';
       // print_r($resp);
      //  echo '</pre>';
      //  exit();

        $paymentStatus = $resp['status'];
        $paymentMessage = $resp['message'];
      	$paymentStatId = $resp['data']['id'];
      	$paymentTxRef = $resp['data']['tx_ref'];
      	$flwref = $resp['data']['flw_ref'];
        $chargeAmountPlain = $resp['data']['amount'];
        $chargeAmount = $resp['data']['charged_amount'];
        $chargeCurrency = $resp['data']['currency'];
        $appFee = $resp['data']['app_fee'];
        $merchantFee = $resp['data']['merchant_fee'];
        $provider_response = $resp['data']['processor_response'];
        $auth_model = $resp['data']['auth_model'];
        $chargeIp = $resp['data']['ip'];
        $narration = $resp['data']['narration'];
        $dataStatus = $resp['data']['status'];
        $chargePaymentType = $resp['data']['payment_type']; 
        $account_id = $resp['data']['account_id'];
        $createdAt = $resp['data']['created_at'];
        
        
        $metadata = $resp['data']['meta']; 
        $amount_settled = $resp['data']['amount_settled'];
        $custid = $resp['data']['customer']['id']; 
        $custPhone = $resp['data']['customer']['phone_number'];
        $custEmail = $resp['data']['customer']['email'];
        
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
            'metadata' => json_encode($metadata),
            'amount_settled' => $amount_settled,
            'custid' => $custid,
            'custPhone' => $custPhone,
            'custEmail' => $custEmail
        );
        $this->db->insert('flutterwave_payments', $data);

        if ($paymentStatus == "success") {
          //Give Value and return to Success page
          
            //for creating the txn code
            $this->load->helper('string');

            //Variables
            $method = 'flutterwave';
            $date = date('Y-m-d H:i:s');
            $datetime = date('Y-m-d H:i:s');
            $finalDeposit = $chargeAmountPlain;

            //Deposit Array
            $depositInfo = array(
                'userId'=>$user_id, 
                'txnCode'=>$_SESSION['txref'],
                'amount'=>$finalDeposit, 
                'paymentMethod'=> $method, 
                'createdDtm'=>$datetime
            );
            $this->generic_model->insert_data('deposits', $depositInfo);
            
            //update the active shelter to active
            $shelterData = array('status'=>'active','activated_date'=>date('Y-m-d H:i:s'));
            $shelter_condition = array('user_id'=>$user_id);
            $this->generic_model->update_data('active_shelters', $shelterData, $shelter_condition);
            
            $update_user_data = array(
                'vip_pending'=>0,
                'is_vip'=>1,
                'shelter_pending'=>0,
                'is_shelter'=>1
            );
            $user_condition = array('id' => $user_id);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
            if($package_name = 'silver'){
                $cName = 'Shelter Pallative Silver';
            }elseif($package_name = 'gold'){
                $cName = 'Shelter Pallative Gold';
            }else{
                $cName = 'Pallative VIP Club program';
            }

            //get package info
            $package = $this->generic_model->getInfo('packages','package_name',$cName);
            
            //let us get the distributables
            $bmt_price = $this->generic_model->getInfo('bmt_price','id',1)->amount;
            
            //get commisions of palliative
            $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package->id);
            $direct = $vip_commissions->Direct;
            $level_1 = $vip_commissions->level_1;
            $level_2 = $vip_commissions->level_2;
            $level_3 = $vip_commissions->level_3;
            
            //cashback commissions
            $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package->id);
            $direct_wallet = $vip_commissions_wallet->Direct;
            $level_1_wallet = $vip_commissions_wallet->level_1;
            $level_2_wallet = $vip_commissions_wallet->level_2;
            $level_3_wallet = $vip_commissions_wallet->level_3;
            
            //bmt commissions
            $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package->id);
            $direct_bmt = $vip_commissions_bmt->Direct;
            $level_1_bmt = $vip_commissions_bmt->level_1;
            $level_2_bmt = $vip_commissions_bmt->level_2;
            $level_3_bmt = $vip_commissions_bmt->level_3;
            
            //shelter_commissions
            $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package->id);
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
            $ref_tree = $this->generic_model->getInfo('referrals','user_id',$user_id);
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
            $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
            $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
            $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
            $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3); //$package_id,$amount,$price,$userid,$cashback,$palliavtive
            
            //fund the silver and gold shelter holders
            $this->silver_or_gold($direct_ref,$direct_shelter);
            $this->silver_or_gold($lev1,$level_1_shelter);
            $this->silver_or_gold($lev2,$level_2_shelter);
            $this->silver_or_gold($lev3,$level_3_shelter);
            $this->silver_or_gold($lev4,$level_4_shelter);
            $this->silver_or_gold($lev5,$level_5_shelter);
            $this->silver_or_gold($lev6,$level_6_shelter);
            $this->silver_or_gold($lev7,$level_7_shelter);
            $this->silver_or_gold($lev8,$level_8_shelter);
            $this->silver_or_gold($lev9,$level_9_shelter);
            
            
            //send email to user
            $this->email->from('notifications@beepagro.com', 'BeepAgro Palliative');
            $this->email->to($user_email);
            $this->email->subject('BeepAgro Payment Confirmation');
            $this->email->message("Your BPI Palliative Program Activation was successful,");
            $this->email->send();
            
            $this->session->unset_userdata('user_details');
            
            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user_id))->row();

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $this->session->set_flashdata('success', 'transaction successful');
			
			$_SESSION['item'] = 'BPI Activation';
				$_SESSION['amount']= $finalDeposit;
				$_SESSION['vat'] = '';
				$_SESSION['qty'] = 1;
			
            redirect('payment_success_page');
        }else {
            $this->session->set_flashdata('error', 'unable to process this transaction at the moment, try again in a few minutes');
            redirect('dashboard');
        }
    } 
    
    public function convertBMT($package_id,$amount,$price,$userid,$cashback,$palliavtive){
	    $userInfo = $this->generic_model->getInfo('users','id',$userid);
	    //get the tax settings
	    $palliative_meal_tax = $this->generic_model->getInfo('palliative_tax_settings','id',1)->percentage;
	    $palliative_env_tax = $this->generic_model->getInfo('palliative_tax_settings','id',3)->percentage;

	    //we handle calculations for tax settings
	    $percentageAmount_pmt = ($palliative_meal_tax / 100) * $palliavtive;
	    $percentageAmount_pet = ($palliative_env_tax / 100) * $palliavtive;
	    
	    $total_deductable = ($percentageAmount_pmt + $percentageAmount_pet);
	    $palliavtive = ($palliavtive - $total_deductable);
	    
	    //save tax details... 	
	    $tax_pmt_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'palliative',
	      'amount'=>$percentageAmount_pmt,
	      'activity'=>'Palliative Meal Tax',
	      'percentage'=>$palliative_meal_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_pmt_array);
	    
	    $tax_pet_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'palliative',
	      'amount'=>$percentageAmount_pet,
	      'activity'=>'Environmental Protection Tax',
	      'percentage'=>$palliative_env_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_pet_array);
	    
	    
        $package = $this->generic_model->getInfo('packages','id',$package_id);
        $bmtConvert = number_format(($amount / $price),8);
        $user = $this->generic_model->getInfo('users','id',$userid);
        $oldBMT = $user->token;
        $oldCashback = $user->cashback;
        $oldPalliative = $user->palliative;
        $newBMT = number_format(($bmtConvert + $oldBMT),8);
        $newCashback = ($cashback + $oldCashback);
        $palliative_tax = 
        $newPalliative = ($palliavtive + $oldPalliative);
        
        //check if the shelter is activated if not activate it if the amount in palliative wallet has reached the required amount.
        $is_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userid);
        if(!empty($is_shelter)){
            //what is their level?
            $package_level = $is_shelter->shelter_package;
            if($package_level == 1){
                //silver subscriber........
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($newPalliative > 100000){
                    $user_shelter_status = $user->shelter_wallet;
                    if(empty($user_shelter_status)){
                        //activate the shelter wallet and add balance to the palliative wallet.
                        $walletBalance = ($newPalliative - 100000);
                        $sh_data = array(
                          'palliative'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_wallet'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        
                        //save transaction history .........
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 100000,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
						//send debit email
						$to = $userInfo->email;
						$subject = 'Debit Transaction Notification (BPI)!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a debit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN100,000.00]</li>
							<li>Description: [Silver Shelter Wallet activation]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);
			  		
                    $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 100000,
                            'type'=> 'Silver Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                    $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                    //save the money paid for tracking....
                    $shelter_type = $is_shelter->shelter_option;
			  		$shelter_type_name = $this->generic_model->getInfo('shelter_program','id',$shelter_type)->name;
			  		$ref_data = $this->generic_model->getInfo('referrals','user_id',$userid);
			  		$sponsor_data = $this->generic_model->getInfo('users','id',$ref_data->id);
			  		//send email
					$to = $userInfo->email;
					$subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
					$title = 'Dear  '.$userInfo->firstname;
                    $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
					<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: '.$userInfo->firstname.' '.$userInfo->lastname.'</li>
						<li>Username: '.$userInfo->username.'</li>
						<li>Sponsor Name: '.$sponsor_data->firstname.' '.$sponsor_data->lastname.'</li>
						<li>Sponsor Email: '.$sponsor_data->email.'</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref='.$userInfo->referral_link.'</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>'.$shelter_type_name.'</li>
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

                    $this->sendemail($title,$to,$subject,$message);
						
			  		
                        //distribute the rewards from the shelter activation...
                        $regular_vip_commission = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 2 );
                        $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 3 );
                        $direct = ($vip_commissions->Direct - $regular_vip_commission->Direct);
                        $level_1 = ($vip_commissions->level_1 - $regular_vip_commission->level_1);
                        $level_2 = ($vip_commissions->level_2 - $regular_vip_commission->level_2);
                        $level_3 = ($vip_commissions->level_3 - $regular_vip_commission->level_3);
                        
                        //cashback commissions
                        $regular_wal_commission = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 2 );
                        $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 3 );
                        $direct_wallet  = ($vip_commissions_wallet->Direct - $regular_wal_commission->Direct);
                        $level_1_wallet = ($vip_commissions_wallet->level_1 - $regular_wal_commission->level_1);
                        $level_2_wallet = ($vip_commissions_wallet->level_2 - $regular_wal_commission->level_2);
                        $level_3_wallet = ($vip_commissions_wallet->level_3 - $regular_wal_commission->level_3);
            
                        //bmt commissions
            			$regular_bpt_commission = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 2 );
                        $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 3 );
                        $direct_bmt = ($vip_commissions_bmt->Direct - $regular_bpt_commission->Direct);
                        $level_1_bmt = ($vip_commissions_bmt->level_1 - $regular_bpt_commission->level_1);
                        $level_2_bmt = ($vip_commissions_bmt->level_2 - $regular_bpt_commission->level_2);
                        $level_3_bmt = ($vip_commissions_bmt->level_3 - $regular_bpt_commission->level_3);
                                    
                        //shelter_commissions
                        $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',3);
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
                        $ref_tree = $this->generic_model->getInfo('referrals','user_id',$userid);
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
                        $this->convertBMT2($package->id,$direct_bmt,$price,$direct_ref,$direct_wallet,$direct);
                        $this->convertBMT2($package->id,$level_1_bmt,$price,$lev1,$level_1_wallet,$level_1);
                        $this->convertBMT2($package->id,$level_2_bmt,$price,$lev2,$level_2_wallet,$level_2);
                        $this->convertBMT2($package->id,$level_3_bmt,$price,$lev3,$level_3_wallet,$level_3);
                        
                        //fund the silver and gold shelter holders
                        $this->silver_or_gold($direct_ref,$direct_shelter);
                        $this->silver_or_gold($lev1,$level_1_shelter);
                        $this->silver_or_gold($lev2,$level_2_shelter);
                        $this->silver_or_gold($lev3,$level_3_shelter);
                        $this->silver_or_gold($lev4,$level_4_shelter);
                        $this->silver_or_gold($lev5,$level_5_shelter);
                        $this->silver_or_gold($lev6,$level_6_shelter);
                        $this->silver_or_gold($lev7,$level_7_shelter);
                        $this->silver_or_gold($lev8,$level_8_shelter);
                        $this->silver_or_gold($lev9,$level_9_shelter);
                        
                    }
                    else{
                      //credit the palliative wallet...............
                          $update_user_data = array(
                            'palliative'=>$newPalliative,
                            );
                          $user_condition = array('id' => $userid);  
                          $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                          //save transaction history BMT.........
                          $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $palliavtive,  // Assuming you have the price for each item
                                'description' => 'Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                          $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
						//send debit email
						$to = $userInfo->email;
						$subject = 'BPI Palliative Bonus Reward Alert!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);

                    }
                }
                else{
                    
                        $update_user_data = array(
                                'palliative'=>$newPalliative,
                        );
                        $user_condition = array('id' => $userid);  
                        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                        
                        //save transaction history BMT.........
                        $transactionDataShelter = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'credit',
                            'amount' => $palliavtive,  // Assuming you have the price for each item
                            'description' => 'Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
					//send email
					    $to = $userInfo->email;
						$subject = 'BPI Palliative Bonus Reward Alert!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);
                    
                }
            }
            else{
                //gold shelter
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($newPalliative > 200000){
                    $user_shelter_status = $user->shelter_wallet;
                    if(empty($user_shelter_status)){
                        //activate the shelter wallet and add balance to the palliative wallet.
                        $walletBalance = ($newPalliative - 200000);
                        $sh_data = array(
                          'palliative'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_wallet'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        
                        //save transaction history .........
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 200000,  // Assuming you have the price for each item
                            'description' => 'Gold Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
						//send debit email
						$to = $userInfo->email;
						$subject = 'Debit Transaction Notification (BPI)!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a debit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN200,000.00]</li>
							<li>Description: [Gold Shelter Wallet activation]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);
                        
                        $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 200000,
                            'type'=> 'Gold Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                        $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                        //save the money paid for tracking....
						$shelter_type = $is_shelter->shelter_option;
			  		$shelter_type_name = $this->generic_model->getInfo('shelter_program','id',$shelter_type)->name;
			  		$ref_data = $this->generic_model->getInfo('referrals','user_id',$userid);
			  		$sponsor_data = $this->generic_model->getInfo('users','id',$ref_data->id);
			  		//send email
					$to = $userInfo->email;
					$subject = 'Welcome to BeepAgro Palliative Initiative (BPI)!';
					$title = 'Dear  '.$userInfo->firstname;
                    $message = '<p>Congratulations and welcome to the BeepAgro Palliative Initiative (BPI)!<br> We are thrilled to have you on board and excited about the journey ahead
					<br>
					<br>
					Here are your membership subscription details:
					<br>
					<ul>
						<li>Name: '.$userInfo->firstname.' '.$userInfo->lastname.'</li>
						<li>Username: '.$userInfo->username.'</li>
						<li>Sponsor Name: '.$sponsor_data->firstname.' '.$sponsor_data->lastname.'</li>
						<li>Sponsor Email: '.$sponsor_data->email.'</li>
						<li>Your Referral Link: https://beepagro.com/app/register?ref='.$userInfo->referral_link.'</li>
					</ul>
					<br>
					<br>
					You have subscribed to the following BPI membership type:
					<ul>
						<li>'.$shelter_type_name.'</li>
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

                    $this->sendemail($title,$to,$subject,$message);
						
                        
                         //distribute the rewards from the shelter activation...
                        $regular_vip_commission = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 2 );
                        $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', 4 );
                        $direct = ($vip_commissions->Direct - $regular_vip_commission->Direct);
                        $level_1 = ($vip_commissions->level_1 - $regular_vip_commission->level_1);
                        $level_2 = ($vip_commissions->level_2 - $regular_vip_commission->level_2);
                        $level_3 = ($vip_commissions->level_3 - $regular_vip_commission->level_3);
            
                        //cashback commissions
            		 $regular_wal_commission = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 2 );
                        $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', 4 );
                        $direct_wallet  = ($vip_commissions_wallet->Direct - $regular_wal_commission->Direct);
                        $level_1_wallet = ($vip_commissions_wallet->level_1 - $regular_wal_commission->level_1);
                        $level_2_wallet = ($vip_commissions_wallet->level_2 - $regular_wal_commission->level_2);
                        $level_3_wallet = ($vip_commissions_wallet->level_3 - $regular_wal_commission->level_3);
            
                        //bmt commissions
            			$regular_bpt_commission = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 2 );
                        $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', 4 );
                        $direct_bmt = ($vip_commissions_bmt->Direct - $regular_bpt_commission->Direct);
                        $level_1_bmt = ($vip_commissions_bmt->level_1 - $regular_bpt_commission->level_1);
                        $level_2_bmt = ($vip_commissions_bmt->level_2 - $regular_bpt_commission->level_2);
                        $level_3_bmt = ($vip_commissions_bmt->level_3 - $regular_bpt_commission->level_3);


                        
                        //shelter_commissions
                        $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',4);
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
                        $ref_tree = $this->generic_model->getInfo('referrals','user_id',$userid);
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
                        $this->convertBMT2($package->id,$direct_bmt,$price,$direct_ref,$direct_wallet,$direct);
                        $this->convertBMT2($package->id,$level_1_bmt,$price,$lev1,$level_1_wallet,$level_1);
                        $this->convertBMT2($package->id,$level_2_bmt,$price,$lev2,$level_2_wallet,$level_2);
                        $this->convertBMT2($package->id,$level_3_bmt,$price,$lev3,$level_3_wallet,$level_3);
                        
                        //fund the silver and gold shelter holders
                        $this->silver_or_gold($direct_ref,$direct_shelter);
                        $this->silver_or_gold($lev1,$level_1_shelter);
                        $this->silver_or_gold($lev2,$level_2_shelter);
                        $this->silver_or_gold($lev3,$level_3_shelter);
                        $this->silver_or_gold($lev4,$level_4_shelter);
                        $this->silver_or_gold($lev5,$level_5_shelter);
                        $this->silver_or_gold($lev6,$level_6_shelter);
                        $this->silver_or_gold($lev7,$level_7_shelter);
                        $this->silver_or_gold($lev8,$level_8_shelter);
                        $this->silver_or_gold($lev9,$level_9_shelter);
                    }
                    else{
                      //credit the palliative wallet...............
                           $update_user_data = array(
                            'palliative'=>$newPalliative,
                            );
                          $user_condition = array('id' => $userid);  
                          $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                          //save transaction history BMT.........
                          $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $palliavtive,  // Assuming you have the price for each item
                                'description' => 'Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                          $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
						  //send email
						  $to = $userInfo->email;
						$subject = 'BPI Palliative Bonus Reward Alert!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);
                    }
                }
                else{
                    
                        $update_user_data = array(
                                'palliative'=>$newPalliative,
                        );
                        $user_condition = array('id' => $userid);  
                        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                        
                        //save transaction history BMT.........
                        $transactionDataShelter = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'credit',
                            'amount' => $palliavtive,  // Assuming you have the price for each item
                            'description' => 'Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
					//send email
					$to = $userInfo->email;
						$subject = 'BPI Palliative Bonus Reward Alert!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);
                    
                }
            }
        }
        else{
            $update_user_data = array(
            'palliative'=>$newPalliative
            );
            $user_condition = array('id' => $userid);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
            //save transaction history Palliative.........
            $transactionDataPalliative = array(
                'user_id' => $userid,
                'order_id' =>$package->id,
                'transaction_type' => 'credit',
                'amount' => $palliavtive,  // Assuming you have the price for each item
                'description' => 'BPI Palliative Reward',  // Add a relevant description
                'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataPalliative);
			$to = $userInfo->email;
						$subject = 'BPI Palliative Bonus Reward Alert!';
						$title = 'Dear  '.$userInfo->firstname;
						$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
							<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
							<li>Description: [BPI Activation Palliative Reward]</li>
							<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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

						$this->sendemail($title,$to,$subject,$message);

        
        }
        
        $update_user_data = array(
            'token'=>$newBMT,
            'cashback'=>$newCashback,
        );
        $user_condition = array('id' => $userid);  
        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
        
        //save transaction history BMT.........
        $transactionDataBMT = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $bmtConvert,  // Assuming you have the price for each item
            'description' => 'BPI pallative BPT Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataBMT);
		$to = $userInfo->email;
		$subject = 'BPI BPT Bonus Reward Alert!';
		$title = 'Dear  '.$userInfo->firstname;
		$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
			<li>Amount: ['.number_format($bmtConvert,8).'BPT]</li>
			<li>Description: [BPI Palliative BPT Reward]</li>
			<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
		$this->sendemail($title,$to,$subject,$message);
        
        //save transaction history Cashback.........
        $transactionDataCashback = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $cashback,  // Assuming you have the price for each item
            'description' => 'BPI Pallative Cashback Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataCashback);
		$to = $userInfo->email;
		$subject = 'BPI Palliative Cashback Reward Alert!';
		$title = 'Dear  '.$userInfo->firstname;
		$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
			<li>Amount: [NGN'.number_format($cashback,2).']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
		$this->sendemail($title,$to,$subject,$message);
        
    }
    
    public function silver_or_gold($userid,$amount){
		$userInfo = $this->generic_model->getInfo('users','id',$userid);
        $is_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userid);
        $shelter_meal_tax = $this->generic_model->getInfo('palliative_tax_settings','id',2)->percentage;
	    $shelter_env_tax = $this->generic_model->getInfo('palliative_tax_settings','id',4)->percentage;
	    
	    //we handle calculations for tax settings
	    $percentageAmount_smt = ($shelter_meal_tax / 100) * $amount;
	    $percentageAmount_set = ($shelter_env_tax / 100) * $amount;
	    
	    $total_deductable = ($percentageAmount_smt + $percentageAmount_set);
	    $amount = ($amount - $total_deductable);
	    
	    //save tax details... 	
	    $tax_smt_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'shelter',
	      'amount'=>$percentageAmount_smt,
	      'activity'=>'Shelter Meal Tax',
	      'percentage'=>$shelter_meal_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_smt_array);
	    
	    $tax_set_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'palliative',
	      'amount'=>$percentageAmount_set,
	      'activity'=>'Shelter Environmental Protection Tax',
	      'percentage'=>$shelter_env_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_set_array);
	    
        if(!empty($is_shelter)){
            //what is their level?
            $package_level = $is_shelter->shelter_package;
            $package_option = $is_shelter->shelter_option;
            if($package_level == 1){
                //silver subscriber..................
                //check which wallet to credit whether car or education
                if($package_option == 6){
                    $wallet = 'educatioin';
                }elseif($package_option == 7){
                    $wallet = 'car';
                }elseif($package_option == 8){
                    $wallet = 'land';
                }elseif($package_option == 9){
                    $wallet = 'business';
                }elseif($package_option == 10){
                    $wallet = 'solar';
                }else{
                    $wallet = 'shelter';
                }
                
                $user = $this->generic_model->getInfo('users','id',$userid);
                $old_shelter = $user->$wallet;
                $new_shelter = ($old_shelter + $amount);
                
                //check for wallet limit and extension......
                $shelter_option = $this->generic_model->getInfo('active_shelters','user_id',$userid)->shelter_option;
                //get shelter option amount
                $shelter_option_amount = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->amount;
				$shelter_option_name = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->name;
                if($new_shelter >= $shelter_option_amount){
                    //check if there is an extended wallet priviledge............
                    
                  //trim it down and then set the balance
                    $update_user_data = array(
                              $wallet =>$shelter_option_amount,
                            );
                    $user_condition = array('id' => $userid);  
                    $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                    $shelter_mature_data = array(
                            'user_id'=>$userid,
                            'shelter_option'=>$shelter_option,
                            'shelter_package'=>$package_level,
                            'date_completed'=>date('Y-m-d H:i:s'),
                           );
                    $shelter_send = $this->generic_model->insert_data('shelter_maturity', $shelter_mature_data); 
					//send email
					$to = $userInfo->email;
					$subject = 'Congratulations! BPI Shelter Palliative Claim';
					$title = 'Dear  '.$userInfo->firstname;
					$message = 'We are pleased to inform you that you have successfully completed your BPI Shelter Palliative Threshold, and you are now eligible to claim your shelter palliative benefit listed below.
					<br>
					<br>
					<strong>Claim Details:</strong>:
					<br>
					<ul>
						<li>Threshold Completion Date and Time: ['.date("Y-m-d H:i:s").']</li>
						<li>Threshold Amount Reached: [NGN'.number_format($shelter_option_amount,2).']</li>
						<li>Benefit Eligibility: ['.$shelter_option_name.' Claim]</li>
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
					$this->sendemail($title,$to,$subject,$message);
                    
                    //save overflow
                    $overflow = array( 	
                        'user_id'=> $userid,
                        'amount'=> ($new_shelter - $shelter_option_amount),
                        'date'=> date('Y-m-d H:i:s')
                    );
                    $this->generic_model->insert_data('account_overflow',$overflow);
                    
                }
				else{
                           $update_user_data = array(
                            $wallet =>$new_shelter,
                            );
                           $user_condition = array('id' => $userid);  
                           $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                           //save transaction history BMT.........
                           $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $amount,  // Assuming you have the price for each item
                                'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                           $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
							$to = $userInfo->email;
							$subject = 'BPI Silver Shelter Pallative Reward Alert!';
							$title = 'Dear  '.$userInfo->firstname;
							$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
							<br>
							<br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
								<li>Amount: [NGN'.number_format($amount,2).']</li>
								<li>Description: [BPI Silver Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
							$this->sendemail($title,$to,$subject,$message);
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
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
                    }
                } **/
            }
            else{
                //this is a gold package
                 //check which wallet to credit whether car or education
                if($package_option == 6){
                    $wallet = 'education';
                }elseif($package_option == 7){
                    $wallet = 'car';
                }elseif($package_option == 8){
                    $wallet = 'land';
                }elseif($package_option == 9){
                    $wallet = 'business';
                }else{
                    $wallet = 'shelter';
                }
                $user = $this->generic_model->getInfo('users','id',$userid);
                $old_shelter = $user->$wallet;
                $new_shelter = ($old_shelter + $amount);
                //check for wallet limit and extension......
                $shelter_option = $this->generic_model->getInfo('active_shelters','user_id',$userid)->shelter_option;
                //get shelter option amount
                $shelter_option_amount = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->amount;
				$shelter_option_name = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->name;
                
                if($new_shelter >= $shelter_option_amount){
                    //check if there is an extended wallet priviledge............
                    
                  //trim it down and then set the balance
                    $update_user_data = array(
                      $wallet=>$shelter_option_amount,
                    );
                    $user_condition = array('id' => $userid);  
                    $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                    $shelter_mature_data = array(
                            'user_id'=>$userid,
                            'shelter_option'=>$shelter_option,
                            'shelter_package'=>$package_level,
                            'date_completed'=>date('Y-m-d H:i:s'),
                           );
                    $shelter_send = $this->generic_model->insert_data('shelter_maturity', $shelter_mature_data); 
					//send email
					$to = $userInfo->email;
					$subject = 'Congratulations! BPI Shelter Palliative Claim';
					$title = 'Dear  '.$userInfo->firstname;
					$message = 'We are pleased to inform you that you have successfully completed your BPI Shelter Palliative Threshold, and you are now eligible to claim your shelter palliative benefit listed below.
					<br>
					<br>
					<strong>Claim Details:</strong>:
					<br>
					<ul>
						<li>Threshold Completion Date and Time: ['.date("Y-m-d H:i:s").']</li>
						<li>Threshold Amount Reached: [NGN'.number_format($shelter_option_amount,2).']</li>
						<li>Benefit Eligibility: ['.$shelter_option_name.' Claim]</li>
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
					$this->sendemail($title,$to,$subject,$message);
                    
                    //save overflow
                    $overflow = array( 	
                        'user_id'=> $userid,
                        'amount'=> ($new_shelter - $shelter_option_amount),
                        'date'=> date('Y-m-d H:i:s')
                    );
                    $this->generic_model->insert_data('account_overflow',$overflow);
					$overflow_user = $this->generic_model->getInfo('users','id',$userid);
					$ref = $this->generic_model->getInfo('referrals','user_id',$userid);
					$overflow_refer = $this->generic_model->getInfo('users','id',$ref->referred_by);
							$to = 'admin@beepagro.com';
							$subject = 'Shelter Pallative Overflow Alert!';
							$title = 'Dear  Admin';
							$message = 'This is to notify you that an overflow has occured on a shelter palliative Maturity transaction.
							<br>
							<br>
							The following user has completed their Shelter Palliative Program:
							<br>
							'.$overflow_user->firstname.' '.$overflow_user->lastname.' - '.$overflow_user->email.' <br>
							Referred By<br>
							'.$overflow_refer->firstname.' '.$overflow_refer->lastname.' - '.$overflow_refer->email.'<br><br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
								<li>Amount: [NGN'.number_format(($new_shelter - $shelter_option_amount),2).']</li>
								<li>Description: [Shelter Maturity Overflow]</li>
								<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
							</ul>
							<br>
							<br>
							Application Manager,
							<br>
							
							BPI Admin Alerts.</p>';
							$this->sendemail($title,$to,$subject,$message);

                    
                }else{
                           $update_user_data = array(
                            $wallet=>$new_shelter,
                            );
                           $user_condition = array('id' => $userid);  
                           $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                           //save transaction history BMT.........
                           $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $amount,  // Assuming you have the price for each item
                                'description' => 'Gold Shelter Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                           $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
					 		$to = $userInfo->email;
							$subject = 'BPI Gold Shelter Pallative Reward Alert!';
							$title = 'Dear  '.$userInfo->firstname;
							$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
							<br>
							<br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
								<li>Amount: [NGN'.number_format($amount,2).']</li>
								<li>Description: [BPI Gold Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
							$this->sendemail($title,$to,$subject,$message);
					
                       }
                
            }
        }
        else{
            //save overflow
                    $overflow = array( 	
                        'user_id'=> $userid,
                        'amount'=> $amount,
                        'date'=> date('Y-m-d H:i:s')
                    );
					$overflow_user = $this->generic_model->getInfo('users','id',$userid);
					$ref = $this->generic_model->getInfo('referrals','user_id',$userid);
					$overflow_refer = $this->generic_model->getInfo('users','id',$ref->referred_by);
                    $this->generic_model->insert_data('account_overflow',$overflow);
							$to = 'admin@beepagro.com';
							$subject = 'Shelter Pallative Overflow Alert!';
							$title = 'Dear  Admin';
							$message = 'This is to notify you that an overflow has occured on a shelter palliative credit transaction.
							<br>
							<br>
							No Shelter wallet was found activated for the following user:
							<br>
							'.$overflow_user->firstname.' '.$overflow_user->lastname.' - '.$overflow_user->email.' <br>
							Referred By<br>
							'.$overflow_refer->firstname.' '.$overflow_refer->lastname.' - '.$overflow_refer->email.'<br><br>
							<strong>Transaction Details</strong>:
							<br>
							<ul>
								<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
								<li>Amount: [NGN'.number_format($amount,2).']</li>
								<li>Description: [BPI Silver Shelter Pallative Reward Reward]</li>
								<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
							</ul>
							<br>
							<br>
							Application Manager,
							<br>
							
							BPI Admin Alerts.</p>';
							$this->sendemail($title,$to,$subject,$message);
        }
    }
	
	public function paySpendable($amount,$userid,$id){
		//payment and
		$userInfo = $this->generic_model->getInfo('users','id',$userid);
		//check the package level..........
		$user_package = $this->generic_model->getInfo('active_shelters','user_id',$userid);
		$package = $this->generic_model->getInfo('packages','id',$id);
		
		//first check if the user shelter wallet is activated
		if($userInfo->shelter_wallet == 1){
			//this user has activated the topmost layer, they can get all bonuses as is
			$oldspendable = $userInfo->spendable;
			$newSpendable = ($oldspendable + $amount);
			$update_user_data = array(
				'spendable'=>$newSpendable
			);
			$user_condition = array('id' => $userid);  
			$user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
			$transactionDataspendable = array(
                'user_id' => $userid,
                'order_id' =>2,
                'transaction_type' => 'credit',
                'amount' => $amount,  // Assuming you have the price for each item
                'description' => 'BPI Spendable Cash Reward',  // Add a relevant description
                'status' => 'Successful'
			);
			$trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataspendable);
			$to = $userInfo->email;
			$subject = 'BPI Spendable Cash Alert!';
			$title = 'Dear  '.$userInfo->firstname;
			$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
			<br>
			<br>
			<strong>Transaction Details</strong>:
			<br>
			<ul>
				<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
				<li>Amount: [NGN'.number_format($amount,2).']</li>
				<li>Description: [BPI Spendable Cash Reward]</li>
				<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
			$this->sendemail($title,$to,$subject,$message);
		}
		else{
			//check what package they are from the amount they paid
			if($user_package->amount == $package->package_price || $user_package->amount > $package->package_price ){
				//this user has activated the same layer, they can get all bonuses as is
				$oldspendable = $userInfo->spendable;
				$newSpendable = ($oldspendable + $amount);
				$update_user_data = array(
					'spendable'=>$newSpendable
				);
				$user_condition = array('id' => $userid);  
				$user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
				$transactionDataspendable = array(
					'user_id' => $userid,
					'order_id' =>2,
					'transaction_type' => 'credit',
					'amount' => $amount,  // Assuming you have the price for each item
					'description' => 'BPI Spendable Cash Reward',  // Add a relevant description
					'status' => 'Successful'
				);
				$trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataspendable);
				$to = $userInfo->email;
				$subject = 'BPI Spendable Cash Alert!';
				$title = 'Dear  '.$userInfo->firstname;
				$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
				<br>
				<br>
				<strong>Transaction Details</strong>:
				<br>
				<ul>
					<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
					<li>Amount: [NGN'.number_format($amount,2).']</li>
					<li>Description: [BPI Spendable Cash Reward]</li>
					<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
				$this->sendemail($title,$to,$subject,$message);
		
			}
			
			else{
				//we split the bonuses into 2 parts, 50% for the palliative wallet, 50% for the spendable wallet
				$oldspendable = $userInfo->spendable;
				$oldPalliative = $userInfo->palliative;
				
				$spendable_half = ($amount/2);
				$newSpendable = ($oldspendable + $spendable_half);
				$newPalliative = ($oldPalliative + $spendable_half);
				
				$update_user_data = array(
					'spendable'=>$newSpendable,
					'palliative'=>$newPalliative
				);
				
				$user_condition = array('id' => $userid);  
				$user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
				
				$transactionDataspendable = array(
					'user_id' => $userid,
					'order_id' =>2,
					'transaction_type' => 'credit',
					'amount' => $spendable_half,  // Assuming you have the price for each item
					'description' => 'BPI Spendable Cash Reward',  // Add a relevant description
					'status' => 'Successful'
				);
				
				$trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataspendable);
				
				$transactionDatapall = array(
					'user_id' => $userid,
					'order_id' =>2,
					'transaction_type' => 'credit',
					'amount' => $spendable_half,  // Assuming you have the price for each item
					'description' => 'BPI Palliative Reward',  // Add a relevant description
					'status' => 'Successful'
				);
				
				$trans_send2 = $this->generic_model->insert_data('transaction_history', $transactionDatapall);
				
				$to = $userInfo->email;
				$subject = 'BPI Spendable Cash Alert!';
				$title = 'Dear  '.$userInfo->firstname;
				$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
				<br>
				<br>
				<strong>Transaction Details</strong>:
				<br>
				<ul>
					<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
					<li>Total Amount: [NGN'.number_format($amount,2).']</li>
					<li>50% Spendable Reward, 50% Palliative Reward
					<li>Description: [BPI Spendable Cash Reward and BPI Palliative Reward]</li>
					<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
				$this->sendemail($title,$to,$subject,$message);
			}
		}
		
		
		
	}
    
    public function convertBMT2($package_id,$amount,$price,$userid,$cashback,$palliavtive){
		$userInfo = $this->generic_model->getInfo('users','id',$userid);
	    $palliative_meal_tax = $this->generic_model->getInfo('palliative_tax_settings','id',1)->percentage;
	    $palliative_env_tax = $this->generic_model->getInfo('palliative_tax_settings','id',3)->percentage;

	    //we handle calculations for tax settings
	    $percentageAmount_pmt = ($palliative_meal_tax / 100) * $palliavtive;
	    $percentageAmount_pet = ($palliative_env_tax / 100) * $palliavtive;
	    
	    $total_deductable = ($percentageAmount_pmt + $percentageAmount_pet);
	    $palliavtive = ($palliavtive - $total_deductable);
	    //save tax details... 	
	    $tax_pmt_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'palliative',
	      'amount'=>$percentageAmount_pmt,
	      'activity'=>'Palliative Meal Tax',
	      'percentage'=>$palliative_meal_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_pmt_array);
	    
	    $tax_pet_array = array(
	      'user_id'=>$userid,
	      'wallet'=>'palliative',
	      'amount'=>$percentageAmount_pet,
	      'activity'=>'Environmental Protection Tax',
	      'percentage'=>$palliative_env_tax,
	      'date'=>date('Y-m-d H:i:s')
	     );
	    $this->generic_model->insert_data('palliative_tax',$tax_pet_array);
	    
	    
        $package = $this->generic_model->getInfo('packages','id',$package_id);
        $bmtConvert = number_format(($amount / $price),8);
        $user = $this->generic_model->getInfo('users','id',$userid);
        $oldBMT = $user->token;
        $oldCashback = $user->cashback;
        $oldPalliative = $user->palliative;
        $newBMT = number_format(($bmtConvert + $oldBMT),8);
        $newCashback = ($cashback + $oldCashback);
        $palliative_tax = 
        $newPalliative = ($palliavtive + $oldPalliative);
        
         $update_user_data = array(
            'palliative'=>$newPalliative
            );
            $user_condition = array('id' => $userid);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
            //save transaction history Palliative.........
            $transactionDataPalliative = array(
                'user_id' => $userid,
                'order_id' =>$package->id,
                'transaction_type' => 'credit',
                'amount' => $palliavtive,  // Assuming you have the price for each item
                'description' => 'BPI Palliative Reward',  // Add a relevant description
                'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataPalliative);
		$to = $userInfo->email;
		$subject = 'BPI Palliative Reward Alert!';
		$title = 'Dear  '.$userInfo->firstname;
		$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
			<li>Amount: [NGN'.number_format($palliavtive,2).']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
		$this->sendemail($title,$to,$subject,$message);
        
        $update_user_data = array(
            'token'=>$newBMT,
            'cashback'=>$newCashback,
        );
        $user_condition = array('id' => $userid);  
        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
        
        //save transaction history BMT.........
        $transactionDataBMT = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $bmtConvert,  // Assuming you have the price for each item
            'description' => 'BPI pallative BPT Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataBMT);
		$to = $userInfo->email;
		$subject = 'BPI BPT Bonus Reward Alert!';
		$title = 'Dear  '.$userInfo->firstname;
		$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
			<li>Amount: ['.number_format($bmtConvert,8).'BPT]</li>
			<li>Description: [BPI Palliative BPT Reward]</li>
			<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
		$this->sendemail($title,$to,$subject,$message);
        
        //save transaction history Cashback.........
        $transactionDataCashback = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $cashback,  // Assuming you have the price for each item
            'description' => 'BPI Pallative Cashback Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataCashback);
		$to = $userInfo->email;
		$subject = 'BPI Palliative Cashback Reward Alert!';
		$title = 'Dear  '.$userInfo->firstname;
		$message = 'This is to notify you that a credit transaction has been successfully processed on your account.
		<br>
		<br>
		<strong>Transaction Details</strong>:
		<br>
		<ul>
			<li>Transaction Date and Time: ['.date("Y-m-d H:i:s").']</li>
			<li>Amount: [NGN'.number_format($cashback,2).']</li>
			<li>Description: [BPI Palliative Cashback Reward]</li>
			<li>Transaction ID: [BPI-TXID-'.$trans_send.']</li>
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
		$this->sendemail($title,$to,$subject,$message);
	}
    
    /*public function convertBMT($package_id,$amount,$price,$userid,$cashback,$palliavtive){
        $package = $this->generic_model->getInfo('packages','id',$package_id);
        $bmtConvert = number_format(($amount / $price),8);
        $user = $this->generic_model->getInfo('users','id',$userid);
        $oldBMT = $user->token;
        $oldCashback = $user->cashback;
        $oldPalliative = $user->palliative;
        $newBMT = number_format(($bmtConvert + $oldBMT),8);
        $newCashback = ($cashback + $oldCashback);
        $newPalliative = ($palliavtive + $oldPalliative);
        
        //check if the shelter is activated if not activate it if the amount in palliative wallet has reached the required amount.
        $is_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userid);
        if(!empty($is_shelter)){
            //what is their level?
            $package_level = $is_shelter->shelter_package;
            if($package_level == 1){
                //silver subscriber........
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($newPalliative > 100000){
                    $user_shelter_status = $user->shelter_wallet;
                    if(empty($user_shelter_status)){
                        //activate the shelter wallet and add balance to the palliative wallet.
                        $walletBalance = ($newPalliative - 100000);
                        $sh_data = array(
                          'palliative'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_wallet'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        
                        //save transaction history .........
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 100000,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
                        
                        $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 100000,
                            'type'=> 'Silver Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                        $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                        //save the money paid for tracking....
                        
                        //distribute the rewards from the shelter activation...
                        $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package_level);
                        $direct = $vip_commissions->Direct;
                        $level_1 = $vip_commissions->level_1;
                        $level_2 = $vip_commissions->level_2;
                        $level_3 = $vip_commissions->level_3;
                        
                        //cashback commissions
                        $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package_level);
                        $direct_wallet = $vip_commissions_wallet->Direct;
                        $level_1_wallet = $vip_commissions_wallet->level_1;
                        $level_2_wallet = $vip_commissions_wallet->level_2;
                        $level_3_wallet = $vip_commissions_wallet->level_3;
                        
                        //bmt commissions
                        $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package_level);
                        $direct_bmt = $vip_commissions_bmt->Direct;
                        $level_1_bmt = $vip_commissions_bmt->level_1;
                        $level_2_bmt = $vip_commissions_bmt->level_2;
                        $level_3_bmt = $vip_commissions_bmt->level_3;
                        
                        //shelter_commissions
                        $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package_level);
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
                        $ref_tree = $this->generic_model->getInfo('referrals','user_id',$userid);
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
                        $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
                        $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
                        $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
                        $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3);
                        
                        //fund the silver and gold shelter holders
                        $this->silver_or_gold($direct_ref,$direct_shelter);
                        $this->silver_or_gold($lev1,$level_1_shelter);
                        $this->silver_or_gold($lev2,$level_2_shelter);
                        $this->silver_or_gold($lev3,$level_3_shelter);
                        $this->silver_or_gold($lev4,$level_4_shelter);
                        $this->silver_or_gold($lev5,$level_5_shelter);
                        $this->silver_or_gold($lev6,$level_6_shelter);
                        $this->silver_or_gold($lev7,$level_7_shelter);
                        $this->silver_or_gold($lev8,$level_8_shelter);
                        $this->silver_or_gold($lev9,$level_9_shelter);
                        
                    }
                    else{
                      //credit the palliative wallet...............
                          $update_user_data = array(
                            'palliative'=>$newPalliative,
                            );
                          $user_condition = array('id' => $userid);  
                          $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                          //save transaction history BMT.........
                          $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $palliavtive,  // Assuming you have the price for each item
                                'description' => 'Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                          $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
                    }
                }
                else{
                    
                        $update_user_data = array(
                                'palliative'=>$newPalliative,
                        );
                        $user_condition = array('id' => $userid);  
                        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                        
                        //save transaction history BMT.........
                        $transactionDataShelter = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'credit',
                            'amount' => $palliavtive,  // Assuming you have the price for each item
                            'description' => 'Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
                    
                }
            }
            else{
                //gold shelter
                //silver subscriber........
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($newPalliative > 200000){
                    $user_shelter_status = $user->shelter_wallet;
                    if(empty($user_shelter_status)){
                        //activate the shelter wallet and add balance to the palliative wallet.
                        $walletBalance = ($newPalliative - 200000);
                        $sh_data = array(
                          'palliative'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_wallet'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        
                        //save transaction history .........
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 200000,  // Assuming you have the price for each item
                            'description' => 'Gold Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
                        
                        $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 200000,
                            'type'=> 'Gold Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                        $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                        //save the money paid for tracking....
                        
                         //distribute the rewards from the shelter activation...
                        $vip_commissions = $this->generic_model->getInfo('commissions_palliative','package_id',$package_level);
                        $direct = $vip_commissions->Direct;
                        $level_1 = $vip_commissions->level_1;
                        $level_2 = $vip_commissions->level_2;
                        $level_3 = $vip_commissions->level_3;
                        
                        //cashback commissions
                        $vip_commissions_wallet = $this->generic_model->getInfo('commissions_wallet','package_id',$package_level);
                        $direct_wallet = $vip_commissions_wallet->Direct;
                        $level_1_wallet = $vip_commissions_wallet->level_1;
                        $level_2_wallet = $vip_commissions_wallet->level_2;
                        $level_3_wallet = $vip_commissions_wallet->level_3;
                        
                        //bmt commissions
                        $vip_commissions_bmt = $this->generic_model->getInfo('commissions_bmt','package_id',$package_level);
                        $direct_bmt = $vip_commissions_bmt->Direct;
                        $level_1_bmt = $vip_commissions_bmt->level_1;
                        $level_2_bmt = $vip_commissions_bmt->level_2;
                        $level_3_bmt = $vip_commissions_bmt->level_3;
                        
                        //shelter_commissions
                        $vip_commissions_shelter = $this->generic_model->getInfo('commissions_shelter','package_id',$package_level);
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
                        $ref_tree = $this->generic_model->getInfo('referrals','user_id',$userid);
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
                        $this->convertBMT($package->id,$direct_bmt,$bmt_price,$direct_ref,$direct_wallet,$direct);
                        $this->convertBMT($package->id,$level_1_bmt,$bmt_price,$lev1,$level_1_wallet,$level_1);
                        $this->convertBMT($package->id,$level_2_bmt,$bmt_price,$lev2,$level_2_wallet,$level_2);
                        $this->convertBMT($package->id,$level_3_bmt,$bmt_price,$lev3,$level_3_wallet,$level_3);
                        
                        //fund the silver and gold shelter holders
                        $this->silver_or_gold($direct_ref,$direct_shelter);
                        $this->silver_or_gold($lev1,$level_1_shelter);
                        $this->silver_or_gold($lev2,$level_2_shelter);
                        $this->silver_or_gold($lev3,$level_3_shelter);
                        $this->silver_or_gold($lev4,$level_4_shelter);
                        $this->silver_or_gold($lev5,$level_5_shelter);
                        $this->silver_or_gold($lev6,$level_6_shelter);
                        $this->silver_or_gold($lev7,$level_7_shelter);
                        $this->silver_or_gold($lev8,$level_8_shelter);
                        $this->silver_or_gold($lev9,$level_9_shelter);
                    }
                    else{
                      //credit the palliative wallet...............
                           $update_user_data = array(
                            'palliative'=>$newPalliative,
                            );
                          $user_condition = array('id' => $userid);  
                          $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                          
                          //save transaction history BMT.........
                          $transactionDataShelter = array(
                                'user_id' => $userid,
                                'order_id' =>$package_level,
                                'transaction_type' => 'credit',
                                'amount' => $palliavtive,  // Assuming you have the price for each item
                                'description' => 'Pallative Reward',  // Add a relevant description
                                'status' => 'Successful'
                            );
                          $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
                    }
                }
                else{
                    
                        $update_user_data = array(
                                'palliative'=>$newPalliative,
                        );
                        $user_condition = array('id' => $userid);  
                        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                        
                        //save transaction history BMT.........
                        $transactionDataShelter = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'credit',
                            'amount' => $palliavtive,  // Assuming you have the price for each item
                            'description' => 'Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
                    
                }
            }
        }
        else{
            $update_user_data = array(
            'palliative'=>$newPalliative
            );
            $user_condition = array('id' => $userid);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
            
            //save transaction history Palliative.........
            $transactionDataPalliative = array(
                'user_id' => $userid,
                'order_id' =>$package->id,
                'transaction_type' => 'credit',
                'amount' => $palliavtive,  // Assuming you have the price for each item
                'description' => 'BPI Palliative Reward',  // Add a relevant description
                'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataPalliative);

        
        }
        
        
        $update_user_data = array(
            'token'=>$newBMT,
            'cashback'=>$newCashback,
        );
        $user_condition = array('id' => $userid);  
        $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
        
        //save transaction history BMT.........
        $transactionDataBMT = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $bmtConvert,  // Assuming you have the price for each item
            'description' => 'BPI pallative BPT Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataBMT);
        
        //save transaction history Cashback.........
        $transactionDataCashback = array(
            'user_id' => $userid,
            'order_id' =>$package->id,
            'transaction_type' => 'credit',
            'amount' => $cashback,  // Assuming you have the price for each item
            'description' => 'BPI Pallative Cashback Reward',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataCashback);
        
        
    }
    
    public function silver_or_gold($userid,$amount){
        $is_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userid);
        if(!empty($is_shelter)){
            //what is their level?
            $package_level = $is_shelter->shelter_package;
            if($package_level == 1){
                //silver subscriber..................
                $user = $this->generic_model->getInfo('users','id',$userid);
                $old_shelter = $user->shelter;
                $new_shelter = ($old_shelter + $amount);
                
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($new_shelter >= 100000){
                    $user_shelter_status = $user->shelter_pending;
                    if($user_shelter_status == 1){
                        //activate the shelter wallet and add balance to the wallet.
                        $walletBalance = ($new_shelter - 100000);
                        $sh_data = array(
                          'shelter'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        
                        //save transaction history BMT.........
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 100000,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
                        
                        $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 100000,
                            'type'=> 'Silver Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                        $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                        //save the money paid for tracking....
                    }
                    else{
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
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
                    }
                    
                }
                else{
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
                        'amount' => $amount,  // Assuming you have the price for each item
                        'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                        'status' => 'Successful'
                    );
                    $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
                }
            }
            else{
                $user = $this->generic_model->getInfo('users','id',$userid);
                $old_shelter = $user->shelter;
                $new_shelter = ($old_shelter + $amount);
                
                //if the user balance has exceeded limiit or it's time to activate shelter wallet
                if($new_shelter >= 200000){
                    $user_shelter_status = $user->shelter_pending;
                    if($user_shelter_status == 1){
                        //activate the shelter wallet and add balance to the wallet.
                        $walletBalance = ($new_shelter - 200000);
                        $sh_data = array(
                          'shelter'=>$walletBalance,
                          'is_shelter'=>1,
                          'shelter_pending'=>0
                        );
                        $sh_condition = array('id' => $userid);
                        $sh_save = $this->generic_model->update_data('users', $sh_data, $sh_condition);
                        //save transaction history BMT.........
                        
                        $transactionDataShelter1 = array(
                            'user_id' => $userid,
                            'order_id' =>$package_level,
                            'transaction_type' => 'debit',
                            'amount' => 200000,  // Assuming you have the price for each item
                            'description' => 'Gold Shelter Wallet activation',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter1);
                        
                        $shelter_active = array(
                            'user_id'=>$userid,
                            'amount'=> 200000,
                            'type'=> 'Silver Shelter Wallet',
                            'status'=>'Completed',
                            'activated_date'=>date('Y-m-d H:i:s')
                            );
                        $this->generic_model->insert_data('shelter_wallet_activation', $shelter_active);
                        //save the money paid for tracking....
                    }
                    else{
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
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter); 
                    }
                }
                else {
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
                        'amount' => $amount,  // Assuming you have the price for each item
                        'description' => 'Gold Shelter Pallative Reward',  // Add a relevant description
                        'status' => 'Successful'
                    );
                    $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
                }
            }
        }
    }*/
    
    public function gold_payout($userid,$amount){
        $is_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userid);
        if(!empty($is_shelter)){
            //what is their level?
            $package_level = $is_shelter->shelter_package;
            if($package_level == 2){
                //silver subscriber..................
                $user = $this->generic_model->getInfo('users','id',$userid);
                $old_shelter = $user->shelter;
                $new_shelter = ($old_shelter + $amount);
                
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
                    'amount' => $amount,  // Assuming you have the price for each item
                    'description' => 'Gold Shelter Pallative Reward',  // Add a relevant description
                    'status' => 'Successful'
                );
                $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
            }
        }
    }
    
    public function usdt_confirmation(){
        $hash = $this->input->post('txhash');
        $userId = $this->session->userdata('user_id');
        $type = 'Crypto';
        // Handle success (redirect, display message, etc.)
        $amount = $this->input->post('amount');
        $vat = $this->input->post('vat');
        $this->generic_model->saveReceiptPath($hash,$userId,$type,$amount);
        $this->session->unset_userdata('user_details');
        // Fetch user details
        $user_details = $this->db->get_where('users', array('id' => $userId))->row();
        // Set user details in session (optional)
        $this->session->set_userdata('user_details', $user_details);
		$invoice_data = array(
				'item'=>'USDT Confirmation',
				'amount'=>$amount,
				'vat'=>$vat,
				'qty'=>1
			);
			
		
		$_SESSION['item'] = 'USDT Confirmation';
				$_SESSION['amount']= $amount;
				$_SESSION['vat'] = $vat;
				$_SESSION['qty'] = 1;
		
        redirect('payment_success_page');
        
    }
    
    public function usdt_confirmation_dual(){
        $hash = $this->input->post('txhash');
        $userId = $this->session->userdata('user_id');
        $type = 'Crypto';
        // Handle success (redirect, display message, etc.)
        $amount = 50000;
        $vat = 3750;
        $this->generic_model->saveReceiptPath($hash,$userId,$type,$amount);
        $this->session->unset_userdata('user_details');
        // Fetch user details
        $user_details = $this->db->get_where('users', array('id' => $userId))->row();
        // Set user details in session (optional)
        $this->session->set_userdata('user_details', $user_details);
		$invoice_data = array(
				'item'=>'USDT Confirmation',
				'amount'=>$amount,
				'vat'=>$vat,
				'qty'=>1
			);
        
         //insert cng payment...........
            $qwik_data = array(
                'user_id'=>$userId,
                'amount'=>10000,
                'vat'=>750,
                'date'=>date('Y-m-d H:i:s'),
                'status'=>'pending'
            );
            $this->generic_model->insert_data('qwik_data',$qwik_data);
			
		
		$_SESSION['item'] = 'USDT Confirmation Dual Activation';
				$_SESSION['amount']= 60000;
				$_SESSION['vat'] = 4500;
				$_SESSION['qty'] = 1;
		
        redirect('payment_success_page');
        
    }
	
	public function sendemail($title,$to,$subject,$message){      
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
    }
    

}