<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BeepAgro Pallative</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="<?php echo base_url('assets_part/font/iconsmind/style.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/font/simple-line-icons/css/simple-line-icons.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/bootstrap.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/fullcalendar.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/dataTables.bootstrap4.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/datatables.responsive.bootstrap4.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/select2.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/perfect-scrollbar.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/owl.carousel.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/bootstrap-stars.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/nouislider.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/bootstrap-datepicker3.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/main.css');?>" /> 
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
</head>
<body id="app-container" class="menu-default show-spinner">
    <nav class="navbar fixed-top">
        <div class="d-flex align-items-center navbar-left">
            <a href="#" class="menu-button d-none d-md-block">

                <svg class="main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 17">

                    <rect x="0.48" y="0.5" width="7" height="1" />

                    <rect x="0.48" y="7.5" width="7" height="1" />

                    <rect x="0.48" y="15.5" width="7" height="1" />

                </svg>

                <svg class="sub" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 17">

                    <rect x="1.56" y="0.5" width="16" height="1" />

                    <rect x="1.56" y="7.5" width="16" height="1" />

                    <rect x="1.56" y="15.5" width="16" height="1" />

                </svg>

            </a>

            <a href="#" class="menu-button-mobile d-xs-block d-sm-block d-md-none">

                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 17">

                    <rect x="0.5" y="0.5" width="25" height="1" />

                    <rect x="0.5" y="7.5" width="25" height="1" />

                    <rect x="0.5" y="15.5" width="25" height="1" />

                </svg>

            </a>
        </div>
        <a class="navbar-logo" href="#">
            <span class="logo d-none d-xs-block"></span>
            <span class="logo-mobile d-block d-xs-none"></span>
        </a>
        <div class="navbar-right"> 
              
            <div class="position-relative d-inline-block">

                    <button class="header-icon btn btn-empty" type="button" id="notificationButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">

                        <i class="simple-icon-bell text-success"></i>

                         <?php if ($unread_count > 0): ?>

                                <span class="count bg-danger text-white"><strong><?php echo $unread_count; ?></strong></span>

                         <?php endif; ?>

                    </button>

                    <div class="dropdown-menu dropdown-menu-right mt-3 scroll position-absolute ps" id="notificationDropdown">

                    <?php foreach ($notifications as $notification): ?> 

                        <div class="row mb-1 pb-1 border-bottom">  

                           <!-- <a href="<?php echo $notification->link; ?>">

                                <img src="<?php echo base_url(); ?>assets_part/img/profile-pic-l-2.jpg" alt="Notification Image" class="img-thumbnail list-thumbnail xsmall border-0 rounded-circle">

                            </a>-->

                            <div class="col-12 mb-2 <?php if (!$notification->read_status): ?>text-primary  <?php endif; ?>">

                                <a href="<?php echo base_url('notifications');?>">

                                     <p class="text-primary"><?php echo $notification->title; ?><br>

                                     <?php echo $notification->message; ?></p>

                                     <em class="mt-2 text-success">Received on: <?php echo $notification->created_at; ?></em>

                                </a>

                            </div>

                            <div class="col-12 mb-2">

                                <?php if (!$notification->read_status): ?>

                                <a href="<?php echo base_url('notifications/mark_as_read/' . $notification->id); ?>" class="float-right">Mark as Read</a>

                            <?php endif; ?>

                    </div>

                        </div>

                        

                    <?php endforeach; ?>

                    <div class="ps__rail-x" style="left: 0px; bottom: 0px;">

                        <div class="ps__thumb-x" tabindex="0" style="left: 0px; width: 0px;"></div>

                    </div>

                    <div class="ps__rail-y" style="top: 0px; right: 0px;">

                        <div class="ps__thumb-y" tabindex="0" style="top: 0px; height: 0px;"></div>

                    </div>

                </div>

            </div>

            

            <button class="header-icon btn btn-empty d-none d-sm-inline-block" type="button" id="fullScreenButton">

                    <i class="simple-icon-size-fullscreen" style="display: none;"></i>

                    <i class="simple-icon-size-actual" style="display: inline;"></i>

            </button>

            

            <div class="user d-inline-block">

                <button class="btn btn-empty p-0" type="button" data-toggle="dropdown" aria-haspopup="true"

                    aria-expanded="false">

                    <span class="name"><?php echo $user_details->name; ?></span>

                    <span>

                        <img alt="Profile Picture" src="<?php echo base_url($user_details->logo);?>" />

                    </span>

                </button>

                <div class="dropdown-menu dropdown-menu-right mt-3">

                    <!--<a class="dropdown-item" href="<?php //echo base_url('settings');?>">Settings</a>-->

                    <a class="dropdown-item" href="<?php echo base_url('partner_logout');?>">Sign out</a>

                </div>

            </div> 

            

        </div>
    </nav>
    <div class="sidebar">
        <div class="main-menu">
            <div class="scroll">
                <ul class="list-unstyled">
                    <li>
                        <a href="<?php echo base_url('part_dashboard');?>">
                            <i class="iconsmind-Shop-4"></i>
                            <span>Dashboard</span>

                        </a>

                    </li>
                    <li>
                        <a href="<?php echo base_url('preference');?>">
                            <i class="glyph-icon iconsmind-Security-Settings"></i>Settings
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('ptransactions');?>">
                            <i class="iconsmind-Receipt-3"></i>Transactions
                        </a>
                    </li>
					 <li class="active" style="background-color: #1b191b;">
                        <a href="#">
                            <i class="iconsmind-Wallet-2"></i>Wallet
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('partner_logout');?>">
                            <i class="simple-icon-power"></i> Log Out
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <main>
        <div class="container-fluid">
            <div class="row  ">
                <div class="col-12">
                    <h1>My assets_part</h1>
                    <nav class="breadcrumb-container d-none d-sm-block d-lg-inline-block" aria-label="breadcrumb">
                        <ol class="breadcrumb pt-0">
                            <li class="breadcrumb-item">
                                <a href="#">Dashboard</a>
                            </li>
                            <li class="breadcrumb-item">
                                <a href="#">Wallets</a>
                            </li>
                        </ol>
                    </nav>
                   <div class="separator mb-5"></div>
                    <?php if ($this->session->flashdata('success')): ?>

                                    <p style="color: green;"><?= $this->session->flashdata('success'); ?></p>
                                <?php endif; ?>

                            

                                <?php if ($this->session->flashdata('error')): ?>
                                    <p style="color: red;"><?= $this->session->flashdata('error'); ?></p>
                                <?php endif; ?>
                    <div class="separator mb-5"></div>
                </div>
            </div>
			  <div class="row mb-4">
			 <div class="col-12">
                    <div class="row icon-cards-row mb-4 sortable">
                        <div class="col-md-4 col-lg-4 col-sm-12 col-12 mb-2">
                            <a href="#" class="card">
                                <div class="card-body text-center">
                                    <i class="simple-icon-wallet"></i>
                                    <p class="card-text font-weight-semibold mb-0">Wallet Balance</p>
                                    <p class="lead text-center"><?php echo $this->generic_model->getInfo('currency_management','id',2)->symbol; ?><?php echo $this->generic_model->convert_currency(2,$user_details->wallet);?></p>
                                </div>
                            </a>
                        </div>
                        <div class="col-md-4 col-lg-4 col-sm-12 col-12 mb-2">
                            <a href="#" class="card">
                                <div class="card-body text-center">
                                    <i class="iconsmind-Basket-Coins"></i>
                                    <p class="card-text mb-0">BPT Balance</p>
                                    <p class="lead text-center"><?php echo number_format($user_details->token,8); ?> BPT</p>
                                </div>
                            </a>
                        </div>
						<div class="col-md-4 col-lg-4 col-sm-12 col-12 mb-2">
                            <a href="#" class="card">
                                <div class="card-body text-center">
                                    <i class="simple-icon-wallet"></i>
                                    <p class="card-text font-weight-semibold mb-0">Palliative Balance</p>
                                    <p class="lead text-center"><?php echo $this->generic_model->getInfo('currency_management','id',2)->symbol; ?><?php echo $this->generic_model->convert_currency(2,$user_details->palliative);?></p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
		    </div>
             <div class="row mb-4">
                 <div class="col-md-12 mb-3">

                            <div class="card d-flex flex-row mb-3">
                                <div class="pl-2 d-flex flex-grow-1 min-width-zero">
                                    <div class="card-body align-self-center d-flex flex-column flex-lg-row justify-content-between min-width-zero align-items-lg-center">
                                        <a href="<?php echo base_url('withdrawal'); ?>" class="w-40 w-sm-100">
                                            <p class="list-item-heading mb-1 truncate">Withdrawal & Transfers</p>
                                        </a>
                                        <div class="w-15 w-sm-100">
                                            <span class="btn btn-sm btn-success">Withdrawal & Transfers</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>				 
             </div>
			<div class="row">
                        <div class="col-md-12 col-xl-6 col-lg-6 col-12 mb-4">
                            <div class="card">
                                <div class="position-absolute card-top-buttons">
                                    <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown"
                                        aria-haspopup="true" aria-expanded="false">
                                        <i class="simple-icon-refresh"></i>
                                    </button>
                                </div>
                                <div class="card-body">

                                    <h5 class="card-title">Instant Cash Withdrawal</h5>

                                    <div class="dashboard-quick-post">

                                        <?php if(!empty($bank)){ ?>

                                        <?php echo form_open_multipart('partners/payout'); ?>

                                            <div class="form-group row mb-5">

                                                <label class="col-sm-3 col-form-label">Bank Withdrawal</label>

                                                <div class="col-sm-9">

                                                    <input type="number" name="amount" class="form-control" placeholder="Enter Amount To Withdraw">

                                                </div>

                                            </div>

                                            <div class="form-group row mb-5">

                                                <label class="col-sm-3 col-form-label">Bank Account</label>

                                                <div class="col-sm-9">

                                                    <input type="text" name="account" class="form-control" value="<?php echo $bank->bank_account; ?>" readonly>

                                                </div>

                                            </div>

                                            <?php if(!empty($bank)){ ?>

                                            <div class="form-group row mb-5">

                                                <label class="col-sm-3 col-form-label">Bank Name</label>

                                                <div class="col-sm-9">

                                                    <input type="text" name="bank" class="form-control" value="<?php echo $bank->bank_name; ?>" readonly>

                                                </div>

                                            </div>

                                            <?php }else{ ?>

                                            <div class="form-group row">

                                                    <label class="col-sm-3 col-form-label">Bank Name</label>

                                                    <div class="col-sm-9">

                                                        <select name="bank" class="form-control">

                                                            <?php

                                                            // Define an array of Nigerian banks and their CBN bank codes

                                                            $nigerian_banks = array(

                                                                "Access Bank" => "044",

                                                                "Citibank" => "023",

                                                                "Diamond Bank" => "063",

                                                                "Ecobank Nigeria" => "050",

                                                                "Fidelity Bank Nigeria" => "070",

                                                                "First Bank of Nigeria" => "011",

                                                                "First City Monument Bank" => "214",

                                                                "Guaranty Trust Bank" => "058",

                                                                "Heritage Bank Plc" => "030",

                                                                "Jaiz Bank" => "301",

                                                                "Keystone Bank Limited" => "082",

                                                                "Providus Bank Plc" => "101",

                                                                "Polaris Bank" => "076",

                                                                "Stanbic IBTC Bank Nigeria Limited" => "221",

                                                                "Standard Chartered Bank" => "068",

                                                                "Sterling Bank" => "232",

                                                                "Suntrust Bank Nigeria Limited" => "100",

                                                                "Union Bank of Nigeria" => "032",

                                                                "United Bank for Africa" => "033",

                                                                "Unity Bank Plc" => "215",

                                                                "Wema Bank" => "035",

                                                                "Zenith Bank" => "057"

                                                            );

                                                            // Loop through the array to populate the select options

                                                            foreach ($nigerian_banks as $bank_name => $bank_code) {

                                                                // Use the bank code as the value for the option

                                                                echo '<option value="' . $bank_code . '"';

                                                                // Check if the current bank matches the one selected

                                                                if ($bank->bank_name == $bank_name) {

                                                                    echo ' selected';

                                                                }

                                                                echo '>' . $bank_name . '</option>';

                                                            }

                                                            ?>

                                                        </select>

                                                    </div>

                                                </div>

                                            <?php } ?>

                                            <div class="form-group row mb-0">

                                                <div class="col-sm-12">

                                                    <button type="submit" class="btn btn-primary btn-lg float-right">Proceed</button>

                                                </div>

                                            </div>

                                        <?php echo form_close(); ?>

                                        <?php }else{ ?>

                                            <h5>Setup your bank information to enable withdrawal to bank. </h5><br>

                                            <a href="<?php echo base_url('preference'); ?>" class="btn btn-lg btn-danger">Go to settings</a>

                                        <?php } ?>

                                    </div>

                                </div>
                            </div>
                        </div>
				  
				
				<div class="col-xl-6 col-lg-6 col-md-12 col-12 mb-4">
                    <div class="card h-100">

                        <div class="card-body">

                            <h5 class="card-title">Withdrawal History</h5>

                            <table class="data-table responsive nowrap" data-order="[[ 1, &quot;desc&quot; ]]">

                                <thead>

                                    <tr>

                                        <th>Description</th>

                                        <th>Amount</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    <?php if(!empty($withdrawals)){

                                    foreach ($withdrawals as $row) { ?>

                                    <tr>

                                        <td>

                                            <p class="list-item-heading"><?php echo $row->description; ?><br><?php echo $row->date; ?></p>

                                        </td>

                                        <td>

                                            <p class="text-muted"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount);?></p>

                                        </td>

                                    </tr>

                                   <?php } } ?>

                                   

                                </tbody>

                            </table>

                        </div>

                    </div>
                </div>
                    </div>
        </div>
    </main>
     <script src="<?php echo base_url('assets_part/js/vendor/jquery-3.3.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/Chart.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/chartjs-plugin-datalabels.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/moment.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/fullcalendar.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/datatables.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/perfect-scrollbar.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/owl.carousel.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/progressbar.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/select2.full.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/nouislider.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/bootstrap-datepicker.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/Sortable.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/mousetrap.min.js');?>"></script>
    <script src="<?php echo base_url('assets_part/js/dore.script.js');?>"></script>
 <script>

        /* Dore Theme Select & Initializer Script 



Table of Contents



01. Css Loading Util

02. Theme Selector And Initializer

*/



/* 01. Css Loading Util */

function loadStyle(href, callback) {

  for (var i = 0; i < document.styleSheets.length; i++) {

    if (document.styleSheets[i].href == href) {

      return;

    }

  }

  var head = document.getElementsByTagName("head")[0];

  var link = document.createElement("link");

  link.rel = "stylesheet";

  link.type = "text/css";

  link.href = href;

  if (callback) {

    link.onload = function() {

      callback();

    };

  }

  head.appendChild(link);

}

/* 02. Theme Selector And Initializer */

(function($) {

  if ($().dropzone) {

    Dropzone.autoDiscover = false;

  }

  

  var themeColorsDom =

    ' ';

  $("body").append(themeColorsDom);

  var theme = "dore.dark.orange.min.css";



  if (typeof Storage !== "undefined") {

    if (localStorage.getItem("theme")) {

      theme = localStorage.getItem("theme");

    }

  }



  $(".theme-color[data-theme='" + theme + "']").addClass("active");



  loadStyle("<?php echo base_url('assets_part/css/');?>" + theme, onStyleComplete);

  function onStyleComplete() {

    setTimeout(onStyleCompleteDelayed, 300);

  }



  function onStyleCompleteDelayed() {

    var $dore = $("body").dore();

  }



  $("body").on("click", ".theme-color", function(event) {

    event.preventDefault();

    var dataTheme = $(this).data("theme");

    if (typeof Storage !== "undefined") {

      localStorage.setItem("theme", dataTheme);

      window.location.reload();

    }

  });





  $(".theme-button").on("click", function(event) {

    event.preventDefault();

    $(this)

      .parents(".theme-colors")

      .toggleClass("shown");

  });

  $(document).on("click", function(event) {

    if (

      !(

        $(event.target)

          .parents()

          .hasClass("theme-colors") ||

        $(event.target)

          .parents()

          .hasClass("theme-button") ||

        $(event.target).hasClass("theme-button") ||

        $(event.target).hasClass("theme-colors")

      )

    ) {

      if ($(".theme-colors").hasClass("shown")) {

        $(".theme-colors").removeClass("shown");

      }

    }

  });

})(jQuery);



        

        

    </script>

<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6629bb3fa0c6737bd13007ec/1hs9g6sk0';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
</body>



</html>