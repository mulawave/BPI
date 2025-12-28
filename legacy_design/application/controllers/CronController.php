<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class CronController extends CI_Controller{

    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
        $this->load->model('user_model');
        $this->load->helper('string');
        $this->load->helper('time_helper'); 
    }

    public function update_referrals()
    {
        // Get all users
        $this->db->select('id');
        $query = $this->db->get('users');
        $users = $query->result_array();

        foreach ($users as $user) {
            $user_id = $user['id'];

            // Stage 1: Get count of referred users who completed KYC
            $level_1_count = $this->generic_model->get_kyc_completes_count($user_id);

            // If 10 persons completed KYC, we check Stage 2
            if ($level_1_count >= 10) {
                // Stage 2: Check if the referred users have activated EPC package
                $level_2_count = $this->generic_model->get_epc_activated_count($user_id);

                // If 10 referred users have activated EPC, we check Stage 3
                if ($level_2_count >= 10) {
                    // Stage 3: Check if those users referred 10 persons who activated EPC package
                    $level_3_count = $this->generic_model->get_referrals_epc_activated_count($user_id);

                    // If 10 users in this level activated EPC, we check Stage 4
                    if ($level_3_count >= 100) {
                        // Stage 4: Check if their referrals also activated EPC
                        $level_4_count = $this->generic_model->get_referrals_epc_activated_count($user_id, 4);

                        // Determine the bpicg level
                        //$bpicg = 0; // Default to stage 4
                        if ($level_1_count >= 10) $bpicg = 1;
                        if ($level_2_count >= 10) $bpicg = 2;
                        if ($level_3_count >= 100) $bpicg = 3;
                        if ($level_4_count >= 1000) $bpicg = 4;

                        // Update user record
                        $this->db->where('id', $user_id);
                        $this->db->update('users', [
                            'bpicg' => $bpicg,
                            'level_1_count' => $level_1_count,
                            'level_2_count' => $level_2_count,
                            'level_3_count' => $level_3_count,
                            'level_4_count' => $level_4_count
                        ]);
                    }
                }
            }
        }

        echo "Referral levels updated successfully!";
    }
}
?>