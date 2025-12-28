<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Model Function
class User_model extends CI_Model {
    
    public function get_user_by_referral_code($referral_code) {
        return $this->db->where('referral_link', $referral_code)->get('users')->row();
    }
    
    public function generate_unique_referral_link() {
        $unique_link = md5(uniqid());
        // Check if the generated link already exists, generate a new one if needed
        while ($this->db->where('referral_link', $unique_link)->get('users')->num_rows() > 0) {
            $unique_link = md5(uniqid());
        }
        return $unique_link;
    }
    
    public function update_referral_levels($referring_user_id, $referred_user_id) {
        $referring_user = $this->db->where('id', $referring_user_id)->get('users')->row();
        if ($referring_user) {
            // Determine the level field to update (level_1, level_2, etc.)
            $level_field = 'level_' . $referring_user->referral_level;
            
            // Update the referring user's referral field
            $this->db->where('id', $referring_user_id)->update('users', array($level_field => $referred_user_id));
        }
    }
    
    public function update_profile_picture($user_id, $file_name) {
        // Update the user's profile picture in the database
        $data = array('profile_pic' => 'uploads/profile_pictures/' . $file_name);
        $this->db->where('id', $user_id);
        $this->db->update('users', $data);
    }
	
	public function update_partner_picture($user_id, $file_name) {
        // Update the user's profile picture in the database
        $data = array('logo' => 'uploads/profile_pictures/' . $file_name);
        $this->db->where('id', $user_id);
        $this->db->update('philanthropy_partners', $data);
    }
    
    public function update_merchant_picture($user_id, $file_name) {
        // Update the user's profile picture in the database
        $data = array('merchant_pic' => 'uploads/merchant_pictures/' . $file_name);
        $this->db->where('id', $user_id);
        $this->db->update('users', $data);
    }
    
    public function update_user_profile($user_id, $data) {
        // Update the user's profile information in the database
        $this->db->where('id', $user_id);
        $this->db->update('users', $data);
    }
    
    public function update_bank_records($user_id, $data) {
        $this->db->where('user_id', $user_id);
        $this->db->update('bank_records', $data);
    }
	
	 public function update_partner_bank_records($user_id, $data) {
        $this->db->where('user_id', $user_id);
        $this->db->update('partner_bank_records', $data);
    }
    
    public function get_bank_records($user_id) {
        // Fetch the user's bank records from the database
        return $this->db->where('user_id', $user_id)->get('bank_records')->row();
    }
	
	 public function get_partner_bank_records($user_id) {
        // Fetch the user's bank records from the database
        return $this->db->where('user_id', $user_id)->get('partner_bank_records')->row();
    }
    
    public function verify_old_password($user_id, $old_password) {
        // Retrieve the user's current hashed password from the database
        $this->db->select('password');
        $this->db->where('id', $user_id);
        $query = $this->db->get('users');

        if ($query->num_rows() == 1) {
            $row = $query->row();
            $stored_password = $row->password;

            // Check if the old password matches the stored hashed password
            return password_verify($old_password, $stored_password);
        }

        return false;
    }

    public function update_password($user_id, $new_password) {
        // Update the user's password in the database
        $data = array('password' => $new_password);
        $this->db->where('id', $user_id);
        $this->db->update('users', $data);
    }
    
    function addReferral($referralInfo){
        $this->db->insert('referrals', $referralInfo);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }
    
    function getReferralId($refcode){
        $this->db->select('*');
        $this->db->from('users');
        $this->db->where('referral_link', $refcode);
        $query = $this->db->get();
        return $query->row();
    }
    
    function getReferrerID($userID)
    {
        $this->db->select('*');
        $this->db->from('referrals');
        $this->db->where('user_id', $userID);
        $query = $this->db->get();

        if($query->num_rows() > 0){
            return $query->row();
          } else {
            return null;
          }
    }
    
    public function getAllData($tablename, $exclude_id = null) {
    if ($exclude_id !== null) {
        $this->db->where('id !=', $exclude_id);
    }
    
    $query = $this->db->get($tablename);
    
    if ($query->num_rows() > 0) {
        return $query->result_array();
    } else {
        return array();
    }
}

    

}
