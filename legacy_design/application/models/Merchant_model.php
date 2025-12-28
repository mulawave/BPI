<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Merchant_model extends CI_Model
{
    public function __construct() {
        parent::__construct();
    }
    
    public function getMerchants($limit, $offset)
    {
        $this->db->where('status', 'active');
        return $this->db->get('merchants', $limit, $offset)->result();
    }
}