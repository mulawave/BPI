<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Model Function
class Transactions_model extends CI_Model { 
 
  function singleTransfer($bank_cd,$account_number,$amount,$secret_key,$sender,$currency,$reference,$userid,$lastid,$tftype){
       
        $ch = curl_init(); //http post to another server
        curl_setopt($ch, CURLOPT_URL,"https://api.ravepay.co/v2/gpx/transfers/create");
        curl_setopt($ch, CURLOPT_POST, 1);
        $values = array(
            'account_bank' => $bank_cd,
            'account_number' => $account_number,
            'amount' => $amount,
            'seckey' => $secret_key,
            'narration' => $sender,
            'currency' => $currency,
            'reference' => $reference
        );
        $params = http_build_query($values);
        curl_setopt($ch, CURLOPT_POSTFIELDS,$params);
        // receive server response
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $server_output = curl_exec ($ch);
        $jd_orders = json_decode($server_output,true);
        
        //echo '<pre>';
        //print_r($jd_orders);
        //echo '</pre>';
        //exit();
        
        $rave_puid = $jd_orders['data']['id'];
        $rave_fullname = $jd_orders['data']['fullname'];
        $rave_amount = $jd_orders['data']['amount'];
        $rave_fee = $jd_orders['data']['fee'];
        $rave_reference = $jd_orders['data']['reference'];
        $rave_is_approved = $jd_orders['data']['is_approved'];
        $dest = $bank_cd;
        //$rave_status = 'processing';
        curl_close ($ch);
        
        $wsave = array(
          'user_id'=>$userid,
            'amount'=>$amount, 
            'fee'=>$rave_fee,
            'ben'=>$rave_fullname,
            'to_account'=> $account_number,
            'destination'=>$dest,
            'transaction_type'=>'bank',
            'reference'=>$rave_reference,
            'type'=>$tftype,
            'status'=>'pending',
            'date'=>date('Y-m-d H:i:s', time()),
            'txid'=>$rave_puid,
            'transaction_id'=>$lastid
        );
        
        //store withdrawal
        $this->db->trans_start();
        $this->db->insert('tbl_rave_withdrawals',$wsave);
        $result = $this->db->insert_id();
        $this->db->trans_complete();
        
        return $rave_puid;
                
    }
}