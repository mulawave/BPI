<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class AjaxCalls extends CI_Controller {
    
    public function updateQuota() {
        // Retrieve selected food items from the POST data
        $selectedFoodItems = $this->input->post('selectedFoodItems') ? $this->input->post('selectedFoodItems') : [];

        // Perform calculations (replace this with your logic)
        $totalQuota = 2000;
        $itemPrice = 5000;
        $quotaBalance = $totalQuota - (count($selectedFoodItems) * $itemPrice);

        // Send back the updated information
        $response = [
            'totalQuota' => $totalQuota,
            'quotaBalance' => $quotaBalance,
        ];

        // Output JSON response
        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($response));
    }

}
