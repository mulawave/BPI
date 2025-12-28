<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class AuthController extends CI_Controller {
 
     public function __construct() {
        parent::__construct();
        $this->load->helper(array('url', 'form', 'string', 'time_helper', 'captcha'));
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
        $this->load->model('user_model');
    }

    public function register() {
        $referral_code = $this->input->get('ref');
        if(!empty($referral_code)){
            $this->load->view('register', array('referral_code' => $referral_code));
        }else{
            $referral_code = 1;
            $this->load->view('register', array('referral_code' => $referral_code));
        }
        //?ref=your_referral_code
    }
    
    public function generate_captcha_image() {
        log_message('debug', 'generate_captcha_image method called');
        
        // Check if GD library is available
        if (!function_exists('imagecreatetruecolor')) {
            log_message('error', 'GD library is not enabled');
            show_error('GD library is required for CAPTCHA generation', 500);
        }
        
        // Check if captcha helper is loaded
        if (!function_exists('generate_captcha')) {
            log_message('error', 'CAPTCHA helper not loaded');
            show_error('CAPTCHA helper not loaded', 500);
        }
        
        $captcha_image = generate_captcha();
        if ($captcha_image === FALSE) {
            log_message('error', 'Failed to generate CAPTCHA image');
            show_error('Failed to generate CAPTCHA image', 500);
        }
        
        header('Content-Type: image/png');
        echo base64_decode($captcha_image);
    }
    
    public function validate_ssc() {
        header('Content-Type: application/json');

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        $ssc = isset($input['ssc']) ? trim($input['ssc']) : '';

        // Validate input
        if (empty($ssc)) {
            echo json_encode([
                'status' => 'error',
                'message' => 'SSC is required'
            ]);
            return;
        }

        // Sanitize SSC
        $ssc = $this->db->escape_str($ssc);

        // Query users table
        $this->db->select('id, firstname, lastname, ssc, email, profile_pic, wallet, token, cashback, spendable, palliative');
        $this->db->from('users');
        $this->db->where('ssc', $ssc);
        $this->db->where('solar_agent', 1);
        $query = $this->db->get();

        if ($query->num_rows() > 0) {
            $user = $query->row_array();
            echo json_encode([
                'status' => 'success',
                'data' => $user
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid SSC or not a solar agent'
            ]);
        }
    }

    public function registration_success(){
        $this->load->view('registration_success');
    }
    
    public function validate_captcha($user_input) {
        $captcha_answer = $this->session->userdata('captcha_answer');
        log_message('debug', 'CAPTCHA Answer: ' . $captcha_answer . ', User Input: ' . $user_input);
        return $user_input == $captcha_answer;
    }
    
    public function check_captcha($user_input) {
        if ($this->validate_captcha($user_input)) {
            return TRUE;
        } else {
            $this->form_validation->set_message('check_captcha', 'Incorrect CAPTCHA answer.');
            return FALSE;
        }
    }

     public function process_registration() {
        $this->form_validation->set_rules('firstname', 'First Name', 'required');
        $this->form_validation->set_rules('lastname', 'Last Name', 'required');
        $this->form_validation->set_rules('username', 'Username', 'required');
        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        $this->form_validation->set_rules('password', 'Password', 'required');
        $this->form_validation->set_rules('confirm_password', 'Confirm Password', 'required|matches[password]');
        $this->form_validation->set_rules('gender', 'Gender', 'required');
        $this->form_validation->set_rules('terms', 'Terms of Service', 'required');
        $this->form_validation->set_rules('captcha', 'CAPTCHA', 'required|callback_check_captcha');
        $referral_code = $this->input->post('ref');

        if ($this->form_validation->run() === FALSE) {
            $this->load->view('register', array('referral_code' => $referral_code));
        } else {
            // Check database for duplicate
            $emailCheck = $this->generic_model->getInfo('users', 'email', $this->input->post('email'));
            $usernameCheck = $this->generic_model->getInfo('users', 'username', $this->input->post('username'));
            if (!empty($emailCheck) || !empty($usernameCheck)) {
                $this->session->set_flashdata('error', 'Duplicate record found for email or username');
                redirect('register');
            } else {
                $to = $this->input->post('email');
                $subject = 'BPI - Email Verification Required';
                $verification_code = substr(md5(uniqid(mt_rand(), true)), 0, 9);
                $trimmed_link = base_url('verify_email/' . $verification_code);
                $title = 'Dear ' . $this->input->post('firstname');
                $message = '<p>Thank you for registering with BeepAgro Palliative Initiative (BPI).<br> To complete your registration and gain access to our platform\'s features and services,<br> we need to verify your email address.</p>
                           <p>Please follow the steps below to verify your email:<br>Click on the button below to verify your email address:</p>
                           <p>
                           <a href="' . $trimmed_link . '" target="_blank">
                           <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Verify Your Email</button>
                           </a>
                           </p>
                           <br>
                           <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
                            Our support team is here to help you with any concerns you may have.<br>
                            Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
                            We look forward to having you as a valued member of our community.<br><br>
                            Best regards,<br>
                            BeepAgro Palliative Initiative (BPI) Team.</p>';

                $this->sendemail($title, $to, $subject, $message);
                
                // Save the verification code and set verified to false in the database
                $data = array(
                    'firstname' => $this->input->post('firstname'),
                    'lastname' => $this->input->post('lastname'),
                    'username' => $this->input->post('username'),
                    'email' => $this->input->post('email'),
                    'password' => password_hash($this->input->post('password'), PASSWORD_BCRYPT),
                    'gender' => $this->input->post('gender'),
                    'user_type' => 'user',
                    'verification_code' => $verification_code,
                    'referral_link' => $this->generate_referral_link(),
                    'default_currency' => 2,
                    'pass_completed' => 1,
                    'verified' => FALSE
                );
                $this->db->insert('users', $data);
                $user_id = $this->db->insert_id();

                $created = date('Y-m-d H:i:s');
                if (empty($referral_code)) {
                    $referred_by = 1;
                    $level_1 = 1;
                    $level_2 = 1;
                    $level_3 = 1;
                    $level_4 = 1;
                    $level_5 = 1;
                    $level_6 = 1;
                    $level_7 = 1;
                    $level_8 = 1;
                    $level_9 = 1;
                    $level_10 = 1;

                    $referralData = array(
                        'user_id' => $user_id,
                        'referred_by' => $referred_by,
                        'level_1' => $level_1,
                        'level_2' => $level_2,
                        'level_3' => $level_3,
                        'level_4' => $level_4,
                        'level_5' => $level_5,
                        'level_6' => $level_6,
                        'level_7' => $level_7,
                        'level_8' => $level_8,
                        'level_9' => $level_9,
                        'level_10' => $level_10,
                        'referral_date' => $created
                    );
                    $this->generic_model->insert_data('referrals', $referralData);

                    $ref_tracker = array(
                        'referrer_id' => 1,
                        'referred_id' => $user_id,
                        'referrer_date' => date('Y-m-d H:i:s')
                    );
                    $this->generic_model->insert_data('referrers', $ref_tracker);
                } else {
                    $isrefcode = $this->user_model->getReferralId($referral_code);
                    $referrer = $isrefcode->id;
                    $refGen = $this->user_model->getReferrerID($referrer);

                    $referred_by = $referrer;
                    $level_1 = $refGen->referred_by;
                    $level_2 = $refGen->level_1;
                    $level_3 = $refGen->level_2;
                    $level_4 = $refGen->level_3;
                    $level_5 = $refGen->level_4;
                    $level_6 = $refGen->level_5;
                    $level_7 = $refGen->level_6;
                    $level_8 = $refGen->level_7;
                    $level_9 = $refGen->level_8;
                    $level_10 = $refGen->level_9;

                    $referralData = array(
                        'user_id' => $user_id,
                        'referred_by' => $referred_by,
                        'level_1' => $level_1,
                        'level_2' => $level_2,
                        'level_3' => $level_3,
                        'level_4' => $level_4,
                        'level_5' => $level_5,
                        'level_6' => $level_6,
                        'level_7' => $level_7,
                        'level_8' => $level_8,
                        'level_9' => $level_9,
                        'level_10' => $level_10,
                        'referral_date' => $created
                    );
                    $this->generic_model->insert_data('referrals', $referralData);

                    $ref_tracker = array(
                        'referrer_id' => $referrer,
                        'referred_id' => $user_id,
                        'referrer_date' => date('Y-m-d H:i:s')
                    );
                    $this->generic_model->insert_data('referrers', $ref_tracker);
                }
                redirect('registration_success');
            }
        }
    }
    
    
        // Helper function to get the user by referral code
    private function get_user_by_referral_code($referral_code) {
        return $this->user_model->get_user_by_referral_code($referral_code);
    }
    
    // Helper function to generate a unique referral link
    private function generate_referral_link() {
        return $this->user_model->generate_unique_referral_link();
    }
    
    // Helper function to handle the referral system
    private function handle_referral_system($referring_user, $referred_user_id) {
        if ($referring_user) {
            $this->user_model->update_referral_levels($referring_user->id, $referred_user_id);
        }
    }
    
    public function email_verified($message){
        $data['message'] = urldecode($message);
        $this->load->view('email_verified',$data);
    }
    
    public function verify_email($verification_code) {
        $user = $this->db->get_where('users', array('verification_code' => $verification_code))->row();
    
        if ($user) {
            // Update user as verified
            $this->db->where('id', $user->id);
            $this->db->update('users', array('verified' => TRUE, 'verification_code' => NULL));
            
            //send verified email confirmation......
             $title = 'Dear  '.$user->firstname;
             $to = $user->email;
             $subject = 'BPI Account Verified (Tier 1)';
             $message = '<p>Thank you for verifying your email with BeepAgro Palliative Initiative (BPI).<br> Your account has achieved Tier 1 Verification Status<br><br>
             Next Step:<br>Login to your account and update your location settings to enable us match you with BPI activities, events and Pickup Centers closest to you.</p>
                               <p>
                               <a href="https://beepagro.com/app" target="_blank">
                               <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Login Here</button>
                               </a>
                               </p>
                               <br>
                               <p>If you have any questions or need further assistance, please don\'t hesitate to contact us at [support@beepagro.com].<br>
                    			 Our support team is here to help you with any concerns you may have.<br>
                    			 Thank you for choosing BeepAgro Palliative Initiative (BPI). <br>
                    			 We look forward to having you as a valued member of our community.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';

                         $this->sendemail($title,$to,$subject,$message);
            
            $message = 'Email verification successful. You can now <a href="'.base_url('login').'">Login</a>';
            $this->email_verified($message);
        } else {
            $message = 'Invalid verification code.';
            $this->email_verified($message);
        }
    }
    
    public function process_login() { 
    $this->load->library('form_validation');
    $this->form_validation->set_rules('email', 'Email', 'trim|required|valid_email');
    $this->form_validation->set_rules('password', 'Password', 'trim|required');

    if ($this->form_validation->run() === FALSE) {
         $this->session->set_flashdata('error', validation_errors()); 
         $this->login();
    } else {
        $email = $this->input->post('email');
        $password = $this->input->post('password');
		

        $user = $this->db->get_where('users', array('email' => $email, 'verified' => TRUE))->row();
        if($user->pass_completed == 0){
            $this->session->set_flashdata('error', 'Compulsory Password Reset! Please Reset Your Password to Login'); 
            redirect('forgot_password');
        }else{
             if ($user && password_verify($password, $user->password)) {
            // Set session data or perform other authentication logic
            $this->session->set_userdata('user_id', $user->id);

            // Fetch user details
            $user_details = $this->db->get_where('users', array('id' => $user->id))->row();
			
			

            // Set user details in session (optional)
            $this->session->set_userdata('user_details', $user_details);
            
            $login_time = date("Y-m-d H:i:s"); 
            $user_agent = $_SERVER['HTTP_USER_AGENT'];
            $device = $this->getDeviceType($user_agent); 
            $user_ip = $_SERVER['REMOTE_ADDR'];
            $location = $user_ip; //$this->getLocationFromIP($user_ip);
            
            //save tracker
            $login_activity = array(
                'user_id'=>$user->id,
                'login_time'=>$login_time,
                'location'=>$location,
                'device'=>$device    
            );
            $this->generic_model->insert_data('login_activity',$login_activity);
            
			
            
            //send login confirmation
            $title = 'Dear  '.$user_details->firstname;
             $to = $user_details->email;
             $subject = 'BPI Account Login Notification';
             $message = 
             '<p>
                We hope this email finds you well.<br>
                We wanted to inform you that there has been a recent login activity detected on your account.
                Your security is our top priority, and we want to ensure that you are aware of any activity
                related to your account for transparency and safety measures.<br><br>
                
                <strong>Login Details</strong>:
                <ul>
                <li>Date and Time: ['.$login_time.']</li>
                <li>Location: ['.$location.']</li>
                <li>Device: ['.$device.']</li>
                </ul>
                <br><br>
                If you recognize this login activity and it was indeed initiated by you, there is no further action needed on your part.
                However, if you suspect any unauthorized access or if this login was not initiated by you,
                please take immediate action to secure your account.<br><br>
                
                <strong>What Can You Do?</strong>:
                <ol>
                <li>Change your password immediately if you suspect unauthorized access.</li>
                <li>Enable two-factor authentication for an extra layer of security.</li>
                <li>Review your account activity regularly to ensure its integrity.</li>
                </ol>
                <br><br>
                If you have any concerns or questions regarding this login activity,
                please do not hesitate to contact our support team at [support@beepagro.com].
                We are here to assist you and ensure the security of your account.<br><br>
                Thank you for your attention to this matter.<br><br>

                Best regards,<br>
                BeepAgro Palliative Initiative (BPI) Team.</p>';

               // $this->sendemail($title,$to,$subject,$message);

            // Pass user details to the dashboard view
            $data['user_details'] = $user_details;
            $data['food_items'] = $this->food_model->get_food_items();
            $data['unread_count'] = $this->generic_model->get_unread_count($user->id);
            redirect('dashboard');
			
            } else {
            //$data['error'] = 'Invalid email or password';
            $this->session->set_flashdata('error', 'Invalid email or password');
            $this->login();
        } 
        }

        
    }
}
	
	private function generate_random_string($length = 3) {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $characters_length = strlen($characters);
        $random_string = '';
        for ($i = 0; $i < $length; $i++) {
            $random_string .= $characters[rand(0, $characters_length - 1)];
        }
        return $random_string;
    }
	
	private function generate_unique_code() {
        $unique_code = '';
        do {
            $prefix = $this->generate_random_string();
            $unique_number = mt_rand(100000, 999999);
            $suffix = $this->generate_random_string();
            $unique_code = "{$prefix}-{$unique_number}-{$suffix}";
        } while ($this->is_code_exists($unique_code));

        return $unique_code;
    }
	
	private function is_code_exists($code) {
        $this->db->where('ssc', $code);
        $query = $this->db->get('users');
        return $query->num_rows() > 0;
    }
	
    public function assign_code_to_user($user_id) {
        $unique_code = $this->generate_unique_code();
        $this->db->where('id', $user_id);
        return $this->db->update('users', ['ssc' => $unique_code]);
    }

    public function dashboard() {
        // Check if the user is logged in (you can use session data)
        if ($this->session->userdata('user_id')) {
            $userid = $this->session->userdata('user_id');
            $this->reset_session();
            $user_details = $this->session->userdata('user_details');
			
			//auto-Assign SSC..............
			$userinfo = $this->generic_model->getInfo('users','id',$userid);
			if(empty($userinfo->ssc) && !empty($userinfo->is_vip) && !empty($userinfo->is_shelter)){
				//generate and update ssc
				$this->assign_code_to_user($userid);
			}
            
            $transactions = $this->generic_model->transaction_select_where_limit('transaction_history',array('user_id'=>$userid),4,'id');
            $referrals = $this->generic_model->transaction_select_where_limit('referrals',array('referred_by'=>$userid),4,'referral_id');
            $tickets = $this->generic_model->select_where('philanthropy_tickets',array('status'=>'active'));
            $my_tickets = $this->generic_model->select_where('philanthropy_tickets',array('status'=>'claimed','used_by'=>$userid));
            $partner_offers = $this->generic_model->select_all_data('philanthropy_offers');
            
            $countdownData = $this->generic_model->getInfo('activation_countdown','user_id',$userid);
            // Get the current date and time
            $currentDate = new DateTime();
           
            if(!empty($countdownData)){
            $startDate = strtotime($countdownData->activated_date);
            $endDate = strtotime($countdownData->end_date);
            
            // Calculate the difference between end date and current date
            $interval = $endDate - $startDate;
            $daysLeft = floor($interval / (60 * 60 * 24));;
            }else{
                $startDate = 0;
                $endDate = 0;
                $interval = 0; 
                $daysLeft = 0;
            }
            
            $year = date("Y");
            $month = date("m");
            $total_referred_ids = $this->generic_model->get_total_referred_ids_by_month_and_user($year, $month,$userid);
            $shelter_active = $this->generic_model->getInfo('active_shelters','user_id',$userid);
            if(!empty($shelter_active)){
                //get shelter option and package
                $shelter_package = $this->generic_model->getInfo('packages','id',$shelter_active->shelter_package)->package_name;
                $shelter_option = $shelter_active->shelter_option;
                $shelter_option_amount = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->amount;
                $shelter_option_name = $this->generic_model->getInfo('shelter_program','id',$shelter_option)->name;
            }else{
                $shelter_package = '';
                $shelter_option = '';
                $shelter_option_amount = 0;
                $shelter_option_name = '';
            }
       // Pass the data to the view
			$shelters = $this->user_model->getAllData( 'shelter_program' );
      		$shelter_type = $this->user_model->getAllData( 'shelter_palliative_types' );
			$data['shelter'] = $shelters;
      		$data['shelter_type'] = $shelter_type;
            $data['shelter_package'] = $shelter_package;
            $data['shelter_option'] = $shelter_option;
            $data['shelter_option_amount'] = $shelter_option_amount;
            $data['shelter_option_name'] = $shelter_option_name;
            
            $data['daysLeft'] = $daysLeft;
            // Pass the data to the view
            $data['refQuota'] = $total_referred_ids;
            $data['plan'] =  $this->generic_model->select_by_id('market_prices', 1)->palliative_price;
            $data['countdownData'] = $countdownData;
            $data['referrals'] = $referrals;
            $data['results'] = $transactions;
            $data['myticket'] = $my_tickets;
            $data['tickets'] = $tickets;
            $data['partner_offers'] = $partner_offers;
            $data['user_details'] = $user_details;
            $data['food_items'] = $this->food_model->get_food_items();
            $data['unread_count'] = $this->generic_model->get_unread_count($userid);
            $data['blogs'] = $this->generic_model->get_blog_limit('tbl_blog');
            $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
            $this->load->view('dashboard',$data);
        } else {
            redirect('login'); // Redirect to login if not logged in
        }
    }

    public function login()	{
		$this->load->view('welcome_message');
	}
	
    public function logout() {
        $this->session->unset_userdata('user_id');
        redirect('login');
    }
    
    public function send_reset_link() {
        $this->load->library('form_validation');
        $this->form_validation->set_rules('email', 'Email', 'trim|required|valid_email');
    
        if ($this->form_validation->run() === FALSE) {
            $this->load->view('forgot_password');
        } else {
            $email = $this->input->post('email');
    
            // Validate if the email exists in the database
            $user = $this->db->get_where('users', array('email' => $email))->row();
    
            if ($user) {
                // Generate a unique token and store it in the database for this user
                $reset_token = bin2hex(random_bytes(32));
                $this->db->update('users', array('reset_token' => $reset_token), array('id' => $user->id));
    
                // Send an email with the reset link (using CodeIgniter's Email library)
                    $to = $email;
                    $reset_link = base_url('reset_password/' . $reset_token);
                    $subject = 'BPI - Password Reset Link';
                    $title = 'Dear  '.$user->firstname;
                    $message = '<p>We have received a request to reset the password associated with your account. <br>
                                To proceed with resetting your password, please follow the instructions below:</p>
                               <p>
                               <ol>
                                    <li>
                                        Click the button below to reset your password<br><br>
                                         <a href="'.$reset_link.'" target="_blank">
                                        <button style="background-color:#26A65B !important; color:#ffffff !important; padding: 20px 20px; border: none; border-radius: 5px; cursor: pointer;">Reset Password</button>
                                        </a>
                                    </li><br><br>

                                    <li>
                                        If the button above does not work, copy and paste the following URL into your web browser:<br>
                                        ['.$reset_link.']
                                    </li>
                                        
                               </ol>
                              
                               </p>
                               <br>
                               <p>Please note that this link is valid for a limited time period for security reasons. 
                               If you did not request a password reset or believe this was a mistake, please ignore this email. Your account remains secure.<br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';
                          $this->sendemail($title,$to,$subject,$message);
                          
                    // Display a success message or redirect to a success page
                    $data['message'] = 'A password reset link has been sent to your email address.';
                    $this->load->view('forgot_password_success', $data);
            } else {
                // Display an error message or redirect to the forgot password page with an error
                $data['error'] = 'Email not found. Please check your email address.';
                $this->load->view('forgot_password', $data);
            }
        }
    }

    public function reset_password() {
        $this->load->library('form_validation');
        $this->form_validation->set_rules('new_password', 'New Password', 'trim|required|min_length[6]');
        $this->form_validation->set_rules('confirm_password', 'Confirm Password', 'trim|required|matches[new_password]');
    
        if ($this->form_validation->run() === FALSE) {
            $this->load->view('reset_password');
        } else {
            $reset_token = $this->input->post('token');
    
            // Validate if the reset token exists in the database
            $user = $this->db->get_where('users', array('reset_token' => $reset_token))->row();
    
            if ($user) {
                // Update the user's password and clear the reset token
                $new_password = $this->input->post('new_password');
                $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    
                $this->db->update('users', array('password' => $hashed_password, 'reset_token' => NULL, 'pass_completed'=> 1), array('id' => $user->id));
                
                    $to = $user->email;
                    $reset_link = base_url('authController/reset_password/' . $reset_token);
                    $subject = 'BPI - Password Reset Successful';
                    $title = 'Dear  '.$user->firstname;
                    $message = '<p>We are writing to inform you that your password has been successfully reset. You can now access your account using your new password.</p>
                               <p>
                               If you did not request this password reset or believe this was a mistake, please contact our support team immediately.<br><br>

                                Thank you for your attention to this matter.
                              
                               </p>
                               <br>
                               <p><br><br>
                    			 Best regards,<br>
                    	  BeepAgro Palliative Initiative (BPI) Team.</p>';
                          $this->sendemail($title,$to,$subject,$message);
    
                // Display a success message or redirect to a success page
                $data['message'] = 'Password reset successful. You can now login with your new password.';
                $this->load->view('reset_password_success', $data);
            } else {
                // Display an error message or redirect to the forgot password page with an error
                $data['error'] = 'Invalid reset token.';
                $this->load->view('reset_password', $data);
            }
        }
    }
    
    public function reset_pass($token){
		$data['reset_token'] = $token;
		$this->load->view('reset_password',$data);	
	}
    
    public function forgot_password(){
        $this->load->view('forgot_password');
    }
    
    public function process_order() {
        // Process the submitted order form
        $selected_items = $this->input->post('selected_items', TRUE);

        if (!empty($selected_items)) {
            $total_price = 0;

            // Calculate the total price of selected items
            foreach ($selected_items as $item_id) {
                $item_price = $this->food_model->get_food_price($item_id);
                $total_price += $item_price;
            }

            // Check if the total price exceeds the user's quota
            if ($total_price <= 25000) {
                // Process the order (e.g., update database, show success message, etc.)
                // Deduct the total price from the user's quota

                $remaining_quota = 25000 - $total_price;

                // Optionally, you can update the user's quota in the database
                // Example: $this->update_user_quota($user_id, $remaining_quota);

                // Show a success message
                $this->session->set_flashdata('success', 'Order placed successfully!');
            } else {
                // Show an error message
                $this->session->set_flashdata('error', 'Order exceeds available quota!');
            }
        } else {
            // Show an error message
            $this->session->set_flashdata('error', 'No items selected!');
        }

        // Redirect back to the dashboard
        redirect('dashboard');
    }
    
    public function reset_session(){
        $userid = $this->session->userdata('user_id');
        //check if this user has set their address
        $user = $this->db->get_where('users', array('id' => $userid))->row();
        if(empty($user->address) || empty($user->city) || empty($user->state) || empty($user->country)){
            $this->session->set_flashdata('error', 'Set your address details to continue');
            redirect('settings');
        }else{
            $this->session->unset_userdata('user_details');
            $user_details = $this->db->get_where('users', array('id' => $userid))->row();
            $this->session->set_userdata('user_details', $user_details);
        }
        
        
    }
    
    public function sendemail($title,$to,$subject,$message){
      $verification_code = substr(md5(uniqid(mt_rand(), true)), 0, 9); // Generate a unique verification code
      $trimmed_link = base_url('verify_email/'.$verification_code);
      
      $data['title'] =  $title;
      $data['message'] = $message;
	  
	  $mesg = $this->load->view('email_templates/index',$data,true);
	  
      $this->load->library('phpmailer_lib');
      // PHPMailer object
      $mail = $this->phpmailer_lib->load();
      // SMTP configuration
        $mail->isSMTP();
        $mail->Host     = 'smtp-relay.brevo.com';
        $mail->SMTPAuth = true;
        $mail->Username = '94a534002@smtp-brevo.com';
        $mail->Password = 'yhFRT3NEpUa6m2fG';
        $mail->SMTPSecure = 'tsl';
        $mail->Port     = 587;
        
        $mail->setFrom('info@beepagro.com', 'BeepAgro Palliative Initiative');
        $mail->addReplyTo('info@beepagro.com', 'BeepAgro Palliative Initiative');

        // Add a recipient
        $mail->addAddress($to);

        // Add cc or bcc 
       // $mail->addCC('quicksave01@gmail.com');
        //$mail->addBCC('bcc@example.com');

        // Email subject
        $mail->Subject = $subject;

        // Set email format to HTML
        $mail->isHTML(true);

        // Email body content
        $mail->Body = $mesg;

        // Send email
        if(!$mail->send()){
            //$msg =  'Message could not be sent.' . $mail->ErrorInfo;
        }else{
            $msg =  1;
        }
        //return $msg;
    }
	
	public function fetch() {
        $user_id = $this->session->userdata('user_id');
    	$notifications = $this->generic_model->get_unread_notifications($user_id);
    	echo json_encode($notifications);
    }
    
    // Function to get device type from user agent
    public function getDeviceType($user_agent) {
        $device_types = array(
            'iPhone' => 'iPhone',
            'iPad' => 'iPad',
            'Android' => 'Android',
            'Windows Phone' => 'Windows Phone',
            'Macintosh' => 'Mac',
            'Windows' => 'Windows',
            'Linux' => 'Linux'
        );
        foreach ($device_types as $type => $device) {
            if (strpos($user_agent, $type) !== false) {
                return $device;
            }
        }
        return 'Unknown';
    }
    
    public function getLocationFromIP($ip) {
        // Construct URL to ipinfo.io API endpoint
        $url = "https://ipinfo.io/$ip/json";

        // Fetch JSON response
        $response = file_get_contents($url);

        // Decode JSON response
        $data = json_decode($response, true);

        // Check if the request was successful
        if (!empty($data['city']) && !empty($data['region']) && !empty($data['country'])) {
            // Construct location string
            $city = $data['city'];
            $region = $data['region'];
            $country = $data['country'];
            return "$city, $region, $country";
        } else {
            return 'Unknown'; // Return 'Unknown' if location not found
        }
    }


}

