<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Community extends CI_Controller {

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
    $this->load->helper('time_helper'); 

  }
    
    public function index(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $pending_application = $this->generic_model->getInfo('ict_tickets','user_id',$userid);
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $this->load->view( 'community', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
    public function create_new_post(){
     $this->load->library( 'form_validation' );
     $this->form_validation->set_rules( 'category', 'Category', 'required' );
     $this->form_validation->set_rules( 'title', 'Title', 'required' );
     $this->form_validation->set_rules( 'body', 'Post Body', 'required' );
     //$this->form_validation->set_rules( 'image', 'Image', 'required' );
     if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect( 'community' );
    } else {
      $category = $this->input->post('category', TRUE);
      $title = $this->input->post('title', TRUE); 
      $amount = $this->input->post('amount', TRUE);
      $body = $this->input->post('body', TRUE);
      $config[ 'upload_path' ] = './receipts/';
      $config[ 'allowed_types' ] = 'jpg|png|jpeg|pdf';
      $config[ 'max_size' ] = 5000960; // 5gb max size (that is going to be one very delayed loading..... marked for optimization)
      $config[ 'encrypt_name' ] = true; // Encrypt file name for uniqueness
      $userId = $this->session->userdata( 'user_id' );
      $recipient = $this->generic_model->getInfo('users','id',$userId);
      $this->load->library( 'upload', $config );
      $this->upload->do_upload('image');
          $upload_data1 = $this->upload->data();
          $file_path1 = 'receipts/' . $upload_data1['file_name'];
          //store information
          $data = array(  	 	 	 	 	 	 	
            'authur'=>$userId,
            'category_id'=>$category,
            'amount'=>$amount,
            'title'=>$title,
            'post'=>$body,
            'image'=>$file_path1,
            'date_created'=>date('Y-m-d H:i:s')
          );
          $this->generic_model->insert_data('community_posts',$data);
          $this->session->set_flashdata( 'success', 'Post submitted successfully' );
          redirect( 'community' );                                                                                                                                                          
    }
    }
    
    public function add_reply(){
     $this->load->library( 'form_validation' );
     $this->form_validation->set_rules( 'post_id', 'Post ID', 'required' );
     $this->form_validation->set_rules( 'category_id', 'Category ID', 'required' );
     $this->form_validation->set_rules( 'reply', 'Post Reply', 'required' );
     $category_id = $this->input->post('category_id', TRUE);
     $post_id = $this->input->post('post_id', TRUE);
     $slug = $this->generic_model->getInfo('community_category','id',$category_id)->slug;
     if ( $this->form_validation->run() == FALSE ) {
      $this->session->set_flashdata( 'error', validation_errors() );
      redirect('post_detail/'.$post_id );
    } else {
      
      $reply = $this->input->post('reply', TRUE);
      $userId = $this->session->userdata( 'user_id' );
      $recipient = $this->generic_model->getInfo('users','id',$userId);
          //store information  	 	 	 	 	
          $data = array(  	 	 	 	 	 	 	
            'post_id'=>$post_id,
            'category_id'=>$category_id,
            'user_id'=>$userId,
            'reply'=>$reply,
            'date_added'=>date('Y-m-d H:i:s')
          );
          $this->generic_model->insert_data('community_post_reply',$data);
          $this->session->set_flashdata( 'success', 'Reply submitted successfully' );
          redirect('post_detail/'.$post_id );                                                                                                                                                      
    }
      
    }
    
    public function post_detail($id){
       if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $user = $this->generic_model->getInfo('users','id',$userid);      
          $post_info = $this->generic_model->getInfo('community_posts','id',$id);
          $slug = $this->generic_model->getInfo('community_category','id',$post_info->category_id)->slug;
          $isPurchased = $this->generic_model->hasPurchasedPost($userid, $id);
          if($isPurchased){
               $this->reset_session();
                  $user_details = $this->session->userdata( 'user_details' );
                  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
                  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
                  $data[ 'user_details' ] = $user_details;
                  $data['post'] = $this->generic_model->getInfo('community_posts','id',$id);
                  $this->generic_model->increment_post_views($id);
                  $this->load->view( 'post_detail', $data );
              }
          else{
              if ($post_info->authur == $userid) { 
                  $this->reset_session();
                  $user_details = $this->session->userdata( 'user_details' );
                  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
                  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
                  $data[ 'user_details' ] = $user_details;
                  $data['post'] = $this->generic_model->getInfo('community_posts','id',$id);
                  $this->generic_model->increment_post_views($id);
                  $this->load->view( 'post_detail', $data );
              }else{
              $amount = $post_info->amount;
              $vat = (7.5*$amount)/100;
              $percentage = (10*$amount)/100;
              $totalDebitAmt = ($amount + $vat + $percentage);
              //does user have enough pay on their cashback wallet to pay this person?
              $availableFunds =  $user->cashback;
              if(bccomp($availableFunds, $totalDebitAmt, 2) == 1){
                   $transactionWith = array(
                            'user_id' => $userid,
                            'order_id' =>$id,
                            'transaction_type' => 'debit',
                            'amount' => $amount,  // Assuming you have the price for each item
                            'description' => 'Community content purchase',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);
                  
                  $transactionVAT = array(
                            'user_id' => $userid,
                            'order_id' =>$id,
                            'transaction_type' => 'debit',
                            'amount' => $vat,  // Assuming you have the price for each item
                            'description' => 'VAT charge for community content purchase',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send1 = $this->generic_model->insert_data('transaction_history', $transactionVAT);
                  
                            $newWallet_balance = ($availableFunds - $totalDebitAmt);
							$update_user_data = array(
								'cashback' => $newWallet_balance,
							);
                        $user_table = 'users';
                        $user_condition = array('id' => $userid);
                        $user_rows_affected = $this->generic_model->update_data($user_table, $update_user_data, $user_condition);
                 
                  $bought = array(
                    'user_id'=>$userid,
                    'post_id'=>$id,
                    'amount'=>$amount,
                    'date_purchased'=>date('Y-m-d H:i:s')
                  );
                  $this->generic_model->insert_data('purchased_posts',$bought);
                  
                  //pay the post owner and remit the rest to the admin
                  $poster = $this->generic_model->getInfo('users','id',$post_info->authur);
                  $payout_amount = $amount;
                  $oldWallet = $poster->wallet;
                  $newWallet = ($oldWallet + $payout_amount);
                  $update_poster_data = array(
								'wallet' => $newWallet,
							);
                  $this->generic_model->update_data('users', $update_poster_data, array('id' => $post_info->authur));
                  $transactionSold = array(
                            'user_id' => $post_info->authur,
                            'order_id' =>$id,
                            'transaction_type' => 'credit',
                            'amount' => $amount,  
                            'description' => 'Community Content Sold', 
                            'status' => 'Successful'
                        );
                        $trans_send11 = $this->generic_model->insert_data('transaction_history', $transactionSold);
                  
                  //remit company fough
                  $remittance = array(
                    'sender'=>$userid,
                    'reciever'=>$post_info->authur,
                    'amount'=>(10*$amount)/100
                  );	
                  $this->generic_model->insert_data('community_post_earnings',$remittance);
                  
                  //send email to student....
             $to_user = $poster->email;
		     $title_user = 'Hello ' . $poster->firstname;
             $subject_user = 'New Sales Made!';
		     $message_user = nl2br(htmlspecialchars('A credit transaction occured on you account from sale of community content.
             
             If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].
			                Our support team is here to help you with any concerns you may have.
			                Thank you for choosing BeepAgro Palliative Initiative (BPI). 
			                Once again, thank you for your support. Together, we are making a real difference in the community we serve.
                            
			                Best regards,
			                BeepAgro Palliative Initiative (BPI) Team.')); 
		     $this->sendemail( $title_user, $to_user, $subject_user, $message_user ); 
                  
                  $this->reset_session();
                  
                  $user_details = $this->session->userdata( 'user_details' );
                  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
                  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
                  $data[ 'user_details' ] = $user_details;
                  $data['post'] = $this->generic_model->getInfo('community_posts','id',$id);
                  $this->generic_model->increment_post_views($id);
                  $this->load->view( 'post_detail', $data );
                  
              }
              else{
                  $this->session->set_flashdata( 'error', 'insufficient Cashback Balance to purchase this content!');
                  redirect($slug);            
              }
              
              }
             
          }
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }   
    }
    
    public function networking(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>1));
          $this->load->view( 'networking', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
      
    public function learning(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>2));
          $this->load->view( 'learning', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
    public function health(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>3));
          $this->load->view( 'health', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
    public function creativity(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>4));
          $this->load->view( 'creativity', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
    public function entertainment(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>5));
          $this->load->view( 'entertainment', $data );
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }  
    }
    
    public function innovation(){
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $data['posts'] = $this->generic_model->select_all('community_posts', array('category_id'=>6));
          $data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['categories'] = $this->generic_model->select_all_data( 'community_category' );
          $this->load->view( 'innovation', $data );
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
?>