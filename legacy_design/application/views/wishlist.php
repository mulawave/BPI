<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BeepAgro Store</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="<?php echo base_url('assets/font/iconsmind/style.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/font/simple-line-icons/css/simple-line-icons.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/jquery.contextMenu.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/perfect-scrollbar.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/select2.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/select2-bootstrap.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>" />
</head>
<body id="app-container" class="menu-sub-hidden show-spinner">
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

            <!--<div class="search" data-search-path="Layouts.Search.html?q=">
                <input placeholder="Search...">
                <span class="search-icon">
                    <i class="simple-icon-magnifier"></i>
                </span>
            </div>-->
        </div>
        <a class="navbar-logo" href="#">
            <span class="logo d-none d-xs-block"></span>
            <span class="logo-mobile d-block d-xs-none"></span>
        </a>

         <div class="navbar-right"> 
            <div class="header-icons d-inline-block align-middle">
                <?php if($user_details->kyc == 1){ ?>
                <a class="btn btn-sm btn-outline-success mr-2 d-none d-md-inline-block mb-2" href="#">&nbsp;Verified &nbsp;</a>
                <?php }else{ ?>
                <?php if($user_details->kyc_pending == 1){ ?>
                <a class="btn btn-sm btn-warning mr-2 d-none d-md-inline-block mb-2" href="<?php echo base_url('settings'); ?>">&nbsp;Validating...&nbsp;</a>
                <?php }else{ ?>
                <a class="btn btn-sm btn-danger mr-2 d-none d-md-inline-block mb-2" href="<?php echo base_url('settings'); ?>">&nbsp;Unverified Accountd&nbsp;</a>
                <?php }} ?>
            </div>
            
            <div class="user d-inline-block">
                <button class="btn btn-empty p-0" type="button" data-toggle="dropdown" aria-haspopup="true"
                    aria-expanded="false">
                    <span class="name"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></span>
                    <span>
                        <img alt="Profile Picture" src="<?php echo base_url($user_details->profile_pic);?>" />
                    </span>
                </button>
                <?php if($user_details->activated == 1){ ?> 
                <div class="dropdown-menu dropdown-menu-right mt-3">
                    <a class="dropdown-item" href="<?php echo base_url('dashboard');?>">Settings</a>
                    <a class="dropdown-item" href="<?php echo base_url('logout');?>">Sign out</a>
                </div>
                <?php } ?>
            </div> 
            
        </div>
    </nav>
   <div class="sidebar">
        <div class="main-menu">
            <div class="scroll">
                <ul class="list-unstyled">
                    <li>
                        <a href="<?php echo base_url('dashboard');?>">
                            <i class="iconsmind-Shop-4"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('palliative');?>">
                            <i class="iconsmind-Myspace"></i> Student Palliative
                        </a>
                    </li>
                    <li  class="active" style="background-color: #eec796;">
                        <a href="#store">
                            <i class="iconsmind-Shop-2"></i> Store
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('my_assets');?>">
                            <i class="iconsmind-Wallet-2"></i> My Assets
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('refer');?>">
                            <i class="iconsmind-Three-ArrowFork"></i>Referrals
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('merchants');?>">
                            <i class="iconsmind-Location-2"></i>Pickup Locations
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('club');?>">
                            <i class="iconsmind-Air-Balloon"></i>BPI
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('settings');?>">
                            <i class="glyph-icon iconsmind-Security-Settings"></i>Settings
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('transactions');?>">
                            <i class="iconsmind-Receipt-3"></i>Transactions
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('logout');?>">
                            <i class="simple-icon-power"></i> Log Out
                        </a>
                    </li>
                </ul>
            </div>
        </div>
         <div class="sub-menu">
            <div class="scroll">
                <ul class="list-unstyled" data-link="store">
                    <li>
                        <a href="<?php echo base_url('checkout');?>">
                            <i class="simple-icon-basket-loaded"></i> Cart
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('store');?>">
                            <i class="iconsmind-Shop-2"></i> Global Store
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('my_items');?>">
                            <i class="iconsmind-Luggage-2"></i> My Claims
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo base_url('wishlist');?>">
                            <i class="iconsmind-Love"></i> Wishlist
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    <main>
        <div class="container-fluid">
            <div class="row">
                <?php if ($this->session->flashdata('success')): ?>
                                                <p style="color: green;"><?= $this->session->flashdata('success'); ?></p>
                                            <?php endif; ?>
                                        
                                            <?php if ($this->session->flashdata('error')): ?>
                                                <p style="color: red;"><?= $this->session->flashdata('error'); ?></p>
                                            <?php endif; ?>
            </div>
            <div class="row app-row">
                <div class="col-12">
                    <div class="mb-2">
                        <h1>Wishlist</h1>
                        <div class="float-md-right text-zero">
                            <a href="<?php echo base_url('store');?>" class="btn btn-primary btn-lg">Back to store</a>
                        </div>
                    </div>
                    <div class="separator mb-5"></div>

                    <div class="list disable-text-selection" data-check-all="checkAll">
                        <?php if(!empty($pending_orders)){
                            foreach($pending_orders as $orders){ 
                            
                            //product data
                            $product_data = $this->generic_model->getInfo('store_products','id',$orders->product_id);
                            
                            ?>
                                <div class="row mb-1">
                                    <div class="col-md-12 mb-1">
                                        <div class="card d-flex flex-row mb-1"> 
                                            <a class="d-flex" href="<?php echo base_url('details/'.$product_data->id);?>">
                                                <img alt="Thumbnail" src="https://beepagro.com/wpanel/uploads/store_products/<?php echo $product_data->image_2; ?>" class="list-thumbnail responsive border-0">
                                            </a>
                                            <div class="pl-2 d-flex flex-grow-1 min-width-zero">
                                                <div class="card-body align-self-center d-flex flex-column flex-lg-row justify-content-between min-width-zero align-items-lg-center">
                                                    <a href="#" class="w-20 w-sm-100">
                                                        <p class="list-item-heading mb-1 truncate"><?php echo $product_data->product_name; ?></p>
                                                    </a>
                                                    <p class="mb-1 text-primary w-15 w-sm-100">Unit Price<br> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$product_data->price); ?></p>
                                                    <p class="mb-1 text-primary w-15 w-sm-100">Quantity<br> <?php echo $orders->quantity; ?></p>
                                                    <p class="mb-1 text-primary w-15 w-sm-100">Sub-Total<br> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol.$this->generic_model->convert_currency($user_details->default_currency,($product_data->price * $orders->quantity)); ?></p>
                                                    <div class="w-15 w-sm-100">
                                                         <a href="<?php echo base_url('move_to_cart/'.$orders->id);?>" class="btn btn-md btn-success">
                                                            Move to Cart
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div> 
                                    </div>
                                </div>
                       <?php }
                        } ?>
                        
                    </div>
                </div>
            </div>
        </div>
         <div class="app-menu">
            <div class="p-4">
                <div class="scroll">
                    <p class="text-muted text-small">Status</p>
                    <ul class="list-unstyled mb-5">
                        <li class="active">
                            <a href="#">
                                <i class="simple-icon-refresh"></i>
                                Pending Orders
                                <span class="float-right"><?php echo $total_pending; ?></span>
                            </a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="simple-icon-check"></i>
                                Completed Orders
                                <span class="float-right"><?php echo $total_completed; ?></span>
                            </a>
                        </li>
                        <li>
                            <a href="#">
                                <i class="simple-icon-check"></i>
                                Total in Wish List
                                <span class="float-right"><?php echo $total_cart; ?></span>
                            </a>
                        </li>
                    </ul>
                    <div class="mb-3">
                        <?php if(!empty($total_cart)){?>
                           <a href="<?php echo base_url('cart');?>" class="btn btn-sm btn-success">View Wish List</a>
                        <?php } ?>
                    </div>
                    <hr>
                    <p class="text-muted text-small">Checkout Ledger</p>
                    <ul class="list-unstyled mb-5">
                        <p>
                            Total Due Now
                            
                        </p>
                        <h2 class="text-primary">
                          <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol.$this->generic_model->convert_currency($user_details->default_currency,$total_sum); ?>  
                        </h2>
                    </ul>




                    <p class="text-muted text-small">Claim Options</p>
                    <div>
                        <?php if($user_details->cashback > $total_sum){ ?> 
                            <p class="d-sm-inline-block mb-1">
                            <a href="<?php echo base_url('claim_with_cashback');?>">
                                <span class="badge badge-pill badge-outline-theme-3 mb-1">Claim With Cashback</span>
                            </a> 
                        </p> 
                         <?php }else { ?>
                            <p class="d-sm-inline-block mb-1">
                                <a href="#">
                                    <span class="badge badge-pill badge-outline-danger mb-1">Cashback is low</span>
                                </a>
                            </p>
                        <?php } ?>
                    </div>

                </div>
            </div>
            <a class="app-menu-button d-inline-block d-xl-none" href="#">
                <i class="simple-icon-refresh"></i>
            </a>
        </div>
    </main>
    <script src="<?php echo base_url('assets/js/vendor/jquery-3.3.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/perfect-scrollbar.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/select2.full.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/mousetrap.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.contextMenu.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/dore.script.js');?>"></script>
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