<?php

class ShareController extends CI_Controller
{
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
    $this->load->model('share_model');
    // Load necessary models, libraries, etc.
  }
    
    // Function to display available packages
    public function available_packages() {
        $userid = $this->session->userdata('user_id');
        $user_details = $this->session->userdata( 'user_details' );
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $data['packages'] = $this->share_model->getAvailablePackages();
        $this->load->view('available_slots', $data);
    }


   public function purchaseSlot($package_id)
{
    $user_id = $this->session->userdata('user_id');  // Retrieve the user ID from session data

    // Step 1: Get the package details including the cost of the package
    $package = $this->share_model->getPackageById($package_id);

    if (!$package) {
        $this->session->set_flashdata('error', 'Package not found.');
        redirect('view_slots/' . $package_id);
        return;
    }

    // Step 2: Get the slot cost directly from the package cost column
    $slot_cost = $package['cost'];

    // Step 3: Check if the user has enough balance for the slot cost
    if (!$this->generic_model->hasEnoughBalance($user_id, $slot_cost)) {
        $this->session->set_flashdata('error', 'Insufficient balance to purchase a slot.');
        redirect('view_slots/' . $package_id);
        return;
    }

    // Step 4: Deduct the balance with the slot cost
    $this->generic_model->deductBalance($user_id, $slot_cost);
    $transactionWith = array(
                            'user_id' => $user_id,
                            'order_id' =>444,
                            'transaction_type' => 'Group Slot Purchase',
                            'amount' => $slot_cost,  // Assuming you have the price for each item
                            'description' => 'Purchase of Investment Group Slot',  // Add a relevant description
                            'status' => 'Successful'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionWith);

    // Step 5: Purchase the slot
    $slot_id = $this->share_model->purchaseSlot($package_id, $user_id);

    if ($slot_id) {
        $this->session->set_flashdata('success', 'Slot purchased successfully.');
        redirect('view_slots/' . $package_id);
    } else {
        $this->session->set_flashdata('error', 'Error purchasing slot. Please try again.');
        redirect('view_slots/' . $package_id);
    }
}

    
    public function viewSlots($package_id)
    {
        $package = $this->share_model->getPackageById($package_id);
        $data['slots'] = $this->share_model->getSlotsByPackage($package_id);
        $data['package_info'] = $package;
        $userid = $this->session->userdata('user_id');
        $user_details = $this->session->userdata( 'user_details' );
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view('viewSlots', $data);
    }

    public function viewGroup($group_id)
    {
        $data['members'] = $this->share_model->getGroupMembers($group_id);
        $data['group_id'] = $group_id;
        $userid = $this->session->userdata('user_id');
        $user_details = $this->session->userdata( 'user_details' );
        $data['unread_count'] = $this->generic_model->get_unread_count($userid);
        $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
        $data[ 'user_details' ] = $user_details;
        $this->load->view('group_details', $data);
    }
}
?>