<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class FoodHandler extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->helper('url');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->database();
        $this->load->model('food_model');
        $this->load->model('generic_model');
    }

   public function processOrder() {
       $stage = $this->input->post('installment');
       $user_id = $this->session->userdata('user_id');
            //who is sending this form? part timer or a first timer???
             // Initialize the total amount due
            $totalAmountDue = $this->generic_model->select_by_id('market_prices', 1)->palliative_price;
            $order_table = 'orders';
            $paid = $this->generic_model->getInfo($order_table,'user_id', $user_id);
           /* $pendingOrder = $this->generic_model->get_by_condition('orders', array('user_id' => $this->session->userdata('user_id'), 'status' => 'pending')); 
            if (!empty($pendingOrder)) {
                 $payment_option = $this->input->post('payment_option');
                 $this->session->unset_userdata('user_details');
                 // Fetch user details
                $user_details = $this->db->get_where('users', array('id' => $user_id))->row();
                // Set user details in session (optional)
                $this->session->set_userdata('user_details', $user_details);
    
                 
                // Display an error message or redirect to a page indicating the user already has a pending order
                if ($payment_option == 'local_bank_transfer') {
                    //local bank transfer redirection
                   $this->session->set_userdata('orderid', $paid->id);
                   redirect('bank_transfer');
                    
                } elseif ($payment_option == 'card_payment') {
                    //card payment
                    $this->session->set_userdata('orderid', $paid->id);
                    redirect('card_pay');
                    
                } elseif ($payment_option == 'crypto') {
                    //crypto payment
                    $this->session->set_userdata('orderid', $paid->id);
                    redirect('crypto_pay');
                    
                }
            }*/
           // else{
                if($stage == 1){
                    $this->form_validation->set_rules('default', 'Form Tampered', 'required');
                    $this->form_validation->set_rules('second_pack', 'Second Pack', 'required');
                    $this->form_validation->set_rules('third_pack', 'Third Pack', 'required');
                    $this->form_validation->set_rules('fourth_pack', 'Fourth Pack', 'required');
                    $this->form_validation->set_rules('fifth_pack', 'Fifth Pack', 'required');
                    $this->form_validation->set_rules('payment_option', 'Payment Option', 'required');
                    $this->form_validation->set_rules('payment_plan', 'Payment Plan', 'required');
                    // Run form validation
                    if ($this->form_validation->run() === FALSE) {
                        // Set flash data with an error message
                        $this->session->set_flashdata('error', 'make sure all the fields are filled');
                        redirect('palliative'); 
                    } else {
                        //declare variables
                        $payment_plan = $this->input->post('payment_plan');
                        $payment_option = $this->input->post('payment_option');
                        
                        $selectedItems = array(
                            $this->input->post('default'),
                            $this->input->post('second_pack'),
                            $this->input->post('third_pack'),
                            $this->input->post('fourth_pack'),
                            $this->input->post('fifth_pack')
                        );
                        $items_table = 'food_items';
                            
                        
                        //now check what type of payment plan and what type of payment option was chosen
                        if ($payment_plan == 'one_time_payment') {
                            //one time payment, we update the user table and proceed to make payment
                            $table_name = 'users';
                            $update_data = array(
                                'pending_activation' => 1,
                                // Add more columns and values as needed
                            );
                            $condition = array('id' => $this->session->userdata('user_id')); 
                            
                            $rows_affected = $this->generic_model->update_data($table_name, $update_data, $condition);
                           
                            //save the order
                            $orderData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'second_pack' => $this->input->post('second_pack'),
                                'third_pack' => $this->input->post('third_pack'),
                                'fourth_pack' => $this->input->post('fourth_pack'),
                                'fifth_pack' => $this->input->post('fifth_pack'),
                                'default_pack'=> $this->input->post('default'),
                                'payment_option' => $this->input->post('payment_option'),
                                'payment_plan' => $this->input->post('payment_plan'),
                                'amount'=>$totalAmountDue,
                                'order_date' => date('Y-m-d H:i:s')
                            );
                            $orderId = $this->generic_model->insert_data('orders', $orderData);
                             
                            $transactionData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'order_id' =>$orderId,
                                'transaction_type' => 'payment',
                                'amount' => $totalAmountDue,  // Assuming you have the price for each item
                                'description' => 'Palliatives Package Subscription',  // Add a relevant description
                                'status' => 'pending'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionData);
                            $this->addLocator($user_id,$this->input->post('second_pack'));
                            $this->addLocator($user_id,$this->input->post('third_pack'));
                            $this->addLocator($user_id,$this->input->post('fourth_pack'));
                            $this->addLocator($user_id,$this->input->post('fifth_pack'));
                            $this->addLocator($user_id,$this->input->post('default'));
                            //insert into the student_palliative_locator 
                            
                            
                            
                            
                            
                            
                            /*if ($rows_affected > 0) {
                                // Update successful
                                echo 'Update successful!';
                            } else {
                                // No rows were affected (no changes made)
                                echo 'No changes made or record not found.';
                            } */
                
                            if ($payment_option == 'local_bank_transfer') {
                                //local bank transfer redirection
                               $this->session->set_userdata('orderid', $orderId);
                               $this->session->set_userdata('amount', $totalAmountDue);
                               redirect('bank_transfer');
                                
                            } elseif ($payment_option == 'card_payment') {
                                //card payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $totalAmountDue);
                                redirect('card_pay');
                                
                            } elseif ($payment_option == 'crypto') {
                                //crypto payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $totalAmountDue);
                                redirect('crypto_pay');
                                
                            }
                        }
                        
                        elseif($payment_plan == 'installments'){
                            $table_name = 'users';
                            $first_installment = ($totalAmountDue*30)/100;
                            $update_data = array(
                                'is_part_pay'=> 1,
                               // 'first_pay'=>1,
                                'pending_activation' => 1,
                            );
                            $condition = array('id' => $this->session->userdata('user_id')); 
                            $rows_affected = $this->generic_model->update_data($table_name, $update_data, $condition);
                            
                            //save the order
                            $orderData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'second_pack' => $this->input->post('second_pack'),
                                'third_pack' => $this->input->post('third_pack'),
                                'fourth_pack' => $this->input->post('fourth_pack'),
                                'fifth_pack' => $this->input->post('fifth_pack'),
                                'default_pack'=> $this->input->post('default'),
                                'payment_option' => $this->input->post('payment_option'),
                                'payment_plan' => $this->input->post('payment_plan'),
                                'amount'=>$first_installment,
                                'order_date' => date('Y-m-d H:i:s')
                            );
                            $orderId = $this->generic_model->insert_data('orders', $orderData);
                            
                            $transactionData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'order_id' =>$orderId,
                                'transaction_type' => 'payment',
                                'amount' => $first_installment,  // Assuming you have the price for each item
                                'description' => 'First Installment, Palliatives Subscription',  // Add a relevant description
                                'status'=> 'pending'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionData);
                            
                            //record locator
                            $this->addLocator($user_id,$this->input->post('second_pack'));
                            $this->addLocator($user_id,$this->input->post('third_pack'));
                            $this->addLocator($user_id,$this->input->post('fourth_pack'));
                            $this->addLocator($user_id,$this->input->post('fifth_pack'));
                            $this->addLocator($user_id,$this->input->post('default'));
        
                            
                            if ($payment_option == 'local_bank_transfer') {
                                //local bank transfer redirection
                               $this->session->set_userdata('orderid', $orderId);
                               $this->session->set_userdata('amount', $first_installment);
                               redirect('bank_transfer');
                                
                            } elseif ($payment_option == 'card_payment') {
                                //card payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $first_installment);
                                redirect('card_pay');
                                
                            } elseif ($payment_option == 'crypto') {
                                //crypto payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $first_installment);
                                redirect('crypto_pay');
                                
                            }
                            
                        }
                        
                        elseif($payment_plan == 'upfront_payment'){
                            $table_name = 'users';
                            $upfrontPayment = ($totalAmountDue*12);
                            $update_data = array(
                                'pending_activation' => 1,
                            );
                            $condition = array('id' => $this->session->userdata('user_id')); 
                            $rows_affected = $this->generic_model->update_data($table_name, $update_data, $condition);
                            
                            //save the order
                            $orderData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'second_pack' => $this->input->post('second_pack'),
                                'third_pack' => $this->input->post('third_pack'),
                                'fourth_pack' => $this->input->post('fourth_pack'),
                                'fifth_pack' => $this->input->post('fifth_pack'),
                                'default_pack'=> $this->input->post('default'),
                                'payment_option' => $this->input->post('payment_option'),
                                'payment_plan' => $this->input->post('payment_plan'),
                                'amount'=>$upfrontPayment,
                                'order_date' => date('Y-m-d H:i:s')
                            );
                            $orderId = $this->generic_model->insert_data('orders', $orderData);
                            
                            $transactionData = array(
                                'user_id' => $this->session->userdata('user_id'),
                                'order_id' =>$orderId,
                                'transaction_type' => 'payment',
                                'amount' => $upfrontPayment,  // Assuming you have the price for each item
                                'description' => 'Upfront Payment, Palliatives Subscription',  // Add a relevant description
                                'status'=> 'pending'
                            );
                            $trans_send = $this->generic_model->insert_data('transaction_history', $transactionData);
                            
                            //record locator
                            $this->addLocator($user_id,$this->input->post('second_pack'));
                            $this->addLocator($user_id,$this->input->post('third_pack'));
                            $this->addLocator($user_id,$this->input->post('fourth_pack'));
                            $this->addLocator($user_id,$this->input->post('fifth_pack'));
                            $this->addLocator($user_id,$this->input->post('default'));
                            
                            
                            if ($payment_option == 'local_bank_transfer') {
                                //local bank transfer redirection
                               $this->session->set_userdata('orderid', $orderId);
                               $this->session->set_userdata('amount', $upfrontPayment);
                               redirect('bank_transfer');
                                
                            } elseif ($payment_option == 'card_payment') {
                                //card payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $upfrontPayment);
                                redirect('card_pay');
                                
                            } elseif ($payment_option == 'crypto') {
                                //crypto payment
                                $this->session->set_userdata('orderid', $orderId);
                                $this->session->set_userdata('amount', $upfrontPayment);
                                redirect('crypto_pay');
                                
                            }
                            
                        }
                
                        else{
                            // Example: Redirect to dashboard with a success message
                            $this->session->set_flashdata('error', 'could not place order!');
                            redirect('dashboard');
                        }
                    }
                }
                
                if($stage == 2){
                    if(empty($this->input->post('payment_option2'))){
                        $this->session->set_flashdata('error','You must select a payment method first');
                        redirect('palliative');
                       }else {
                                    
                        //second installment
                        $payment_plan = 'installments';
                        $payment_option = $this->input->post('payment_option2');
            
                        $amount_paid = $paid->amount;
                        
                        $transactionData = array(
                            'user_id' => $this->session->userdata('user_id'),
                            'order_id' =>$paid->id,
                            'transaction_type' => 'payment',
                            'amount' => $amount_paid,  // Assuming you have the price for each item
                            'description' => 'Second Installment, Palliative Subscription',  // Add a relevant description
                            'status' => 'pending'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionData);
                        
                        
                        if ($payment_option == 'local_bank_transfer') {
                            //local bank transfer redirection
                           $this->session->set_userdata('orderid', $paid->id);
                           $this->session->set_userdata('amount', $amount_paid);
                           redirect('bank_transfer');
                            
                        } elseif ($payment_option == 'card_payment') {
                            //card payment
                            $this->session->set_userdata('orderid', $paid->id);
                            $this->session->set_userdata('amount', $amount_paid);
                            redirect('card_pay');
                            
                        } elseif ($payment_option == 'crypto') {
                            //crypto payment
                            $this->session->set_userdata('orderid', $paid->id);
                            $this->session->set_userdata('amount', $amount_paid);
                            redirect('crypto_pay');
                            
                        }
                    }
                    
                }
                
                if($stage == 3){
                     if(empty($this->input->post('payment_option3'))){
                        $this->session->set_flashdata('error','You must select a payment method first');
                        redirect('palliative');
                        exit();
                       }else {
                        //last instalment.
                        $order_table = 'orders';
                        $payment_plan = 'installments';
                        $payment_option = $this->input->post('payment_option3');
                        
                        $paid = $this->generic_model->getInfo($order_table,'user_id', $user_id);
                        $amount_paid = $paid->amount;
                        
                        $selectedItems = array(
                            $paid->default_pack,
                            $paid->second_pack,
                            $paid->third_pack,
                            $paid->fourth_pack,
                            $paid->fifth_pack
                        );
                        $items_table = 'food_items';
                        
                        $final_pay = ($totalAmountDue*40)/100;
                        $oData = array(
                                'amount'=>$final_pay                
                            );
                        $condition = array('id'=>$paid->id);
                        
                        $orderUpdate = $this->generic_model->update_data('orders', $oData, $condition);
                        
                        $transactionData = array(
                            'user_id' => $this->session->userdata('user_id'),
                            'order_id' =>$paid->id,
                            'transaction_type' => 'payment',
                            'amount' => $final_pay,  // Assuming you have the price for each item
                            'description' => 'Final Installment, Palliative Subscription',  // Add a relevant description
                            'status' => 'pending'
                        );
                        $trans_send = $this->generic_model->insert_data('transaction_history', $transactionData);
            
                        
                        if ($payment_option == 'local_bank_transfer') {
                            //local bank transfer redirection
                           $this->session->set_userdata('orderid', $paid->id);
                           $this->session->set_userdata('amount', $final_pay);
                           redirect('bank_transfer');
                            
                        } elseif ($payment_option == 'card_payment') {
                            //card payment
                            $this->session->set_userdata('orderid', $paid->id);
                            $this->session->set_userdata('amount', $final_pay);
                            redirect('card_pay');
                            
                        } elseif ($payment_option == 'crypto') {
                            //crypto payment
                            $this->session->set_userdata('orderid', $paid->id);
                            $this->session->set_userdata('amount', $final_pay);
                            redirect('crypto_pay');
                            
                        }
                     }
                }
           // }
        $this->session->set_flashdata('error','There are errors in your form, make sure all the field are filled correctly!');
        redirect('palliative');
           
   }
   
   public function addLocator($user_id,$pack){
       $pickup = $this->generic_model->getInfo('food_items','id',$pack);
       $code = rand(984674,897465);
       $locator = array(
          'user_id'=>$user_id,
          'pack_id'=>$pack,
          'code'=>$code,
          'pick_up_center_id'=>$pickup->pickup_center_id,
          'status'=>'pending',
          'activated_date'=>date('y-m-d H:i:s')      
        );
       $this->generic_model->insert_data('student_palliative_locator', $locator);
       //reduce the stock quantity
       $food_item_id = $pickup->id;
       $itemCount = $this->generic_model->getInfo('food_items','id',$food_item_id);
       $oldCount = $itemCount->quantity;
       $newCount = ($oldCount - 1);
       //update new count
       $item_data = array('quantity'=>$newCount);
       $condition = array('id',$food_item_id);
       $this->generic_model->update_data('food_items',$item_data,$condition);
       
   }

   private function getFailedField() {
    // Loop through the validation errors and return the first one
    foreach ($this->form_validation->error_array() as $field => $error) {
        return $field;
    }

    return '';
    }



}
