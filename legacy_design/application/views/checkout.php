<!DOCTYPE html>
<html lang="en" data-footer="true">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <title>BeepAgro Palliative Initiative | BPI Store</title>
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
                      <a  href="<?php echo base_url('store');?>"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Global Store</span>
                      </a>
                    </li>
                    <li>
                      <a class="active"  href="#">
                        <i data-acorn-icon="cart" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">My Cart</span>
                      </a>
                    </li>
					  <li>
                      <a href="<?php echo base_url('my_items');?>">
                        <i data-acorn-icon="archive" class="icon d-none" data-acorn-size="18"></i>
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
                      <a href="#">
                        <i data-acorn-icon="file-empty" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Docs</span>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i data-acorn-icon="notebook-1" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Knowledge Base</span>
                      </a>
                    </li><li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
                  </ul>
                </li>
              </ul>
            </div>
               <!-- end menu segment -->
               
               
            <div class="col">
                
                	<!-- Product display-->
              <div class="page-title-container mb-3">
                <div class="row">
                  <div class="col mb-2">
                    <h1 class="mb-2 pb-0 display-4" id="title">Your BPI Cart</h1>
                    <div class="text-muted font-heading text-small">Review your choices</div>
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
                
				
			  <div class="row mb-5">
					  <div class="col-12 col-lg order-1 order-lg-0">
						<h2 class="small-title">Items in your cart</h2>
						<div class="mb-5">
						  <?php if(!empty($pending_orders)){
                            foreach($pending_orders as $orders){ 
                            //product data
                            $product_data = $this->generic_model->getInfo('store_products','id',$orders->product_id);
                            ?>
						    <div class="card mb-5">
							<div class="row g-0 sh-18 sh-md-14">
							  <div class="col-auto">
								<img src="https://beepagro.com/wpanel/uploads/store_products/<?php echo $product_data->image_1; ?>" class="card-img h-100 sw-9 sw-sm-13 sw-md-15"  alt="thumb">
							  </div>
							  <div class="col position-relative h-100">
								<div class="card-body h-100">
								  <div class="row h-100">
									<div class="col-12 col-md-6 mb-2 mb-md-0 d-flex align-items-center">
									  <div class="pt-0 pb-0 pe-2">
										<div class="h6 mb-0 clamp-line" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;"><?php echo $product_data->product_name; ?></div>
										<div class="text-muted text-small"><?php echo $product_data->product_name; ?></div>
										<div class="mb-0 sw-19"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$product_data->price); ?></div>
									  </div>
									</div>
									<div class="col-6 col-md-3 pe-0 d-flex align-items-center">
									  <div class="input-group spinner sw-11" data-trigger="spinner">
										
										<input type="text" disabled="disabled" class="form-control text-center px-0" value="<?php echo $orders->quantity; ?>" data-rule="quantity">
										
									  </div>
									</div>
									<div class="col-6 col-md-3 d-flex justify-content-end justify-content-md-start align-items-center">
									  <div class="h6 mb-0"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol.$this->generic_model->convert_currency($user_details->default_currency,($product_data->price * $orders->quantity)); ?></div>
									</div>
								  </div>
								</div>
								<a class="btn btn-sm btn-icon btn-icon-only btn btn-foreground-alternate position-absolute t-2 e-2" href="<?php echo base_url('delete_order/'.$orders->id);?>">
								  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-error-hexagon undefined">
									<path d="M9 2.57735C9.6188 2.22008 10.3812 2.22008 11 2.57735L15.9282 5.42265C16.547 5.77992 16.9282 6.44017 16.9282 7.1547V12.8453C16.9282 13.5598 16.547 14.2201 15.9282 14.5774L11 17.4226C10.3812 17.7799 9.6188 17.7799 9 17.4226L4.0718 14.5774C3.45299 14.2201 3.0718 13.5598 3.0718 12.8453V7.1547C3.0718 6.44017 3.45299 5.77992 4.0718 5.42265L9 2.57735Z"></path>
									<path d="M8 12 12.0001 7.99994M8 7.99994 12.0001 12"></path>
								  </svg>
								</a>
							  </div>
							</div>
						  </div>
						 <?php }
                        } ?>
						</div>
					<!--	<div class="row g-2 mt-5">
						  <div class="col-12">
							<h2 class="small-title">People who claimed this are also checked these</h2>
						  </div>
						  <div class="col-12 col-sm-6 col-xxl-3">
							<div class="card w-100 sh-19 sh-sm-25 hover-img-scale-up">
							  <img src="img/product/small/product-1.webp" class="card-img h-100 scale" alt="card image">
							  <div class="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
								<div class="d-flex flex-column h-100 justify-content-between align-items-start">
								  <div class="cta-3 text-black w-75 w-sm-50 w-lg-75 w-xxl-50">Seasoned Breads</div>
								  <a href="store.html" class="btn btn-icon btn-icon-start btn-primary mt-3 stretched-link">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
									  <path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
									</svg>
									<span>View</span>
								  </a>
								</div>
							  </div>
							</div>
						  </div>
						  <div class="col-12 col-sm-6 col-xxl-3">
							<div class="card w-100 sh-19 sh-sm-25 hover-img-scale-up">
							  <img src="img/product/small/product-6.webp" class="card-img h-100 scale" alt="card image">
							  <div class="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
								<div class="d-flex flex-column h-100 justify-content-between align-items-start">
								  <div class="cta-3 text-black w-75 w-sm-50 w-lg-75 w-xxl-50">Seasoned Breads</div>
								  <a href="store.html" class="btn btn-icon btn-icon-start btn-primary mt-3 stretched-link">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
									  <path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
									</svg>
									<span>View</span>
								  </a>
								</div>
							  </div>
							</div>
						  </div>
						  <div class="col-12 col-sm-6 col-xxl-3">
							<div class="card w-100 sh-19 sh-sm-25 hover-img-scale-up">
							  <img src="img/product/small/product-110.webp" class="card-img h-100 scale" alt="card image">
							  <div class="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
								<div class="d-flex flex-column h-100 justify-content-between align-items-start">
								  <div class="cta-3 text-black w-75 w-sm-50 w-lg-75 w-xxl-50">Seasoned Breads</div>
								  <a href="store.html" class="btn btn-icon btn-icon-start btn-primary mt-3 stretched-link">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
									  <path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
									</svg>
									<span>View</span>
								  </a>
								</div>
							  </div>
							</div>
						  </div>
						  <div class="col-12 col-sm-6 col-xxl-3">
							<div class="card w-100 sh-19 sh-sm-25 hover-img-scale-up">
							  <img src="img/product/small/product-10.webp" class="card-img h-100 scale" alt="card image">
							  <div class="card-img-overlay d-flex flex-column justify-content-between bg-transparent">
								<div class="d-flex flex-column h-100 justify-content-between align-items-start">
								  <div class="cta-3 text-black w-75 w-sm-50 w-lg-75 w-xxl-50">Seasoned Breads</div>
								  <a href="store.html" class="btn btn-icon btn-icon-start btn-primary mt-3 stretched-link">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
									  <path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
									</svg>
									<span>View</span>
								  </a>
								</div>
							  </div>
							</div>
						  </div>
						</div>-->
					  </div>
					  <div class="col-12 col-lg-auto order-0 order-lg-1">
						<h2 class="small-title">Summary</h2>
						<div class="card mb-5 w-100 sw-lg-35">
						  <div class="card-body">
							<div class="mb-4">
							  <div class="mb-2">
								<p class="text-small text-muted mb-1">ITEMS</p>
								<p>
								  <span class="text-alternate"><?php echo $total_cart; ?></span>
								</p>
							  </div>
							  <div class="mb-2">
								<p class="text-small text-muted mb-1">TOTAL</p>
								<p>
								  <span class="text-alternate">
									<span class="text-small text-muted"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?></span> <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_sum); ?> </span>
								</p>
							  </div>
							  <div class="mb-2">
								<p class="text-small text-muted mb-1">SHIPPING</p>
								<p>
								  <span class="text-alternate">
									<span class="text-small text-muted"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?></span> 0.00 </span>
								</p>
							  </div>
							  <div class="mb-2">
								<p class="text-small text-muted mb-1">DISCOUNT</p>
								<p>
								  <span class="text-alternate">
									<span class="text-small text-muted"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?></span> -0.00 </span>
								</p>
							  </div>
							  <div class="mb-2">
								<p class="text-small text-muted mb-1">GRAND TOTAL</p>
								<div class="cta-2">
								  <span>
									<span class="text-small text-muted cta-2"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?></span> <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_sum); ?> </span>
								</div>
							  </div>
							</div>
							<?php 
							  if(!empty($total_sum)){
							  if($user_details->cashback > $total_sum){ ?> 
							<a href="<?php echo base_url('claim_with_cashback');?>">
							<button class="btn btn-icon btn-icon-end btn-primary w-100" type="button">
							  <span>Claim With Cashback</span>
							  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
								<path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
							  </svg>
							</button>
							</a>
							<?php }else { ?>
                            <div class="alert alert-danger mb-3 mt-3 alert-dismissible fade show" role="alert">
                                Insufficient Cashback Balance
                            </div>
                        <?php }
							if($user_details->wallet > $total_sum){ ?> 
							<a href="<?php echo base_url('claim_with_wallet');?>">
							<button class="btn btn-icon btn-icon-end btn-primary w-100" type="button">
							  <span>Claim With Cash Wallet</span>
							  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-chevron-right undefined">
								<path d="M7 4L12.6464 9.64645C12.8417 9.84171 12.8417 10.1583 12.6464 10.3536L7 16"></path>
							  </svg>
							</button>
							</a>
							<?php }else{ ?>
								<div class="alert alert-danger mb-3 mt-3 alert-dismissible fade show" role="alert">
									<a href="<?php echo base_url('top_up');?>">
										<button class="btn btn-icon btn-icon-end btn-danger" type="button">
                                   			Top Up Cash Balance
										</button>
									</a>
                                </div>
							<?php }
							  
							  
				    	}else{ ?>
								<div class="alert alert-muted mb-3 mt-3 alert-dismissible fade show" role="alert">
						<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
						<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_sum); ?>
                            </div>  
								  
							<?php  } ?>
						  </div>
						</div>
					  </div>
					</div>
				<!-- Product display-->				
              
			   <!-- Best Sellers
			 <h2 class="small-title">Best Sellers</h2>
			  <div class="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-4 g-2 mb-5">
				  <div class="col">
					<div class="card h-100">
					  <span class="badge rounded-pill bg-primary me-1 position-absolute s-n2 t-2 z-index-1">SALE</span>
					  <img src="img/product/small/product-11.webp" class="card-img-top sh-22" alt="card image">
					  <div class="card-body pb-2">
						<div class="h6 mb-0 d-flex">
						  <a href="Storefront.Detail.html" class="body-link d-block lh-1-25 stretched-link">
							<span class="clamp-line sh-4" data-line="2" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 2;">Wooden Animal Toys</span>
						  </a>
						</div>
					  </div>
					  <div class="card-footer border-0 pt-0">
						<div class="mb-2">
						  <div class="br-wrapper br-theme-cs-icon d-inline-block">
							<div class="br-wrapper">
							  <select class="rating" name="rating" autocomplete="off" data-readonly="true" data-initial-rating="5" style="display: none;">
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							  </select>
							  <div class="br-widget br-readonly">
								<a href="#" data-rating-value="1" data-rating-text="1" class="br-selected"></a>
								<a href="#" data-rating-value="2" data-rating-text="2" class="br-selected"></a>
								<a href="#" data-rating-value="3" data-rating-text="3" class="br-selected"></a>
								<a href="#" data-rating-value="4" data-rating-text="4" class="br-selected"></a>
								<a href="#" data-rating-value="5" data-rating-text="5" class="br-selected br-current"></a>
								<div class="br-current-rating">5</div>
							  </div>
							</div>
						  </div>
						  <div class="text-muted d-inline-block text-small align-text-top">(5)</div>
						</div>
						<div class="card-text mb-0">
						  <div class="text-muted text-overline text-small sh-2">
							<del>$ 14.25</del>
						  </div>
						  <div>$ 8.50</div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card h-100">
					  <img src="img/product/small/product-12.webp" class="card-img-top sh-22" alt="card image">
					  <div class="card-body pb-2">
						<div class="h6 mb-0 d-flex">
						  <a href="Storefront.Detail.html" class="body-link d-block lh-1-25 stretched-link">
							<span class="clamp-line sh-4" data-line="2" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 2;">Aromatic Green Candle</span>
						  </a>
						</div>
					  </div>
					  <div class="card-footer border-0 pt-0">
						<div class="mb-2">
						  <div class="br-wrapper br-theme-cs-icon d-inline-block">
							<div class="br-wrapper">
							  <select class="rating" name="rating" autocomplete="off" data-readonly="true" data-initial-rating="5" style="display: none;">
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							  </select>
							  <div class="br-widget br-readonly">
								<a href="#" data-rating-value="1" data-rating-text="1" class="br-selected"></a>
								<a href="#" data-rating-value="2" data-rating-text="2" class="br-selected"></a>
								<a href="#" data-rating-value="3" data-rating-text="3" class="br-selected"></a>
								<a href="#" data-rating-value="4" data-rating-text="4" class="br-selected"></a>
								<a href="#" data-rating-value="5" data-rating-text="5" class="br-selected br-current"></a>
								<div class="br-current-rating">5</div>
							  </div>
							</div>
						  </div>
						  <div class="text-muted d-inline-block text-small align-text-top">(44)</div>
						</div>
						<div class="card-text mb-0">
						  <div class="text-muted text-overline text-small sh-2"></div>
						  <div>$ 4.25</div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card h-100">
					  <span class="badge rounded-pill bg-primary me-1 position-absolute s-n2 t-2 z-index-1">SALE</span>
					  <img src="img/product/small/product-13.webp" class="card-img-top sh-22" alt="card image">
					  <div class="card-body pb-2">
						<div class="h6 mb-0 d-flex">
						  <a href="Storefront.Detail.html" class="body-link d-block lh-1-25 stretched-link">
							<span class="clamp-line sh-4" data-line="2" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 2;">Good Glass Teapot</span>
						  </a>
						</div>
					  </div>
					  <div class="card-footer border-0 pt-0">
						<div class="mb-2">
						  <div class="br-wrapper br-theme-cs-icon d-inline-block">
							<div class="br-wrapper">
							  <select class="rating" name="rating" autocomplete="off" data-readonly="true" data-initial-rating="5" style="display: none;">
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							  </select>
							  <div class="br-widget br-readonly">
								<a href="#" data-rating-value="1" data-rating-text="1" class="br-selected"></a>
								<a href="#" data-rating-value="2" data-rating-text="2" class="br-selected"></a>
								<a href="#" data-rating-value="3" data-rating-text="3" class="br-selected"></a>
								<a href="#" data-rating-value="4" data-rating-text="4" class="br-selected"></a>
								<a href="#" data-rating-value="5" data-rating-text="5" class="br-selected br-current"></a>
								<div class="br-current-rating">5</div>
							  </div>
							</div>
						  </div>
						  <div class="text-muted d-inline-block text-small align-text-top">(2)</div>
						</div>
						<div class="card-text mb-0">
						  <div class="text-muted text-overline text-small sh-2">
							<del>$ 12.25</del>
						  </div>
						  <div>$ 9.50</div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card h-100">
					  <img src="img/product/small/product-14.webp" class="card-img-top sh-22" alt="card image">
					  <div class="card-body pb-3">
						<h5 class="heading mb-0 d-flex">
						  <a href="Storefront.Detail.html" class="body-link d-block lh-1-5 stretched-link">
							<span class="clamp-line sh-4" data-line="2" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 2;">Modern Dark Pot</span>
						  </a>
						</h5>
					  </div>
					  <div class="card-footer border-0 pt-0">
						<div class="mb-2">
						  <div class="br-wrapper br-theme-cs-icon d-inline-block">
							<div class="br-wrapper">
							  <select class="rating" name="rating" autocomplete="off" data-readonly="true" data-initial-rating="5" style="display: none;">
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							  </select>
							  <div class="br-widget br-readonly">
								<a href="#" data-rating-value="1" data-rating-text="1" class="br-selected"></a>
								<a href="#" data-rating-value="2" data-rating-text="2" class="br-selected"></a>
								<a href="#" data-rating-value="3" data-rating-text="3" class="br-selected"></a>
								<a href="#" data-rating-value="4" data-rating-text="4" class="br-selected"></a>
								<a href="#" data-rating-value="5" data-rating-text="5" class="br-selected br-current"></a>
								<div class="br-current-rating">5</div>
							  </div>
							</div>
						  </div>
						  <div class="text-muted d-inline-block text-small align-text-top">(412)</div>
						</div>
						<div class="card-text mb-0">
						  <div class="text-muted text-overline text-small sh-2"></div>
						  <div>$ 9.50</div>
						</div>
					  </div>
					</div>
				  </div>
				</div>	   -->             		
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
    <script src="<?php echo base_url('assets/js/vendor/jquery-3.5.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/OverlayScrollbars.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/autoComplete.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/clamp.min.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons-interface.js');?>"></script>
    <script src="<?php echo base_url('assets/icon/acorn-icons-commerce.js');?>"></script>
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
	  
	  
<script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
<script src="<?php echo base_url('assets/js/vendor/movecontent.js');?>"></script>
<script src="<?php echo base_url('assets/js/pages/storefront.home.js');?>"></script>
<script src="<?php echo base_url('assets/js/common.js');?>"></script>
<script src="<?php echo base_url('assets/js/scripts.js');?>"></script>  
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