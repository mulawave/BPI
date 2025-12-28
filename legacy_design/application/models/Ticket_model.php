<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Ticket_model extends CI_Model {

    public function __construct() {
        parent::__construct();
        $this->load->database();
    }

    public function get_tickets() {
        $this->db->select('tickets.*, creator.firstname AS created_by, assignee.firstname AS assigned_to');
        $this->db->from('tickets');
        $this->db->join('users AS creator', 'tickets.created_by = creator.id');
        $this->db->join('users AS assignee', 'tickets.assigned_to = assignee.id', 'left');
        $query = $this->db->get();
        return $query->result();
    }

    public function get_ticket($id) {
        $this->db->select('tickets.*, creator.firstname AS created_by, assignee.firstname AS assigned_to');
        $this->db->from('tickets');
        $this->db->join('users AS creator', 'tickets.created_by = creator.id');
        $this->db->join('users AS assignee', 'tickets.assigned_to = assignee.id', 'left');
        $this->db->where('tickets.id', $id);
        $query = $this->db->get();
        return $query->row();
    }

    public function create_ticket($data) {
        return $this->db->insert('tickets', $data);
    }

    public function update_ticket($id, $data) {
        $this->db->where('id', $id);
        return $this->db->update('tickets', $data);
    }

    public function delete_ticket($id) {
        $this->db->where('id', $id);
        return $this->db->delete('tickets');
    }

    public function get_users() {
		$this->db->where('user_type', 'support');
        $query = $this->db->get('users');
        return $query->result();
    }
	
	public function add_reply($data) {
        return $this->db->insert('ticket_replies', $data);
    }

    public function get_replies($ticket_id) {
        $this->db->select('ticket_replies.*, users.username AS user');
        $this->db->from('ticket_replies');
        $this->db->join('users', 'ticket_replies.user_id = users.id');
        $this->db->where('ticket_replies.ticket_id', $ticket_id);
        $query = $this->db->get();
        return $query->result();
    }


}
