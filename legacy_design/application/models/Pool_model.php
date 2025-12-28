<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Pool_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function create_pool($data) {
        return $this->db->insert('pools', $data);
    }

    public function get_active_pools() {
        return $this->db->where('status', 'active')->get('pools')->result_array();
    }

    public function update_pool_total($pool_id, $amount) {
        $this->db->set('total_amount', 'total_amount + ' . $amount, FALSE);
        $this->db->where('id', $pool_id);
        return $this->db->update('pools');
    }

    public function get_pool($pool_id) {
        return $this->db->where('id', $pool_id)->get('pools')->row_array();
    }
    
    public function get_all_pools() {
        return $this->db->get('pools')->result_array();
    }

    public function get_pool_contributions($pool_id) {
        $this->db->select('pc.*, u.username'); // Assuming users table has 'username'
        $this->db->from('pool_contributions pc');
        $this->db->join('users u', 'u.id = pc.user_id');
        $this->db->where('pc.pool_id', $pool_id);
        return $this->db->get()->result_array();
    }
}