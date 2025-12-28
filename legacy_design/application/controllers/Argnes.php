<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Argnes  extends CI_Controller {

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
  }
	
	
  public function index() {
    if ( $this->session->userdata( 'user_id' ) ) {
      $userid = $this->session->userdata( 'user_id' );
      $this->reset_session();
      $user_details = $this->session->userdata( 'user_details' );
        $data[ 'unread_count' ] = $this->generic_model->get_unread_count( $userid );
        $data[ 'notifications' ] = $this->generic_model->get_unread_notifications( $userid );
        $data[ 'user_details' ] = $user_details;
        $this->load->view( 'argnes/index', $data );
      } else {
      redirect( 'login' ); // Redirect to login if not logged in
    }

  }
	
}