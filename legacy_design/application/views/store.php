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
                      <a class="active"  href="#"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Global Store</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('checkout');?>">
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
                
                	
				<!-- Title segment-->
              <div class="page-title-container mb-3">
                <div class="row">
                  <div class="col mb-2">
                    <h1 class="mb-2 pb-0 display-4" id="title">Welcome to the BPI Storefront</h1>
                    <div class="text-muted font-heading text-small">Unlock a World of Possibilities: Start Exploring Now</div>
                  </div>
                 <div>
                <?php
                $error = $this->session->flashdata('error');
                if($error)
                { ?>
                            <div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('error'); ?>
                            </div>
                <?php } ?>
                <?php  
                        $success = $this->session->flashdata('success');
                        if($success)
                        {
                    ?>
                            <div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('success'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                <?php } ?>
                <?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
                </div>
               
				<div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
				    We have a new look! We are making more features available to you...
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
				</div>	
                </div>
              </div>
				<!-- Title segment-->
				
            
              <div class="row mb-3">
				  <!-- Profile status wdgets-->
                <div class="col-12 col-lg-3 mb-5">
					<h5>Active Pickup Centers</h5>
                  <div class="scroll-out">
                    <div class="scroll-by-count" data-count="4">
                      <?php if(!empty($merchants)){
                          foreach($merchants as $merchant){ ?>
                            <div class="card mb-2 hover-border-primary">
                                <a href="#" class="row g-0 sh-9">
                                  <div class="col-auto">
                                    <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                                      <div class="fw-bold text-primary">
                                        <i data-acorn-icon="cart"></i>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="col">
                                    <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                                      <div class="d-flex flex-column">
                                        <div class="text-alternate"><?php echo $merchant->merchant_name; ?></div>
                                        <div class="text-small text-muted"><?php echo $merchant->merchant_email; ?></div>
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </div>
                      <?php } } ?>
                    </div>
                  </div>
                </div>
				  
				  <!-- Promotional Materials -->
                <div class="col-12 col-lg-6 mb-5">
                  <div class="card sh-45 h-lg-100 position-relative bg-theme">
					<img src="<?php echo base_url('assets/img/banner/cta-horizontal-short-2.webp');?>" class="card-img h-100 scale" alt="BPI STORE">
                    <div class="card-img-overlay d-flex flex-column justify-content-end bg-transparent">
                      <div class="mb-4">
                        <div class="cta-3 mb-2 text-black w-75">Rooted in Excellence!</div>
                        <div class="w-75 text-black">Welcome! Your Portal to Agricultural Excellence! Explore, Claim, and Purchase our Finest Products with Ease using your Palliative and Cashback Wallets. experience a seamless blend of Convenience and Quality, tailored just for you."</div>
                      </div>
                      <div>
                        <a href="#products" class="btn btn-icon btn-icon-start btn-outline-primary">
                          <i data-acorn-icon="chevron-right"></i>
                          <span>Browse Products</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
				  
				<div class="col-12 col-lg-3 mb-5">
                  <div class="card sh-45 h-lg-100 position-relative bg-theme">
                    <img src="<?php echo base_url('assets/img/banner/shirt.webp');?>" class="card-img h-100 scale" alt="card image">
                    <div class="card-img-overlay d-flex flex-column justify-content-end bg-transparent">
                      <div class="mb-4">
                        <div class="cta-3 mb-2 text-black w-75">Official BPI T-shirts</div>
                        <div class="w-50 text-black"> Now Available</div>
                      </div>
                      <div>
                        <a href="#" class="btn btn-icon btn-icon-start btn-outline-primary">
                          <i data-acorn-icon="chevron-right"></i>
                          <span>New Arrivals!</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
				
			   <!-- Best Sellers-->
			 <h2 class="small-title">Best Sellers</h2>
			  <div class="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-4 g-2 mb-5">
			   <?php if(!empty($store_products)){ 
                        foreach($store_products as $product){
                ?>
				  <div class="col mb-5">
					<div class="card h-100">
					  <!--<span class="badge rounded-pill bg-primary me-1 position-absolute s-n2 t-2 z-index-1">SALE</span>-->
					  <img src="https://beepagro.com/wpanel/uploads/store_products/<?php echo $product->image_2; ?>" class="card-img-top" alt="<?php echo $product->product_name; ?>" width="200px" height="200px">
					  <div class="card-body">
						  <a href="<?php echo base_url('details/'.$product->id);?>" class="stretched-link">
							<h5 class="text-primary"><?php echo $product->product_name; ?></h5>
						  </a>
					  </div>
					  <div class="card-footer">
						   <?php echo $product->description; ?>    
							<!--<del>$ 14.25</del>-->
						  <div class="mt-3 justify-content-end">
						   <i data-acorn-icon="cart" class="text-primary"></i>    
						      <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$product->price);?>
						  </div>
					  </div>
					</div>
				  </div>
				<?php } }else{ ?>
                        <h5>There are no products currently available in the store</h5>
                        <?php } ?>
				</div>
			
			   <!-- Explore New Products	
			  <h2 class="small-title">Explore New Products</h2>	
			  <div class="row g-2 row-cols-1 row-cols-md-2 row-cols-xl-2 row-cols-xxl-3 mb-5">
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100 position-relative">
						  <span class="badge rounded-pill bg-primary me-1 position-absolute e-n2 t-2 z-index-1">SALE</span>
						  <img src="img/product/small/product-9.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">XBox Controller</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2">
								  <del>$ 12.25</del>
								</div>
								<div>$ 8.50</div>
							  </div>
							  <div>
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
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100">
						  <img src="img/product/small/product-12.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">Aromatic Green Candle</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2"></div>
								<div>$ 7.50</div>
							  </div>
							  <div>
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
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100">
						  <img src="img/product/small/product-110.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">Health and Fitness Smartwatch</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2"></div>
								<div>$ 4.25</div>
							  </div>
							  <div>
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
								<div class="text-muted d-inline-block text-small align-text-top">(4)</div>
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100">
						  <img src="img/product/small/product-18.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">Geometric Chandelier</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2"></div>
								<div>$ 12.25</div>
							  </div>
							  <div>
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
								<div class="text-muted d-inline-block text-small align-text-top">(12)</div>
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100 position-relative">
						  <span class="badge rounded-pill bg-primary me-1 position-absolute e-n2 t-2 z-index-1">SALE</span>
						  <img src="img/product/small/product-14.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">Modern Dark Pot</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2">
								  <del>$ 3.25</del>
								</div>
								<div>$ 2.50</div>
							  </div>
							  <div>
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
								<div class="text-muted d-inline-block text-small align-text-top">(9)</div>
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				  <div class="col">
					<div class="card">
					  <div class="row g-0 sh-16 sh-sm-17">
						<div class="col-auto h-100 position-relative">
						  <span class="badge rounded-pill bg-primary me-1 position-absolute e-n2 t-2 z-index-1">SALE</span>
						  <img src="img/product/small/product-5.webp" alt="alternate text" class="card-img card-img-horizontal h-100 sw-11 sw-sm-16 sw-lg-20">
						</div>
						<div class="col p-0">
						  <div class="card-body d-flex align-items-center h-100 py-3">
							<div class="mb-0 h6">
							  <a href="details.html" class="body-link stretched-link">
								<div class="clamp-line sh-3 lh-1-5" data-line="1" style="overflow: hidden; text-overflow: ellipsis; -moz-box-orient: vertical; display: -webkit-box; -webkit-line-clamp: 1;">Wood Handle Hunter Knife</div>
							  </a>
							  <div class="card-text mb-2">
								<div class="text-muted text-overline text-small sh-2">
								  <del>$ 5.25</del>
								</div>
								<div>$ 2.85</div>
							  </div>
							  <div>
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
								<div class="text-muted d-inline-block text-small align-text-top">(3)</div>
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				</div>			                		
				-->
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