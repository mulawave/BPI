<?php
defined( 'BASEPATH' )OR exit( 'No direct script access allowed' );

class Invest extends CI_Controller {
    public function __construct() {
        parent::__construct();
        $this->load->model(['pool_model', 'contribution_model']);
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

    public function contribute() {
        $pool_id = $this->input->post('pool');
        $pool = $this->pool_model->get_pool($pool_id);
        if (!$pool || $pool['status'] != 'active') {
            $this->session->set_flashdata('error', 'Invalid Pool Id, create pool to use pool id');
            redirect('admin_investment');
        }

        if ($this->input->post()) {
            $amount = $this->input->post('amount');
            // Validate amount (e.g., minimum contribution)
            if ($amount <= 0) {
                $this->session->set_flashdata('error', 'Invalid amount.');
                redirect('admin_investment');
            }

            // Calculate percentage (example: Y = X / Z * 100)
            $total_pool = $pool['total_amount'] + $amount;
            $percentage = ($amount / $total_pool) * 100;

            $contribution_data = [
                'pool_id' => $pool_id,
                'user_id' => $this->input->post('userid'), // Assuming user ID in session
                'amount' => $this->input->post('amount'),
                'percentage' => $percentage
            ];

            // Start transaction
            $this->db->trans_start();
            $this->contribution_model->add_contribution($contribution_data);
            $this->pool_model->update_pool_total($pool_id, $amount);
            $this->db->trans_complete();

            if ($this->db->trans_status() === FALSE) {
                $this->session->set_flashdata('error', 'Contribution failed.');
            } else {
                $this->session->set_flashdata('success', 'Contribution added successfully.');
            }
            redirect('admin_investment');
        }

        redirect('admin_investment');
    }

    public function my_contributions() {
        $user_id = $this->session->userdata('user_id');
        $data['contributions'] = $this->contribution_model->get_user_contributions($user_id);
        $this->load->view('my_contributions', $data);
    }
}