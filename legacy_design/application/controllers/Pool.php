<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Pool extends CI_Controller {
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
        // Add authentication check for admin v3
    }

    public function create() {
        if ($this->input->post()) {
            $data = [
                'name' => $this->input->post('name'),
                'description' => $this->input->post('description'),
                'status' => $this->input->post('status')
            ];
            if ($this->pool_model->create_pool($data)) {
                $this->session->set_flashdata('success', 'Pool created successfully.');
            } else {
                $this->session->set_flashdata('error', 'Failed to create pool.');
            }
            redirect('admin_investment');
        }
        redirect('admin_investment');
    }

    public function list() {
        $data['pools'] = $this->pool_model->get_active_pools();
        $this->load->view('pool_list', $data);
    }
    
    public function manage() {
        $data['pools'] = $this->pool_model->get_all_pools();
        $this->load->view('pool_manage', $data);
    }

    public function view($pool_id) {
        $pool = $this->pool_model->get_pool($pool_id);
        if (!$pool) {
            show_404();
        }
        $data['pool'] = $pool;
        $data['contributions'] = $this->pool_model->get_pool_contributions($pool_id);
        $this->load->view('pool_view', $data);
    }
    
}