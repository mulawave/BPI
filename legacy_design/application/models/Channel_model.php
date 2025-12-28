<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Channel_model extends CI_Model {

    // Add a new channel
    public function add_channel($data) {
        $this->db->insert('youtube_channels', $data);
        return $this->db->insert_id();
    }

    // Retrieve all verified channels
    public function get_verified_channels() {
        $this->db->where('is_verified', 1);
        $query = $this->db->get('youtube_channels');
        return $query->result();
    }
    
     public function update_channel_info($channel_id, $data) {
        $this->db->where('id', $channel_id);
        return $this->db->update('youtube_channels', $data);
    }


    // Get channel details by ID
    public function get_channel_by_id($channel_id) {
        $this->db->where('id', $channel_id);
        $query = $this->db->get('youtube_channels');
        return $query->row();
    }

    // Update channel verification status
    public function update_verification_status($channel_id, $status) {
        $this->db->where('id', $channel_id);
        $this->db->update('youtube_channels', ['is_verified' => $status]);
    }
    
    // Check if a user has earnings
    public function check_user_earnings($user_id, $channel_id) {
        $this->db->where('user_id', $user_id);
        $this->db->where('channel_id', $channel_id);
        $query = $this->db->get('user_earnings');
        return $query->row();
    }

    // Add earnings for user
    public function add_user_earnings($data) {
        $this->db->insert('user_earnings', $data);
    }
    
    public function remove_subscription($subscription_id) {
    $this->db->where('id', $subscription_id);
    $this->db->delete('channel_subscriptions');
    }
    
    public function ban_user($user_id) {
    $this->db->where('id', $user_id);
    $this->db->update('users', ['youtube_banned' => 1]);
    }
    
    public function add_subscription($user_id, $channel_id) {
        $data = array(
            'user_id' => $user_id,
            'channel_id' => $channel_id,
            'status' => 'pending', // Default status is pending
            'subscription_date' => date('Y-m-d H:i:s') // Set current timestamp
        );

        return $this->db->insert('channel_subscriptions', $data);
    }
    
    public function update_subscription_status($subscription_id, $status) {
        $data = array(
            'status' => $status
        );
        $this->db->where('id', $subscription_id);
        return $this->db->update('channel_subscriptions', $data);
    }
    
    public function get_pending_subscriptions() {
        $this->db->where('status', 'pending');
        $query = $this->db->get('channel_subscriptions');
        return $query->result();
    }


}
?>
