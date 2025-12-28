<!DOCTYPE html>
<html lang="en" data-footer="true">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <title>BeepAgro Palliative Initiative | Card Payment</title>
    <meta name="description" content="Transforming Lives!">
    <link rel="apple-touch-icon-precomposed" sizes="57x57" href="<?php echo base_url('assets/img/favicon/apple-icon-57x57.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<?php echo base_url('assets/img/favicon/apple-icon-114x114.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<?php echo base_url('assets/img/favicon/apple-icon-72x72.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="<?php echo base_url('assets/img/favicon/apple-icon-144x144.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="60x60" href="<?php echo base_url('assets/img/favicon/apple-icon-60x60.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="120x120" href="<?php echo base_url('assets/img/favicon/apple-icon-120x120.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="76x76" href="<?php echo base_url('assets/img/favicon/apple-icon-76x76.png');?>">
    <link rel="apple-touch-icon-precomposed" sizes="152x152" href="<?php echo base_url('assets/img/favicon/apple-icon-152x152.png');?>">
    <link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-196x196.png" sizes="196x196');?>">
    <link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-96x96.png" sizes="96x96');?>">
    <link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-32x32.png" sizes="32x32');?>">
    <link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-16x16.png" sizes="16x16');?>">
    <link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-128.png" sizes="128x128');?>">
    <meta name="application-name" content="&nbsp;">
    <meta name="msapplication-TileColor" content="#FFFFFF">
    <meta name="msapplication-TileImage" content="<?php echo base_url('assets/img/favicon/mstile-144x144.png');?>">
    <meta name="msapplication-square70x70logo" content="<?php echo base_url('assets/img/favicon/mstile-70x70.png');?>">
    <meta name="msapplication-square150x150logo" content="<?php echo base_url('assets/img/favicon/mstile-150x150.png');?>">
    <meta name="msapplication-wide310x150logo" content="<?php echo base_url('assets/img/favicon/mstile-310x150.png');?>">
    <meta name="msapplication-square310x310logo" content="<?php echo base_url('assets/img/favicon/mstile-310x310.png');?>">
    <link rel="preconnect" href="https://fonts.gstatic.com/">
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;700&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo base_url('assets/font/CS-Interface/style.css');?>">
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>">
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/OverlayScrollbars.min.css');?>">
    <link rel="stylesheet" href="<?php echo base_url('assets/css/styles.css');?>">
    <link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>">
    <script src="<?php echo base_url('assets/js/base/loader.js');?>"></script>	  
  </head>
  <body>
    <div id="root">
        
       <!-- navbar segment -->
      <div id="nav" class="nav-container d-flex">
        <div class="nav-content d-flex">
          <div class=" position-relative">
            <a href="https://beepagro.com/">
              <div class=""><img src="<?php echo base_url('assets/img/logo/beep_agro_logo.jpg" alt="logo');?>"  width="55px" ></div>
            </a>
          </div>
          <div class="user-container d-flex">
            <a href="#" class="d-flex user position-relative" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <img class="profile" alt="profile" src="<?php echo base_url($user_details->profile_pic);?>">
              <div class="name"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></div>
            </a>
            <div class="dropdown-menu dropdown-menu-end user-menu wide">
              <div class="row mb-3 ms-0 me-0">
                <div class="col-12 ps-1 mb-2">
                  <div class="text-extra-small text-primary">ACCOUNT</div>
                </div>
                <div class="col-6 ps-1 pe-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('profile');?>">User Profile</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('donor');?>">Preferences</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('aid_tickets');?>">BPI Tickets</a>
                    </li>
                  </ul>
                </div>
                <div class="col-6 pe-1 ps-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('security');?>">Security</a>
                    </li>
                    <li> <a href="<?php echo base_url('billing');?>">Billing</a> </li>
<li> <a href="<?php echo base_url('notifications');?>">Notifications</a> </li>
                  </ul>
                </div>
              </div>
              <div class="row mb-1 ms-0 me-0">
                <div class="col-12 p-1 mb-2 pt-2">
                  <div class="text-extra-small text-primary">APPLICATION</div>
                </div>
                <div class="col-6 ps-1 pe-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="#" data-bs-toggle="modal" data-bs-target="#settings">Themes</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('settings');?>">Currency</a>
                    </li>
                  </ul>
                </div>
                <div class="col-6 pe-1 ps-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('security');?>">Logs</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('notifications');?>">Alerts</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="row mb-1 ms-0 me-0">
                <div class="col-12 p-1 mb-3 pt-3">
                  <div class="separator-light"></div>
                </div>
                <div class="col-6 ps-1 pe-1">
                  <ul class="list-unstyled">
                      <li>
                      <a href="<?php echo base_url('settings');?>">
                        <i data-acorn-icon="gear" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Settings</span>
                      </a>
                    </li> 
                    <!--<li>
                      <a href="#">
                        <i data-acorn-icon="help" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Help</span>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i data-acorn-icon="file-text" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Docs</span>
                      </a>
                    </li>-->
                  </ul>
                </div>
                <div class="col-6 pe-1 ps-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('logout');?>">
                        <i data-acorn-icon="logout" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Logout</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <ul class="list-unstyled list-inline text-center menu-icons">
            <li class="list-inline-item">
              <a href="#" data-bs-toggle="modal" data-bs-target="#searchPagesModal">
                <i data-acorn-icon="search" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" id="pinButton" class="pin-button">
                <i data-acorn-icon="lock-on" class="unpin" data-acorn-size="18"></i>
                <i data-acorn-icon="lock-off" class="pin" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" id="colorButton">
                <i data-acorn-icon="light-on" class="light" data-acorn-size="18"></i>
                <i data-acorn-icon="light-off" class="dark" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" data-bs-toggle="dropdown" data-bs-target="#notifications" aria-haspopup="true" aria-expanded="false" class="notification-button">
                <div class="position-relative d-inline-flex">
                  <i data-acorn-icon="bell" data-acorn-size="18"></i>
                   <?php if ($unread_count > 0): ?>
                        <span class="position-absolute notification-dot rounded-xl"><strong><?php echo $unread_count; ?></strong></span>
                   <?php endif; ?>
                </div>
              </a>
              <div class="dropdown-menu dropdown-menu-end wide notification-dropdown scroll-out" id="notifications">
                <div class="scroll">
              <?php foreach ($notifications as $notification): ?>
              <div class="row mb-1 pb-1 border-bottom"> 
                <!-- <a href="<?php //echo $notification->link; ?>">
                                <img src="<?php echo base_url(); ?>assets/img/profile-pic-l-2.jpg" alt="Notification Image" class="img-thumbnail list-thumbnail xsmall border-0 rounded-circle">
                            </a>-->
                <div class="col-12 mb-2"> 
					<a href="<?php echo base_url('notifications');?>">
                  		<p class="text-primary">
					  		<?php echo $notification['title']; ?><br>
                  			<em class="mt-2 text-success">
								Received on: <?php echo $notification['title']; ?>
							</em> 
						</p>
					</a> 
				</div>
                <div class="col-12 mb-2">
                  <a href="<?php echo base_url('mark_as_read/' . $notification['id']); ?>" class="float-right">Mark as Read</a>
                </div>
              </div>
              <?php endforeach; ?>
			  <div class="mt-5">
				<a href="<?php echo base_url('notifications');?>">View Notifications</a>
			  </div>
              
              <!--<ul class="list-unstyled border-last-none">
                    <li class="mb-3 pb-3 border-bottom border-separator-light d-flex">
                      <img src="img/profile/profile-1.webp" class="me-3 sw-4 sh-4 rounded-xl align-self-center" alt="...">
                      <div class="align-self-center">
                        <a href="#">Joisse Kaycee just sent a new comment!</a>
                      </div>
                    </li>
                  </ul>--> 
            </div>
              </div>
            </li>
          </ul>
          <div class="menu-container flex-grow-1">
            <ul id="menu" class="menu">
              <li> <a href="<?php echo base_url('blogs'); ?>"> <i data-acorn-icon="file-text" class="icon" data-acorn-size="18"></i> <span class="label">Blog</span> </a> </li>
              <?php  if(!empty($user_details->is_vip) && empty($user_details->shelter_wallet)){  ?>
				<li>
                <a href="<?php echo base_url('upgrade_bpi'); ?>">
                  <i data-acorn-icon="trend-up" class="icon" data-acorn-size="18"></i>
                  <span class="label">Upgrade</span>
                </a>
              </li>
			 <?php } ?>
              <li>
                <a href="#">
                  <i data-acorn-icon="messages" class="icon" data-acorn-size="18"></i>
                  <span class="label">Community</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="mobile-buttons-container">
            <a href="#" id="mobileMenuButton" class="menu-button">
              <i data-acorn-icon="menu"></i>
            </a>
          </div>
        </div>
        <div class="nav-shadow"></div>
      </div>
       <!-- end navbar segment -->
       
      <main>
        <div class="container">
          <div class="row">
              
            
               <!-- menu segment -->
            <div class="col-auto d-none d-lg-flex">
              <ul class="sw-25 side-menu mb-0 primary" id="menuSide">
                <li>
                  <a href="#" data-bs-target="#dashboard">
                    <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i>
                    <span class="label">Member Dashboard</span>
                  </a>
                  <ul>
                    <li>
                      <a href="<?php echo base_url('dashboard');?>">
                        <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Home</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('analytics');?>">
                        <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Analytics</span>
                      </a>
                    </li>
					 <li>
                      <a href="<?php echo base_url('my_assets');?>">
                        <i data-acorn-icon="wallet" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Assets</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('refer');?>">
                        <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Invites</span>
                      </a>
                    </li>
                  </ul>
                </li>
				<li>
                  <a href="#" data-bs-target="#store">
                    <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i>
                    <span class="label">Storefront</span>
                  </a>
                  <ul>
                    <li>
                      <a href="<?php echo base_url('store');?>">
                        <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Global Store</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('checkout');?>">
                        <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">My Cart</span>
                      </a>
                    </li>
					  <li>
                      <a href="<?php echo base_url('my_items');?>">
                        <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">My Claims</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#services">
                    <i data-acorn-icon="grid-1" class="icon" data-acorn-size="18"></i>
                    <span class="label">Palliative Services</span>
                  </a>
                  <ul>
                    <li>
                      <a href="<?php echo base_url('club');?>">
                        <i data-acorn-icon="database" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">BPI</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('donor');?>">
                        <i data-acorn-icon="file-image" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Donors</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('merchants');?>">
                        <i data-acorn-icon="router" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Pickup Locations</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('palliative');?>">
                        <i data-acorn-icon="book" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Student Palliative</span>
                      </a>
                    </li>
					 <li>
                      <a href="<?php echo base_url('aid_tickets');?>">
                        <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Tickets</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#account">
                    <i data-acorn-icon="user" class="icon" data-acorn-size="18"></i>
                    <span class="label">Account Management</span>
                  </a>
                  <ul>
					  <li>
                      <a href="<?php echo base_url('billing');?>">
                        <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Billing</span>
                      </a>
                    </li>
					<li>
                      <a href="<?php echo base_url('security');?>">
                        <i data-acorn-icon="shield" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Security</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('settings');?>">
                        <i data-acorn-icon="gear" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Settings</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('transactions');?>">
                        <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Transactions</span>
                      </a>
                    </li>
                    
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#support">
                    <i data-acorn-icon="help" class="icon" data-acorn-size="18"></i>
                    <span class="label">Support</span>
                  </a>
                  <ul>
                    <li>
                      <a href="support.html">
                        <i data-acorn-icon="file-empty" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Docs</span>
                      </a>
                    </li>
                    <li>
                      <a href="knowledgebase.html">
                        <i data-acorn-icon="notebook-1" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Knowledge Base</span>
                      </a>
                    </li>
                    <li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
                  </ul>
                </li>
              </ul>
            </div>
               <!-- end menu segment -->
               
            
            <?php
            $link = base_url().'flutterwaveCallback_vip_dual';
            ?>

            <div class="col">
              
              	<!-- Title segment-->
              <div class="page-title-container mb-3">
                <div class="row">
                  <div class="col mb-2">
                    <h1 class="mb-2 pb-0 display-4" id="title">BPI Card Pay</h1>
                    <div class="text-muted font-heading text-small">Helping to empower the community we serve!</div>
                  </div>
                 <div>
                <?php
                $error = $this->session->flashdata('error');
                if($error)
                { ?>
                            <div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('error'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                            </div>
                <?php } ?>
                <?php  
                        $success = $this->session->flashdata('success');
                        if($success)
                        {
                    ?>
                            <div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('success'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                            </div>
                <?php } ?>
                <?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
                </div>
                </div>
              </div>
				<!-- Title segment-->
			    	<div class="row">
				<div class="col-12 col-xxl-4 col-xl-6 mb-5">
                  <div class="d-flex justify-content-between">
                    <h2 class="small-title">Checking Out</h2>
                  </div>
                  <div class="card sh-35 h-xl-100-card">
                    <div class="card-body row g-0 h-100">
                        <div class="col-12">
                        <div class="cta-2">Card Payment</div>
                        <div class="mb-3 text-primary">inclusive of VAT 7.5%</div>
                        <div class="row g-2">
                          <div class="col-12 mb-2 mt-2">
                            <div class=""> 
								<p>Sub Total : <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$amount);?> </p>
								
								<p>Vat - 7.5%:    <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$vat);?> </p>
								
								<h3>Total Due: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?></h3>
							</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
					<?php $percentage = 7.5 / 100; $vat = $amount * $percentage; ?>
                <div class="col-12 col-xxl-8 col-xl-6 mb-5">
                  <h2 class="small-title">Make your payment</h2>
                  <div class="card sh-35 h-xl-100-card">
                    <div class="card-body row g-0 h-100">
                        <div class="col-12">
                        <div class="cta-2"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?></div>
                        <div class="mb-3 text-primary">inclusive of VAT 7.5%</div>
                        <div class="row g-2">
                          <div class="col-12 mb-4 mt-4">
                            <div class=""> 
								 Please note that card payment attract a processing charge of 1.7% 
							</div>
                          </div>
                          <div class="col-12 col-sm-auto d-flex align-items-center position-relative">
                            <button type="button" onclick="payWithRave()" class="btn btn-icon btn-icon-start btn-primary">
                              <i data-acorn-icon="cart"></i>
                              <span>Pay Now</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>                
              </div>
				
				
				<div class="row mb-n5">
                <div class="col-12 col-xxl-auto mb-5">
                  <h2 class="small-title">Top Activation by Packages (Users)</h2>
                  <div class="row g-2 h-100">
                    <div class="col-12 col-sm-4 col-xxl-auto">
                      <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                        <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                          <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                            <div role="progressbar" class="progress-bar-circle position-relative text-muted text-small" data-trail-color="" aria-valuemax="100" aria-valuenow="98" data-show-percent="true" data-hide-all-text="false" data-stroke-width="3" data-trail-width="1" data-duration="0"></div>
                          </div>
                          <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">BPI Gold Plus</div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 col-sm-4 col-xxl-auto">
                      <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                        <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                          <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                            <div role="progressbar" class="progress-bar-circle position-relative text-muted text-small" data-trail-color="" aria-valuemax="100" aria-valuenow="87" data-show-percent="true" data-hide-all-text="false" data-stroke-width="3" data-trail-width="1" data-duration="0"></div>
                          </div>
                          <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">BPI Silver Plus</div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 col-sm-4 col-xxl-auto">
                      <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                        <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                          <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                            <div role="progressbar" class="progress-bar-circle position-relative text-muted text-small" data-trail-color="" aria-valuemax="100" aria-valuenow="54" data-show-percent="true" data-hide-all-text="false" data-stroke-width="3" data-trail-width="1" data-duration="0"></div>
                          </div>
                          <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">BPI Regular</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col mb-5">
                  <h2 class="small-title">BPI Global Storefront</h2>
                  <div class="card h-100-card">
                    <div class="card-body row g-0">
                      <div class="col-12">
                        <div class="cta-2">Have you visited our store today?</div>
                        <div class="mb-3 text-primary">Tons or products to be claimed!</div>
                        <div class="row g-2">
                          <div class="col">
                            <div class="text-muted mb-3 mb-sm-0 pe-3 w-75"> You can claim products rangind from our customized clothes to food items from our store. Try it now! </div>
                          </div>
                          <div class="col-12 col-sm-auto d-flex align-items-center position-relative">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
				
				
            </div>
          </div>
        </div>
      </main>
      <footer>
        <div class="footer-content">
          <div class="container">
            <div class="row">
              <div class="col-12 col-sm-6">
                <p class="mb-0 text-muted text-medium">BeepAgro Palliative Initiative 2024</p>
              </div>
              <div class="col-sm-6 d-none d-sm-block">
                <ul class="breadcrumb pt-0 pe-0 mb-0 float-end">
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/terms" target="_blank" class="btn-link">Our Terms</a>
                  </li>
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/privacy" target="_blank" class="btn-link">Our Policies</a>
                  </li>
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/" target="_blank" class="btn-link">Home</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <div class="modal fade modal-right scroll-out-negative" id="settings" data-bs-backdrop="true" tabindex="-1" role="dialog" aria-labelledby="settings" aria-hidden="true">
      <div class="modal-dialog modal-dialog-scrollable full" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Theme Settings</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="scroll-track-visible">
              <div class="mb-5" id="color">
                <label class="mb-3 d-inline-block form-label">Color</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-blue" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="blue-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT BLUE</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-blue" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="blue-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK BLUE</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-teal" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="teal-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT TEAL</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-teal" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="teal-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK TEAL</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-sky" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="sky-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT SKY</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-sky" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="sky-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK SKY</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-red" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="red-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT RED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-red" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="red-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK RED</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-green" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="green-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT GREEN</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-green" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="green-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK GREEN</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-lime" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="lime-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT LIME</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-lime" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="lime-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK LIME</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-pink" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="pink-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT PINK</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-pink" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="pink-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK PINK</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-purple" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="purple-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT PURPLE</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-purple" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="purple-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK PURPLE</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="navcolor">
                <label class="mb-3 d-inline-block form-label">Override Nav Palette</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="default" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DEFAULT</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="light" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-secondary figure-light top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="dark" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-muted figure-dark top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="behaviour">
                <label class="mb-3 d-inline-block form-label">Menu Behaviour</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="pinned" data-parent="behaviour">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary left large"></div>
                      <div class="figure figure-secondary right small"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">PINNED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="unpinned" data-parent="behaviour">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary left"></div>
                      <div class="figure figure-secondary right"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">UNPINNED</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="layout">
                <label class="mb-3 d-inline-block form-label">Layout</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="fluid" data-parent="layout">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">FLUID</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="boxed" data-parent="layout">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom small"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">BOXED</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="radius">
                <label class="mb-3 d-inline-block form-label">Radius</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="rounded" data-parent="radius">
                    <div class="card rounded-md radius-rounded p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">ROUNDED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="standard" data-parent="radius">
                    <div class="card rounded-md radius-regular p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">STANDARD</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="flat" data-parent="radius">
                    <div class="card rounded-md radius-flat p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">FLAT</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-buttons-container">
      <button type="button" class="btn settings-button btn-primary p-0" data-bs-toggle="modal" data-bs-target="#settings" id="settingsButton">
        <span class="d-inline-block no-delay" data-bs-delay="0" data-bs-offset="0,3" data-bs-toggle="tooltip" data-bs-placement="left" title="Settings">
          <i data-acorn-icon="paint-roller" class="position-relative"></i>
        </span>
      </button>
    </div>
    <div class="modal fade modal-under-nav modal-search modal-close-out" id="searchPagesModal" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header border-0 p-0">
            <button type="button" class="btn-close btn btn-icon btn-icon-only btn-foreground" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body ps-5 pe-5 pb-0 border-0">
            <input id="searchPagesInput" class="form-control form-control-xl borderless ps-0 pe-0 mb-1 auto-complete" type="text" autocomplete="off">
          </div>
          <div class="modal-footer border-top justify-content-start ps-5 pe-5 pb-3 pt-3 border-0">
            <span class="text-alternate d-inline-block m-0 me-3">
              <i data-acorn-icon="arrow-bottom" data-acorn-size="15" class="text-alternate align-middle me-1"></i>
              <span class="align-middle text-medium">Navigate</span>
            </span>
            <span class="text-alternate d-inline-block m-0 me-3">
              <i data-acorn-icon="arrow-bottom-left" data-acorn-size="15" class="text-alternate align-middle me-1"></i>
              <span class="align-middle text-medium">Select</span>
            </span>
          </div>
        </div>
      </div>
    </div>
	<script src="https://checkout.flutterwave.com/v3.js"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery-3.5.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/OverlayScrollbars.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/autoComplete.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/clamp.min.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons-interface.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons-commerce.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/quill.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/quill.active.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/moment-with-locales.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/Chart.bundle.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-rounded-bar.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-crosshair.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-datalabels.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-streaming.min.js');?>"></script>
	<script src="<?php echo base_url('assets/js/vendor/progressbar.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/base/helpers.js');?>"></script>
    <script src="<?php echo base_url('assets/js/base/globals.js');?>"></script>
    <script src="<?php echo base_url('assets/js/base/nav.js');?>"></script>
    <script src="<?php echo base_url('assets/js/base/search.js');?>"></script>
    <script src="<?php echo base_url('assets/js/base/settings.js');?>"></script>
	<script src="<?php echo base_url('assets/js/cs/charts.extend.js');?>"></script>
	<script src="<?php echo base_url('assets/js/pages/dashboard.analysis.js');?>"></script>
	<script src="<?php echo base_url('assets/js/pages/support.ticketsdetail.js');?>"></script>
    <script src="<?php echo base_url('assets/js/common.js');?>"></script>
    <script src="<?php echo base_url('assets/js/scripts.js');?>"></script>
	 <script>
    function payWithRave() {
    FlutterwaveCheckout({
      public_key: "FLWPUBK-0732f5f0a50dfaa213b367e5f9a39bc5-X",
      tx_ref: "<?php echo $_SESSION['txref'] ?>",
      amount: <?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?>,
      currency: "<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->sign; ?>",
      country: "<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->country; ?>",
      payment_options: "card,ussd,banktransfer,account",
      redirect_url: "<?php echo $link ?>",
      customer: {
        email: "<?php echo $user_details->email; ?>",
        phone_number: "<?php echo $user_details->mobile ?>",
        name: "<?php echo $user_details->firstname.' '.$user_details->lastname ?>",
      },
      callback: function (data) { // specified callback function
        console.log(data);
      },
      customizations: {
        title: 'Beep Agro Palliative',
        description: 'Palliatives Package',
        logo: "https://development.beepagro.com/assets/img/logo/beep_agro_logo.jpg",
      },
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