<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Assessment_model extends CI_Model {

    public function __construct()
    {
        parent::__construct();
    }

    public function get_states()
    {
        return array(
            'North' => array('Kaduna', 'Kano', 'Sokoto'),
            'South' => array('Lagos', 'Rivers', 'Delta'),
            'East' => array('Enugu', 'Anambra', 'Imo'),
            'West' => array('Oyo', 'Ogun', 'Osun')
        );
    }

    public function get_sunlight_hours($state)
    {
        $sunlight_hours = array(
            'Kaduna' => 5.2, 'Kano' => 5.3, 'Sokoto' => 5.4,
            'Lagos' => 5.5, 'Rivers' => 5.3, 'Delta' => 5.4,
            'Enugu' => 5.2, 'Anambra' => 5.1, 'Imo' => 5.0,
            'Oyo' => 5.3, 'Ogun' => 5.4, 'Osun' => 5.2
        );
        return isset($sunlight_hours[$state]) ? $sunlight_hours[$state] : 5.0;
    }

    public function get_products()
    {
        return array(
            'inverters' => array(
                1 => array('name' => '3KVA Inverter', 'bpi_price' => 300000, 'non_bpi_price' => 350000, 'capacity' => 3),
                2 => array('name' => '5KVA Inverter', 'bpi_price' => 500000, 'non_bpi_price' => 550000, 'capacity' => 5),
                3 => array('name' => '10KVA Inverter', 'bpi_price' => 900000, 'non_bpi_price' => 1000000, 'capacity' => 10)
            ),
            'batteries' => array(
                1 => array('name' => '200AH Battery', 'type' => 'Lithium', 'bpi_price' => 200000, 'non_bpi_price' => 250000, 'capacity' => 200),
                2 => array('name' => '250AH Battery', 'type' => 'Lead-Acid', 'bpi_price' => 150000, 'non_bpi_price' => 180000, 'capacity' => 250)
            ),
            'panels' => array(
                1 => array('name' => '550W Panel', 'bpi_price' => 110000, 'non_bpi_price' => 130000, 'wattage' => 550)
            )
        );
    }

    public function get_user_by_ssc($ssc_code)
    {
        $this->db->where('ssc', $ssc_code);
        $query = $this->db->get('users');
        return $query->row_array();
    }

    public function get_referrer($user_id)
    {
        $this->db->select('users.*');
        $this->db->from('referrals');
        $this->db->join('users', 'users.id = referrals.referred_by');
        $this->db->where('referrals.user_id', $user_id);
        $query = $this->db->get();
        return $query->row_array();
    }

    public function save_assessment($data)
    {
        $this->db->insert('assessments', $data);
        return $this->db->insert_id();
    }

    public function get_assessment($id)
    {
        $query = $this->db->get_where('assessments', array('id' => $id));
        return $query->row_array();
    }

    public function credit_wallet($user_id, $amount)
    {
        $this->db->where('id', $user_id);
        $this->db->set('wallet', 'wallet + ' . $amount, FALSE);
        $this->db->update('users');
    }
}