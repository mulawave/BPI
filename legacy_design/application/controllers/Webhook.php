<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Webhook extends CI_Controller {
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
    
    public function handleWebhook() {
        $secretHash = $this->config->item('flutterwave_secret_hash'); 
        $signature = $this->input->get_request_header('verif-hash');
        if (!$signature || ($signature !== $secretHash)) {
            show_error('Unauthorized', 401);
        }
        
        // Get the payload
        $payload = $this->input->post(NULL, TRUE); // TRUE parameter to sanitize input
        
        // It's a good idea to log all received events.
        log_message('info', json_encode($payload));
        
        // Do something (that doesn't take too long) with the payload
        
        // Send response
        $this->output
            ->set_status_header(200)
            ->set_content_type('application/json')
            ->set_output(json_encode(['message' => 'Webhook received successfully']));
    }
}
