<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Blog extends CI_Controller {

  public function __construct() 
  {
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
	
	 public function addComment() { 
	   if ( $this->session->userdata( 'user_id' ) ) {
			  $userid = $this->session->userdata( 'user_id' );
		   	  $id = $this->input->post('blog_id');
			  $this->reset_session();
			  $user_details = $this->session->userdata( 'user_details' );
			  $this->form_validation->set_rules( 'comment', 'Comment', 'required' );
			  if ( $this->form_validation->run() === FALSE ) {
				  $this->session->set_flashdata('error', validation_errors());
				redirect('blogs_details/'.$id );
			  } else {
				$data = array(
				  'blog_id' => $id,
				  'commenter' => $userid,
				  'comment' => $this->input->post('comment'),
				  'date_added'=> date('Y-m-d H:i:s')
				);
				$this->generic_model->add_comment( $data );
				$this->session->set_flashdata( 'success', 'You have successfully added a comment' );
				redirect('blogs_details/'.$id );
			  }
		} else {
		  	redirect( 'login' ); // Redirect to login if not logged in
		}
    }
	
	
	public function posts(){
	  if ($this->session->userdata('user_id')){
		  $userid = $this->session->userdata('user_id');
		  $this->reset_session();
		  $user_details = $this->session->userdata('user_details');
		  $data['unread_count'] = $this->generic_model->get_unread_count($userid);
		  $data['notifications'] = $this->generic_model->get_notifications($userid);
		  $data['admin_notification'] = $this->generic_model->select_all_data('notifications');
		  $data['blogs'] = $this->generic_model->select_all_data('tbl_blog');
		  $data['user_details'] = $user_details;
		  $data['recent_notifications'] = $this->generic_model->get_notification_limit();
		  $this->load->view('blog',$data);
		} else {
		  redirect( 'login' ); // Redirect to login if not logged in
		}  
	}
	
	public function blog_detail($id){
		 if ( $this->session->userdata( 'user_id' ) ) {
		  $userid = $this->session->userdata( 'user_id' );
		  $this->reset_session();
		  $user_details = $this->session->userdata( 'user_details' );$data['unread_count'] = $this->generic_model->get_unread_count($userid);
$data['notifications'] = $this->generic_model->get_unread_notifications($userid);
		  $data['admin_notification'] = $this->generic_model->select_all_data('notifications');
		  $data['blogs'] = $this->generic_model->select_all_data('tbl_blog');
		  $data[ 'user_details' ] = $user_details;
		  $data['details'] = $this->generic_model->getInfo('tbl_blog','id',$id);
		  $data['comments'] = $this->generic_model->select_where('blog_comments',array('blog_id'=>$id));
		  $data['recent_notifications'] = $this->generic_model->get_notification_limit();
		  $this->generic_model->increment_views($id);
		  $this->load->view('blog_details',$data);
		} else {
		  redirect( 'login' ); // Redirect to login if not logged in
		}  
	}
	
	public function reset_session() 
	  {
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