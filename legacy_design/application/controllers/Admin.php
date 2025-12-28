<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Admin extends CI_Controller {

  public function __construct() {
    parent::__construct();
    $this->load->model('pool_model');
    $this->load->helper( 'url' );
    $this->load->library( 'form_validation' );
    $this->load->library( 'session' );
    $this->load->database();
    $this->load->model( 'food_model' );
    $this->load->model( 'generic_model' );
    $this->load->model( 'user_model' );
    $this->load->library( 'pagination' );
    $this->load->model( 'merchant_model' );
  }
	
  public function fix_wallets(){
	  $member_id = $this->input->post('user');
	  $cashback = $this->input->post('cashback');
	  $palliative = $this->input->post('palliative');
	  $bpt = $this->input->post('bpt');
	  $newPal = $this->input->post('spendable');
	  $welcome_bonus = $this->generic_model->getInfo('welcome_bonus','user_id',$member_id);
	  if(!empty($welcome_bonus)){
	      $spendable =($newPal + 3000);
	  }else{
	      $spendable = $newPal;
	  }
	  $shelter = $this->input->post('shelter');
	  //get user details
	  $user = $this->generic_model->getInfo('users','id',$member_id);
	  //find the shelter package activated
	  $activator = $this->generic_model->getInfo('active_shelters','user_id',$member_id);
	  $shelter_type = $activator->shelter_option;
	  if($shelter_type == 6){
		  $shelter_wallet = 'education';
	  }
	  elseif($shelter_type == 7){
		  $shelter_wallet = 'car';
	  }
	  elseif($shelter_type == 8){
		  $shelter_wallet = 'land';
	  }
	  elseif($shelter_type == 9){
		  $shelter_wallet = 'business';
	  }
	  elseif($shelter_type == 10){
		  $shelter_wallet = 'power';
	  }
	  else{
		  $shelter_wallet = 'shelter';
	  }
	 // $oldCashback = $user->cashback;
	  //$oldPalliative = $user->palliative;
	  //$oldBpt = $user->token;
	  //$oldspendable = ($user->wallet + $user->spendable);
	  //$oldshelter = $user->$shelter_wallet;
	  //////////////new balances///////////////
	  $data = array(
	  	'cashback'=>$cashback,
		'wallet'=>0,
		'palliative'=>$palliative,
		'token'=>($bpt/20),
		'spendable'=>$spendable,
		$shelter_wallet=> $shelter
	  );
	  $condition = array('id'=>$member_id);
	  $this->generic_model->update_data( 'users', $data, $condition );
	  
	  $this->session->set_flashdata( 'success', 'Wallets Fixed successfully' );
	  redirect('users_details/'.$member_id);
	  
  }
  
 public function review_support_requests() {
        $data['pending_requests'] = $this->generic_model->select_all('bpi_support_requests',array('status !=' => 'active'));
        $data['user_details'] = $this->session->userdata('user_details');
        $this->load->view('admin/support_review_list', $data);
    }
    
  public function active_support_requests() {
        $data['pending_requests'] = $this->generic_model->select_all('bpi_support_requests',array('status' => 'active'));
        $data['user_details'] = $this->session->userdata('user_details');
        $this->load->view('admin/active_support', $data);
    }

    public function approve_request($id) {
        $request = $this->generic_model->getInfo('bpi_support_requests', 'id', $id);
        if ($request) {
            $user = $this->generic_model->getInfo('users','id',$request->user_id);
            $remarks = 'Approved';
            $update_data = array(
                'status' => 'active',
                'remarks' => $remarks
                );
            $conditions = array('id'=>$id);
            $this->generic_model->update_data('bpi_support_requests', $update_data, $conditions);
            
             //send message
          $to = $user->email;
          $subject = 'BPI Community Support Request Status';
          $title = 'Hello '. $user->firstname;
          $message = 'Congratulations! Your BPI Community Support Request was approved.
		  <br><br>
		  Thank you for your attention to this notification.
		  <br>
		  <br>
		  Best regards,
		  <br>
		  BeepAgro Palliative Initiative (BPI) Team.</p>';

          $this->sendemail( $title, $to, $subject, $message );
            
          $this->session->set_flashdata('success', 'Support request approved.');
        }
        redirect('admin/review_support_requests');
    }

    public function decline_request($id) {
        $request = $this->generic_model->getInfo('bpi_support_requests', 'id', $id);
        if ($request) {
            $user = $this->generic_model->getInfo('users','id',$request->user_id);
            $remarks = 'unfortunately we cannot approve your request at the moment, please contact support if you require more info';
            $update_data = array(
                'status' => 'declined',
                'remarks' => $remarks
                );
            $conditions = array('id'=>$id);
            $this->generic_model->update_data('bpi_support_requests', $update_data, $conditions);
            
            
            //send message
          $to = $user->email;
          $subject = 'BPI Community Support Request Status';
          $title = 'Hello '. $user->firstname;
          $message = 'Unfortunately we cannot approve your request at the moment, please contact support if you require more info
		  <br><br>
		  Thank you for your attention to this notification.
		  <br>
		  <br>
		  Best regards,
		  <br>
		  BeepAgro Palliative Initiative (BPI) Team.</p>';

          $this->sendemail( $title, $to, $subject, $message );
          $this->session->set_flashdata('error', 'Support request declined.');
        }
        redirect('admin/review_support_requests');
    }
    
    public function delete_request($id) {
        $this->db->where( 'id', $id );
        $this->db->delete( 'bpi_support_requests' );
	    $this->session->set_flashdata( 'success', 'Request deleted successfully' );
        redirect( 'review_support_requests' );
    }

  public function grant_solar_agent() {
    if ( $this->session->userdata( 'user_id' ) ) {
        $id = $this->input->post('user_id');
      $user = $this->generic_model->getInfo( 'users', 'id', $id );
      $user_table = 'users';
      $update_user_data = array(
            'solar_agent' => 1
      );
      $user_condition = array( 'id' => $id );
      $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );
     
          $to = $user->email;
          $subject = 'BPI Solar Agent Approval Status';
          $title = 'Hello '. $user->firstname;
          $message = 'This is to notify you that your BPI Solar Agent Application has been approved and your account upgraded respectively. You can now Login to the BPI Solar Assessment Tool using your BPI SSC.
						<br><br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );
      $this->session->set_flashdata( 'success', 'Upgrade Completed Successfully' );
      redirect( 'users_details/'.$id );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
  
  public function disable_solar_agent() {
    if ( $this->session->userdata( 'user_id' ) ) {
        $id = $this->input->post('user_id');
      $user = $this->generic_model->getInfo( 'users', 'id', $id );
      $user_table = 'users';
      $update_user_data = array(
            'solar_agent' => 0
      );
      $user_condition = array( 'id' => $id );
      $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );
     
          $to = $user->email;
          $subject = 'BPI Solar Agent Approval Status';
          $title = 'Hello '. $user->firstname;
          $message = 'This is to notify you that your BPI Solar Agent Application has been revoked You can no longer Login to the BPI Solar Assessment Tool using your BPI SSC.
						<br><br>
						Thank you for your attention to this notification.
						<br>
						<br>
						Best regards,
						<br>
						BeepAgro Palliative Initiative (BPI) Team.</p>';

            $this->sendemail( $title, $to, $subject, $message );
      $this->session->set_flashdata( 'success', 'Upgrade Completed Successfully' );
      redirect( 'users_details/'.$id );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function delete_product($id){
	  //delete record....
        $this->db->where( 'id', $id );
        $this->db->delete( 'store_products' );
	    $this->session->set_flashdata( 'success', 'Record deleted successfully' );
        redirect( 'admin_products' );
  }

  public function pickup_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $centers = $this->generic_model->get_centers( $limit, $offset, $search, $order );
    $total_users = $this->generic_model->count_all_centers();
    $filtered_users = $this->generic_model->count_filtered_centers( $search );

    $data = [];
    foreach ( $centers as $center ) {
      $row = [];
      $row[ 'id' ] = $center->id;
      $row[ 'merchant_name' ] = $center->merchant_name;
      $row[ 'merchant_phone' ] = $center->merchant_phone;
      $row[ 'merchant_email' ] = $center->merchant_email;
      $row[ 'merchant_rank' ] = $center->merchant_rank;
      $row[ 'status' ] = $center->status;
      $row[ 'datejoined' ] = $center->datejoined;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_users,
      'recordsFiltered' => $filtered_users,
      'data' => $data
    ];

    echo json_encode( $output );
  }

  public function delete_merchant() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $id = $this->input->post( 'merchant_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $store_owner = $this->generic_model->getInfo( 'users', 'id', $store_details->user_id );
      $this->form_validation->set_rules( 'reason', 'Reason For cancellation', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
        $this->session->set_flashdata( 'error', validation_errors() );
        redirect( 'pickup_details/' . $id );
      } else {
        //send message....
        ///send message.......
        $to = $store_owner->email;
        $subject = 'Pickup Center Application Update';
        $title = 'Dear  ' . $store_owner->firstname;
        $message = 'This is to notify you that your BPI Pickup Center application for ' . $store_details->merchant_name . '  was declined.
			   <br>
			   <br>
			   Reason: <br>
			   ' . $this->input->post( 'reason' ) . '
				<br>
				<br>
				If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
				<br>
				<br>
				Thank you for your attention to this notification.
				<br>
				<br>
				Best regards,
				<br>
				BeepAgro Palliative Initiative (BPI) Team.</p>';
        $this->sendemail( $title, $to, $subject, $message );

        //delete record....
        $this->db->where( 'id', $id );
        $this->db->delete( 'merchants' );
        $this->session->set_flashdata( 'success', 'Record deleted successfully' );
        redirect( 'admin_pickup' );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function disable_merchant() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $id = $this->input->post( 'disable_merchant_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $store_owner = $this->generic_model->getInfo( 'users', 'id', $store_details->user_id );
      $this->form_validation->set_rules( 'disable_reason', 'Reason For deactivation', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
        $this->session->set_flashdata( 'error', validation_errors() );
        redirect( 'pickup_details/' . $id );
      } else {
        //send message....
        ///send message.......
        $to = $store_owner->email;
        $subject = 'Pickup Center Application Update';
        $title = 'Dear  ' . $store_owner->firstname;
        $message = 'This is to notify you that your BPI Pickup Center: ' . $store_details->merchant_name . ' has been de-activated. This means you are no longer qualified to act as a BPI Pickup Center or carry out any form of business on behalf of BPI. 
			   <br>
			   <br>
			   Reason: <br>
			   ' . $this->input->post( 'disable_reason' ) . '
				<br>
				<br>
				If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
				<br>
				<br>
				Thank you for your attention to this notification.
				<br>
				<br>
				Best regards,
				<br>
				BeepAgro Palliative Initiative (BPI) Team.</p>';
        $this->sendemail( $title, $to, $subject, $message );

        //update record....
        $data = array( 'status' => 'disabled' );
        $condition = array( 'id' => $id );
        $this->generic_model->update_data( 'merchants', $data, $condition );
        $this->session->set_flashdata( 'success', 'Center de-activated successfully' );
        redirect( 'pickup_details/' . $id );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function enable_merchant() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $id = $this->input->post( 'enable_merchant_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $store_owner = $this->generic_model->getInfo( 'users', 'id', $store_details->user_id );
      $this->form_validation->set_rules( 'enable_reason', 'Reason For Re-Activation', 'required' );
      if ( $this->form_validation->run() === FALSE ) {
        $this->session->set_flashdata( 'error', validation_errors() );
        redirect( 'pickup_details/' . $id );
      } else {
        //send message....
        ///send message.......
        $to = $store_owner->email;
        $subject = 'Pickup Center Application Update';
        $title = 'Dear  ' . $store_owner->firstname;
        $message = 'This is to notify you that your BPI Pickup Center: ' . $store_details->merchant_name . ' has been reinstated. This means that you have been reapproved and authorized to act as a BPI Pickup Center to carry out BPI related businesses on behalf of BPI in your location. 
			   <br>
			   <br>
			   Reason: <br>
			   ' . $this->input->post( 'enable_reason' ) . '
				<br>
				<br>
				If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
				<br>
				<br>
				Thank you for your attention to this notification.
				<br>
				<br>
				Best regards,
				<br>
				BeepAgro Palliative Initiative (BPI) Team.</p>';
        $this->sendemail( $title, $to, $subject, $message );

        //update record....
        $data = array( 'status' => 'active' );
        $condition = array( 'id' => $id );
        $this->generic_model->update_data( 'merchants', $data, $condition );
        $this->session->set_flashdata( 'success', 'Center Reinstated Successfully' );
        redirect( 'pickup_details/' . $id );
      }
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function pickup_details( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $store_owner = $this->generic_model->getInfo( 'users', 'id', $store_details->user_id );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'userdetails' ] = $store_owner;
      $data[ 'store_details' ] = $store_details;
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $this->generic_model->getInfo( 'merch_payments', 'user_id', $store_details->user_id );
      $this->load->view( 'admin/view_center', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function products() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/store_product', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }	
  
  public function investment(){
      if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $data['pools'] = $this->pool_model->get_all_pools();
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/investment', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function admin_transactions() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/transactions', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function admin_withdrawals() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/withdrawals', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function product_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];
    $products = $this->generic_model->get_products( $limit, $offset, $search, $order );
    $total_products = $this->generic_model->count_all_products();
    $filtered_products = $this->generic_model->count_filtered_products( $search );


    $data = [];
    foreach ( $products as $product ) {
      $row = [];
      $row[ 'id' ] = $product->id;
      $row[ 'pickup_center_id' ] = $this->generic_model->getInfo('merchants','id',$product->pickup_center_id)->merchant_name;
      $row[ 'product_name' ] = $product->product_name;
      $row[ 'unit' ] = $product->unit;
      $row[ 'quantity' ] = $product->quantity;
      $row[ 'price' ] = $product->price;
      $row[ 'description' ] = $product->description;
      $row[ 'pickup_reward' ] = $product->pickup_reward;
      $row[ 'in_stock' ] = $product->in_stock;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_products,
      'recordsFiltered' => $filtered_products,
      'data' => $data
    ];

    echo json_encode( $output );

  }

  public function transaction_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];
  $transactions = $this->generic_model->get_table('transaction_history','transaction_type','description', $limit, $offset, $search, $order );
    $total_transactions = $this->generic_model->count_all_table('transaction_history');
    $filtered_transactions = $this->generic_model->count_filtered_table('transaction_history','transaction_type','description',$search);


    $data = [];
    foreach ( $transactions as $transaction ) {
      $row = [];
      $row[ 'id' ] = $transaction->id;
      $row[ 'user_id' ] = $this->generic_model->getInfo('users','id',$transaction->user_id)->firstname;
      $row[ 'transaction_type' ] = $transaction->transaction_type;
      $row[ 'amount' ] = $transaction->amount;
      $row[ 'description' ] = $transaction->description;
      $row[ 'transaction_date' ] = $transaction->transaction_date;
      $row[ 'status' ] = $transaction->status;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_transactions,
      'recordsFiltered' => $filtered_transactions,
      'data' => $data
    ];

    echo json_encode( $output );

  }

  public function withdrawal_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];
  $transactions = $this->generic_model->get_table('withdrawal_history','status','description', $limit, $offset, $search, $order );
    $total_transactions = $this->generic_model->count_all_table('withdrawal_history');
    $filtered_transactions = $this->generic_model->count_filtered_table('withdrawal_history','status','description',$search);


    $data = [];
    foreach ( $transactions as $transaction ) {
      $row = [];
      $row[ 'id' ] = $transaction->id;
      $row[ 'user_id' ] = $this->generic_model->getInfo('users','id',$transaction->user_id)->firstname;
      $row[ 'currency' ] = $transaction->currency;
      $row[ 'amount' ] = $transaction->amount;
      $row[ 'description' ] = $transaction->description;
      $row[ 'date' ] = $transaction->date;
      $row[ 'status' ] = $transaction->status;
      $data[] = $row;
    }
	 	 	 	 	 	 	 	
    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_transactions,
      'recordsFiltered' => $filtered_transactions,
      'data' => $data
    ];

    echo json_encode( $output );

  
   }
	
  public function user_withdrawal_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
	$user_id = $this->input->post('user_id');
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];
    $transactions = $this->generic_model->get_table_user('user_id',$user_id,'withdrawal_history','status','description', $limit, $offset, $search, $order );
    $total_transactions = $this->generic_model->count_all_table_user('user_id',$user_id,'withdrawal_history');
    $filtered_transactions = $this->generic_model->count_filtered_table_user('user_id',$user_id,'withdrawal_history','status','description',$search);


    $data = [];
    foreach ( $transactions as $transaction ) {
      $row = [];
      $row[ 'id' ] = $transaction->id;
	  $row[ 'user_id' ] = $transaction->user_id;
      $row[ 'currency' ] = $transaction->currency;
      $row[ 'amount' ] = $transaction->amount;
      $row[ 'description' ] = $transaction->description;
      $row[ 'date' ] = $transaction->date;
      $row[ 'status' ] = $transaction->status;
      $data[] = $row;
    }
	 	 	 	 	 	 	 	
    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_transactions,
      'recordsFiltered' => $filtered_transactions,
      'data' => $data
    ];

    echo json_encode( $output );

  
   }

  public function accept_merchant( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $store_details = $this->generic_model->getInfo( 'merchants', 'id', $id );
      $store_owner = $this->generic_model->getInfo( 'users', 'id', $store_details->user_id );
      //update the table to reflect acceptance 
      $data = array( 'status' => 'approved' );
      $condition = array( 'id' => $id );
      $this->generic_model->update_data( 'merchants', $data, $condition );
      ///send message.......
      $to = $store_owner->email;
      $subject = 'Pickup Center Application Update';
      $title = 'Dear  ' . $store_owner->firstname;
      $message = 'This is to notify you that your BPI Pickup Center application for ' . $store_details->merchant_name . '  was accepted.
		   <br>
		   <br>
		   Login to your account, visit Pickup Locations from the menu option, you will see your application status has changed, click the activation button to pay your activation fee and complete your application.
			<br>
			<br>
			If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
			<br>
			<br>
			Thank you for your attention to this notification.
			<br>
			<br>
			Best regards,
			<br>
			BeepAgro Palliative Initiative (BPI) Team.</p>';
      $this->sendemail( $title, $to, $subject, $message );
      //redirect to kyc page.
      $this->session->set_flashdata( 'success', 'Application Accepted Successfully, Notification sent to User\'s Email' );
      redirect( 'pickup_details/' . $id );

    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function search() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'users' ] = $this->generic_model->select_all_data( 'users' );
      $this->load->view( 'admin/search', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function do_search() {
    $search_term = $this->input->post( 'search_term' );
    $results = $this->generic_model->search_users( $search_term );
    echo json_encode( $results );
  }

  public function unban_withdrawal() {
    $user = $this->input->post( 'uid' );
    $userinfo = array( 'withdraw_ban' => 0 );
    $user_condition = array( 'id' => $user );
    $this->generic_model->update_data( 'users', $userinfo, $user_condition );
    $this->session->set_flashdata( 'success', 'Withdrawal enabled for user!' );
    redirect( 'users_details/' . $user );
  }

  public function ban_withdrawal() {
    $user = $this->input->post( 'uid' );
    $userinfo = array( 'withdraw_ban' => 1 );
    $user_condition = array( 'id' => $user );
    $this->generic_model->update_data( 'users', $userinfo, $user_condition );
    $this->session->set_flashdata( 'success', 'Withdrawal disabled for user!' );
    redirect( 'users_details/' . $user );
  }

  public function pickups() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/pickups', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function user_details( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $sponsor = $this->generic_model->getInfo( 'referrals', 'user_id', $id );
      $login_logs = $this->generic_model->select_where( 'login_activity', array( 'user_id' => $id ) );
      $referrals = $this->generic_model->select_where( 'referrals', array( 'referred_by' => $id ) );

      //regular packages breakdown..................
      $total_regulars_direct = $this->generic_model->get_users_count_by_package( $id, 10000 );
      $total_regularsPro_direct = $this->generic_model->get_users_count_by_package( $id, 23000 );
      $total_regularsPlus_direct = $this->generic_model->get_users_count_by_package( $id, 50000 );
      $total_Gold_direct = $this->generic_model->get_users_count_by_package( $id, 210000 );
      $total_platinum_direct = $this->generic_model->get_users_count_by_package( $id, 310000 );

      //level2 packages breakdown..................
      $total_regulars_level_2 = $this->generic_model->get_users_count_by_package_level( $id, 'level_1', 10000 );
      $total_regularsPro_level_2 = $this->generic_model->get_users_count_by_package_level( $id, 'level_1', 23000 );
      $total_regularsPlus_level_2 = $this->generic_model->get_users_count_by_package_level( $id, 'level_1', 50000 );
      $total_Gold_level_2 = $this->generic_model->get_users_count_by_package_level( $id, 'level_1', 210000 );
      $total_platinum_level_2 = $this->generic_model->get_users_count_by_package_level( $id, 'level_1', 310000 );

      //level3 packages breakdown..................
      $total_regulars_level_3 = $this->generic_model->get_users_count_by_package_level( $id, 'level_2', 10000 );
      $total_regularsPro_level_3 = $this->generic_model->get_users_count_by_package_level( $id, 'level_2', 23000 );
      $total_regularsPlus_level_3 = $this->generic_model->get_users_count_by_package_level( $id, 'level_2', 50000 );
      $total_Gold_level_3 = $this->generic_model->get_users_count_by_package_level( $id, 'level_2', 210000 );
      $total_platinum_level_3 = $this->generic_model->get_users_count_by_package_level( $id, 'level_2', 310000 );

      //level4 packages breakdown..................
      $total_regulars_level_4 = $this->generic_model->get_users_count_by_package_level( $id, 'level_3', 10000 );
      $total_regularsPro_level_4 = $this->generic_model->get_users_count_by_package_level( $id, 'level_3', 23000 );
      $total_regularsPlus_level_4 = $this->generic_model->get_users_count_by_package_level( $id, 'level_3', 50000 );
      $total_Gold_level_4 = $this->generic_model->get_users_count_by_package_level( $id, 'level_3', 210000 );
      $total_platinum_level_4 = $this->generic_model->get_users_count_by_package_level( $id, 'level_3', 310000 );

      //level5 packages breakdown..................
      $total_Gold_level_5 = $this->generic_model->get_users_count_by_package_level( $id, 'level_4', 210000 );
      $total_platinum_level_5 = $this->generic_model->get_users_count_by_package_level( $id, 'level_4', 310000 );

      //level6 packages breakdown..................
      $total_Gold_level_6 = $this->generic_model->get_users_count_by_package_level( $id, 'level_5', 210000 );
      $total_platinum_level_6 = $this->generic_model->get_users_count_by_package_level( $id, 'level_5', 310000 );

      //level7 packages breakdown..................
      $total_Gold_level_7 = $this->generic_model->get_users_count_by_package_level( $id, 'level_6', 210000 );
      $total_platinum_level_7 = $this->generic_model->get_users_count_by_package_level( $id, 'level_6', 310000 );

      //level8 packages breakdown..................
      $total_Gold_level_8 = $this->generic_model->get_users_count_by_package_level( $id, 'level_7', 210000 );
      $total_platinum_level_8 = $this->generic_model->get_users_count_by_package_level( $id, 'level_7', 310000 );

      //level9 packages breakdown..................
      $total_Gold_level_9 = $this->generic_model->get_users_count_by_package_level( $id, 'level_8', 210000 );
      $total_platinum_level_9 = $this->generic_model->get_users_count_by_package_level( $id, 'level_8', 310000 );

      //level5 packages breakdown..................
      $total_Gold_level_10 = $this->generic_model->get_users_count_by_package_level( $id, 'level_9', 210000 );
      $total_platinum_level_10 = $this->generic_model->get_users_count_by_package_level( $id, 'level_9', 310000 );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'active_plan' ] = $this->generic_model->getInfo( 'active_shelters', 'user_id', $id );
      $data[ 'userdetails' ] = $this->generic_model->getInfo( 'users', 'id', $id );
      $data[ 'referrals' ] = $referrals;
      $data[ 'total_direct_activated' ] = $this->generic_model->count_activated_users_referred_by( $id );
      $data[ 'total_level2' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_1' );
      $data[ 'total_level3' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_2' );
      $data[ 'total_level4' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_3' );
      $data[ 'total_level5' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_4' );
      $data[ 'total_level6' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_5' );
      $data[ 'total_level7' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_6' );
      $data[ 'total_level8' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_7' );
      $data[ 'total_level9' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_8' );
      $data[ 'total_level10' ] = $this->generic_model->count_activated_users_referred_by_level( $id, 'level_9' );

      $data[ 'total_direct_regular' ] = $total_regulars_direct;
      $data[ 'regular_list' ] = $this->generic_model->get_users_by_package( $id, 10000 );
      $data[ 'total_direct_regularPro' ] = $total_regularsPro_direct;
      $data[ 'regularPro_list' ] = $this->generic_model->get_users_by_package( $id, 23000 );
      $data[ 'total_direct_regularPlus' ] = $total_regularsPlus_direct;
      $data[ 'regularPlus_list' ] = $this->generic_model->get_users_by_package( $id, 50000 );
      $data[ 'total_direct_gold' ] = $total_Gold_direct;
      $data[ 'gold_list' ] = $this->generic_model->get_users_by_package( $id, 210000 );
      $data[ 'total_direct_platinum' ] = $total_platinum_direct;
      $data[ 'platinum_list' ] = $this->generic_model->get_users_by_package( $id, 310000 );

      //////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_regular_level2' ] = $total_regulars_level_2;
      $data[ 'regular_list_2' ] = $this->generic_model->get_users_by_package_level( $id, 'level_1', 10000 );
      $data[ 'total_regularPro_level2' ] = $total_regularsPro_level_2;
      $data[ 'regularPro_list_2' ] = $this->generic_model->get_users_by_package_level( $id, 'level_1', 23000 );
      $data[ 'total_regularPlus_level2' ] = $total_regularsPlus_level_2;
      $data[ 'regularPlus_list_2' ] = $this->generic_model->get_users_by_package_level( $id, 'level_1', 50000 );
      $data[ 'total_gold_level2' ] = $total_Gold_level_2;
      $data[ 'gold_list_2' ] = $this->generic_model->get_users_by_package_level( $id, 'level_1', 210000 );
      $data[ 'total_platinum_level2' ] = $total_platinum_level_2;
      $data[ 'platinum_list_2' ] = $this->generic_model->get_users_by_package_level( $id, 'level_1', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////	  
      $data[ 'total_regular_level3' ] = $total_regulars_level_3;
      $data[ 'regular_list_3' ] = $this->generic_model->get_users_by_package_level( $id, 'level_2', 10000 );
      $data[ 'total_regularPro_level3' ] = $total_regularsPro_level_3;
      $data[ 'regularPro_list_3' ] = $this->generic_model->get_users_by_package_level( $id, 'level_2', 23000 );
      $data[ 'total_regularPlus_level3' ] = $total_regularsPlus_level_3;
      $data[ 'regularPlus_list_3' ] = $this->generic_model->get_users_by_package_level( $id, 'level_2', 50000 );
      $data[ 'total_gold_level3' ] = $total_Gold_level_3;
      $data[ 'gold_list_3' ] = $this->generic_model->get_users_by_package_level( $id, 'level_2', 210000 );
      $data[ 'total_platinum_level3' ] = $total_platinum_level_3;
      $data[ 'platinum_list_3' ] = $this->generic_model->get_users_by_package_level( $id, 'level_2', 310000 );

      /////////////////////////////////////////////////////////////////////////////////////////////////////	  
      $data[ 'total_regular_level4' ] = $total_regulars_level_4;
      $data[ 'regular_list_4' ] = $this->generic_model->get_users_by_package_level( $id, 'level_3', 10000 );
      $data[ 'total_regularPro_level4' ] = $total_regularsPro_level_4;
      $data[ 'regularPro_list_4' ] = $this->generic_model->get_users_by_package_level( $id, 'level_3', 23000 );
      $data[ 'total_regularPlus_level4' ] = $total_regularsPlus_level_4;
      $data[ 'regularPlus_list_4' ] = $this->generic_model->get_users_by_package_level( $id, 'level_3', 50000 );
      $data[ 'total_gold_level4' ] = $total_Gold_level_4;
      $data[ 'gold_list_4' ] = $this->generic_model->get_users_by_package_level( $id, 'level_3', 210000 );
      $data[ 'total_platinum_level4' ] = $total_platinum_level_4;
      $data[ 'platinum_list_4' ] = $this->generic_model->get_users_by_package_level( $id, 'level_3', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level5' ] = $total_Gold_level_5;
      $data[ 'gold_list_5' ] = $this->generic_model->get_users_by_package_level( $id, 'level_4', 210000 );
      $data[ 'total_platinum_level5' ] = $total_platinum_level_5;
      $data[ 'platinum_list_5' ] = $this->generic_model->get_users_by_package_level( $id, 'level_4', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level6' ] = $total_Gold_level_6;
      $data[ 'gold_list_6' ] = $this->generic_model->get_users_by_package_level( $id, 'level_5', 210000 );
      $data[ 'total_platinum_level6' ] = $total_platinum_level_6;
      $data[ 'platinum_list_6' ] = $this->generic_model->get_users_by_package_level( $id, 'level_5', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level7' ] = $total_Gold_level_7;
      $data[ 'gold_list_7' ] = $this->generic_model->get_users_by_package_level( $id, 'level_6', 210000 );
      $data[ 'total_platinum_level7' ] = $total_platinum_level_7;
      $data[ 'platinum_list_7' ] = $this->generic_model->get_users_by_package_level( $id, 'level_6', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level8' ] = $total_Gold_level_8;
      $data[ 'gold_list_8' ] = $this->generic_model->get_users_by_package_level( $id, 'level_7', 210000 );
      $data[ 'total_platinum_level8' ] = $total_platinum_level_8;
      $data[ 'platinum_list_8' ] = $this->generic_model->get_users_by_package_level( $id, 'level_7', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level9' ] = $total_Gold_level_9;
      $data[ 'gold_list_9' ] = $this->generic_model->get_users_by_package_level( $id, 'level_8', 210000 );
      $data[ 'total_platinum_level9' ] = $total_platinum_level_9;
      $data[ 'platinum_list_9' ] = $this->generic_model->get_users_by_package_level( $id, 'level_8', 310000 );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      $data[ 'total_gold_level10' ] = $total_Gold_level_10;
      $data[ 'gold_list_10' ] = $this->generic_model->get_users_by_package_level( $id, 'level_9', 210000 );
      $data[ 'total_platinum_level10' ] = $total_platinum_level_10;
      $data[ 'platinum_list_10' ] = $this->generic_model->get_users_by_package_level( $id, 'level_9', 310000 );

      $data[ 'logs' ] = $login_logs;
      $data[ 'sponsor_data' ] = $sponsor;
      $this->load->view( 'admin/view_user', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function products_details($id){
	  if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
	  $product_details = $this->generic_model->getInfo('store_products','id',$id); 
	  $store_details = $this->generic_model->getInfo( 'merchants', 'id', $product_details->pickup_center_id );
      $user_details = $this->session->userdata( 'user_details' );
	  $data['store_details'] = $store_details;
	  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
      $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data['user_details'] = $user_details;
	  $data['product_details'] = $product_details;
	  $data['new_centers'] = $this->generic_model->get_centers_without_products($product_details->product_name);
      $this->load->view('admin/view_products',$data);
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }  
  }

  public function add_to_store() { 
	   if ( $this->session->userdata( 'user_id' ) ) {
			  $userid = $this->session->userdata( 'user_id' );
		   	  $id = $this->input->post('store_product_id');
			  $this->reset_session();
			  $user_details = $this->session->userdata( 'user_details' );
			  $this->form_validation->set_rules( 'store_id', 'Select Store', 'required' );
		      $this->form_validation->set_rules( 'new_stock', 'New Stock Quantity', 'required' );
			  if ( $this->form_validation->run() === FALSE ) {
				  $this->session->set_flashdata('error', validation_errors());
				redirect('products_details/'.$id );
			  } else {
				$quantity = $this->input->post('new_stock');
				$store_owner = $this->generic_model->getInfo( 'users', 'id', $this->input->post('store_id') );
				$store_details = $this->generic_model->getInfo( 'merchants', 'id', $this->input->post('store_id'));
				$products = $this->generic_model->getInfo('store_products','id',$id);
				$products->pickup_center_id = $this->input->post('store_id');
				$products->in_stock = 1;
				$products->quantity = $quantity; 
				unset($products->id);
				if ($this->generic_model->insert_data('store_products', $products)) {
					 
					//notify the center manager of the addition!
					 $to = $store_owner->email;
					 $subject = 'Pickup Center New Product Added!';
					 $title = 'Dear  ' . $store_owner->firstname;
					 $message = 'This is to notify you that your A new product was added to your BPI Pickup Center: ' . $store_details->merchant_name . '\'s Catalog. 
							   <br>
							   <br>
							   Product Name: <br>
							   ' . $products->product_name . '
								<br>
								Quantity: <br>
								'.$quantity.'
								<br><br>
								If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
								<br>
								<br>
								Thank you for your attention to this notification.
								<br>
								<br>
								Best regards,
								<br>
								BeepAgro Palliative Initiative (BPI) Team.</p>';
					 $this->sendemail( $title, $to, $subject, $message );

					
					$this->session->set_flashdata( 'success', 'Product added successfully' );
					redirect('products_details/'.$id );
				} else {
					$this->session->set_flashdata( 'error', 'Unable to add product! Something went wrong' );
					redirect('products_details/'.$id );
				}
				
			  }
		} else {
		  	redirect( 'login' ); // Redirect to login if not logged in
		}
    }
	
  public function add_stock() { 
	   if ( $this->session->userdata( 'user_id' ) ) {
			  $userid = $this->session->userdata( 'user_id' );
		   	  $id = $this->input->post('product_id');
			  $this->reset_session();
			  $user_details = $this->session->userdata( 'user_details' );
			  $this->form_validation->set_rules( 'center_id', 'Select Store', 'required' );
		      $this->form_validation->set_rules( 'stock', 'New Stock Quantity', 'required' );
			  if ( $this->form_validation->run() === FALSE ) {
				  $this->session->set_flashdata('error', validation_errors());
				redirect('products_details/'.$id );
			  } else {
				$quantity = $this->input->post('stock');
				$store_id = $this->input->post('center_id');
				$store_owner = $this->generic_model->getInfo( 'users', 'id', $this->input->post('center_id'));
				$store_details = $this->generic_model->getInfo( 'merchants', 'id', $this->input->post('center_id'));
				$product = $this->generic_model->getInfo('store_products','id',$id);
				$old_stock = $product->quantity;
				$new_stock = ($old_stock + $quantity);
				  
				$data = array('quantity'=>$new_stock);
				$condition = array('id'=>$id);
				$table = 'store_products';
				
				  
				if ($this->generic_model->update_data($table, $data, $condition)) {
					//notify the center manager of the addition!
					 $to = $store_owner->email;
					 $subject = 'Pickup Center Stock Updated!';
					 $title = 'Dear  ' . $store_owner->firstname;
					 $message = 'This is to notify you that a product\'s stock was updated in your BPI Pickup Center: ' . $store_details->merchant_name . '\'s Catalog. 
							   <br>
							   <br>
							   Product Name: <br>
							   ' . $product->product_name . '
								<br>
								Old Stock: <br>
								'.$old_stock.'
								<br>
								Top Up: <br>
								'.$quantity.'
								<br>
								New Stock: <br>
								'.$new_stock.'
								<br><br>
								If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
								<br>
								<br>
								Thank you for your attention to this notification.
								<br>
								<br>
								Best regards,
								<br>
								BeepAgro Palliative Initiative (BPI) Team.</p>';
					 $this->sendemail( $title, $to, $subject, $message );

					
					$this->session->set_flashdata( 'success', 'New Stock added successfully' );
					redirect('products_details/'.$id );
				} else {
					$this->session->set_flashdata( 'error', 'Unable to add New Stock! Something went wrong' );
					redirect('products_details/'.$id );
				}
				
			  }
		} else {
		  	redirect( 'login' ); // Redirect to login if not logged in
		}
    }
	
  public function edit_bonus() { 
	   if ( $this->session->userdata( 'user_id' ) ) {
			  $userid = $this->session->userdata( 'user_id' );
		   	  $id = $this->input->post('edit_product_id');
			  $this->reset_session();
			  $user_details = $this->session->userdata( 'user_details' );
		   
				$discount = $this->input->post('discount');
				$pickup_reward = $this->input->post('pickup_reward');
				$revenue = $this->input->post('revenue');
				$Direct = $this->input->post('Direct');
				$level_1 = $this->input->post('level_1');
				$level_2 = $this->input->post('level_2');
				$level_3 = $this->input->post('level_3');
				$level_4 = $this->input->post('level_4');
				$cashback_direct = $this->input->post('cashback_direct');
				$cashback_level1 = $this->input->post('cashback_level1');
				$cashback_level2 = $this->input->post('cashback_level2');
				$cashback_level3 = $this->input->post('cashback_level3');
				$cashback_level4 = $this->input->post('cashback_level4');
				  
				$data = array(
					'discount'=>$discount,
					'pickup_reward'=>$pickup_reward,
					'revenue'=>$revenue,
					'Direct'=>$Direct,
					'level_1'=>$level_1,
					'level_2'=>$level_2,
					'level_3'=>$level_3,
					'level_4'=>$level_4,
					'cashback_direct'=>$cashback_direct,
					'cashback_level1'=>$cashback_level1,
					'cashback_level2'=>$cashback_level2,
					'cashback_level3'=>$cashback_level3,
					'cashback_level4'=>$cashback_level4
				);
				$condition = array('id'=>$id);
				$table = 'store_products';
				
				  
				if ($this->generic_model->update_data($table, $data, $condition)) {
					$this->session->set_flashdata( 'success', 'Details Edited successfully' );
					redirect('products_details/'.$id );
				} else {
					$this->session->set_flashdata( 'error', 'Unable Edit Product! Something went wrong' );
					redirect('products_details/'.$id );
				}
				
			  
		} else {
		  	redirect( 'login' ); // Redirect to login if not logged in
		}
    }

  public function users() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'users' ] = $this->generic_model->select_all_data( 'users' );
      $this->load->view( 'admin/users', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function activated_users() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'users' ] = $this->generic_model->select_all('users', array('is_vip'=>1));
      $this->load->view( 'admin/activated_users', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }
	
  public function inactive_users() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'users' ] = $this->generic_model->select_all('users', array('is_vip'=>0));
      $this->load->view( 'admin/inactive_users', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function ajax_list() {
    $limit = (int) $this->input->post('length', TRUE);
    $offset = (int) $this->input->post('start', TRUE);
    $search = $this->input->post('search[value]', TRUE) ?? '';
    $draw = (int) $this->input->post('draw', TRUE);

    // Sanitize order parameters
    $order_column_index = $this->input->post('order[0][column]', TRUE);
    $columns = $this->input->post('columns', TRUE);
    $order = [
        'column' => isset($columns[$order_column_index]['data']) ? $columns[$order_column_index]['data'] : 'id',
        'dir' => $this->input->post('order[0][dir]', TRUE) === 'desc' ? 'DESC' : 'ASC'
    ];

    // Fetch data
    $users = $this->generic_model->get_users($limit, $offset, $search, $order);
    $total_users = $this->generic_model->count_all_users();
    $filtered_users = $this->generic_model->count_filtered_users($search);

    // Prepare data
    $data = [];
    foreach ($users as $user) {
        $data[] = [
            'id' => $user['id'] ?? '',
            'firstname' => $user['firstname'] ?? '',
            'lastname' => $user['lastname'] ?? '',
            'mobile' => $user['mobile'] ?? '',
            'gender' => $user['gender'] ?? '',
            'address' => $user['address'] ?? '',
            'username' => $user['username'] ?? '',
            'email' => $user['email'] ?? '',
            'created_at' => $user['created_at'] ?? ''
        ];
    }

    // Log memory usage after processing
    log_message('debug', 'Memory Usage End: ' . (memory_get_usage() / 1024 / 1024) . ' MB');

    // Output JSON
    $output = [
        'draw' => $draw,
        'recordsTotal' => (int) $total_users,
        'recordsFiltered' => (int) $filtered_users,
        'data' => $data
    ];

    $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode($output));
}

  /**public function ajax_list() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $users = $this->generic_model->get_users( $limit, $offset, $search, $order );
    $total_users = $this->generic_model->count_all_users();
    $filtered_users = $this->generic_model->count_filtered_users( $search );

    $data = [];
    foreach ( $users as $user ) {
      $row = [];
      $row[ 'id' ] = $user->id;
      $row[ 'firstname' ] = $user->firstname;
      $row[ 'lastname' ] = $user->lastname;
      $row[ 'mobile' ] = $user->mobile;
      $row[ 'gender' ] = $user->gender;
      $row[ 'address' ] = $user->address;
      $row[ 'username' ] = $user->username;
      $row[ 'email' ] = $user->email;
      $row[ 'created_at' ] = $user->created_at;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_users,
      'recordsFiltered' => $filtered_users,
      'data' => $data
    ];

    echo json_encode( $output );
  }**/
	
  public function ajax_list_active() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $users = $this->generic_model->get_users_active( $limit, $offset, $search, $order );
    $total_users = $this->generic_model->count_all_users_active();
    $filtered_users = $this->generic_model->count_filtered_users_active( $search );

    $data = [];
    foreach ( $users as $user ) {
      $row = [];
      $row[ 'id' ] = $user->id;
      $row[ 'firstname' ] = $user->firstname;
      $row[ 'lastname' ] = $user->lastname;
      $row[ 'mobile' ] = $user->mobile;
      $row[ 'gender' ] = $user->gender;
      $row[ 'address' ] = $user->address;
      $row[ 'username' ] = $user->username;
      $row[ 'email' ] = $user->email;
      $row[ 'created_at' ] = $user->created_at;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_users,
      'recordsFiltered' => $filtered_users,
      'data' => $data
    ];

    echo json_encode( $output );
  }
	
  public function ajax_list_inactive() {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $users = $this->generic_model->get_users_inactive( $limit, $offset, $search, $order );
    $total_users = $this->generic_model->count_all_users_inactive();
    $filtered_users = $this->generic_model->count_filtered_users_inactive( $search );

    $data = [];
    foreach ( $users as $user ) {
      $row = [];
      $row[ 'id' ] = $user->id;
      $row[ 'firstname' ] = $user->firstname;
      $row[ 'lastname' ] = $user->lastname;
      $row[ 'mobile' ] = $user->mobile;
      $row[ 'gender' ] = $user->gender;
      $row[ 'address' ] = $user->address;
      $row[ 'username' ] = $user->username;
      $row[ 'email' ] = $user->email;
      $row[ 'created_at' ] = $user->created_at;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_users,
      'recordsFiltered' => $filtered_users,
      'data' => $data
    ];

    echo json_encode( $output );
  }
 
  public function store_products( $store_id ) {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $products = $this->generic_model->get_store_products( $store_id, $limit, $offset, $search, $order );
    $total_products = $this->generic_model->count_all_store_products( $store_id );
    $filtered_products = $this->generic_model->count_filtered_store_products( $store_id, $search );

    $data = [];
    foreach ( $products as $product ) {
      $row = [];
      $row[ 'product_name' ] = $product->product_name;
      $row[ 'quantity' ] = $product->quantity;
      $row[ 'price' ] = $product->price;
      $row[ 'unit' ] = $product->unit;
      $row[ 'pickup_reward' ] = $product->pickup_reward;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_products,
      'recordsFiltered' => $filtered_products,
      'data' => $data
    ];

    echo json_encode( $output );
  }

  public function order_products( $store_id ) {
    $limit = $this->input->post( 'length' );
    $offset = $this->input->post( 'start' );
    $search = $this->input->post( 'search' )[ 'value' ];
    $order = [
      'column' => $this->input->post( 'columns' )[ $this->input->post( 'order' )[ 0 ][ 'column' ] ][ 'data' ],
      'dir' => $this->input->post( 'order' )[ 0 ][ 'dir' ]
    ];

    $products = $this->generic_model->get_order_products( $store_id, $limit, $offset, $search, $order );
    $total_products = $this->generic_model->count_all_order_products( $store_id );
    $filtered_products = $this->generic_model->count_filtered_order_products( $store_id, $search );

    $data = [];
    foreach ( $products as $product ) {
      $row = [];
      $row[ 'product_name' ] = $product->product_name;
      $row[ 'quantity' ] = $product->quantity;
      $row[ 'price' ] = $product->price;
      $row[ 'unit' ] = $product->unit;
      $row[ 'pickup_reward' ] = $product->pickup_reward;
      $data[] = $row;
    }

    $output = [
      'draw' => $this->input->post( 'draw' ),
      'recordsTotal' => $total_products,
      'recordsFiltered' => $filtered_products,
      'data' => $data
    ];

    echo json_encode( $output );
  }

  public function kyc() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'kyc_data' ] = $this->generic_model->select_where( 'kyc_data', array( 'status' => 1 ) );
      $this->load->view( 'admin/kyc', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function admin_view_kyc( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $kyc_data = $this->generic_model->getInfo( 'kyc_data', 'id', $id );
      $user_details = $this->session->userdata( 'user_details' );
      $upgrader_details = $this->generic_model->getInfo( 'users', 'id', $kyc_data->user_id );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'kyc_data' ] = $kyc_data;
      $data[ 'upgrader_details' ] = $upgrader_details;
      $this->load->view( 'admin/view_kyc', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
  }

  public function reject_kyc( $id ) {
    $upgrader = $this->generic_model->getInfo( 'kyc_data', 'id', $id );
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
    //change user status from kyc_pending
    $user_data = array(
      'kyc_pending' => 0,
    );
    $condition = array( 'id' => $upgrader->user_id );
    $this->generic_model->update_data( 'users', $user_data, $condition );

    //delete from the kyc data table
    $this->db->where( 'id', $id );
    $this->db->delete( 'kyc_data' );

    //send message to user
    $to = $userInfo->email;
    $subject = 'KYC Verification Failed!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that your KYC verification was declined.
							<br>
							<br>
							<strong>Reasons why your verification might be declined</strong>:
							<br>
							<ul>
								<li>Documents Submitted were not clear</li>
								<li>You Uploaded the wrong documents</li>
								<li>Your name is not clearly visible and could not be used</li>
								<li>You uploaded an expired document</li>
							</ul>
							<br>
							Kinly resubmit your verification documents. 
							<br>
							<br>
							If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
							<br>
							<br>
							Thank you for your attention to this notification.
							<br>
							<br>
							Best regards,
							<br>
							BeepAgro Palliative Initiative (BPI) Team.</p>';
    $this->sendemail( $title, $to, $subject, $message );

    //redirect to kyc page.
    $this->session->set_flashdata( 'success', 'Declined successfully, Notification sent to User\'s Email' );
    redirect( 'admin_kyc' );
  }

  public function approve_kyc( $id ) {
    $upgrader = $this->generic_model->getInfo( 'kyc_data', 'id', $id );
    $userInfo = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
    //change user status from kyc_pending
    $user_data = array(
      'kyc_pending' => 0,
      'kyc' => 1
    );
    $condition = array( 'id' => $upgrader->user_id );
    $this->generic_model->update_data( 'users', $user_data, $condition );

    //update from the kyc data table
    $kyc_data = array(
      'status' => 2,
    );
    $kyc_condition = array( 'id' => $id );
    $this->generic_model->update_data( 'kyc_data', $kyc_data, $kyc_condition );

    //send message to user
    $to = $userInfo->email;
    $subject = 'KYC Verification Approved!';
    $title = 'Dear  ' . $userInfo->firstname;
    $message = 'This is to notify you that your KYC verification was approved.
							<br>
							<br>
							<strong> Congratulations! Your BPI account is now verified!</strong>:
							<br>
							<br>
							If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
							<br>
							<br>
							Thank you for your attention to this notification.
							<br>
							<br>
							Best regards,
							<br>
							BeepAgro Palliative Initiative (BPI) Team.</p>';
    $this->sendemail( $title, $to, $subject, $message );

    //redirect to kyc page.
    $this->session->set_flashdata( 'success', 'Approved successfully, Notification sent to User\'s Email' );
    redirect( 'admin_kyc' );
  }

  public function index() {
    if ( $this->session->userdata( 'user_id' ) ) {
	
	  //lets attach this payload to run on idex load one time 
	  //$this->generic_model->update_active_shelters();
		//
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      if ( $user_details->user_type == 'admin' || $user_details->user_type == 'support' ) {
        $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
        $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
        $data[ 'user_details' ] = $user_details;
        $data[ 'exclude_ids' ] = [ 1, 2, 3, 4, 5, 67 ];
        $this->load->view( 'admin/index', $data );
      } else {
        $this->session->set_flashdata( 'error', 'link manipulation detected, We have started logging your browsing data against malicious user behavior!' );
        redirect('dashboard');
      }

    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function bpi_upgrades() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'upgrades' ] = $this->generic_model->select_where( 'upgrade_payments', array( 'status' => 0 ) );
      $data[ 'subs' ] = $this->generic_model->select_where( 'payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/bpi_upgrade', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function nextofkin() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'claims' ] = $this->generic_model->select_where( 'kin_claims', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/nextofkin', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function view_nextofkin( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $claim = $this->generic_model->getInfo( 'kin_claims', 'id', $id );
      $submitted_by = $this->generic_model->getInfo( 'users', 'id', $claim->submitted_by );
      $benefactor = $this->generic_model->getInfo( 'users', 'id', $claim->benefactor );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'upgrades' ] = $this->generic_model->select_where( 'kin_claims', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'claim_info' ] = $claim;
	  $data['nextofkin'] = $this->generic_model->select_all('beneficiary_info', array('user_id'=>$claim->benefactor));
      $data[ 'benefactor_details' ] = $benefactor;
      $data[ 'requester_details' ] = $submitted_by;
      $this->load->view( 'admin/view_nextofkin', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function reject_nok_request($id){
	  if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $claim = $this->generic_model->getInfo( 'kin_claims', 'id', $id );
      $submitted_by = $this->generic_model->getInfo( 'users', 'id', $claim->submitted_by );
      $benefactor = $this->generic_model->getInfo( 'users', 'id', $claim->benefactor );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      
      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'kin_claims' );

      $this->session->set_flashdata( 'success', 'User Claim Request Denied Successfully' );
      redirect( 'admin_nextofkin' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function approve_nok_request($id){
	  if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $claim = $this->generic_model->getInfo( 'kin_claims', 'id', $id );
      $submitted_by = $this->generic_model->getInfo( 'users', 'id', $claim->submitted_by );
      $benefactor = $this->generic_model->getInfo( 'users', 'id', $claim->benefactor );
	  $is_shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $claim->benefactor );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
	   
	  //benefactor assets
	  $ben_wallet = $benefactor->wallet;
	  $ben_spendable = $benefactor->spendable;
	  $ben_palliative = $benefactor->palliative;
	  $ben_cashback = $benefactor->cashback;
	  $ben_token = $benefactor->token;
		  
	  //beneficiary percentages
	  $nextofkin = $this->generic_model->select_all('beneficiary_info', array('user_id'=>$claim->benefactor));
	  if(!empty($nextofkin)){
	  	foreach($nextofkin as $kin){
			$ben_details = $this->generic_model->getInfo( 'users', 'ssc', $kin->ssc );
			$old_wallet = $ben_details->wallet;
			$old_spendable = $ben_details->spendable;
			$old_palliative = $ben_details->palliative;
			$old_cashback = $ben_details->cashback;
			$old_token = $ben_details->token;

			//new balance
			$kin_percent = $kin->percent;

			$add_wallet = ($ben_wallet * $kin_percent)/100;
			$new_wallet = ($old_wallet + $add_wallet );

			$add_spendable = ($ben_spendable * $kin_percent)/100;
			$new_spendable = ($old_spendable + $add_spendable );

			$add_palliative = ($ben_palliative * $kin_percent)/100;
			$new_palliative = ($old_palliative + $add_palliative );

			$add_cashback = ($ben_cashback * $kin_percent)/100;
			$new_cashback = ($old_cashback + $add_cashback );

			$add_token = ($ben_token * $kin_percent)/100;
			$new_token = ($old_token + $add_token );

			if ( !empty( $is_shelter ) ) {
		  //what is their level?
			  $package_level = $is_shelter->shelter_package;
			  $package_option = $is_shelter->shelter_option;
			   if( $package_option == 6 ) {
				  $wallet = 'education';
				} elseif ( $package_option == 7 ) {
				  $wallet = 'car';
				} elseif ( $package_option == 8 ) {
				  $wallet = 'land';
				} elseif ( $package_option == 9 ) {
				  $wallet = 'business';
				} elseif ( $package_option == 10 ) {
				  $wallet = 'solar';
				} else {
				  $wallet = 'shelter';
				}
				$ben_shelter = $benefactor->$wallet;

				$old_shelter_wallet = $ben_details->$wallet;
				$add_shelter_wallet = ($ben_shelter * $kin_percent)/100;
				$new_shelter_wallet = ($old_shelter_wallet + $add_shelter_wallet );

				$shelter_wallet_data = array(
					$wallet =>$new_shelter_wallet
				);
				$shelter_condition = array( 'id' => $ben_details->id );
				$this->generic_model->update_data('users', $shelter_wallet_data, $shelter_condition);

				$transaction6 = array(
					'user_id' => $ben_details->id,
					'order_id' => $ben_details->id,
					'transaction_type' => 'credit',
					'amount' => $add_token, 
					'description' => 'Next of kin Settlement - '.$wallet.' Wallet', 
					'status' => 'Successful'
				  );

				$this->generic_model->insert_data( 'transaction_history', $transaction6 );
		  }

			  //credit wallets
			  $wallet_data = array(
				'wallet'=>$new_wallet,
				'spendable'=>$new_spendable,
				'palliative'=>$new_palliative,
				'cashback'=>$new_cashback,
				'token'=>$new_token
			  );
			  $condition = array( 'id' => $ben_details->id );
			  $this->generic_model->update_data( 'users', $wallet_data, $condition );

			  //transactions...................................................................................
			  $transaction = array(
				'user_id' => $ben_details->id,
				'order_id' => $ben_details->id,
				'transaction_type' => 'credit',
				'amount' => $add_wallet, 
				'description' => 'Next of kin Settlement - Cash Wallet', 
				'status' => 'Successful'
			  );

			  $transaction2 = array(
				'user_id' => $ben_details->id,
				'order_id' => $ben_details->id,
				'transaction_type' => 'credit',
				'amount' => $add_spendable, 
				'description' => 'Next of kin Settlement - Spendable Wallet', 
				'status' => 'Successful'
			  );

			  $transaction3 = array(
				'user_id' => $ben_details->id,
				'order_id' => $ben_details->id,
				'transaction_type' => 'credit',
				'amount' => $add_palliative, 
				'description' => 'Next of kin Settlement - Palliative Wallet', 
				'status' => 'Successful'
			  );

			   $transaction4 = array(
				'user_id' => $ben_details->id,
				'order_id' => $ben_details->id,
				'transaction_type' => 'credit',
				'amount' => $add_cashback, 
				'description' => 'Next of kin Settlement - Cashback Wallet', 
				'status' => 'Successful'
			  );

			  $transaction5 = array(
				'user_id' => $ben_details->id,
				'order_id' => $ben_details->id,
				'transaction_type' => 'credit',
				'amount' => $add_token, 
				'description' => 'Next of kin Settlement - BPT Wallet', 
				'status' => 'Successful'
			  );

			  $this->generic_model->insert_data( 'transaction_history', $transaction );
			  $this->generic_model->insert_data( 'transaction_history', $transaction2 );
			  $this->generic_model->insert_data( 'transaction_history', $transaction3 );
			  $this->generic_model->insert_data( 'transaction_history', $transaction4 );
			  $this->generic_model->insert_data( 'transaction_history', $transaction5 );

			  //emails.....................................................................................................

				  //send email to beneficiaries....
				 $to_user = $ben_details->email;
				 $subject_user = 'BPI Student Palliative';
				 $title_user = 'Dear ' . $ben_details->firstname;
				 $message_user = nl2br(htmlspecialchars('We are pleased to inform you that your claim as a beneficiary under our Next of Kin Program has been successfully reviewed and approved. This decision follows a thorough assessment of the documents and information you provided in line with the program’s requirements.<br><br>
				 Details of the Claim:
				   <ul>
					<li>Claim Reference Number: [BPI-NOK-'.$id.']</li>
					<li>Name of the Deceased/Nominee: ['.$benefactor->firstname.' '.$benefactor->lastname.']</li>
					<li>Entitlement Percent: ['.$kin_percent.'% of total assets]</li>
					<li>The approved percentage will be disbursed as follows:
						<ol>
						  <li>Main Wallet: NGN'.number_format($add_wallet,2).' </li>
						  <li>Spendable Wallet: NGN'.number_format($add_spendable,2).' </li>
						  <li>Palliative Wallet: NGN'.number_format($add_palliative,2).' </li>
						  <li>Cashback Wallet: NGN'.number_format($add_cashback,2).' </li>
						  <li>BPT Wallet: NGN'.$add_token.' </li>
						</ol>
					</li>
					<li>Payment Mode: [Individual Wallet Credit]</li>
					<li>Disbursement Date: '.date('Y-m-d H:i:s').'</li>
				   </ul>
				   <br>
				   <br>
				   We understand that this is a significant moment for you, and we are committed to ensuring the smooth processing of your entitlement. Kindly verify your BPI wallets and Transaction History for confirmation of disbursement.
					<br>
					<br>
				 If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
								Our support team is here to help you with any concerns you may have.<br>
								Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
								On Behalf of the entire BPI Community I once again extend our condolences for your loss and assure you of our continued support during this time.<br>
								Thank you for trusting us.<br>
								Yours sincerely,.<br>
								AMB. Dr. Don Gilead Okolonkwo.<br>
								Chairman, BPI')); 
				 $this->sendemail( $title_user, $to_user, $subject_user, $message_user );      

			  //delete next of kin claim
			  $this->db->where( 'id', $id );
			  $this->db->delete( 'kin_claims' );

			  //delete next of kin data
			  $this->db->where( 'user_id', $claim->benefactor );
			  $this->db->delete( 'beneficiary_info' );
			
			  $this->session->set_flashdata( 'success', 'User Claim Request Approved Successfully' );
			  redirect( 'admin_nextofkin' );
	  	}
	  }
	  else{
		   $this->session->set_flashdata( 'error', 'Unable to process claim, beneficiary list is empty or there is an issue trying to get beneficiary details from the database...check code line 1416' );
		   redirect( 'admin_nextofkin' );
	  	
	  }
	
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function top_up_request() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'requests' ] = $this->generic_model->select_where( 'wallet_payments', array( 'status' => 0 ) );
      $data[ 'crypto' ] = $this->generic_model->select_where( 'crypto_withdrawal', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/requests', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function remove_duplicates() {
    $this->generic_model->remove_duplicates();
    $this->session->set_flashdata( 'success', 'Duplicates Cleared Successfully, The list has been cleaned' );
    redirect( 'admin_bpi_upgrade' );
  }

  public function remove_kyc_duplicates() {
    $this->generic_model->remove_kyc_duplicates();
    $this->session->set_flashdata( 'success', 'Duplicates Cleared Successfully, The list has been cleaned' );
    redirect( 'admin_kyc' );
  }

  public function view_upgrades( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'upgrade_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'upgrades' ] = $this->generic_model->select_where( 'upgrade_payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $upgrader;
      $data[ 'shelter_details' ] = $shelter;
      $data[ 'upgrader_details' ] = $payer;
      $this->load->view( 'admin/view_upgrades', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function view_payments( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'upgrades' ] = $this->generic_model->select_where( 'upgrade_payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $upgrader;
      $data[ 'shelter_details' ] = $shelter;
      $data[ 'upgrader_details' ] = $payer;
      $this->load->view( 'admin/view_payments', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function view_student_payments( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'student_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $student = $this->generic_model->getInfo( 'student_data', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'upgrades' ] = $this->generic_model->select_where( 'upgrade_payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $upgrader;
      $data[ 'student_details' ] = $student;
      $data[ 'upgrader_details' ] = $payer;
      $this->load->view( 'admin/view_student', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function view_wallet_payments( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $payment = $this->generic_model->getInfo( 'wallet_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $payment->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'payment' ] = $this->generic_model->select_where( 'wallet_payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $payment;
      $data[ 'upgrader_details' ] = $payer;
      $this->load->view( 'admin/view_topup', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function view_crypto_payment( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $payment = $this->generic_model->getInfo( 'crypto_withdrawal', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $payment->user_id );
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'payment' ] = $this->generic_model->select_where( 'crypto_withdrawal', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $data[ 'payment_info' ] = $payment;
      $data[ 'upgrader_details' ] = $payer;
      $this->load->view( 'admin/view_crypto', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }    

  public function reject_upgrade( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'upgrade_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $upgrader->user_id );
      $user_details = $this->session->userdata( 'user_details' );
      //start resetting the data, first the user table
      $user_data = array(
        'vip_pending' => 0,
        'shelter_pending' => 0,
        'bpi_upgrade' => 0,
        'is_vip' => 1,
        'is_shelter' => 1
      );
      $condition = array( 'id' => $upgrader->user_id );
      $this->generic_model->update_data( 'users', $user_data, $condition );

      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'upgrade_payments' );

      //return the shelter to active	

      $shelter_data = array(
        'starter_pack' => 1,
        'status' => 'active',
        'amount' => '10000'
      );

      $shelter_condition = array( 'user_id' => $upgrader->user_id );
      $this->generic_model->update_data( 'active_shelters', $shelter_data, $shelter_data );

      $this->session->set_flashdata( 'success', 'Reset Completed Successfully' );
      redirect( 'admin_bpi_upgrade' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function reject_payment( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      //start resetting the data, first the user table
      $user_data = array(
        'vip_pending' => 0,
        'shelter_pending' => 0,
        'bpi_upgrade' => 0,
        'is_vip' => 0,
        'is_shelter' => 0
      );
      $condition = array( 'id' => $upgrader->user_id );
      $this->generic_model->update_data( 'users', $user_data, $condition );

      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'payments' );

      //return the shelter to active	

      //delete the active shelter
      $this->db->where( 'user_id', $upgrader->user_id );
      $this->db->delete( 'active_shelters' );

      $this->session->set_flashdata( 'success', 'User Subscription Request Denied Successfully' );
      redirect( 'admin_bpi_upgrade' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function reject_topup( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'wallet_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'wallet_payments' );
	  //send debit email
            $to = $payer->email;
            $subject = 'Top Up Rejected!';
            $title = 'Dear  ' . $payer->firstname;
            $message = 'This is to notify you that a credit transaction to your cash wallet was rejected.
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
      $this->session->set_flashdata( 'success', 'User Topup Request Deleted Successfully' );
      redirect( 'top_up_request' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function reject_crypto($id) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'crypto_withdrawal', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      //update the withdrawal history and return the funds debited........
      $amount = $upgrader->amount;
        
      $update_withdrawal_data = array(
          'status' => 'rejected',
      );
      $withdrawal_table = 'withdrawal_history';
      $withdrawal_condition = array('amount' => $amount,'user_id'=>$upgrader->user_id);
      $this->generic_model->update_data($withdrawal_table, $update_withdrawal_data, $withdrawal_condition);
        
      $total_wallet = $this->generic_model->convert_currency($payer->default_currency,$payer->wallet);
      $total_spendable = $this->generic_model->convert_currency($payer->default_currency,$payer->spendable);
             
      if($payer->shelter_wallet == 1){
          $availableFunds = ($total_wallet + $total_spendable);
      }
      else{
          $availableFunds = $total_spendable;  
      }       
        
      if($payer->shelter_wallet == 1){
          $newWallet_balance = ($availableFunds + ($amount+2));
          $newWallet_balance_reversed = $this->generic_model->reset_currency($newWallet_balance);
          $update_user_data = array(
			'wallet' => $newWallet_balance_reversed,
			'spendable'=>0
			);
		}
      else{
		$newWallet_balance = ($availableFunds + ($amount+2));
        $newWallet_balance_reversed = $this->generic_model->reset_currency($newWallet_balance);
		$update_user_data = array(
            'spendable' => $newWallet_balance_reversed,
        );
      }
                 
        $user_table = 'users';
        $user_condition = array('id' => $upgrader->user_id);
        $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
        
        $amount_reversed = $this->generic_model->reset_currency($amount + 2);
        $transactionWith = array(
            'user_id' => $upgrader->user_id,
            'order_id' =>0,
            'transaction_type' => 'credit',
            'amount' => $amount_reversed,  // Assuming you have the price for each item
            'description' => 'Reversal for withdrawal of '.$amount.' USD to crypto wallet',  // Add a relevant description
            'status' => 'Successful'
        );
        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                         
      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'crypto_withdrawal' );
	  //send debit email
            $to = $payer->email;
            $subject = 'Crypto Withdrawal Rejected!';
            $title = 'Dear  ' . $payer->firstname;
            $message = 'This is to notify you that your Crypto Withdrawal Request was rejected.
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
      $this->session->set_flashdata( 'success', 'User Request Deleted Successfully' );
      redirect( 'top_up_request' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function approve_crypto( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $upgrader = $this->generic_model->getInfo( 'crypto_withdrawal', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $userid = $upgrader->user_id;
      $user_table = 'users';
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $oldSpendable = $user->spendable;
      $payment_data = array(
        'status' => 1,
      );
      $payment_condition = array( 'id' => $id );
      $this->generic_model->update_data( 'crypto_withdrawal', $payment_data, $payment_condition );
        
      $amount = $upgrader->amount;
        
      $update_withdrawal_data = array(
          'status' => 'Successful',
      );
      $withdrawal_table = 'withdrawal_history';
      $withdrawal_condition = array('amount' => $amount,'user_id'=>$upgrader->user_id);
      $this->generic_model->update_data($withdrawal_table, $update_withdrawal_data, $withdrawal_condition);
            
            //send email to user
            $this->email->from('notifications@beepagro.com', 'BeepAgro Palliative');
            $this->email->to($user->email);
            $this->email->subject('BeepAgro Crypto Withdrawal');
            $this->email->message("Your Withdrawal was successful,");
            $this->email->send();
		
      $this->session->set_flashdata( 'success', 'Approval Completed Successfully' );
      redirect( 'top_up_request' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function approve_merc_payment( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $upgrader = $this->generic_model->getInfo( 'merch_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $store = $this->generic_model->getInfo( 'merchants', 'user_id', $upgrader->user_id );
      $userid = $upgrader->user_id;
      $user_table = 'users';
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $payment_data = array(
        'status' => 1,
      );
      $payment_condition = array( 'id' => $id );
      $this->generic_model->update_data( 'merch_payments', $payment_data, $payment_condition );

      $method = 'Bank Payment';
      $date = date( 'Y-m-d H:i:s' );
      $datetime = date( 'Y-m-d H:i:s' );
      $finalDeposit = $upgrader->amount;
      $percentage = 7.5 / 100; // Converting percentage to decimal
      $vat = $finalDeposit * $percentage;

      //add the vat data
      $vat_data = array(
        'user_id' => $upgrader->user_id,
        'amount' => $finalDeposit,
        'activity' => 'Pickup Center Activation Fee',
        'vat' => $vat,
        'date' => date( 'Y-m-d H:i:s' )
      );
      $this->generic_model->insert_data( 'vat_data', $vat_data );

      $merchshare = $this->generic_model->getInfo( 'pickup_reg_fee', 'id', 1 );
      $share_allocation_revenue = ( $merchshare->amount - $merchshare->referrer_percent );
      $update_user_data = array(
        'status' => 'active',
      );
      $user_condition = array( 'user_id' => $upgrader->user_id );
      $user_rows_affected = $this->generic_model->update_data( 'merchants', $update_user_data, $user_condition );
      //save transaction history BMT.........
      $transactionBMT = array(
        'user_id' => $upgrader->user_id,
        'order_id' => 0,
        'transaction_type' => 'payment',
        'amount' => $finalDeposit,
        'description' => 'Pickup Center Activation Fee',
        'status' => 'Successful'
      );
      $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionBMT );
      //remittance share
      $revenue_data = array( 'user_id' => $upgrader->user_id, 'amount' => $share_allocation_revenue, 'date' => date( 'Y-m-d H:i:s' ) );
      $this->generic_model->insert_data( 'revenue', $revenue_data );
      //referrer...
      $referrer = $this->generic_model->getInfo( 'referrals', 'user_id', $upgrader->user_id )->referred_by;
      $referrer_info = $this->generic_model->getInfo( 'users', 'id', $referrer );
      $oldwallet = $referrer_info->wallet;
      $newwallet = ( $merchshare->referrer_percent + $oldwallet );
      $this->generic_model->update_data( 'users', array( 'wallet' => $newwallet ), array( 'id' => $referrer ) );

      $transactionREf = array(
        'user_id' => $referrer_info->id,
        'order_id' => 0,
        'transaction_type' => 'credit',
        'amount' => $merchshare->referrer_percent,
        'description' => 'Pickup Center Activation Earnings',
        'status' => 'Successful'
      );
      $trans_send_ref = $this->generic_model->insert_data( 'transaction_history', $transactionREf );

      ///send ref earnings message.......
      $ref_to = $referrer_info->email;
      $ref_subject = 'BPI Credit Alert!';
      $ref_title = 'Dear  ' . $referrer_info->firstname;
      $ref_message = 'This is to notify you that a credit transaction occured on your BPI Cash Wallet.<br>Cash Earning for the Activation of ' . $store->merchant_name . '  Pickup Center.
		   <br>
		   <br>Transaction Details:<br>
		   Amount: NGN(' . number_format( $merchshare->referrer_percent, 2 ) . ')<br>
		   Wallet Credited: Cash Wallet<br><br>
			If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
			<br>
			<br>
			Thank you for your attention to this notification.
			<br>
			<br>
			Best regards,
			<br>
			BeepAgro Palliative Initiative (BPI) Team.</p>';
      $this->sendemail( $ref_title, $ref_to, $ref_subject, $ref_message );


      ///send message.......
      $to = $payer->email;
      $subject = 'Pickup Center Application Update';
      $title = 'Dear  ' . $payer->firstname;
      $message = 'This is to notify you that your BPI Pickup Center application Activation for ' . $store->merchant_name . '  has been confirmed and your Pickup Center Approved. Your Pickup Center is now active.
		   <br>
			If you have any questions or need assistance, please feel free to contact our support team at [support@beepagro.com].
			<br>
			<br>
			Thank you for your attention to this notification.
			<br>
			<br>
			Best regards,
			<br>
			BeepAgro Palliative Initiative (BPI) Team.</p>';
      $this->sendemail( $title, $to, $subject, $message );

      $this->session->set_flashdata( 'success', 'Confirmation Completed Successfully' );
      redirect( 'pickup_details/' . $store->id );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function reject_merc_payment( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'merch_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $store = $this->generic_model->getInfo( 'merchants', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      //start resetting the data, first the user table
      $user_data = array(
        'status' => 'approved'
      );
      $condition = array( 'user_id' => $upgrader->user_id );
      $this->generic_model->update_data( 'merchants', $user_data, $condition );

      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'merch_payments' );

      $this->session->set_flashdata( 'success', 'Payment Rejected' );
      redirect( 'pickup_details/' . $store->id );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function approve_upgrade( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'upgrade_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $shelter = $this->generic_model->getInfo( 'active_shelters', 'user_id', $upgrader->user_id );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $ref_tree = $this->generic_model->getInfo( 'referrals', 'user_id', $upgrader->user_id );
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

      //get the amount so we can know what package they are upgrading to
      $package_amount = $upgrader->amount;
      //now we get the package info
      $package_id = $this->generic_model->getInfo( 'upgrade_shelter_palliative_types', 'amount', $upgrader->amount )->package_id;
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
        $condition = array( 'id' => $upgrader->user_id );
        $this->generic_model->update_data( 'users', $user_data, $condition );
      } else {
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
        $condition = array( 'id' => $upgrader->user_id );
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
				$u_condition = array( 'id' => $upgrader->user_id );
				$this->generic_model->update_data( 'users', $user_data, $u_condition );
			  }

      //delete the payment receipt entry
      $this->db->where( 'id', $id );
      $this->db->delete( 'upgrade_payments' );

      //return the shelter to active	
      $shelter_data = array(
        'status' => 'active',
        'starter_pack' => $starter,
		'amount' => $upgrader->amount
      );

      $shelter_condition = array( 'user_id' => $upgrader->user_id );
      $this->generic_model->update_data( 'active_shelters', $shelter_data, $shelter_condition );

      $this->session->set_flashdata( 'success', 'Upgrade Completed Successfully' );
      redirect( 'admin_bpi_upgrade' );

    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }

  public function approve_payment( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $upgrader = $this->generic_model->getInfo( 'payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $userid = $upgrader->user_id;
      $user_table = 'users';
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $oldSpendable = $user->spendable;
      $payment_data = array(
        'status' => 1,
      );
      $payment_condition = array( 'id' => $id );
      $this->generic_model->update_data( 'payments', $payment_data, $payment_condition );

      if ( $user->is_part_pay == 1 ) {
        $userOrder = $this->generic_model->getInfoCondition( 'orders', 'user_id', $userid, array( 'status' => 'pending' ) );
        $method = 'Bank Transfer';
        $date = date( 'Y-m-d H:i:s' );
        $datetime = date( 'Y-m-d H:i:s' );
        $finalDeposit = $userOrder->amount;

        $depositInfo = array(
          'userId' => $userid,
          'txnCode' => 'BA-BT-345' . $userOrder->id,
          'amount' => $userOrder->amount,
          'paymentMethod' => $method,
          'createdDtm' => $datetime
        );
        $this->generic_model->insert_data( 'deposits', $depositInfo );

        if ( $user->first_pay == 0 && $user->second_pay == 0 && $user->third_pay == 0 ) {
          //first payment
          $update_user_data = array(
            'pending_activation' => 1,
            'first_pay' => 1
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );

          //update the order table
          $order_table = 'orders';
          $update_order_data = array(
            'status' => 'first installment'
            // Add more columns and values as needed
          );
          $order_condition = array( 'id' => $userOrder->id );
          $user_rows_affected = $this->generic_model->update_data( $order_table, $update_order_data, $order_condition );
        } elseif ( $user->first_pay == 1 && $user->second_pay == 0 && $user->third_pay == 0 ) {

          //second payment
          $update_user_data = array(
            'second_pay' => 1
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );

          //update the order table
          $order_table = 'orders';
          //get previous order balance
          $paid = $this->generic_model->getInfo( $order_table, 'id', $userOrder->id );
          $prev_balance = $paid->amount;
          $new_balance = ( $prev_balance + $userOrder->amount );

          $update_order_data = array(
            'status' => 'Second installment',
            'amount' => $new_balance
          );
          $order_condition = array( 'id' => $userOrder->id );
          $user_rows_affected = $this->generic_model->update_data( $order_table, $update_order_data, $order_condition );


        }
        elseif ( $user->first_pay == 1 && $user->second_pay == 1 && $user->third_pay == 0 ) {
          //last payment

          $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
          $share_allocation = $this->generic_model->getInfo( 'financial_data', 'id', 1 );
          $share_allocation_bmt = $share_allocation->bmt;
          $share_allocation_sug = $share_allocation->sug;
          $share_allocation_funding = $share_allocation->palliative_funds;
          $share_allocation_revenue = $share_allocation->revenue;
          //start bmt share
          $bmtConvert = number_format( ( $share_allocation_bmt / $bmt_price ), 8 );
          $oldBMT = $user->token;
          $newBMT = number_format( ( $bmtConvert + $oldBMT ), 8 );

          $update_user_data = array(
            'pending_activation' => 0,
            'third_pay' => 1,
            'activated' => 1,
            'is_part_pay' => 0,
            'token' => $newBMT
          );

          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );
          $transactionBMT = array(
            'user_id' => $userid,
            'order_id' => $id,
            'transaction_type' => 'credit',
            'amount' => $newBMT, // Assuming you have the price for each item
            'description' => 'Palliative activation BPT Bonus', // Add a relevant description
            'status' => 'Successful'
          );

          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionBMT );
          //remittance share
          $revenue_data = array( 'user_id' => $userid, 'amount' => $share_allocation_revenue, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'revenue', $revenue_data );
          //sug remittance
          $sug_data = array( 'user_id' => $userid, 'sug_id' => 1, 'amount' => $share_allocation_sug, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'sug', $sug_data );
          //palliative funds remittance
          $palliative_data = array( 'user_id' => $userid, 'amount' => $share_allocation_funding, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'palliative_funds', $palliative_data );
          //update the order table
          $order_table = 'orders';
          //get previous order balance
          $paid = $this->generic_model->getInfo( $order_table, 'id', $userOrder->id );
          $new_balance = $this->generic_model->select_by_id( 'market_prices', 1 )->palliative_price;
          $update_order_data = array(
            'status' => 'Paid',
            'amount' => $new_balance
          );
          $order_condition = array( 'user_id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( $order_table, $update_order_data, $order_condition );
          //insert activation countdown.
          $activated_entry = array(
            'user_id' => $userid,
            'activated_date' => date( 'Y-m-d H:i:s' ),
            'end_date' => date( 'Y-m-d H:i:s', strtotime( date( 'Y-m-d H:i:s' ) . ' +30 days' ) )
          );
          $this->v->insert_data( 'activation_countdown', $activated_entry );
        }


      } 
      else {
        //it is not part pay so we want to check if this payment is for vip package
        if ( $user->vip_pending ) {
          //get the amount of the payment
          $payment_amount = $this->generic_model->getInfo( 'payments', 'id', $id )->amount;
          //get package via amount
          $package = $this->generic_model->getInfo( 'packages', 'package_price', $payment_amount );
          $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
          $vip_commissions = $this->generic_model->getInfo( 'commissions_palliative', 'package_id', $package->id );
          $direct = $vip_commissions->Direct;
          $level_1 = $vip_commissions->level_1;
          $level_2 = $vip_commissions->level_2;
          $level_3 = $vip_commissions->level_3;

          //cashback commissions
          $vip_commissions_wallet = $this->generic_model->getInfo( 'commissions_wallet', 'package_id', $package->id );
          $direct_wallet = $vip_commissions_wallet->Direct;
          $level_1_wallet = $vip_commissions_wallet->level_1;
          $level_2_wallet = $vip_commissions_wallet->level_2;
          $level_3_wallet = $vip_commissions_wallet->level_3;

          //bmt commissions
          $vip_commissions_bmt = $this->generic_model->getInfo( 'commissions_bmt', 'package_id', $package->id );
          $direct_bmt = $vip_commissions_bmt->Direct;
          $level_1_bmt = $vip_commissions_bmt->level_1;
          $level_2_bmt = $vip_commissions_bmt->level_2;
          $level_3_bmt = $vip_commissions_bmt->level_3;

          //shelter_commissions
          $vip_commissions_shelter = $this->generic_model->getInfo( 'commissions_shelter', 'package_id', $package->id );
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
          $this->convertBMT( $package->id, $direct_bmt, $bmt_price, $direct_ref, $direct_wallet, $direct );
          $this->convertBMT( $package->id, $level_1_bmt, $bmt_price, $lev1, $level_1_wallet, $level_1 );
          $this->convertBMT( $package->id, $level_2_bmt, $bmt_price, $lev2, $level_2_wallet, $level_2 );
          $this->convertBMT( $package->id, $level_3_bmt, $bmt_price, $lev3, $level_3_wallet, $level_3 );


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


          $spendable_commissions = $this->generic_model->getInfo( 'commissions_spendable', 'package_id', $package->id );
          $spend_direct = $spendable_commissions->Direct;
          $spend_level_1 = $spendable_commissions->level_1;
          $spend_level_2 = $spendable_commissions->level_2;
          $spend_level_3 = $spendable_commissions->level_3;
          //pay spendable

          $this->paySpendable( $spend_direct, $direct_ref, $package->id );
          $this->paySpendable( $spend_level_1, $lev1, $package->id );
          $this->paySpendable( $spend_level_2, $lev2, $package->id );
          $this->paySpendable( $spend_level_3, $lev3, $package->id );

          //update the active shelter to active
          $shelterData = array( 'status' => 'active', 'activated_date' => date( 'Y-m-d H:i:s' ) );
          $shelter_condition = array( 'user_id' => $userid );
          $this->generic_model->update_data( 'active_shelters', $shelterData, $shelter_condition );
          $update_user_data = array(
            'vip_pending' => 0,
            'is_vip' => 1,
            'shelter_pending' => 0,
            'is_shelter' => 1
          );
          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
          
          //check if this user has a pending qwik_data....................
            $qwik_data = $this->generic_model->getInfo('qwik_data','user_id',$userid);
            if($qwik_data){
                //change to confirmed
                $update_qwik = array('status'=>'confirmed');
                $this->generic_model->update_data( 'qwik_data', $update_qwik, array('user_id'=>$userid) );
            }
            
            $to = 'richardobroh@gmail.com';
            $subject = 'QwikRide Driver Activation (From BPI)!';
            $title = 'Hello Admin';
            $message = 'This is to notify you A driver account has been activated via BPI.
						<br>
						<br>
						<strong>Transaction Details</strong>:
						<br>
						<ul>
							<li>Transaction Date and Time: [' . date( "Y-m-d H:i:s" ) . ']</li>
							<li>Amount: [NGN10,000.00]</li>
							<li>Description: [QwikRide Affiliate Hub Activation]</li>
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

            
          //set the wallet activation as well for other package
          if ( $package->id == 4 || $package->id == 6 ) {
            $user_data = array(
              'shelter_wallet' => 1
            );
            $u_condition = array( 'id' => $userid );
            $this->generic_model->update_data( 'users', $user_data, $u_condition );
          }
          if($package->id == 7 ){
              //credit the user start off bonus.......................
              $newSpendable = ($oldSpendable + 3000);
              $spendData = array('spendable'=>$newSpendable);
              $this->generic_model->update_data('users',$spendData,array('id'=>$userid));
              
               //save transaction history .........
            $transactionWelcome = array(
              'user_id' => $userid,
              'order_id' => 0,
              'transaction_type' => 'credit',
              'amount' => 3000, // Assuming you have the price for each item
              'description' => 'Welcome Bonus!!', // Add a relevant description
              'status' => 'Successful'
            );
            $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionWelcome );
            
            //insert bonus record
            $bonus_data = array(
                'user_id'=>$userid,
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

        } else {

          $userOrder = $this->generic_model->getInfoCondition( 'orders', 'user_id', $userid, array( 'status' => 'pending' ) );
          //Variables
          $method = 'Bank Transfer';
          $date = date( 'Y-m-d H:i:s' );
          $datetime = date( 'Y-m-d H:i:s' );
          $finalDeposit = $userOrder->amount;

          //Deposit Array
          $depositInfo = array(
            'userId' => $userid,
            'txnCode' => 'BA-BT-345' . $userOrder->id,
            'amount' => $userOrder->amount,
            'paymentMethod' => $method,
            'createdDtm' => $datetime
          );
          $this->generic_model->insert_data( 'deposits', $depositInfo );
          $bmt_price = $this->generic_model->getInfo( 'bmt_price', 'id', 1 )->amount;
          $share_allocation = $this->generic_model->getInfo( 'financial_data', 'id', 1 );
          $share_allocation_bmt = $share_allocation->bmt;
          $share_allocation_sug = $share_allocation->sug;
          $share_allocation_funding = $share_allocation->palliative_funds;
          $share_allocation_revenue = $share_allocation->revenue;

          //start bmt share
          $bmtConvert = number_format( ( $share_allocation_bmt / $bmt_price ), 8 );
          $oldBMT = $user->token;
          $newBMT = number_format( ( $bmtConvert + $oldBMT ), 8 );
          $update_user_data = array(
            'pending_activation' => 0,
            'activated' => 1,
            'token' => $newBMT
          );

          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( $user_table, $update_user_data, $user_condition );

          //save transaction history BMT.........
          $transactionBMT = array(
            'user_id' => $userid,
            'order_id' => $userOrder->id,
            'transaction_type' => 'credit',
            'amount' => $newBMT, // Assuming you have the price for each item
            'description' => 'Palliative activation BPT Bonus', // Add a relevant description
            'status' => 'Successful'
          );
          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionBMT );
          //remittance share
          $revenue_data = array( 'user_id' => $userid, 'amount' => $share_allocation_revenue, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'revenue', $revenue_data );
          //sug remittance
          $sug_data = array( 'user_id' => $userid, 'sug_id' => 1, 'amount' => $share_allocation_sug, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'sug', $sug_data );
          //palliative funds remittance
          $palliative_data = array( 'user_id' => $userid, 'amount' => $share_allocation_funding, 'date' => date( 'Y-m-d H:i:s' ) );
          $this->generic_model->insert_data( 'palliative_funds', $palliative_data );
          $order_table = 'orders';
          $update_order_data = array(
            'status' => 'Paid',
          );
          $order_condition = array( 'id' => $userOrder->id );
          $user_rows_affected = $this->generic_model->update_data( $order_table, $update_order_data, $order_condition );
          //insert activation countdown.
          $activated_entry = array(
            'user_id' => $userid,
            'activated_date' => date( 'Y-m-d H:i:s' ),
            'end_date' => date( 'Y-m-d H:i:s', strtotime( date( 'Y-m-d H:i:s' ) . ' +30 days' ) )
          );
          $this->generic_model->insert_data( 'activation_countdown', $activated_entry );
        }

      }
      $this->session->set_flashdata( 'success', 'Approval Completed Successfully' );
      redirect( 'admin_bpi_upgrade' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function approve_student( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $upgrader = $this->generic_model->getInfo( 'student_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $userid = $upgrader->user_id;
      $user_table = 'users';
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $oldSpendable = $user->spendable;
      $payment_data = array(
        'status' => 1,
      );
      $payment_condition = array( 'id' => $id );
      $this->generic_model->update_data( 'student_payments', $payment_data, $payment_condition );
        
        $share_allocation = $this->generic_model->getInfo( 'financial_data', 'id', 1 );
        $share_allocation_bmt = $share_allocation->bmt;
        $share_allocation_sug = $share_allocation->sug;
        $share_allocation_funding = $share_allocation->palliative_funds;
        $share_allocation_revenue = $share_allocation->revenue;
        
      //activate the student for palliative
        $student_array = array(
            'activated'=>1,
            'pending_activation'=>0
        );
        $student_condition = array( 'id' => $userid );
        $this->generic_model->update_data( 'users', $student_array, $student_condition );
        
        //share the revenues and voucher.................................
        $student_revenue = array(
            'user_id'=>$userid,
            'amount'=> $share_allocation_revenue,
            'payment_date'=>date( 'Y-m-d H:i:s' )
        );
        $this->generic_model->insert_data('student_revenue',$student_revenue);
        
        //school id to determine SUG ID
        $school_id = $this->generic_model->getInfo('student_data','user_id',$userid);
        
        $newCashback = $share_allocation->palliative_funds;

          $update_user_data = array(
            'student_cashback' => $newCashback
          );

          $user_condition = array( 'id' => $userid );
          $user_rows_affected = $this->generic_model->update_data( 'users', $update_user_data, $user_condition );
          $transactionBMT = array(
            'user_id' => $userid,
            'order_id' => $school_id->id,
            'transaction_type' => 'credit',
            'amount' => $share_allocation->palliative_funds, 
            'description' => 'Student Palliative Starter Packs', 
            'status' => 'Successful'
          );

          $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionBMT );
        
        $sug_data = array(
            'user_id' => $userid, 
            'sug_id' => $school_id->id, 
            'amount' => $share_allocation_sug, 
            'date' => date('Y-m-d H:i:s'));
        $this->generic_model->insert_data( 'sug', $sug_data );   
        
        //referral bonus
        $referrers = $this->generic_model->getInfo('referrals','user_id',$userid);
        $ref_payout = $this->generic_model->getInfo('student_bonus_data','id',1);
        
        //payouts
        $direct = $this->generic_model->getInfo('users','id',$referrers->referred_by);
        $level_2 = $this->generic_model->getInfo('users','id',$referrers->level_1);
        
        $old_direct_cashback = $direct->cashback;
        $new_direct_cashback = ($ref_payout->level_1_cashback + $old_direct_cashback);
        $this->generic_model->update_data( 'users', array('cashback' => $new_direct_cashback), array( 'id' => $direct->id ) );
        $transactionDirect = array(
            'user_id' => $direct->id,
            'order_id' => $direct->id,
            'transaction_type' => 'credit',
            'amount' => $ref_payout->level_1, 
            'description' => 'Student Palliative Referral Bonus', 
            'status' => 'Successful'
          );
          $trans_send_direct = $this->generic_model->insert_data( 'transaction_history', $transactionDirect );
        
        //level 1
        $old_level_2_cashback = $level_2->cashback;
        $new_level_2_cashback = ($ref_payout->level_2_cashback + $old_level_2_cashback);
        $this->generic_model->update_data( 'users', array('cashback' => $new_level_2_cashback), array( 'id' => $level_2->id ) );
        $transactionlevel_2 = array(
            'user_id' => $level_2->id,
            'order_id' => $level_2->id,
            'transaction_type' => 'credit',
            'amount' => $ref_payout->level_2, 
            'description' => 'Level Student Palliative Referral Bonus', 
            'status' => 'Successful'
          );
          $trans_send_level_2 = $this->generic_model->insert_data( 'transaction_history', $transactionlevel_2 );
        
        $old_direct_spendable = $direct->spendable;
        $new_direct_spendable = ($ref_payout->level_1_spendable + $old_direct_spendable);
        $this->generic_model->update_data( 'users', array('spendable' => $new_direct_spendable), array( 'id' => $direct->id ) );
        $transactionDirect_level_1_spendable = array(
            'user_id' => $direct->id,
            'order_id' => $direct->id,
            'transaction_type' => 'credit',
            'amount' => $ref_payout->level_1_spendable, 
            'description' => 'Student Palliative Referral Bonus', 
            'status' => 'Successful'
          );
        $this->generic_model->insert_data( 'transaction_history', $transactionDirect_level_1_spendable );
        
        //level 1
        $old_level_2_spendable = $level_2->spendable;
        $new_level_2_spendable = ($ref_payout->level_2_spendable + $old_level_2_spendable);
        $this->generic_model->update_data( 'users', array('spendable' => $new_level_2_spendable), array( 'id' => $level_2->id ) );
        $transactionlevel_2_level_2_spendable = array(
            'user_id' => $level_2->id,
            'order_id' => $level_2->id,
            'transaction_type' => 'credit',
            'amount' => $ref_payout->level_2_spendable, 
            'description' => 'Level Student Palliative Referral Bonus', 
            'status' => 'Successful'
          );
         $this->generic_model->insert_data('transaction_history', $transactionlevel_2_level_2_spendable);
                
        $this->session->set_flashdata( 'success', 'Approval Completed Successfully' );
        redirect( 'admin_student' );
        } else {
        redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function reject_student( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $upgrader = $this->generic_model->getInfo( 'student_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      //start resetting the data, first the user table

      //delete the payment receipt entry
      $this->db->where('id', $id);
      $this->db->delete('student_payments');

      $update_user_data = array(
        'pending_activation' => 0,
      );
      $user_condition = array('id' => $upgrader->user_id);
      $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);

      //delete the active shelter
      $this->db->where( 'user_id', $upgrader->user_id );
      $this->db->delete( 'student_data' );
        
     $recipient = $this->generic_model->getInfo('users','id',$upgrader->user_id);
      //send email to student....
    $to_user = $recipient->email;
        $subject_user = 'BPI Student Palliative';
		     $title_user = 'Hello ' . $recipient->firstname;
		     $message_user = nl2br(htmlspecialchars('Your Student Palliative Registration was rejected, we have reasons to believe your submission did not meet our conditions. If you feel we have made this decision in error, kindly reach out to customer support for further assistance.
             
             If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
			                Our support team is here to help you with any concerns you may have.<br>
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.<br><br>
			                Best regards,<br>
			                BeepAgro Palliative Initiative (BPI) Team.')); 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user );      
          

      $this->session->set_flashdata( 'success', 'Student Subscription Request Denied Successfully' );
      redirect( 'admin_student' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
    
  public function students_palliative(){
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'requests' ] = $this->generic_model->select_where( 'student_payments', array( 'status' => 0 ) );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/students', $data );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
  public function approve_topup( $id ) {
    if ( $this->session->userdata( 'user_id' ) ) {
      $upgrader = $this->generic_model->getInfo( 'wallet_payments', 'id', $id );
      $payer = $this->generic_model->getInfo( 'users', 'id', $upgrader->user_id );
      $userid = $upgrader->user_id;
      $user_table = 'users';
      $user = $this->generic_model->getInfo( $user_table, 'id', $userid );
      $oldSpendable = $user->spendable;
      $payment_data = array(
        'status' => 1,
      );
      $payment_condition = array( 'id' => $id );
      $this->generic_model->update_data( 'wallet_payments', $payment_data, $payment_condition );
	  
		$funding_id = $upgrader->funding_id;

      //credit wallet and add to transaction list
			$amount = $this->generic_model->getInfo('funding_history','id',$funding_id)->amount;
			$old_wallet = $user->wallet;
			$new_wallet = ($old_wallet + $amount);
			
			$update_user_data = array(
              'wallet' => $new_wallet,
            );
            $user_condition = array('id' => $userid);  
            $user_rows_affected = $this->generic_model->update_data('users', $update_user_data, $user_condition);
                    
            $transactionWallet = array(
              'user_id' => $userid,
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
            $this->email->to($user->email);
            $this->email->subject('BeepAgro Wallet Funding');
            $this->email->message("Your Wallet Funding was successful,");
            $this->email->send();
		
      $this->session->set_flashdata( 'success', 'Approval Completed Successfully' );
      redirect( 'top_up_request' );
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

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
              'amount' => 100000, // Assuming you have the price for each item
              'description' => 'Silver Shelter Wallet activation', // Add a relevant description
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
              'amount' => $palliavtive, // Assuming you have the price for each item
              'description' => 'Pallative Reward', // Add a relevant description
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
            'amount' => $palliavtive, // Assuming you have the price for each item
            'description' => 'Pallative Reward', // Add a relevant description
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
              'amount' => 200000, // Assuming you have the price for each item
              'description' => 'Gold Shelter Wallet activation', // Add a relevant description
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
              'amount' => $palliavtive, // Assuming you have the price for each item
              'description' => 'Pallative Reward', // Add a relevant description
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
            'amount' => $palliavtive, // Assuming you have the price for each item
            'description' => 'Pallative Reward', // Add a relevant description
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
        'amount' => $palliavtive, // Assuming you have the price for each item
        'description' => 'BPI Palliative Reward', // Add a relevant description
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
      'amount' => $bmtConvert, // Assuming you have the price for each item
      'description' => 'BPI pallative BPT Reward', // Add a relevant description
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
      'amount' => $cashback, // Assuming you have the price for each item
      'description' => 'BPI Pallative Cashback Reward', // Add a relevant description
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
      'amount' => $palliavtive, // Assuming you have the price for each item
      'description' => 'BPI Palliative Reward', // Add a relevant description
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
      'amount' => $bmtConvert, // Assuming you have the price for each item
      'description' => 'BPI pallative BPT Reward', // Add a relevant description
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
      'amount' => $cashback, // Assuming you have the price for each item
      'description' => 'BPI Pallative Cashback Reward', // Add a relevant description
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
          $wallet = 'education';
        } elseif ( $package_option == 7 ) {
          $wallet = 'car';
        } elseif ( $package_option == 8 ) {
          $wallet = 'land';
        } elseif ( $package_option == 9 ) {
          $wallet = 'business';
        } elseif ( $package_option == 10 ) {
          $wallet = 'solar';
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
            'amount' => $amount, // Assuming you have the price for each item
            'description' => 'Silver Shelter Pallative Reward', // Add a relevant description
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
                     'amount' => $amount,  // Assuming you have the price for each item
                     'description' => 'Silver Shelter Pallative Reward',  // Add a relevant description
                     'status' => 'Successful'
                 );
                 $trans_send = $this->generic_model->insert_data('transaction_history', $transactionDataShelter);
             }
         } **/
      } 
	  else {
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
        } elseif ( $package_option == 10 ) {
          $wallet = 'solar';
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
            'amount' => $amount, // Assuming you have the price for each item
            'description' => 'Gold Shelter Pallative Reward', // Add a relevant description
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
    }
	  
	else {
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
        'amount' => $amount, // Assuming you have the price for each item
        'description' => 'BPI Spendable Cash Reward', // Add a relevant description
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
          'amount' => $amount, // Assuming you have the price for each item
          'description' => 'BPI Spendable Cash Reward', // Add a relevant description
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
          'amount' => $spendable_half, // Assuming you have the price for each item
          'description' => 'BPI Spendable Cash Reward', // Add a relevant description
          'status' => 'Successful'
        );

        $trans_send = $this->generic_model->insert_data( 'transaction_history', $transactionDataspendable );

        $transactionDatapall = array(
          'user_id' => $userid,
          'order_id' => 2,
          'transaction_type' => 'credit',
          'amount' => $spendable_half, // Assuming you have the price for each item
          'description' => 'BPI Palliative Reward', // Add a relevant description
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

  public function verifyAll() {
    $this->generic_model->update_data( 'users', array( 'verified' => 1 ), array( 'verified' => 0 ) );
    $this->session->set_flashdata( 'success', 'All unverified emails have been marked verified.' );
    redirect( 'admin' );
  }

  public function notification() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
      $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
      $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
      $data[ 'admin_notification' ] = $this->generic_model->select_all_data( 'notifications' );
      $data[ 'blogs' ] = $this->generic_model->select_all_data( 'tbl_blog' );
	  $data['news'] = $this->generic_model->select_all_data('tbl_newsletter');
      $data[ 'user_details' ] = $user_details;
      $this->load->view( 'admin/notification', $data );
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

}