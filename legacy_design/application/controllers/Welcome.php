<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Welcome extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->helper('form'); 
        $this->load->library('session'); // Load the Session library
        $this->load->library('form_validation'); 
    }


	public function index()
	{
	    $data['error'] = '';
		$this->load->view('welcome_message',$data);
	}

    
    
}
