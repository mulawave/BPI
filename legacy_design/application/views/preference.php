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

                    <li class="active" style="background-color: #1b191b;">

                        <a href="javascript:void();">

                            <i class="glyph-icon iconsmind-Security-Settings"></i>Settings

                        </a>

                    </li>

                    <li>

                        <a href="<?php echo base_url('ptransactions');?>">

                            <i class="iconsmind-Receipt-3"></i>Transactions

                        </a>

                    </li>
					<li>
                        <a href="<?php echo base_url('pwallet');?>">
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
        <h1>Account Settings</h1>
        <nav class="breadcrumb-container d-none d-sm-block d-lg-inline-block" aria-label="breadcrumb">
          <ol class="breadcrumb pt-0">
            <li class="breadcrumb-item"> <a href="#">Dashboard</a> </li>
            <li class="breadcrumb-item"> <a href="#">Settings</a> </li>
          </ol>
        </nav>
        <div class="separator mb-5"></div>
      </div>
    </div>
    <h5 class="mb-4">Business Information</h5>
    <div class="row">
      <div class="col-md-6 col-sm-6 col-lg-4 col-12 mb-4">
        <div class="card ">
          <div class="card-body">
            <div class="text-center"> 
				<?php if(empty($user_details->logo)){
												$logo = base_url('assets_part/default_icon.jpg');
											}
										  else{
											  
											   $logo = base_url($user_details->logo);
										  }
									?>
			<img alt="Profile" src="<?php echo $logo; ?>" class="img-thumbnail border-0 rounded-circle mb-4 list-thumbnail">
              <p class="list-item-heading mb-1"><?php echo $user_details->name; ?></p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-sm-6 col-lg-4 col-12 mb-4">
        <div class="card ">
          <div class="card-body">
            <div class="text-center">
              <p class="list-item-heading mb-1">Contact Information</p>
              <p class="mb-4 text-muted text-small">---</p>
              <p class="mb-4 text-muted text-small"><?php echo $user_details->email; ?></p>
              <p class="mb-4 text-muted text-small"><?php echo $user_details->ref_code; ?></p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-sm-6 col-lg-4 col-12 mb-4">
        <div class="card ">
          <div class="card-body">
            <div class="text-center">
              <?php if ($this->session->flashdata('kyc_success')): ?>
              <p style="color: green;">
                <?= $this->session->flashdata('kyc_success'); ?>
              </p>
              <?php endif; ?>
              <?php if ($this->session->flashdata('kyc_error')): ?>
              <p style="color: red;">
                <?= $this->session->flashdata('kyc_error'); ?>
              </p>
              <?php endif; ?>
            </div>
            <div class="text-center">
              <p class="list-item-heading mb-1">Financial Information</p>
              <p class="mb-4 text-muted text-small">---</p>
              <?php if(!empty($bank_records)){ ?>
              <p class="mb-4 text-muted text-small"><?php echo $bank_records->bank_account; ?></p>
              <p class="mb-4 text-muted text-small"><?php echo $bank_records->bank_name; ?></p>
              <?php }else{ ?>
              <p>Add your financial details to activate withdrawal</p>
              <?php } ?>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card mb-4">
      <div class="card-body">
        <?php if ($this->session->flashdata('success')): ?>
        <p style="color: green;">
          <?= $this->session->flashdata('success'); ?>
        </p>
        <?php endif; ?>
        <?php if ($this->session->flashdata('error')): ?>
        <p style="color: red;">
          <?= $this->session->flashdata('error'); ?>
        </p>
        <?php endif; ?>
        <h3 class="mb-3">Change Business Logo</h3>
        <p class="text-warning">Acceptable file types: jpg,png. Maximum file size: 4MB</p>
        <?php echo form_open_multipart('partners/upload_profile_picture'); ?>
        <div class="input-group mb-3">
          <div class="custom-file">
            <input type="file" name="userfile" class="form-control" id="inputGroupFile02" required>
          </div>
          <div class="input-group-append">
            <button type="submit" class="input-group-text">Upload</button>
          </div>
        </div>
        <?php echo form_close(); ?> </div>
    </div>
	<div class="row">
		<div class="col-xl-6 col-lg-6 col-12">
			<div class="card mb-4">
			  <div class="card-body">
				<?php if ($this->session->flashdata('address_success')): ?>
				<p style="color: green;">
				  <?= $this->session->flashdata('address_success'); ?>
				</p>
				<?php endif; ?>
				<?php if ($this->session->flashdata('address_error')): ?>
				<p style="color: red;">
				  <?= $this->session->flashdata('address_error'); ?>
				</p>
				<?php endif; ?>
				<h3 class="mb-5">Business Details</h3>
				<p class="text-warning mb-5">All the fields marked with <span class="text-danger">*</span> are compulsory!</p>
				<form class="mb-5" action="<?php echo base_url('partners/update_bio'); ?>" method="post">

				  <div class="form-row mb-4">            
					<div class="col-12 mb-5">
					  <label for="validationTooltip005">Business Address <span class="text-danger">*</span></label>
					  <input type="text" name="address" class="form-control" id="validationTooltip005" value="<?php echo $user_details->address; ?>" required>
					  <div class="invalid-tooltip"> Please provide an Address. </div>
					</div>
					<div class="col-12 mb-5">
					  <label for="validationTooltip005">Business Category <span class="text-danger">*</span></label>
						<select class="form-control select2-single" id="validationTooltip005" name="category" required >
						<optgroup label="Select a Category">
						<option>Choose your business category</option>
						<?php foreach ($category as $item): ?>
						<option value="<?= $item->id; ?>"><?= $item->name; ?> - <?= $item->code; ?></option>
						<?php endforeach; ?>
						</optgroup>
					  </select>
					  <div class="invalid-tooltip"> Please select a Category. </div>
					</div>
				  </div>

				  <button class="btn btn-primary btn-lg" type="submit">Save Changes</button>
				</form>
			  </div>
			</div>
		</div>
		<div class="col-xl-6 col-lg-6 col-12">
			<div class="card mb-4">
			  <div class="card-body">
				<?php if ($this->session->flashdata('pin_success')): ?>
				<p style="color: green;">
				  <?= $this->session->flashdata('pin_success'); ?>
				</p>
				<?php endif; ?>
				<?php if ($this->session->flashdata('pin_error')): ?>
				<p style="color: red;">
				  <?= $this->session->flashdata('pin_error'); ?>
				</p>
				<?php endif; ?>
				<h3 class="mb-3">Location Login Pin</h3>
				<p class="mb-3">One Pin, Multiple Locations. Location Login Pin enables fast and quicker access to your branch management portal from any location. Your Location Login Pin is alphanumeric, meaning you can have both numbers and letters and special characters. Keep your Location Login Pin as simple as you can. No Sensitive or Financial Business Data can be accessed, manipulated or viewed from the branch management portal</p>
				<form class="mb-5" action="<?php echo base_url('partners/update_pin'); ?>" method="post">
				  <div class="form-row mb-4">            
					<div class="col-12 mb-3">
					  <label for="validationTooltip005">Current Pin</label>
					  <input type="text" readonly class="form-control"  value="<?php echo $user_details->pin; ?>" required>
					</div>
					<div class="col-12 mb-3">
					  <label for="validationTooltip005">Set New Pin <span class="text-danger">*</span></label>
					  <input type="text" name="pin" class="form-control"  placeholder="Enter New Pin Here" required>
					  <div class="invalid-tooltip"> Please Enter a Pin. </div>
					</div>
				  </div>

				  <button class="btn btn-primary btn-lg" type="submit">Update</button>
				</form>
			  </div>
			</div>
		</div>
	</div>
    <div class="card mb-4">
      <div class="card-body">
        <?php if ($this->session->flashdata('bank_success')): ?>
        <p style="color: green;">
          <?= $this->session->flashdata('bank_success'); ?>
        </p>
        <?php endif; ?>
        <?php if ($this->session->flashdata('bank_error')): ?>
        <p style="color: red;">
          <?= $this->session->flashdata('bank_error'); ?>
        </p>
        <?php endif; ?>
        <h6 class="mb-3">Financial Information</h6>
        <p>Add a bank account we can send your money to</p>
        <form class="mb-5" action="<?php echo base_url('partners/update_account'); ?>" method="post">
          <div class="form-row">
            <div class="col-md-8 mb-3">
              <label for="validationTooltip02">Account Name</label>
              <input type="text" name="account_name" class="form-control" id="validationTooltip02" value="<?php echo isset($bank_records->bank_account) ? $bank_records->bank_account : ''; ?>" <?php if(empty($bank_records)){ ?> required <?php }else { ?> readonly <?php } ?>>
              <div class="valid-icon" data-toggle="tooltip" data-placement="left" title="Looks good!"> <i class="simple-icon-check"></i> </div>
            </div>
            <div class="col-md-4 mb-3">
              <label for="validationTooltip02">Account Number</label>
              <input type="text" name="account_number" class="form-control" id="validationTooltip02" value="<?php echo isset($bank_records->account_number) ? $bank_records->account_number : ''; ?>" <?php if(empty($bank_records)){ ?> required <?php }else { ?> readonly <?php } ?>>
              <div class="valid-icon" data-toggle="tooltip" data-placement="left" title="Looks good!"> <i class="simple-icon-check"></i> </div>
            </div>
          </div>
          <div class="form-row">
            <div class="col-md-6 mb-3">
              <label for="validationTooltip01">Bank Name</label>
              <input type="text" name="bank_name" class="form-control" id="validationTooltip01" value="<?php echo isset($bank_records->bank_name) ? $bank_records->bank_name : ''; ?>" <?php if(empty($bank_records)){ ?> required <?php }else { ?> readonly <?php } ?>>
              <div class="valid-icon" data-toggle="tooltip" data-placement="left" title="Looks good!"> <i class="simple-icon-check"></i> </div>
            </div>
            <div class="col-md-6 mb-3">
              <input type="hidden" name="bvn" class="form-control" id="validationTooltip03" value="1234">
            </div>
          </div>
          <?php if(empty($bank_records)){ ?>
          <button class="btn btn-primary" type="submit">Save Account</button>
          <?php } ?>
        </form>
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
<script>

    function getstates(){

            $('#statePopmessage').html('Fetching States...');

            $('#statePopmessage').fadeIn();

            var code = $('#country_id').val();

            //alert(code);

            if(code =='all'){

                $('#city').val('all');

            }else{

            $.ajax({    

               type:'POST',

               url: '<?php echo base_url(); ?>get_states',

               data :  {code:code},

               dataType: "text",  

               cache:false,

               success: 

                function(data){

              //  alert(data);  //as a debugging message.

                $('#statePopmessage').fadeOut();

                $('#statePop').html(data);

                $('#statePop').show();

              }

            });

            }

        }

    function getCities(){

            $('#cityPopmessage').html('Fetching Cities...');

            $('#cityPopmessage').fadeIn();

            var code = $('#state_id').val();

            $.ajax({    

               type:'POST',

               url: '<?php echo base_url(); ?>get_cities',

               data :  {code:code},

               dataType: "text",  

               cache:false,

               success: 

                function(data){

               $('#cityPopmessage').fadeOut();

                $('#cityPop').html(data);

                 $('#cityPop').show();

              }

            });

        }

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