<?php
class Share_model extends CI_Model {
    
     public function __construct() {
        parent::__construct();
    }

    public function purchaseSlot($package_id, $user_id) {
    // Step 1: Prepare slot data
    $slot_data = [
        'package_id' => $package_id,
        'user_id' => $user_id,
        'slot_number' => $this->getNextSlotNumber($package_id), // Get the next available slot number for this package
        'group_id' => null, // Initially null, will be updated if a group is formed
        'payment_status' => 'completed', // Assuming the payment has been made successfully
        'created_at' => date('Y-m-d H:i:s') // Set the current timestamp
    ];

    // Step 2: Insert slot purchase data into the table
    $this->db->insert('share_package_slots', $slot_data);
    $slot_id = $this->db->insert_id();

    // Step 3: Check if the group is complete (e.g., 4 slots purchased)
    if ($this->isGroupComplete($package_id)) {
        // Step 4: Form the group and get the group ID
        $group_id = $this->formGroup($package_id);

        // Step 5: Update the newly added slot with the group ID
        $this->db->set('group_id', $group_id);
        $this->db->where('id', $slot_id);
        $this->db->update('share_package_slots');

        // Step 6: Allocate rewards to the group members
        $this->allocateRewards($group_id);
    }

    // Step 7: Return the slot ID
    return $slot_id;
}


    private function getNextSlotNumber($package_id) {
        $this->db->where('package_id', $package_id);
        $this->db->where('group_id IS NULL', null, false); // Slots not yet in a group
        return $this->db->count_all_results('share_package_slots') + 1;
    }

    private function isGroupComplete($package_id) {
        $this->db->where('package_id', $package_id);
        $this->db->where('group_id IS NULL', null, false); // Slots not yet in a group
        return $this->db->count_all_results('share_package_slots') == 4;
    }

    private function formGroup($package_id) {
        // Create a new group ID
        $group_id = uniqid();  // Generate a unique group ID

        // Assign the group ID to the 4 pending slots for this package
        $this->db->set('group_id', $group_id);
        $this->db->where('package_id', $package_id);
        $this->db->where('group_id IS NULL', null, false); // Slots not yet in a group
        $this->db->update('share_package_slots');

        return $group_id;
    }

    private function allocateRewards($group_id) {
        // Get the package's founders pool percentage
        $this->db->select('share_packages.founders_pool_percentage, share_package_slots.package_id');
        $this->db->from('share_package_slots');
        $this->db->join('share_packages', 'share_packages.id = share_package_slots.package_id');
        $this->db->where('share_package_slots.group_id', $group_id);
        $package_data = $this->db->get()->row();

        $reward_percentage = $package_data->founders_pool_percentage / 4;  // Split equally among 4 members

        // Allocate the percentage to each user
        $members = $this->getGroupMembers($group_id);
        foreach ($members as $member) {
            $this->db->insert('user_rewards', [
                'user_id' => $member['user_id'],
                'package_id' => $package_data->package_id,
                'reward_percentage' => $reward_percentage,
                'reward_status' => 'active'  // For quarterly sharing
            ]);
        }
    }

    public function getGroupMembers($group_id) {
        return $this->db->get_where('share_package_slots', ['group_id' => $group_id])->result_array();
    }
    
    public function getSlotsByPackage($package_id)
    {
        // Query to fetch slots associated with the specified package ID
        $this->db->select('*');
        $this->db->from('share_package_slots'); // Replace with your table name
        $this->db->where('package_id', $package_id);
        $query = $this->db->get();

        // Return the result as an array
        return $query->result_array();
    }
    
    public function getAvailablePackages() {
        $query = $this->db->get('share_packages'); // Get all records from packages table
        return $query->result_array(); // Return the result as an associative array
    }

    // Fetch a single package by ID
    public function getPackageById($package_id) {
        $this->db->where('id', $package_id);
        $query = $this->db->get('share_packages'); // Get the package details
        return $query->row_array(); // Return a single row as an associative array
    }
}
