<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Beep Agro Palliative</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="<?php echo base_url('assets/font/iconsmind/style.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/font/simple-line-icons/css/simple-line-icons.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-stars.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/owl.carousel.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-float-label.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-stars.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>" />
</head>
<body class="show-spinner">
    <div class="landing-page">
        <div class="mobile-menu">
            <a href="#" class="logo-mobile">
                <span></span>
            </a>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a href="<?php echo base_url('logout'); ?>">Log Out</a>
                </li>
            </ul>
        </div>
        <div class="main-container">
            <nav class="landing-page-nav">
                <div class="container d-flex align-items-center justify-content-between">
                    <a class="navbar-logo pull-left" href="#">
                        <span class="white"></span>
                        <span class="dark"></span>
                    </a>
                    <ul class="navbar-nav d-none d-lg-flex flex-row">
                        <li class="nav-item pl-2">
                            <a class="btn btn-outline-semi-light btn-sm pr-4 pl-4" href="<?php echo base_url('logout');?>">Log Out</a>
                        </li>
                    </ul>
                    <a href="#" class="mobile-menu-button">
                        <i class="simple-icon-menu"></i>
                    </a>
                </div>
            </nav>
            <div class="content-container">
                <div class="section home subpage-long">
                    <div class="container">
                        <div class="row home-row mb-0">
                            <div class="col-12 col-lg-6 col-xl-4 col-md-12">
                                <div class="home-text">
                                    <div class="display-1">
                                        Crypto Payment: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?>  USDT (TRC20)
                                        <?php
                                        ?>
                                    </div>
                                    <p class="white mb-2">
                                         Transfer the total of <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?>  USDT (TRC20) to the wallet address below 
                                    </p> 
                                    <hr class="bg-white text-white">
                                    <div> 
                                        <a href="#" class="text-white" > 
                                            0x1Bf1Ae2C4e68da5963C2812caD3De3f5c17591Ba - (TRC20)
                                        </a>
                                        <br>
                                         <hr class="bg-white text-white">
                                         <blockquote class="blockquote-2 mb-0 add-animate" data-animated="fadeInRight">
                                            <p class="mb-0">
                                                Payment Expires In <span id="timer">29:00<span> minutes!
                                                <!-- custom js -->
                                                <script> 
                                             window.onload = function () {
                                                var minute = 29;
                                                var sec = 60;
                                                setInterval(function () {
                                                   document.getElementById("timer").innerHTML =
                                                      minute + " : " + sec;
                                                   sec--;
                                                   if (sec == 00) {
                                                      minute--;
                                                      sec = 60;
                                                      if (minute == 0) {
                                                         minute = 29;
                                                      }
                                                   }
                                                }, 1000);
                                             };
                                          </script>
                                            </p>
                                            <footer class="blockquote-footer text-white">Complete Payment before countdown expires!</footer>
                                        </blockquote>
                                    </div>
                                        <div class=mt-3>
                                            <a href="#" data-toggle="modal" data-target="#vertical-modal" class="btn-round btn btn-success btn-xl mt-4">Confirm Transfer</a>
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    
    <!-- Modal -->
<div class="modal fade" id="vertical-modal" tabindex="-1" role="dialog"
                     aria-labelledby="model-3" aria-hidden="true">
                  <div class="modal-dialog modal-dialog-centered" role="document">

                    <!-- Modal Content -->
                    <div class="modal-content">

                      <!-- Modal Header -->
                      <div class="modal-header">
                        <h5 class="modal-title" id="model-3">Confirm USDT Transfer</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <!-- /modal header -->
                         <?php echo form_open(base_url( 'usdt_confirmation' ) , array( 'id' => 'usdt_confirm' ));?>
                      <!-- Modal Body -->
                      <div class="modal-body">
                        <h5>Amount: 25 USDT</h5>
                    <div class="row">
                      <div class="col-12">
                        <label class="form-group has-float-label mb-4">
                             <input type="hidden" name="amount" value="<?php echo $amount; ?>">
                            <input type="hidden" name="vat" value="<?php echo $vat; ?>">
                            <input class="form-control" type="text" name="txhash" id="txhash" required  placeholder="Transaction Hash" />
                            <span>Transaction Hash</span>
                        </label>
                       
                      </div>
                      </div>
                      </div>
                      <!-- /modal body -->
                      <div class="col-md-12">
                      <small class="text-danger text-center">ENSURE YOU COPY THE COMPLETE HASH LINK EG (https://link-to-hash)</small>
                      </div>
                      <!-- Modal Footer -->
                      <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-round">Submit</button>
                      </div>
                      <!-- /modal footer -->
                       <?php echo form_close(); ?>
                    </div>
                    <!-- /modal content -->

                  </div>
</div>

    <script src="<?php echo base_url('assets/js/vendor/jquery-3.3.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/owl.carousel.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/headroom.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/jQuery.headroom.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/jquery.scrollTo.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/dore.scripts.landingpage.js');?>"></script>
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
        
          loadStyle("<?php echo base_url('assets/css/');?>" + theme, onStyleComplete);
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