<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">

    <title>BeepAgro Pallative Partners</title>

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

    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/slick.css');?>">

    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/perfect-scrollbar.css');?>">

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
                    <li class="active" style="background-color: #1b191b;">

                        <a href="#">

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
            <div class="row">
                   <div class="col-12">
                    <h1>Partner Dashboard</h1>
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
            <div class="row">
                <div class="col-xl-3 col-lg-6 mb-4">

                    <div class="card">

                        <div class="card-header p-0 position-relative">

                            <div class="position-absolute handle card-icon">

                                <i class="simple-icon-shuffle"></i>

                            </div>

                        </div>

                        <div class="card-body d-flex justify-content-between align-items-center">

                            <h6 class="mb-0">Account Status</h6>

                             <?php if(!empty($user_details->logo) && !empty($user_details->category_id) && !empty($user_details->city) && !empty($user_details->state) && !empty($user_details->country) && !empty($user_details->address) ){

                                $isComp = 100;

                            }else{

                                $isComp = 60;

                            }

                            ?>

                            <div role="progressbar" class="progress-bar-circle position-relative" data-color="#28a745"

                                data-trailColor="#28a745" aria-valuemax="100" aria-valuenow="<?php echo $isComp; ?>" data-show-percent="true">

                            </div>

                        </div>

                    </div>

                </div>

                <div class="col-xl-3 col-lg-6 mb-4">

                    <div class="card">

                        <div class="card-header p-0 position-relative">

                            <div class="position-absolute handle card-icon">

                                <i class="simple-icon-shuffle"></i>

                            </div>

                        </div>

                        <div class="card-body d-flex justify-content-between align-items-center">

                            <h6 class="mb-0">Total Offers: <?php echo $total_offers;?></h6>                          

                            <div role="progressbar" class="progress-bar-circle position-relative" data-color="#28a745"

                                data-trailColor="#28a745" aria-valuemax="100" aria-valuenow="<?php echo $total_offers;?>" data-show-percent="true">

                            </div>

                        </div>

                    </div>

                </div>

                <div class="col-xl-3 col-lg-6 mb-4">

                    <div class="card">

                        <div class="card-header p-0 position-relative">

                            <div class="position-absolute handle card-icon">

                                <i class="simple-icon-shuffle"></i>

                            </div>

                        </div>

                        <div class="card-body d-flex justify-content-between align-items-center">

                            <h6 class="mb-0">Tickets / Redeemed: <?php echo $total_tickets;?> / <?php echo $tickets_used;?> </h6>

                            <div role="progressbar" class="progress-bar-circle position-relative" data-color="#28a745"

                                data-trailColor="#28a745" aria-valuemax="100" aria-valuenow="<?php echo $tickets_used;?>" data-show-percent="true">

                            </div>

                        </div>

                    </div>

                </div>

                <div class="col-xl-3 col-lg-6 mb-4">

                    <div class="card">

                        <div class="card-header p-0 position-relative">

                            <div class="position-absolute handle card-icon">

                                <i class="simple-icon-shuffle"></i>

                            </div>

                        </div>

                        <div class="card-body d-flex justify-content-between align-items-center">

                            <h6 class="mb-0">Total Locations: <?php echo $total_locations; ?></h6>

                            <div role="progressbar" class="progress-bar-circle position-relative" data-color="#28a745"

                                data-trailColor="#28a745" aria-valuemax="100" aria-valuenow="<?php echo $total_locations; ?>" data-show-percent="true">

                            </div>

                        </div>

                    </div>

                </div>
            </div>
            <div class="row">
             <div class="col-lg-12 col-xl-4">
                    <div class="row">
                        <div class="col-12 mb-4">
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
								  <p class="mb-4 text-muted text-small"><?php echo $user_details->email; ?></p>
								</div>
							  </div>
							</div>
                        </div>
						 <div class="col-12 mb-4">
                            <div class="card ">
							  <div class="card-body">
								<div class="tab-pane show active" id="pickup_first" role="tabpanel" aria-labelledby="first-tab">

                                           <h3 class="mb-2 text-primary">Palliative Ticket Verification</h3><br><br>

                                           <form action="<?php echo base_url('partners/verify_ticket');?>" method="post">
											    <div class="form-group row">
                                                        <div class="col-12 mb-4 mt-2">
                                                            <p class="text-warning"> 
																Make sure the redeemer has brought a valid Government Identification, you will use that to verify that the name from this verification matches that of the ID provided by the redeemer
															</p>

                                                        </div>

                                                    </div>

                                                    <div class="form-group row">

                                                        <label class="col-sm-3 col-form-label">Ticket Code</label>

                                                        <div class="col-sm-9">

                                                            <input type="text" name="code" class="form-control" placeholder="Enter Picker Verification Code Here" >

                                                        </div>

                                                    </div>

                                                    <div class="form-group row">

                                                        <label class="col-sm-3 col-form-label">Category</label>

                                                        <div class="col-sm-9">

                                                            <label class="w-100">

                                                                <select class="form-control select2-single select2-hidden-accessible" tabindex="-1" aria-hidden="true">

                                                                    <option label="&nbsp;">BeepAgro Partner Redeem Center</option>

                                                                </select>

                                                            </label>

                                                        </div>

                                                    </div>

        

                                                    <div class="form-group row mb-0">

                                                        <div class="col-sm-12">

                                                            <button type="submit" class="btn btn-lg btn-primary float-right">Verify</button>

                                                        </div>

                                                    </div>

                                                </form>

                                            </div>
							  </div>
							</div>
                        </div>
                    </div>
                </div>
			 <div class="col-xl-4 col-lg-12 mb-4">
                    <div class="card">

                        <div class="position-absolute card-top-buttons">

                            <button class="btn btn-header-light icon-button">

                                <i class="simple-icon-refresh"></i>

                            </button>

                        </div>



                        <div class="card-body" >

                            <h5 class="card-title">Latest Referrals</h5>

                            <div class="scroll dashboard-list-with-thumbs">

                                         <?php 

                                         if(!empty($referrals)){

                                             foreach ($referrals as $row) { 

                                                $fname = $this->generic_model->getInfo('philanthropy_partners','id',$row->user_id)->name;

                                                $image = $this->generic_model->getInfo('philanthropy_partners','id',$row->user_id)->logo;

                                                if(empty($image)){

                                                    $imager = 'assets_part/img/profile-pic-l-2.jpg';

                                                }else{

                                                    $imager = $image;

                                                }

                                                $dateJoined = $this->generic_model->getInfo('users','id',$row->user_id)->created_at;

                                             ?>

                                                <div class="d-flex flex-row mb-3 pb-3 border-bottom">

                                                <a href="#"> 

                                                    <img src="<?php echo base_url($imager);?>" alt="<?php echo $this->generic_model->getInfo('philanthropy_partners','id',$row->user_id)->email; ?>" class="img-thumbnail border-0 rounded-circle list-thumbnail align-self-center xsmall" width="50px" height="50px" />

                                                </a>

                                                <div class="pl-3 pr-2">

                                                    <a href="#">

                                                        <p class="font-weight-medium mb-0 "><?php echo $fname; ?></p>

                                                        <p class="text-muted mb-0 text-small"><?php echo $dateJoined; ?></p>

                                                    </a>

                                                </div>

                                        </div>

                                         <?php }}else{ echo 'You do not have any referral yet'; }?>

                                    </div>

                        </div>

                    </div>
                </div>
             <div class="col-xl-4 col-lg-12 mb-4">
                    <div class="card">

                        <div class="position-absolute card-top-buttons">

                            <button class="btn btn-header-light icon-button">

                                <i class="simple-icon-refresh"></i>

                            </button>

                        </div>



                        <div class="card-body" >

                            <h5 class="card-title">Recent Transactions</h5>

                            <div class="scroll dashboard-list-with-thumbs">

                                <?php

                                  if(!empty($results)){

                                    foreach ($results as $row) { ?>

                                    

                                    <div class="d-flex flex-row mb-3">

                                    <a class="d-block position-relative" href="#">

                                        <!--<img src="<?php //echo base_url('assets_part/img/marble-cake-thumb.jpg');?>" alt="Marble Cake" class="list-thumbnail border-0" />

                                        <span class="badge badge-pill badge-theme-2 position-absolute badge-top-right">NEW</span>-->

                                    </a>

                                    <div class="pl-3 pt-2 pr-2 pb-2">

                                        <a href="javascript:void()">

                                            <p class="list-item-heading"><?php echo $row->transaction_type; ?></p>

                                            <div class="pr-4">

                                                <p class="text-muted mb-1 text-small"><?php echo $row->description; ?></p>

                                            </div>

                                            <?php

                                                if($row->status == 'Successful'){?>

                                            <div class="text-success text-small font-weight-medium mb-1">

                                                <?php if($row->amount < 1) { echo 'Amount: '.number_format($row->amount,8).' BPT '.$row->status;}else { ?>Amount: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount); }?>

                                            </div>

                                            <?php }elseif($row->status == 'Pending' || $row->status == 'pending'){ ?>

                                            <div class="text-warning text-small font-weight-medium d-none d-sm-block mb-1">Amount: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount); ?> | <?php echo $row->status; ?></div>

                                            <?php }else{ ?>

                                            <div class="text-danger text-small font-weight-medium d-none d-sm-block mb-1">Amount: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount); ?> | <?php echo $row->status; ?></div>

                                            <?php } ?>

                                            <div class="text-success text-muted font-weight-medium d-none d-sm-block"><?php echo $row->transaction_date; ?></div>

                                        </a>

                                    </div>

                                </div>

                                        

                                 <?php   } } ?>

                            </div>

                        </div>

                    </div>
                </div>
            </div>
			<div class="row">
			  <div class="col-xl-6 col-lg-6 col-md-6 col-12">
				  <div class="card">
					  <div class="card-body">
					   <form action="<?php echo base_url('partners/add_location');?>" method="post">
                              <div class="col-12 mb-4 mt-2">
							  <h3 class="mb-2 text-primary">Add A Location</h3><br><br>
                              <p class=""> Use this form to add branch/franchise locations to your account.<p>

                          </div>
                          <div class="row">
							<div class="col-12 mb-4 mt-2">
							   <label>Location Name</label>	
                               <input type="text" name="name" class="form-control" value="<?php echo $user_details->name; ?>" >
								 <div class="invalid-tooltip">Location Name</div>
                            </div>
												
							<div class="col-12 mb-4 mt-2">
							   <label>Street Address</label>	
                               <input type="text" name="address" class="form-control" placeholder="Enter Street Address" >
								 <div class="invalid-tooltip">Location Address</div>
                            </div>
                        </div>
                          <div class="row">
							<div class="col-12 mb-4 mt-2">
							  <label>Country</label>	
								<?php $countries = $this->generic_model->get_countries(); ?>									<select name="country" id="country_id" class="form-control form-control-lg" onchange="getstates()">
									<option value="">Set Country</option>
										<?php foreach($countries as $country){ ?>
										<option value="<?php echo $country->id; ?>"><?php echo $country->country_name; ?></option>
										<?php } ?>
								</select>
								  <div class="invalid-tooltip"> Please Choose a country. </div>
								</div>
								<div class="col-12 mb-4 mt-2">	
								 <label>State/Region</label>		
								 <div id="statePop">
									<select class="form-control form-control-lg">
										  <option value="">Select Country First</option>
									</select>
								 </div>
								 <div id="statePopmessage" class="text-primary mt-2" style="display:none"></div>
								  <div class="invalid-tooltip"> Please choose a state. </div>
								</div>	 
								<div class="col-12 mb-4 mt-2">
								 <label>City/Town/County</label>	
								  <div id="cityPop">
									<select class="form-control form-control-lg">
									  <option value="">Select Country and State/Region First</option>
									</select>
								  </div>
								<div id="cityPopmessage" class="text-primary mt-2" style="display:none"></div>
								  <div class="invalid-tooltip"> Please Choose a city. </div>
								</div>
                         </div>
                          <div class="form-group row mb-0">
                              <div class="col-sm-12">
                              <button type="submit" class="btn btn-lg btn-primary float-right">Add Location</button>
							  </div>
                         </div>
                       </form>
					  </div>				  
				  </div>
			  </div>
			   <div class="col-xl-6 col-lg-6 col-md-6 col-12">
				  <div class="card">
					  <div class="card-body">
					  	 <?php echo form_open_multipart('partners/create_offer'); ?>
                              <div class="col-12 mb-4 mt-2">
							  <h3 class="mb-2 text-primary">Create An Offer</h3><br><br>
                              <p class=""> Use this form to add new offers.<p>
                          </div>
                          <div class="row">
								<div class="col-12 mb-4 mt-2">
								<label>Offer Name</label>	
                                  <textarea name="offer" style="height: 160px;" class="form-control">What are you offering?</textarea>
								  <div class="invalid-tooltip">Offer Name</div>
                           </div>
					       <div class="col-12 mb-4 mt-2">
							  <label>Offer Amount</label>	 
                              <input type="text" name="amount" class="form-control" placeholder="How much is the offer?">
								 <div class="invalid-tooltip">Offer Amount</div>
                           </div>
					       <div class="col-12 mb-4 mt-2">
							   <label class="mb-3">Add an Image</label>	 
							   <p class="text-warning mb-5">Image must be equal dimensions in length and height, maximum file size is 4mb, accepted file types: jpg,png,gif</p>
                              <input type="file" name="userfile" class="form-control" id="inputGroupFile02" required>
							  <div class="invalid-tooltip">Offer Image</div>
                           </div>
                           </div>
                          <div class="form-group row mb-0">
                              <div class="col-sm-12">
                                 <button type="submit" class="btn btn-lg btn-primary float-right">Submit</button>
                              </div>
                         </div>
                      <?php echo form_close(); ?>
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
    <script src="<?php echo base_url('assets_part/js/vendor/perfect-scrollbar.min.js');?>" style="opacity: 1;"></script>
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