<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Tickets extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('ticket_model');
        $this->load->helper('url');
        $this->load->library('session');
		$this->load->model( 'generic_model' );
        $this->load->model( 'user_model' );
		$this->load->library( 'form_validation' );
		$this->load->library( 'session' );
		$this->load->database();
		$this->load->model( 'food_model' );
		$this->load->model( 'generic_model' );
		$this->load->model( 'user_model' );
		$this->load->library( 'pagination' );
		$this->load->model( 'merchant_model' );
    }

    public function index() {
	 if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
	  $userInfo = $this->generic_model->getInfo('users','id',$userid);
	  if($userInfo->user_type == 'admin' || $userInfo->user_type == 'support'){
	  	$data['tickets'] = $this->ticket_model->get_tickets();
	  }else{
		$data['tickets'] = $this->generic_model->select_where('tickets', array('created_by'=>$userid));  
	  }$data['unread_count'] = $this->generic_model->get_unread_count($userid);
	  $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
      $data[ 'user_details' ] = $user_details;
      $this->load->view('tickets/index', $data);
    } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }
        
    }

    public function view($id) {
	  if ( $this->session->userdata( 'user_id' ) ) {
		$userid = $this->session->userdata( 'user_id' );
      	$this->reset_session();
        $user_details = $this->session->userdata( 'user_details' );
		  
		if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $reply_data = array(
                'ticket_id' => $id,
                'user_id' => $this->session->userdata('user_id'),
                'reply' => $this->input->post('reply')
            );
            $this->ticket_model->add_reply($reply_data);
            redirect('tickets/view/' . $id);
        } else {
			$data['ticket'] = $this->ticket_model->get_ticket($id);
			$data['replies'] = $this->ticket_model->get_replies($id);
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
			$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
			$data[ 'user_details' ] = $user_details;
			$this->load->view('tickets/view', $data);
		}
	  } else {
      	redirect( 'login' ); // Redirect to login if not logged in
	  }
    }
	
	

    public function create() {
	  if ( $this->session->userdata( 'user_id' ) ) {
		  $userid = $this->session->userdata( 'user_id' );
      	  $this->reset_session();
		  $user_details = $this->session->userdata( 'user_details' );
		  
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = array(
                'title' => $this->input->post('title'),
                'description' => $this->input->post('description'),
                'status' => 'open',
                'created_by' => $this->session->userdata('user_id'), // Store the creator's ID
                'assigned_to' => $this->input->post('assigned_to') // Store the assigned user's ID
            );
            $this->ticket_model->create_ticket($data);
            redirect('support_tickets');
        } else {
			
		    $data['tickets'] = $this->ticket_model->get_tickets();
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
			$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
		    $data[ 'user_details' ] = $user_details;
            $data['users'] = $this->ticket_model->get_users();
            $this->load->view('tickets/create', $data);
        }
	  } else {
      	redirect( 'login' ); // Redirect to login if not logged in
	  }
    }

    public function edit($id) {
	   if ( $this->session->userdata( 'user_id' ) ) {
		$userid = $this->session->userdata( 'user_id' );
      	$this->reset_session();
        $user_details = $this->session->userdata( 'user_details' );
		   
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = array(
                'title' => $this->input->post('title'),
                'description' => $this->input->post('description'),
                'status' => $this->input->post('status'),
                'assigned_to' => $this->input->post('assigned_to') // Update the assigned user's ID
            );
            $this->ticket_model->update_ticket($id, $data);
            redirect('support_tickets');
        } else {
            $data['ticket'] = $this->ticket_model->get_ticket($id);
            $data['users'] = $this->ticket_model->get_users();
			$data['unread_count'] = $this->generic_model->get_unread_count($userid);
			$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        	$data[ 'user_details' ] = $user_details;
            $this->load->view('tickets/edit', $data);
        }
	 } else {
      	redirect( 'login' ); // Redirect to login if not logged in
	  }
    }

    public function delete($id) {
	   if($this->session->userdata( 'user_id' ) ) {
		$userid = $this->session->userdata( 'user_id' );
      	$this->reset_session();
        $user_details = $this->session->userdata( 'user_details' );
        $this->ticket_model->delete_ticket($id);
        redirect('support_tickets');
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
        //return $msg;
    }
}
