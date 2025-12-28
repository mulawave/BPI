<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Food_model extends CI_Model {

    public function __construct() {
        parent::__construct();
        $this->load->database();
    }

    public function get_food_items() {
        $query = $this->db->get('food_items');
        return $query->result();
    }

    public function get_food_price($food_id) {
        // Retrieve the price of a specific food item
        $query = $this->db->get_where('food_items', array('id' => $food_id));
        $result = $query->row();
        return $result->price;
    }
    
    public function get_currencies(){
        $query = $this->db->get('currency_management');
        return $query->result();
    }
	
	public function get_categories(){
        $query = $this->db->get('philanthropy_category');
        return $query->result();
    }

}
