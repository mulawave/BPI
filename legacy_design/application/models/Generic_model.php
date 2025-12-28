<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Generic_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }
    
    
     public function get_solar_states()
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

    public function get_user_by_id($user_id) {
        return $this->db->get_where('users', ['id' => $user_id])->row();
    }

    public function get_active_shelter_by_user($user_id) {
        return $this->db->get_where('active_shelters', ['user_id' => $user_id, 'status' => 'active'])->row();
    }
    
    public function get_support_requests(){
        return $this->db->where('bpi_support_requests', ['status' => 'pending']);
    }

    public function count_direct_referrals($user_id) {
        return $this->db->where('referred_by', $user_id)->count_all_results('referrals');
    }

    public function insert($table, $data) {
        return $this->db->insert($table, $data);
    }

    public function get_last_support_request($user_id) {
        return $this->db->where('user_id', $user_id)
                        ->order_by('created_at', 'DESC')
                        ->limit(1)
                        ->get('bpi_support_requests')
                        ->row();
    }

    public function get_support_request_by_id($id) {
        return $this->db->get_where('bpi_support_requests', ['id' => $id])->row();
    }

    public function transfer_funds_and_log($data) {
        // Begin transaction
        $this->db->trans_start();

        // Deduct from donor's wallet and/or spendable
        $user = $this->get_user_by_id($data['donor_id']);
        $amount = $data['amount'];

        $wallet_deduction = min($user->wallet, $amount);
        $spendable_deduction = $amount - $wallet_deduction;

        $this->db->set('wallet', 'wallet - '.$wallet_deduction, FALSE);
        $this->db->set('spendable', 'spendable - '.$spendable_deduction, FALSE);
        $this->db->where('id', $user->id);
        $this->db->update('users');

        // Insert donation log
        $this->db->insert('bpi_support_donations', $data);

        // Commit transaction
        $this->db->trans_complete();

        return $this->db->trans_status();
    }

    public function get_total_donations_received($user_id) {
        return $this->db->select_sum('amount')
                        ->where('recipient_id', $user_id)
                        ->get('bpi_support_donations')
                        ->row()
                        ->amount;
    }

    public function get_donations_received($user_id) {
        return $this->db->where('recipient_id', $user_id)
                        ->order_by('donated_at', 'DESC')
                        ->get('bpi_support_donations')
                        ->result();
    }
    
        // PEVC/GEVC Dashboard: Support Summary for User
    public function get_my_support_summary($user_id) {
        $this->db->select('COUNT(*) AS total_requests, SUM(amount_requested) AS total_requested');
        $this->db->where('user_id', $user_id);
        $this->db->from('bpi_support_requests');
        return $this->db->get()->row();
    }

    // PEVC/GEVC Dashboard: Support Received (approved donations)
    public function get_support_received($user_id) {
        $this->db->select('SUM(amount) AS total_received');
        $this->db->where('recipient_id', $user_id);
        $this->db->from('bpi_support_donations');
        return $this->db->get()->row();
    }

    // PEVC Dashboard: My Support History
    public function get_my_support_requests($user_id) {
        $this->db->where('user_id', $user_id);
        $this->db->order_by('created_at', 'DESC');
        return $this->db->get('bpi_support_requests')->result();
    }

    // PEVC Dashboard: Donations Made by Me
    public function get_donations_by_user($user_id) {
        $this->db->where('donor_id', $user_id);
        $this->db->order_by('donated_at', 'DESC');
        return $this->db->get('bpi_support_donations')->result();
    }

    // GEVC Dashboard: Global Approved Requests (not mine)
    public function get_global_requests($exclude_user_id) {
        $this->db->where('support_level', 'global');
        $this->db->where('status', 'approved');
        $this->db->where('user_id !=', $exclude_user_id);
        $this->db->order_by('created_at', 'DESC');
        return $this->db->get('bpi_support_requests')->result();
    }

    // GEVC Dashboard: Leaderboard (Top 10 Donors)
    public function get_top_donors($limit = 10) {
        $this->db->select('donor_id, SUM(amount) AS total_donated');
        $this->db->from('bpi_support_donations');
        $this->db->group_by('donor_id');
        $this->db->order_by('total_donated', 'DESC');
        $this->db->limit($limit);
        return $this->db->get()->result();
    }
    

    public function get_solar_products()
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
    
    public function get_assessments_by_installer($installer_ssc, $limit = 10, $offset = 0) {
        $this->db->select('*');
        $this->db->from('assessments');
        $this->db->where('installer_ssc', $installer_ssc);
        $this->db->limit($limit, $offset);
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_assessments_count($installer_ssc) {
        $this->db->select('COUNT(*) as count');
        $this->db->from('assessments');
        $this->db->where('installer_ssc', $installer_ssc);
        $query = $this->db->get();
        return $query->row()->count;
    }

    public function get_solar_referrer($user_id)
    {
        $this->db->select('users.*');
        $this->db->from('referrals');
        $this->db->join('users', 'users.id = referrals.referred_by');
        $this->db->where('referrals.user_id', $user_id);
        $query = $this->db->get();
        return $query->row_array();
    }

    public function save_solar_assessment($data)
    {
        $this->db->insert('assessments', $data);
        return $this->db->insert_id();
    }

    public function get_solar_assessment($id)
    {
        $query = $this->db->get_where('assessments', array('id' => $id));
        return $query->row_array();
    }

    public function solar_credit_wallet($user_id, $amount)
    {
        $this->db->where('id', $user_id);
        $this->db->set('wallet', 'wallet + ' . $amount, FALSE);
        $this->db->update('users');
    }
    
    public function get_kyc_completes_count($referred_by) {
        $this->db->select('count(*) as count');
        $this->db->from('referrals');
        $this->db->join('users', 'referrals.user_id = users.id');
        $this->db->where('referrals.referred_by', $referred_by);
        $this->db->where('users.kyc', 1);
        $query = $this->db->get();
        return $query->row()->count;
    }
    
    public function get_epc_activated_count($referred_by) {
        $this->db->select('count(*) as count');
        $this->db->from('referrals');
        $this->db->join('export_code_users', 'referrals.user_id = export_code_users.user_id');
        $this->db->where('referrals.referred_by', $referred_by);
        $this->db->where('export_code_users.status', 1); // Assuming package_activated marks EPC activation
        $query = $this->db->get();
        return $query->row()->count;
    }
    
    public function get_referrals_epc_activated_count($referred_by, $level = 1) {
        $this->db->select('count(*) as count');
        $this->db->from('referrals as r1');
        
        // We join progressively for each level
        for ($i = 1; $i <= $level; $i++) {
            $this->db->join('referrals as r' . ($i + 1), 'r' . $i . '.user_id = r' . ($i + 1) . '.referred_by', 'left');
        }
        
        $this->db->join('export_code_users', 'r' . ($level + 1) . '.user_id = export_code_users.user_id');
        $this->db->where('r1.referred_by', $referred_by);
        $this->db->where('export_code_users.status', 1);
        
        $query = $this->db->get();
        return $query->row()->count;
    }



    
   /**
     * Get referral counts for all levels (1-4)
     */
    public function calculate_referral_levels($user_id)
    {
        // Level 1: Direct referrals who completed KYC
        $this->db->select('users.id');
        $this->db->from('users');
        $this->db->join('referrals', 'referrals.user_id = users.id'); 
        $this->db->where('referrals.referred_by', $user_id);
        $this->db->where('users.kyc', 1);
        $query = $this->db->get();
        $level_1_users = array_column($query->result_array(), 'id'); 
        $level_1_count = count($level_1_users);

        // Level 2: People referred by Level 1 users
        $level_2_count = $this->count_referred_users($level_1_users);

        // Level 3: People referred by Level 2 users
        $level_3_count = $this->count_referred_users($this->get_referred_users($level_1_users));

        // Level 4: People referred by Level 3 users
        $level_4_count = $this->count_referred_users($this->get_referred_users($this->get_referred_users($level_1_users)));

        return [$level_1_count, $level_2_count, $level_3_count, $level_4_count];
    }

    /**
     * Get referred users who completed KYC
     */
    private function get_referred_users($user_ids)
    {
        if (empty($user_ids)) return [];

        $this->db->select('users.id');
        $this->db->from('users');
        $this->db->join('referrals', 'referrals.user_id = users.id');
        $this->db->where_in('referrals.referred_by', $user_ids);
        $this->db->where('users.kyc', 1);
        $query = $this->db->get();
        
        return array_column($query->result_array(), 'id');
    }

    /**
     * Count the number of KYC-completed users referred by a list of user IDs
     */
    private function count_referred_users($user_ids)
    {
        return count($this->get_referred_users($user_ids));
    }
    
    public function extract_channel_id($url) {
    // Regular expression patterns to match various YouTube URL formats
    $patterns = [
        '/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i',  // For Channel URLs
        '/youtube\.com\/c\/([a-zA-Z0-9_-]+)/i',        // For Custom URLs
        '/youtube\.com\/user\/([a-zA-Z0-9_-]+)/i'      // For User URLs
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            $id = $matches[1];  // Extracted ID
            
            // For 'channel' URL, return the ID directly
            if (strpos($url, '/channel/') !== false) {
                return $id;
            }

            // For 'user' or 'custom' URLs, use the API to get the actual channel ID
            return $this->get_channel_id_from_username_or_custom_url($id);
        }
    }

    // If no pattern matched, return null
    return null;
}

    public function get_channel_id_from_username_or_custom_url($identifier) {
    $client = getGoogleClient();
    $service = new Google_Service_YouTube($client);

    try {
        // Use the YouTube API to find the channel ID by username or custom URL
        $response = $service->channels->listChannels('id', [
            'forUsername' => $identifier,  // Will work for both username or custom URL
        ]);

        if (!empty($response->items)) {
            return $response->items[0]->id;  // Return CHANNEL_ID
        } else {
            $this->session->set_flashdata('error', 'Could not find the YouTube channel for the given identifier.');
            return null;
        }
    } catch (Google_Service_Exception $e) {
        $this->session->set_flashdata('error', 'YouTube API error: ' . $e->getMessage());
        return null;
    }
}
    
    public function get_vip_users_in_active_shelters_ids($amount) {    
    $this->db->select('u.id');
    $this->db->from('users u');
    $this->db->join('active_shelters a', 'u.id = a.user_id');
    $this->db->where('u.is_vip', 1);
    $this->db->where('a.amount', $amount);
    $query = $this->db->get();
    $users = $query->result_array();
    return array_column($users, 'id');
}
    
    public function hasEnoughBalance($user_id, $amount) {
        $this->db->where('id', $user_id);
        $wallet = $this->db->get('users')->row();
        return $wallet && $wallet->wallet >= $amount;
    }

    public function deductBalance($user_id, $amount) {
        $this->db->set('wallet', 'wallet - ' . $amount, FALSE);
        $this->db->where('id', $user_id);
        $this->db->update('users');
    }
    
    public function get_total_referrals_for_user($user_id, $amount) {
    $this->db->select('u.id, COUNT(r.user_id) AS total_referrals');
    $this->db->from('users u');
    $this->db->join('referrals r', 'u.id = r.referred_by');
    $this->db->join('active_shelters a', 'r.user_id = a.user_id');
    $this->db->where('a.amount', $amount);
    $this->db->where('u.id', $user_id);
    $this->db->group_by('u.id');
    $query = $this->db->get();
    return $query->row();
        
        
}
    
    public function get_total_referrals_for_user_level($user_id, $amount) {
    $this->db->select('u.id, COUNT(r.user_id) AS total_referrals');
    $this->db->from('users u');
    $this->db->join('referrals r', 'u.id = r.level_1');
    $this->db->join('active_shelters a', 'r.user_id = a.user_id');
    $this->db->where('a.amount', $amount);
    $this->db->where('u.id', $user_id);
    $this->db->group_by('u.id');
    $query = $this->db->get();
    return $query->row();
        
    }

    public function get_vip_users_in_active_shelters($amount) {
    $this->db->select('u.*');
    $this->db->from('users u');
    $this->db->join('active_shelters a', 'u.id = a.user_id');
    $this->db->where('u.is_vip', 1);
    $this->db->where('a.amount', $amount);
    $query = $this->db->get();
    return $query->result();
}

	
	public function update_active_shelters() {
    $this->db->select('user_id');
    $this->db->from('payments');
    $this->db->where('status', 1);
    $query = $this->db->get();
    $user_ids = $query->result_array();

    $user_id_array = array_column($user_ids, 'user_id');

    if (!empty($user_id_array)) {
        $this->db->where_in('user_id', $user_id_array);
        $this->db->where('status', 'Pending');
        $this->db->update('active_shelters', array('status' => 'active'));
        // Debugging: echo the last query
       // echo $this->db->last_query();
    } else {
       return null;
    }
}

	
	public function get_centers_without_products($product_name) {
        $subquery = $this->db->select('pickup_center_id')
                             ->from('store_products')
							 ->where('product_name', $product_name)
                             ->get_compiled_select();

        $query = $this->db->query("SELECT * FROM merchants WHERE id NOT IN ($subquery)");
        return $query->result_array();
    }
	
	public function count_activated_users_referred_by($user_id) {
        $this->db->select('COUNT(users.id) as vip_users_count');
        $this->db->from('users');
        $this->db->join('referrals', 'users.id = referrals.user_id');
        $this->db->join('active_shelters', 'users.id = active_shelters.user_id');
        $this->db->where('users.is_vip', 1);
        $this->db->where('active_shelters.status', 'active');
        $this->db->where('referrals.referred_by', $user_id);
        $query = $this->db->get();
        return $query->row()->vip_users_count;
	}
	
	public function increment_views($id) {
        $this->db->set('views', 'views + 1', FALSE);
        $this->db->where('id', $id);
        $this->db->update('tbl_blog');
    }
    
    public function increment_post_views($id) {
        $this->db->set('views', 'views + 1', FALSE);
        $this->db->where('id', $id);
        $this->db->update('community_posts');
    }

    public function get_total_comments($blog_id) {
        $this->db->where('blog_id', $blog_id);
        $this->db->from('blog_comments');
        return $this->db->count_all_results();
    }
	
	public function get_comments($blog_id) {
        $this->db->where('blog_id', $blog_id);
        $this->db->order_by('id', 'ASC');
        $query = $this->db->get('blog_comments');
        return $query->result_array();
    }

    public function add_comment($data) {
        return $this->db->insert('blog_comments', $data);
	}
	
	public function get_users_count_by_package($user_id, $package_amount) {
		$this->db->select('COUNT(*) as users_count');
		$this->db->from('referrals');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->join('active_shelters', 'active_shelters.user_id = referrals.user_id');
		$this->db->where('referrals.referred_by', $user_id);
		$this->db->where('users.is_vip', 1);
		$this->db->where('active_shelters.status', 'active');
		$this->db->where('active_shelters.amount', $package_amount);
		$query = $this->db->get();

		return $query->row()->users_count;
	}
	
	public function get_users_by_package($user_id, $package_amount) {
		$this->db->select('users.*, active_shelters.amount as package_amount');
		$this->db->from('referrals');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->join('active_shelters', 'active_shelters.user_id = referrals.user_id');
		$this->db->where('referrals.referred_by', $user_id);
		$this->db->where('users.is_vip', 1);
		$this->db->where('active_shelters.status', 'active');
		$this->db->where('active_shelters.amount', $package_amount);
		$query = $this->db->get();

		return $query->result_array();
	}
	
	public function get_users_by_package_level($user_id, $level,$package_amount ){
		$this->db->select('users.*, active_shelters.amount as package_amount');
		$this->db->from('referrals');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->join('active_shelters', 'active_shelters.user_id = referrals.user_id');
		$this->db->where('referrals.'.$level, $user_id);
		$this->db->where('users.is_vip', 1);
		$this->db->where('active_shelters.status', 'active');
		$this->db->where('active_shelters.amount', $package_amount);
		$query = $this->db->get();

		return $query->result_array();
	}

	public function get_users_count_by_package_level($user_id,$level,$package_amount) {
		$this->db->select('COUNT(*) as users_count');
		$this->db->from('referrals');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->join('active_shelters', 'active_shelters.user_id = referrals.user_id');
		$this->db->where('referrals.'.$level, $user_id);
		$this->db->where('users.is_vip', 1);
		$this->db->where('active_shelters.status', 'active');
		$this->db->where('active_shelters.amount', $package_amount);
		$query = $this->db->get();

		return $query->row()->users_count;
	}
	
	public function count_activated_users_referred_by_level($user_id,$level) {
        $this->db->select('COUNT(users.id) as vip_users_count');
        $this->db->from('users');
        $this->db->join('referrals', 'users.id = referrals.user_id');
        $this->db->join('active_shelters', 'users.id = active_shelters.user_id');
        $this->db->where('users.is_vip', 1);
        $this->db->where('active_shelters.status', 'active');
        $this->db->where('referrals.'.$level, $user_id);
        $query = $this->db->get();
        return $query->row()->vip_users_count;
	}
	
	public function get_vip_users_with_active_shelters() {
        $this->db->select('users.*');
        $this->db->from('users');
        $this->db->join('active_shelters', 'users.id = active_shelters.user_id');
        $this->db->where('users.is_vip', 1);
        $this->db->where('active_shelters.status', 'active');
        
        $query = $this->db->get();
        return $query->result();
    }
	
	public function get_vip_users_with_specific_amount($amount) {
        $this->db->select('users.*');
        $this->db->from('users');
        $this->db->join('active_shelters', 'users.id = active_shelters.user_id');
        $this->db->where('users.is_vip', 1);
        $this->db->where('active_shelters.amount', $amount);
        
        $query = $this->db->get();
        return $query->result();
    }
	
	public function count_vip_users_with_active_shelters() {
        $this->db->from('users');
        $this->db->join('active_shelters', 'users.id = active_shelters.user_id');
        $this->db->where('users.is_vip', 1);
        $this->db->where('active_shelters.status', 'active');
        
        return $this->db->count_all_results();
    }
	
	public function search_users($search_term) {
        $this->db->like('firstname', $search_term);
		$this->db->like('lastname', $search_term);
        $this->db->or_like('email', $search_term);
        $query = $this->db->get('users');
        return $query->result();
    }
	
	public function remove_duplicates() {
        $sql = "
            DELETE t1 FROM payments t1
            INNER JOIN payments t2 
            WHERE 
                t1.id < t2.id AND 
                t1.user_id = t2.user_id;
        ";

        $this->db->query($sql);
		
		 $sql2 = "
            DELETE t1 FROM upgrade_payments t1
            INNER JOIN upgrade_payments t2 
            WHERE 
                t1.id < t2.id AND 
                t1.user_id = t2.user_id;
        ";

        $this->db->query($sql2);
    }
	
	public function remove_kyc_duplicates() {
        $sql = "
            DELETE t1 FROM kyc_data t1
            INNER JOIN kyc_data t2 
            WHERE 
                t1.id < t2.id AND 
                t1.user_id = t2.user_id;
        ";

        $this->db->query($sql);
    }

    public function insert_data($table, $data) {
        // Insert data into the specified table
        $this->db->insert($table, $data);

        // Return the ID of the inserted record
        return $this->db->insert_id();
    }
	
	public function convertBankCode($bankcode){
        $this->db->select('*');
        $this->db->from('nigerian_banks');
        $this->db->where('bank_code = ',$bankcode);
        $query = $this->db->get();
        $count = $query->num_rows();
        return $query->row();
     }
    
    public function count_referral_matches($table1, $table2, $my_user_id) {
    $this->db->select('COUNT(*) as count');
    $this->db->from($table1);
    $this->db->join($table2, "$table1.user_id = $table2.user_id");
    $this->db->where("$table1.referred_by", $my_user_id);

    $query = $this->db->get();

    if ($query->num_rows() > 0) {
        $result = $query->row();
        return $result->count;
    } else {
        return 0;
    }
}
	
	public function getInfoCondition($table,$key, $user,$condition){
        $this->db->where($key, $user);
        $this->db->where($condition);
        $query = $this->db->get($table);
        return $query->row();
    }
    
     // Function to check if a user has purchased a specific post
    public function hasPurchasedPost($user_id, $post_id) {
        // Fetch data from the 'purchased_posts' table where both user_id and post_id match
        $this->db->select('*');
        $this->db->from('purchased_posts');
        $this->db->where('user_id', $user_id);
        $this->db->where('post_id', $post_id);
        
        // Execute the query
        $query = $this->db->get();
        
        // If the query returns at least one row, the post is purchased
        if ($query->num_rows() > 0) {
            return true; // Post is purchased
        } else {
            return false; // Post is not purchased
        }
    }
	
	public function getTop100() {
		  // List of user IDs to exclude
        $excluded_user_ids = array(1, 2,3,4,5,67); // Example: User IDs to exclude

       /* // Subquery to calculate referral count per referred_by
        $this->db->select('referrals.referred_by AS userid, COUNT(*) as referral_count');
        $this->db->from('referrals');
		$this->db->where('referrals.referral_date >=', '2024-05-01 00:00:00');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->where('users.is_vip',1);
        $this->db->group_by('referrals.referred_by');
        $this->db->order_by('referral_count', 'desc');
        
        // Exclude specified user IDs
        if (!empty($excluded_user_ids)) {
            $this->db->where_not_in('referred_by', $excluded_user_ids);
        }

        $this->db->limit(10);
        $query = $this->db->get();

        return $query->result_array();*/
		
		$this->db->select('referrals.referred_by AS userid, COUNT(referrals.user_id) as referral_count');
		$this->db->from('referrals');
		$this->db->join('users', 'users.id = referrals.user_id');
		$this->db->where('users.is_vip', 1);
		$this->db->where_not_in('referrals.referred_by', $excluded_user_ids);
		$this->db->group_by('referrals.referred_by');
		$this->db->order_by('referral_count', 'desc');
		//$this->db->limit(10);
		$query = $this->db->get();
		return $query->result_array();

    }
	
	public function getTop100_winner() {
		  // List of user IDs to exclude
        $excluded_user_ids = array(1, 2,3,4,5,67); // Example: User IDs to exclude

        // Subquery to calculate referral count per referred_by
        $this->db->select('referred_by AS user_id, COUNT(*) as referral_count');
        $this->db->from('referrals');
		$this->db->where('referral_date >=', '2024-05-13 00:00:00');
        $this->db->group_by('referred_by');
        $this->db->order_by('referral_count', 'desc');
        
        // Exclude specified user IDs
        if (!empty($excluded_user_ids)) {
            $this->db->where_not_in('referred_by', $excluded_user_ids);
        }

        $this->db->limit(1);
        $query = $this->db->get();

        return $query->result_array();
    }

    public function select_all_random($table) {
     $this->db->order_by('RAND()');
     $query = $this->db->get($table);
     return $query->result();
    }
    
    public function get_random_item($table) {
    $this->db->select('*');
    $this->db->from($table);
    $this->db->order_by('RAND()');
    $this->db->limit(1);

    $query = $this->db->get();
    return $query->row();
} 
    
    public function get_single_item($table,$conditions) {
    $this->db->select('*');
    $this->db->from($table);
    $this->db->where($conditions);
    $this->db->order_by('RAND()');
    $this->db->limit(1);
    $query = $this->db->get();
    return $query->row();
}

    public function get_count($table,$conditions){        
        $this->db->select('*');
        $this->db->from($table);
        $this->db->where($conditions);
        $query = $this->db->get();
        $count = $query->num_rows();
        return $count;
    }
    
    public function getSum($table,$param,$conditions) {
        $this->db->select_sum($param);
        $this->db->where($conditions);
        $result = $this->db->get($table)->row();  
        return $result->$param; 
    }
    
	public function getTotalSum($table,$param) {
        $this->db->select_sum($param);
        $result = $this->db->get($table)->row();  
        return $result->$param; 
    }
	
	public function get_users_with_non_empty_column_excluding_ids($table, $wallet_column, $exclude_ids = []){
        $this->db->select('*'); // Select all columns
        
        // Condition to ensure wallet is not empty
        $this->db->where("$wallet_column >", 0);

        // Exclude specified IDs
        if (!empty($exclude_ids)) {
            $this->db->where_not_in('id', $exclude_ids); // Assuming 'id' is the column name
        }

        $query = $this->db->get($table);
        return $query->result(); 
    }
	
	public function get_sum_excluding_ids($param, $table, $exclude_ids = []) {
        $this->db->select_sum($param);
        
        // Exclude specified IDs
        if (!empty($exclude_ids)) {
            $this->db->where_not_in('id', $exclude_ids); // Assuming 'id' is the column name
        }

        $result = $this->db->get($table)->row();
        return $result->$param; 
    }
	
    public function update_data($table, $data, $condition){
        $this->db->update($table, $data, $condition);
        $affectedRows = $this->db->affected_rows();
        
        if ($affectedRows > 0) {
        // Fetch the updated row ID
            $this->db->select('id');
            $this->db->where($condition);
            $query = $this->db->get($table);
    
            if ($query->num_rows() > 0) {
                $updatedRow = $query->row();
                return $updatedRow->id;
            }
        }
        
        return false;

    }
    
    public function get_user_by_ssn($ssn) {
        $this->db->where('ssc', $ssn);
        $query = $this->db->get('users'); 
        if ($query->num_rows() > 0) {
            return $query->row();
        }
        return false; 
    }
    
    public function select_all($table, $conditions = array()){
        $this->db->select('*');
        $this->db->from($table);

        if (!empty($conditions)) {
            $this->db->where($conditions);
        }
        $query = $this->db->get();
        return $query->result();
    }
    
    public function select_all_data($table){
        $this->db->select('*');
        $this->db->from($table);
        $this->db->order_by('id', 'DESC');
        $query = $this->db->get();
        return $query->result();
    }
    
    public function select_by_id($table, $id){
        // Perform a SELECT query to get the row with the given ID
        $query = $this->db->get_where($table, array('id' => $id));

        // Return the result as an object
        return $query->row();
    }
    
    public function saveReceiptPath($file_path,$userId,$type,$amount) {
        // Save file path to the database
        // Assuming you have a 'payments' table with a 'receipt_path' column
        $data = array(
            'receipt_path' => $file_path,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount
            // Add other fields as needed
        );

        $this->db->insert('payments', $data);
    }
	
	
	public function saveWalletReceiptPath($file_path,$userId,$type,$amount,$funding_id) {
        // Save file path to the database
        $data = array(
            'receipt_path' => $file_path,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount,
			'funding_id'=>$funding_id
            // Add other fields as needed
        );

        $this->db->insert('wallet_payments', $data);
    }
	
	public function saveReceiptPath_donor($file_path,$userId,$type,$amount) {
        // Save file path to the database
        // Assuming you have a 'payments' table with a 'receipt_path' column
        $data = array(
            'receipt_path' => $file_path,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount
            // Add other fields as needed
        );

        $this->db->insert('donor_payments', $data);
    }
	
	public function saveReceiptPath_upgrade($file_path,$userId,$type,$amount) {
        // Save file path to the database
        // Assuming you have a 'payments' table with a 'receipt_path' column
        $data = array(
            'receipt_path' => $file_path,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount,
			//'date_uploaded'=>date('Y-m-d H:i:s')
            // Add other fields as needed
        );

        $this->db->insert('upgrade_payments', $data);
    }
    
    public function studentReceiptPath($file_path1,$file_path2,$userId,$type,$amount) {
        $data = array(
            'receipt_path' => $file_path1,
            'id_card'=>$file_path2,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount,
            'date_uploaded'=>date('Y-m-d H:i:s')
        );

        $this->db->insert('student_payments', $data);
    }
    
    public function saveReceiptPathMerch($file_path,$userId,$type,$amount) {
        // Save file path to the database
        $data = array(
            'receipt_path' => $file_path,
            'user_id'=>$userId,
            'type'=>$type,
            'amount'=>$amount,
			'date_uploaded'=>date('Y-m-d H:i:s')
            // Add other fields as needed
        );

        $this->db->insert('merch_payments', $data);
    }
    
    public function getInfo($table,$key, $user){
        $query = $this->db->get_where($table, array($key => $user));
        return $query->row();
    }
    
    public function getInfo_channel($table,$key, $user){
        $query = $this->db->order_by('id', 'DESC')->get_where($table, array($key => $user));
        return $query->row();
    }
    
    public function get_by_condition($table, $condition) {
        $this->db->where($condition);
        $query = $this->db->get($table);

        if ($query->num_rows() > 0) {
            return $query->row();
        } else {
            return null;
        }
    }
    
    public function select_where($table, $condition) {
        $this->db->where($condition);
        $query = $this->db->get($table);

        if ($query->num_rows() > 0) {
            return $query->result();
        } else {
            return array(); // or null, depending on your preference
        }
    }
    
    public function transaction_select_where($table, $condition) {
        $this->db->where($condition);
        $this->db->order_by('id', 'DESC');
        $query = $this->db->get($table);

        if ($query->num_rows() > 0) {
            return $query->result();
        } else {
            return array(); // or null, depending on your preference
        }
    }
    
    public function transaction_select_where_limit($table, $condition, $limit, $param) {
        $this->db->where($condition);
        $this->db->order_by($param, 'DESC');
        $this->db->limit($limit);
        $query = $this->db->get($table);

        if ($query->num_rows() > 0) {
            return $query->result();
        } else {
            return array(); // or null, depending on your preference
        }
    }
	
	public function get_notification_limit(){
		$this->db->select('*');
		$this->db->from('notifications');
		$this->db->order_by('id','DESC');
		$this->db->limit(4);
		$query = $this->db->get();
        return $query->result();
	}
	
	public function get_blog_limit(){
		$this->db->select('*');
		$this->db->from('tbl_blog');
		$this->db->order_by('id','DESC');
		$this->db->limit(4);
		$query = $this->db->get();
        return $query->result();
	}
    
    public function getCountdownData() {
        // Adjust the table name if needed
        $tableName = 'activation_countdown';

        // Fetch the countdown data from the database
        $query = $this->db->get($tableName);

        // Return the result as an associative array
        return $query->row_array();
    }
    
    public function get_total_referred_ids_by_month_and_user($year, $month, $user) {
    $query = $this->db->query("
        SELECT COUNT(referred_id) AS total_referred_ids
        FROM referrers
        WHERE YEAR(referrer_date) = ? 
        AND MONTH(referrer_date) = ?
        AND referrer_id = ?
    ", array($year, $month, $user));
    $result = $query->row();
    if ($result) {
        return $result->total_referred_ids;
    } else {
        return 0;
    }
}

    public function convert_currency($currencyFrom,$amount){
        if($currencyFrom == 1){
            $rate = $this->getInfo('currency_management','id',$currencyFrom)->rate;
            $converted = number_format(($amount * $rate),2);
        }else{
            $converted = number_format($amount,2);
        }
        
        return $converted;
    }
    
    public function convert_currencyk($currencyFrom,$amount){
        if($currencyFrom == '$'){
            $rate = $this->getInfo('currency_management','id',$currencyFrom)->rate;
            $converted = number_format(($amount * $rate)/1000,2);
        }else{
            $converted = number_format(($amount/1000),2).'k';
        }
        
        return $converted;
    }
    
    public function reset_currency($amount){
        $rate = $this->getInfo('currency_management','id', 1)->rate;
        $converted = ($amount / $rate);
        return $converted;
    }
    
    public function get_countries(){
        $this->db->select('*');
        $this->db->from('tbl_country_table');
        $this->db->order_by('country_name',"ASC");
        $query = $this->db->get();
        return $query->result();
    }
    
    public function get_states($cid){
        $this->db->select('*');
        $this->db->from('tbl_states');
        $this->db->where('country_id',$cid);
        $this->db->order_by('name',"ASC");
        $query = $this->db->get();
        return $query->result();
    }
    
    public function get_cities($sid){
        $this->db->select('*');
        $this->db->from('tbl_city');
        $this->db->where('state_id',$sid);
        $this->db->order_by('name',"ASC");
        $query = $this->db->get();
        return $query->result();
    }
    
    public function get_notifications($user_id) {
        // Retrieve notifications for a specific user
        $this->db->where('user_id', $user_id);
        return $this->db->get('notifications')->result();
    }
    
    public function get_unread_count($user_id) {
        $this->db->from('user_notifications');
		$this->db->where('user_id', $user_id);
		$this->db->where('is_read', 0);
		return $this->db->count_all_results();
    }
	
	public function assign_notification_to_users($notification_id, $user_ids) {
        $data = array();
        foreach ($user_ids as $user_id) {
            $data[] = array(
                'notification_id' => $notification_id,
                'user_id' => $user_id
            );
        }
        $this->db->insert_batch('user_notifications', $data);
    }

    public function get_unread_notifications($user_id) {
        $this->db->select('n.id, n.title, n.created_at, n.message, n.link, n.type, un.id as user_notification_id');
        $this->db->from('notifications n');
        $this->db->join('user_notifications un', 'n.id = un.notification_id');
        $this->db->where('un.user_id', $user_id);
        $this->db->where('un.is_read', 0);
        $query = $this->db->get();
        return $query->result_array();
    }

    public function mark_as_read($user_notification_id,$userid) {
        $this->db->where('notification_id', $user_notification_id);
		$this->db->where('user_id',$userid);
        $this->db->update('user_notifications', array('is_read' => 1));
    }
	
	/**public function get_users($limit, $offset, $search, $order) {
        $this->db->like('username', $search);
        $this->db->or_like('email', $search);
		$this->db->or_like('firstname', $search);
		$this->db->or_like('lastname', $search);
        $this->db->order_by($order['column'], $order['dir']);
        $query = $this->db->get('users', $limit, $offset);
        return $query->result();
    }**/
    
    public function get_users($limit, $offset, $search, $order) {
    // Enforce reasonable limit to prevent large result sets
    $limit = min((int)$limit, 100); // Cap at 100 rows
    $offset = max((int)$offset, 0); // Ensure non-negative offset

    // Select minimal columns
    $this->db->select('id, firstname, lastname, mobile, gender, address, username, email,  created_at');

    // Sanitize search
    $search = $this->db->escape_like_str(trim($search));
    if (!empty($search)) {
        $this->db->where("(username LIKE '%$search%' 
                          OR email LIKE '%$search%' 
                          OR firstname LIKE '%$search%' 
                          OR lastname LIKE '%$search%')", NULL, FALSE);
    }

    // Validate order
    $valid_columns = ['id', 'firstname', 'lastname', 'mobile', 'gender', 'address', 'username', 'email', 'created_at'];
    $order_column = in_array($order['column'], $valid_columns) ? $order['column'] : 'id';
    $order_dir = strtoupper($order['dir']) === 'DESC' ? 'DESC' : 'ASC';
    $this->db->order_by($order_column, $order_dir);

    // Execute query with limit and offset
    $query = $this->db->get('users', $limit, $offset);

    // Process results incrementally
    $results = [];
    while ($row = $query->unbuffered_row('array')) {
        $results[] = $row;
    }

    // Free result explicitly
    $query->free_result();

    return $results;
}
    
	public function get_users_inactive($limit, $offset, $search, $order) {
        $this->db->group_start();
		$this->db->like('username', $search);
		$this->db->or_like('email', $search);
		$this->db->or_like('firstname', $search);
		$this->db->or_like('lastname', $search);
		$this->db->group_end();
		$this->db->where('is_vip', 0);
		$this->db->order_by($order['column'], $order['dir']);
		$query = $this->db->get('users', $limit, $offset);
		return $query->result();

    }
	
	public function get_users_active($limit, $offset, $search, $order) {
        $this->db->group_start();
		$this->db->like('username', $search);
		$this->db->or_like('email', $search);
		$this->db->or_like('firstname', $search);
		$this->db->or_like('lastname', $search);
		$this->db->group_end();
		$this->db->where('is_vip', 1);
		$this->db->order_by($order['column'], $order['dir']);
		$query = $this->db->get('users', $limit, $offset);
		return $query->result();

    }
	
	public function get_products($limit, $offset, $search, $order) {
        $this->db->like('description', $search);
        $this->db->or_like('product_name', $search);
        $this->db->order_by($order['column'], $order['dir']);
        $query = $this->db->get('store_products', $limit, $offset);
        return $query->result();
    }
	
	public function count_all_products() {
        return $this->db->count_all('store_products');
    }
	
	public function count_filtered_products($search) {
        $this->db->like('description', $search);
        $this->db->or_like('product_name', $search);
        $query = $this->db->get('store_products');
        return $query->num_rows();
    }
	
	public function get_store_products($store_id, $limit, $offset, $search, $order) {
		$this->db->where('pickup_center_id', $store_id);  // Filter by store ID
		$this->db->group_start();  // Start grouping for LIKE conditions
		$this->db->like('product_name', $search);
		$this->db->or_like('price', $search);
		$this->db->or_like('description', $search);
		$this->db->group_end();  // End grouping for LIKE conditions
		$this->db->order_by($order['column'], $order['dir']);
		$query = $this->db->get('store_products', $limit, $offset);
		return $query->result();
 }	
	
	public function get_centers($limit, $offset, $search, $order) {
        $this->db->like('merchant_name', $search);
        $this->db->or_like('merchant_email', $search);
		$this->db->or_like('merchant_phone', $search);
		$this->db->or_like('user_id', $search);
        $this->db->order_by($order['column'], $order['dir']);
        $query = $this->db->get('merchants', $limit, $offset);
        return $query->result();
    }

    public function count_all_users() {
        return $this->db->count_all('users');
    }
	
	 public function count_all_users_inactive() {
		$this->db->where('is_vip', 1);
		return $this->db->from('users')->count_all_results();

    }
	
	 public function count_all_users_active() {
		$this->db->where('is_vip', 0);
		return $this->db->from('users')->count_all_results();
    }
	
	public function count_all_store_products($store_id) {
		$this->db->where('pickup_center_id', $store_id);
		return $this->db->count_all_results('store_products');
	}
	
	public function count_all_centers() {
        return $this->db->count_all('merchants');
    }

    public function count_filtered_users($search) {
        $this->db->like('username', $search);
        $this->db->or_like('email', $search);
        $query = $this->db->get('users');
        return $query->num_rows();
    }
	
	 public function count_filtered_users_active($search) {
        $this->db->group_start();
		$this->db->like('username', $search);
		$this->db->or_like('email', $search);
		$this->db->group_end();
		$this->db->where('is_vip', 1);
		$query = $this->db->get('users');
		return $query->num_rows();

    }
	
	 public function count_filtered_users_inactive($search) {
        $this->db->group_start();
		$this->db->like('username', $search);
		$this->db->or_like('email', $search);
		$this->db->group_end();
		$this->db->where('is_vip', 0);
		$query = $this->db->get('users');
		return $query->num_rows();

    }
	
	public function count_filtered_store_products($store_id, $search) {
    $this->db->where('pickup_center_id', $store_id);
    $this->db->group_start();  // Start grouping for LIKE conditions
    $this->db->like('product_name', $search);
    $this->db->or_like('price', $search);
    $this->db->or_like('description', $search);
    $this->db->group_end();  // End grouping for LIKE conditions
    $query = $this->db->get('store_products');
    return $query->num_rows();
}
	
	public function count_filtered_centers($search) {
        $this->db->like('merchant_name', $search);
        $this->db->or_like('merchant_email', $search);
        $query = $this->db->get('merchants');
        return $query->num_rows();
    }
	
	public function get_table($table, $like1, $like2,$limit, $offset, $search, $order) {
        $this->db->like($like1, $search);
        $this->db->or_like($like2, $search);
        $this->db->order_by($order['column'], $order['dir']);
        $query = $this->db->get($table, $limit, $offset);
        return $query->result();
    }
	
	public function count_all_table($table) {
        return $this->db->count_all($table);
    }
	
	public function count_filtered_table($table,$like1,$like2,$search) {
        $this->db->like($like1, $search);
        $this->db->or_like($like2, $search);
        $query = $this->db->get($table);
        return $query->num_rows();
    }
	
	
	public function get_table_user($param, $id, $table, $like1, $like2, $limit, $offset, $search, $order) {
		$this->db->where($param, $id);
		$this->db->group_start(); // start grouping
		$this->db->like($like1, $search);
		$this->db->or_like($like2, $search);
		$this->db->group_end(); // end grouping
		$this->db->order_by($order['column'], $order['dir']);
		$query = $this->db->get($table, $limit, $offset);
		// Debugging: echo the last query
		//echo $this->db->last_query();
		return $query->result();
	}

	
	public function count_all_table_user($param, $id, $table) {
		$this->db->where($param, $id);
		$result = $this->db->count_all_results($table);
		// Debugging: echo the last query
		//echo $this->db->last_query();
		return $result;
	}


	
	public function count_filtered_table_user($param, $id, $table, $like1, $like2, $search) {
		$this->db->where($param, $id);
		$this->db->group_start(); // start grouping
		$this->db->like($like1, $search);
		$this->db->or_like($like2, $search);
		$this->db->group_end(); // end grouping
		$query = $this->db->get($table);
		// Debugging: echo the last query
		//echo $this->db->last_query();
		return $query->num_rows();
	}


}
