<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class SolarAssessment extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->helper(array('url', 'form'));
        $this->load->library(array('form_validation', 'session', 'email'));
        $this->load->model('assessment_model');
        $this->load->model( 'generic_model' );
        $this->load->model( 'user_model' );
        $this->load->library( 'pagination' );
        $this->load->model( 'merchant_model' );
        $this->load->model(['pool_model', 'contribution_model']);
        $this->load->database();
        $this->load->model( 'food_model' );
        require_once APPPATH . 'third_party/fpdf/fpdf.php';
    }

    public function solar()
    {
        if ( $this->session->userdata( 'user_id' ) ) {
          $userid = $this->session->userdata( 'user_id' );
          $this->reset_session();
          $user_details = $this->session->userdata( 'user_details' );
          $transactions = $this->generic_model->select_where( 'transaction_history', array( 'user_id' => $userid ) );
          $data[ 'withdrawals' ] = $this->generic_model->select_where( 'withdrawal_history', array( 'user_id' => $userid ) );
          $data[ 'results' ] = $transactions;$data['unread_count'] = $this->generic_model->get_unread_count($userid);
          $data['notifications'] = $this->generic_model->get_unread_notifications($userid);
          $data[ 'user_details' ] = $user_details;
          $data['states'] = $this->generic_model->get_solar_states();
          $data['products'] = $this->generic_model->get_solar_products();
          $this->load->view('solar_assessment', $data);
        } else {
          redirect( 'login' ); // Redirect to login if not logged in
        }
        
    }
    
    public function reset_session() {
        $userid = $this->session->userdata( 'user_id' );
        //check if this user has set their address
        $user = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
        if ( empty( $user->address ) || empty( $user->city ) || empty( $user->state ) || empty( $user->country ) ) {
          $this->session->set_flashdata( 'error', 'Set your address details to continue' );
          redirect( 'settings' );
        } else {
          $this->session->unset_userdata( 'user_details' );
          $user_details = $this->db->get_where( 'users', array( 'id' => $userid ) )->row();
          $this->session->set_userdata( 'user_details', $user_details );
        }
    
    
      }

    public function calculate()
    {
        // Form validation
        $this->form_validation->set_rules('client_name', 'Client Name', 'required|trim');
        $this->form_validation->set_rules('client_email', 'Client Email', 'required|valid_email');
        $this->form_validation->set_rules('region', 'Region', 'required');
        $this->form_validation->set_rules('state', 'State', 'required');
        $this->form_validation->set_rules('ssc_code', 'SSC Code', 'required|trim');
        $this->form_validation->set_rules('daily_runtime', 'Daily Runtime', 'required|numeric|greater_than[0]');
        $this->form_validation->set_rules('inverter_id', 'Inverter', 'required');
        $this->form_validation->set_rules('battery_id', 'Battery', 'required');
        $this->form_validation->set_rules('panel_id', 'Solar Panel', 'required');
        $this->form_validation->set_rules('installation_option', 'Installation Option', 'required');
        $this->form_validation->set_rules('installation_address', 'Installation Address', 'required|trim');
        $this->form_validation->set_rules('contact_person', 'Contact Person', 'required|trim');
        $this->form_validation->set_rules('contact_phone', 'Contact Phone', 'required|trim');
        $this->form_validation->set_rules('installation_date', 'Installation Date', 'required');

        $appliances = $this->input->post('appliances');
        if ($appliances) {
            foreach ($appliances as $index => $appliance) {
                $this->form_validation->set_rules("appliances[$index][name]", "Appliance Name #$index", 'required|trim');
                $this->form_validation->set_rules("appliances[$index][wattage]", "Appliance Wattage #$index", 'required|numeric|greater_than[0]');
                $this->form_validation->set_rules("appliances[$index][quantity]", "Appliance Quantity #$index", 'required|integer|greater_than[0]');
                $this->form_validation->set_rules("appliances[$index][hours]", "Appliance Hours #$index", 'required|numeric|greater_than[0]');
            }
        } else {
            $this->form_validation->set_error('appliances', 'At least one appliance is required.');
        }

        // Handle file upload
        $config['upload_path'] = './uploads/proof/';
        $config['allowed_types'] = 'jpg|png|pdf';
        $config['max_size'] = 2048;
        $this->load->library('upload', $config);

        if (!$this->upload->do_upload('proof_of_payment')) {
            $this->form_validation->set_error('proof_of_payment', $this->upload->display_errors());
        } else {
            $upload_data = $this->upload->data();
            $proof_file = $upload_data['file_name'];
        }

        if ($this->form_validation->run() === FALSE) {
            $data['title'] = 'BPI Solar Energy Assessment Tool';
            $data['states'] = $this->Assessment_model->get_states();
            $data['products'] = $this->Assessment_model->get_products();
            $this->load->view('solar_assessment', $data);
            return;
        }

        // Retrieve inputs
        $client_name = $this->input->post('client_name');
        $client_email = $this->input->post('client_email');
        $region = $this->input->post('region');
        $state = $this->input->post('state');
        $ssc_code = $this->input->post('ssc_code');
        $daily_runtime = floatval($this->input->post('daily_runtime'));
        $inverter_id = $this->input->post('inverter_id');
        $battery_id = $this->input->post('battery_id');
        $panel_id = $this->input->post('panel_id');
        $installation_option = $this->input->post('installation_option');
        $installation_address = $this->input->post('installation_address');
        $contact_person = $this->input->post('contact_person');
        $contact_phone = $this->input->post('contact_phone');
        $installation_date = $this->input->post('installation_date');

        // Verify SSC code and get pricing
        $consultant = $this->Assessment_model->get_user_by_ssc($ssc_code);
        $is_bpi_member = $consultant !== FALSE;
        $products = $this->Assessment_model->get_products();
        $inverter = $products['inverters'][$inverter_id];
        $battery = $products['batteries'][$battery_id];
        $panel = $products['panels'][$panel_id];

        // Calculations
        $total_watts = 0;
        $battery_voltage = 24;
        $dod = $battery['type'] === 'Lithium' ? 0.8 : 0.5;
        foreach ($appliances as $appliance) {
            $wattage = floatval($appliance['wattage']);
            if ($appliance['unit'] === 'HP') {
                $wattage *= 746;
            }
            $total_watts += $wattage * intval($appliance['quantity']) * floatval($appliance['hours']);
        }

        $sunlight_hours = $this->Assessment_model->get_sunlight_hours($state);
        $inverter_capacity = ($total_watts / 0.8) * 1.25 / 1000;
        $battery_capacity_ah = ($total_watts * $daily_runtime) / ($battery_voltage * $dod);
        $panel_watts = ($total_watts * 1.3) / $sunlight_hours;
        $number_of_panels = ceil($panel_watts / $panel['wattage']);
        $number_of_batteries = ceil($battery_capacity_ah / $battery['capacity']);
        $runtime_hours = ($battery_capacity_ah * $battery_voltage * $dod) / $total_watts;

        // Cost calculations
        $assessment_fee = $is_bpi_member ? 5000 : 10000;
        $inverter_cost = $is_bpi_member ? $inverter['bpi_price'] : $inverter['non_bpi_price'];
        $battery_cost = ($is_bpi_member ? $battery['bpi_price'] : $battery['non_bpi_price']) * $number_of_batteries;
        $panel_cost = ($is_bpi_member ? $panel['bpi_price'] : $panel['non_bpi_price']) * $number_of_panels;
        $additional_costs = 50000;
        $installation_cost = $installation_option === 'Corporate' ? $inverter_capacity * 100000 : 0;
        $total_cost = $inverter_cost + $battery_cost + $panel_cost + $additional_costs + $installation_cost + $assessment_fee;

        // Save assessment
        $assessment_data = array(
            'client_name' => $client_name,
            'client_email' => $client_email,
            'region' => $region,
            'state' => $state,
            'ssc_code' => $ssc_code,
            'inverter_id' => $inverter_id,
            'battery_id' => $battery_id,
            'panel_id' => $panel_id,
            'installation_option' => $installation_option,
            'installation_address' => $installation_address,
            'contact_person' => $contact_person,
            'contact_phone' => $contact_phone,
            'installation_date' => $installation_date,
            'total_load_kwh' => $total_watts / 1000,
            'inverter_capacity' => round($inverter_capacity, 2),
            'battery_capacity' => round($battery_capacity_ah, 2),
            'number_of_batteries' => $number_of_batteries,
            'panel_watts' => round($panel_watts, 2),
            'number_of_panels' => $number_of_panels,
            'runtime_hours' => round($runtime_hours, 2),
            'inverter_cost' => $inverter_cost,
            'battery_cost' => $battery_cost,
            'panel_cost' => $panel_cost,
            'additional_costs' => $additional_costs,
            'installation_cost' => $installation_cost,
            'assessment_fee' => $assessment_fee,
            'total_cost' => $total_cost,
            'proof_of_payment' => isset($proof_file) ? $proof_file : null,
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s')
        );
        $assessment_id = $this->Assessment_model->save_assessment($assessment_data);

        // Credit wallets
        if ($consultant) {
            $this->Assessment_model->credit_wallet($consultant['id'], $assessment_fee);
            $referrer = $this->Assessment_model->get_referrer($consultant['id']);
            if ($referrer) {
                $this->Assessment_model->credit_wallet($referrer['id'], $assessment_fee * 0.1); // 10% referrer bonus
            }
        }

        // Send email
        $this->send_email_summary($assessment_data);

        // Load view
        $data = array_merge($assessment_data, [
            'title' => 'BPI Solar Energy Assessment Tool',
            'states' => $this->Assessment_model->get_states(),
            'products' => $products,
            'assessment_id' => $assessment_id,
            'is_bpi_member' => $is_bpi_member
        ]);
        $this->load->view('solar_assessment', $data);
    }

    public function download_pdf($assessment_id)
    {
        $data = $this->Assessment_model->get_assessment($assessment_id);
        if (!$data) {
            show_404();
            return;
        }

        $pdf = new FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'BPI Solar Energy Assessment', 0, 1, 'C');
        $pdf->SetFont('Arial', '', 12);
        $pdf->Ln(10);
        $pdf->Cell(0, 10, 'Client: ' . $data['client_name'], 0, 1);
        $pdf->Cell(0, 10, 'Region: ' . $data['region'] . ' (' . $data['state'] . ')', 0, 1);
        $pdf->Cell(0, 10, 'SSC Code: ' . $data['ssc_code'], 0, 1);
        $pdf->Ln(5);
        $pdf->Cell(0, 10, 'System Requirements:', 0, 1);
        $pdf->Cell(0, 10, 'Total Load: ' . number_format($data['total_load_kwh'], 2) . ' kWh/day', 0, 1);
        $pdf->Cell(0, 10, 'Inverter Capacity: ' . number_format($data['inverter_capacity'], 2) . ' kVA', 0, 1);
        $pdf->Cell(0, 10, 'Battery Capacity: ' . number_format($data['battery_capacity'], 2) . ' Ah (' . $data['number_of_batteries'] . ' units)', 0, 1);
        $pdf->Cell(0, 10, 'Solar Panels: ' . number_format($data['panel_watts'], 2) . ' W (' . $data['number_of_panels'] . ' panels)', 0, 1);
        $pdf->Cell(0, 10, 'Estimated Runtime: ' . number_format($data['runtime_hours'], 2) . ' hours', 0, 1);
        $pdf->Ln(5);
        $pdf->Cell(0, 10, 'Cost Summary (NGN):', 0, 1);
        $pdf->Cell(0, 10, 'Inverter Cost: N' . number_format($data['inverter_cost'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Battery Cost: N' . number_format($data['battery_cost'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Solar Panel Cost: N' . number_format($data['panel_cost'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Additional Costs: N' . number_format($data['additional_costs'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Installation Cost: N' . number_format($data['installation_cost'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Assessment Fee: N' . number_format($data['assessment_fee'], 2), 0, 1);
        $pdf->Cell(0, 10, 'Total Cost: N' . number_format($data['total_cost'], 2), 0, 1);

        $pdf->Output('D', 'Solar_Assessment_' . $data['client_name'] . '.pdf');
    }

    private function send_email_summary($data)
    {
        $this->email->from('no-reply@naijapoly.com', 'Naijapoly Solar Assessment');
        $this->email->to($data['client_email']);
        $this->email->subject('Solar Assessment Summary for ' . $data['client_name']);
        $message = "Dear {$data['client_name']},\n\n";
        $message .= "Here is your solar energy assessment:\n\n";
        $message .= "System Requirements:\n";
        $message .= "- Total Load: " . number_format($data['total_load_kwh'], 2) . " kWh/day\n";
        $message .= "- Inverter Capacity: " . number_format($data['inverter_capacity'], 2) . " kVA\n";
        $message .= "- Battery Capacity: " . number_format($data['battery_capacity'], 2) . " Ah ({$data['number_of_batteries']} units)\n";
        $message .= "- Solar Panels: " . number_format($data['panel_watts'], 2) . " W ({$data['number_of_panels']} panels)\n";
        $message .= "- Estimated Runtime: " . number_format($data['runtime_hours'], 2) . " hours\n\n";
        $message .= "Cost Summary (NGN):\n";
        $message .= "- Inverter Cost: N" . number_format($data['inverter_cost'], 2) . "\n";
        $message .= "- Battery Cost: N" . number_format($data['battery_cost'], 2) . "\n";
        $message .= "- Solar Panel Cost: N" . number_format($data['panel_cost'], 2) . "\n";
        $message .= "- Additional Costs: N" . number_format($data['additional_costs'], 2) . "\n";
        $message .= "- Installation Cost: N" . number_format($data['installation_cost'], 2) . "\n";
        $message .= "- Assessment Fee: N" . number_format($data['assessment_fee'], 2) . "\n";
        $message .= "- Total Cost: N" . number_format($data['total_cost'], 2) . "\n\n";
        $message .= "Thank you for using Naijapoly Solar Assessment Tool!";
        $this->email->message($message);
        $this->email->send();
    }
}