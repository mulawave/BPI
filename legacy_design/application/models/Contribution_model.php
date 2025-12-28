<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Contribution_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function add_contribution($data) {
        return $this->db->insert('pool_contributions', $data);
    }

    public function get_user_contributions($user_id) {
        $this->db->select('pc.*, p.name as pool_name');
        $this->db->from('pool_contributions pc');
        $this->db->join('pools p', 'p.id = pc.pool_id');
        $this->db->where('pc.user_id', $user_id);
        return $this->db->get()->result_array();
    }
}