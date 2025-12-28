<?php
// Google OAuth "bounce" logic
if (isset($_GET['code']) && isset($_GET['scope'])) {
    $query = $_SERVER['QUERY_STRING'];
    header("Location: /app/channels/verify_callback?$query");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>BeepAgro Africa - Home</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="assets/img/fv.png" type="image/x-icon">
    <link rel="icon" href="assets/img/fv.png" type="image/x-icon">
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/animate.css">
    <link rel="stylesheet" href="assets/css/fontawesome-all.css">
    <link rel="stylesheet" href="assets/css/owl.carousel.css">
    <link rel="stylesheet" href="assets/css/side-demo.css">
    <link rel="stylesheet" href="assets/css/style.css">
	<link rel="stylesheet" href="assets/css/flaticon-3.css">
	<link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/inner-page.css">
</head>

<body class="saas-classic">
    <!-- Preloader -->
        <div id="preloader" class="saas-classic-preloader">
        </div>

    <!-- Page Scroll -->
        <div class="up">
            <a href="#" id="scrollup" class="saas-classic-scrollup text-center"><i class="fas fa-angle-up"></i></a>
        </div>

    <!-- Header Popup -->
        <div class="demo-page-landing">
            <div class="side-demo-close side-demo"><i class="fas fa-times"></i></div>
            <div class="demo-title text-center">
                <h2>BeepAgro Palliative Initiative</h2>
                <p>A community-first model aimed at uplifting, training, and empowering millions of Africans.</p>
            </div>
            <div class="demo-page-landing-wrap sa-demo-bar justify-content-center">
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">Model</span> 
                        <img alt="BPI" src="assets/img-demo/d1.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="model.php" target="">Model</a>
                            </div>
                        </div>
                    </div>
                    <h6>The BPI Model</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">SEED</span> 
                        <img alt="SEED" src="assets/img-demo/d2.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="seed.php" target="">SEED</a>
                            </div>
                        </div>
                    </div>
                    <h6>SEED Value Chain</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">Programs</span> 
                        <img alt="Programs" src="assets/img-demo/d3.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="programs.php" target="">Programs</a>
                            </div>
                        </div>
                    </div>
                    <h6>Programs & Services</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">Training</span> 
                        <img alt="Training" src="assets/img-demo/d4.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="training.php" target="">Training</a>
                            </div>
                        </div>
                    </div>
                    <h6>Training & Mentorship</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">Join</span> 
                        <img alt="Join" src="assets/img-demo/d5.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="join.php" target="">Join</a>
                            </div>
                        </div>
                    </div>
                    <h6>Join the Movement</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">News</span> 
                        <img alt="News" src="assets/img-demo/d6.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="news.php" target="">News</a>
                            </div>
                        </div>
                    </div>
                    <h6>News & Updates</h6>
                </div>
                <div class="sa-demo-bar-item">
                    <div class="sa-demo-bar-item-inner">
                        <span class="demo-label position-absolute">Partners</span> 
                        <img alt="Partners" src="assets/img-demo/d7.jpg" alt="">
                        <div class="sa-demo-bar-holder">
                            <div class="sa-demo-btn-group"> 
                                <a class="btn btn-default" href="partners.php" target="">Partners</a>
                            </div>
                        </div>
                    </div>
                    <h6>Partners</h6>
                </div>
            </div>
        </div>

    <!-- Start of Header section
        ============================================= -->
        <header id="header_main" class="saas_two_main_header">
            <div class="container">
                <!-- //desktop menu -->
                <div class="s_main_menu">
                    <div class="row">
                        <div class="col-md-2">
                            <div class="brand_logo">
                                <a href="index.php"><img src="assets/img/saas-c/logo/logo.png" alt=""></a>
                            </div>
                        </div>
                        <div class="col-md-10">
                            <div class="main_menu_list clearfix float-right">
                                <nav class="s2-main-navigation  clearfix ul-li">
                                    <ul id="main-nav" class="navbar-nav text-capitalize clearfix">
                                        <li><a href="#" class="active" >Home</a></li>
                                        <li><a href="about.php" target="">About Us</a></li>
                                        <li class="side-demo position-relative"><a href="#">BPI Community</a> <span>Important</span></li>
                                        <li><a href="contact.php" target="">Contact Us</a></li>
                                        <li class="dropdown">
                                            <a href="#">Pages</a>
                                            <ul class="dropdown-menu clearfix">
                                                <li><a target="" href="aml.php">AML Policy</a></li>
                                                <li><a target="" href="refunds.php">Refund Policy</a></li>
                                                <li><a target="" href="privacy.php">Privacy Policy</a></li>
                                                <li><a target="" href="terms.php">Terms & Condition</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </nav>
                                <div class="saas_sign_up_btn text-center">
                                    <a href="/app" target="_blank">Login</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- //mobile menu -->
                <div class="s2-mobile_menu relative-position">
                    <div class="s2-mobile_menu_button s2-open_mobile_menu">
                        <i class="fas fa-bars"></i>
                    </div>
                    <div class="s2-mobile_menu_wrap">
                        <div class="mobile_menu_overlay s2-open_mobile_menu"></div>
                        <div class="s2-mobile_menu_content">
                            <div class="s2-mobile_menu_close s2-open_mobile_menu">
                                <i class="far fa-times-circle"></i>
                            </div>
                            <div class="m-brand-logo text-center">
                                <a href="index.php"><img src="assets/img/saas-c/logo/logo.png" alt="Logo"></a>
                            </div>
                        <nav class="s2-mobile-main-navigation  clearfix ul-li">
                            <ul id="m-main-nav" class="navbar-nav text-capitalize clearfix">
                                <li><a href="index.php" target="">Home</a></li>
                                <li><a href="about.php" target="">About Us</a></li>
                                <li class="side-demo position-relative"><a href="#">BPI Community</a> <span>Important</span></li>
                                <li><a href="contact.php" target="">Contact Us</a></li>
                               <li class="dropdown">
                                            <a href="#">Pages</a>
                                            <ul class="dropdown-menu clearfix">
                                                <li><a target="" href="aml.php">AML Policy</a></li>
                                                <li><a target="" href="refunds.php">Refund Policy</a></li>
                                                <li><a target="" href="privacy.php">Privacy Policy</a></li>
                                                <li><a target="" href="terms.php">Terms & Condition</a></li>
                                            </ul>
                                        </li>
                            </ul>
                        </nav>
                        <div class="saas_sign_up_btn text-center">
                            <a href="/app" target="_blank"> Login</a>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    <!-- End of Header section    ============================================= -->

    <!-- Start of Banner section    
        ============================================= -->
        <section id="saas_two_banner" class="saas_two_banner_section relative-position">
            <div class="container">
                <div class="row">
                    <div class="col-md-12">
                        <div class="s2-banner_area relative-position">
                            <div class="s2-banner_content saas2-headline pera-content">
                                <span class="s2-tilte_tag">BeepAgro</span>
                                <h1>Welcome to <span>BEEPAGRO</span> Africa
                                </h1>
                                <p>Empowering Africa through technology, sustainable palliatives, and transformative training. Join a movement that integrates Blockchain, AI, and Web3 to drive real impact across communities.</p>
                                <div class="banner_btn">
                                    <a href="app/register"><i class="fas fa-clipboard-list"></i> Join Us</a>
                                    <!-- <a href="programs.php"><i class="fas fa-cloud-download-alt"></i> Explore Programs</a>
                                    <span>Secure payments, Guaranteed. *</span>-->
                                </div>
                            </div>
                            <div class="banner_mockup">
                                <img src="assets/images/banner/b-laptop.png" alt="Hero">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="s2-banner_shape1 position-absolute" data-parallax='{"y" : 100}'><img src="assets/images/banner/b-shape4.png" alt=""></div>
            <div class="s2-banner_shape2 position-absolute"><img src="assets/images/banner/b-shape3.png" alt=""></div>
            <div class="s2-banner_shape3 position-absolute"><img src="assets/images/banner/b-shape2.png" alt=""></div>
        </section>
    <!-- End of Banner section    ============================================= -->

    <!-- Start of About section   
        ============================================= -->
        <section id="saas_two_feature" class="saas_two_feature_section">
            <div class="container">
                <div class="s2-feature_content">
                    <div class="row">
                        <!-- /about left content -->
                        <div class="col-lg-6 col-md-12 wow fadeFromUp" data-wow-delay="300ms" data-wow-duration="1500ms">
                            <div class="s2-feature_left">
                                <div class="s2-feature_text saas2-headline pera-content">
                                    <span class="feature_tag">Who We Are</span>
                                    <h2><span>About</span> BeepAgro Africa</h2>
                                    <p>BeepAgro Africa is a pioneering agro-tech company operating at the intersection of agriculture, technology, and social innovation.</p>
                                    <div class="saas_btn">
                                        <a href="about.php"><i class="fas fa-clipboard-list"></i> Read More</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- /about right content -->
                        <div class="col-lg-6 col-md-12">
                            <div class="s2-feature_right">
                                <!-- list item -->
                                <div class="s2-feature_list s2-grean wow fadeFromUp" data-wow-delay="0ms" data-wow-duration="1500ms">
                                    <div class="s2-feature_icon text-center relative-position">
                                        <i class="fas fa-pen-square"></i>
                                    </div>
                                    <div class="s2-feature_text_box saas2-headline pera-content">
                                        <h3>Our Mission</h3>
                                        <p>- is to solve Africa’s socio-economic challenges through Blockchain and Web3 integration.</p>
                                    </div>
                                </div>
                                <!-- list item -->
                                <div class="s2-feature_list s2-purple wow fadeFromUp" data-wow-delay="100ms" data-wow-duration="1500ms">
                                    <div class="s2-feature_icon text-center relative-position">
                                        <i class="fab fa-codepen"></i>
                                    </div>
                                    <div class="s2-feature_text_box saas2-headline pera-content">
                                        <h3>We are the creators of BPI</h3>
                                        <p>– the BeepAgro Palliative Initiative, a community-first model aimed at empowering Africans.</p>
                                    </div>
                                </div>
                                <!-- list item -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    <!-- End of About section   ============================================ -->

    <!-- Start of SEED section   
        ============================================= -->
        <section id="integration" class="integration_section">
            <div class="container">
                <div class="row">
                    <div class="col-lg-7 col-md-12 wow fadeFromLeft" data-wow-delay="0ms" data-wow-duration="1500ms">
                        <div class="integration_img">
                            <img src="assets/images/banner/in.png" alt="">
                        </div>
                    </div>
                    <div class="col-lg-5 wow fadeFromRight" data-wow-delay="0ms" data-wow-duration="1500ms">
                        <div class="integration_text saas2-headline pera-content">
                            <span class="feature_tag">SEED Value Chain</span>
                            <h2><span>SEED:</span> Our Empowerment Engine</h2>
                            <p>Sustainable Economic Empowerment Development [SEED] – a framework that fuels Africa’s grassroots empowerment movement.</p>
                            <p>It is the BPI framework for technological innovation, palliative support, and training.</p>
                            <a href="seed.php#">More Details...</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    <!-- End of SEED section   ============================================= -->

    <!-- Start of Programs  section    
        ============================================= -->
        <section id="saas_two_service" class="saas_two_service_section">
            <div class="container">
                <div class="saas_two_section_title saas2-headline text-center">
                    <span class="title_tag">Programs & Services</span>
                    <h2>Programs<span> & </span>Core Services</h2>
                </div>
                <!-- /section title -->
                <div class="service_content">
                    <div class="row justify-content-md-center">
                        <div class="col-lg-4 col-md-6  wow fadeFromUp" data-wow-delay="0ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                                <div class="service_icon_box relative-position">
                                    <div class="upper_icon">
                                        <svg height="463pt" viewBox="0 -8 463.99398 463" width="463pt" xmlns="http://www.w3.org/2000/svg"> 
                                        <path d="m384 48.496094c0-13.253906-10.746094-24-24-24h-24c0-13.253906-10.746094-24-24-24s-24 10.746094-24 24h-32c0-13.253906-10.746094-24-24-24s-24 10.746094-24 24h-32c0-13.253906-10.746094-24-24-24s-24 10.746094-24 24h-32c0-13.253906-10.746094-24-24-24s-24 10.746094-24 24h-24c-13.253906 0-24 10.746094-24 24v336c0 4.417968 3.582031 8 8 8h24v24c0 4.417968 3.582031 8 8 8h210.664062c.105469 0 .183594-.054688.28125-.054688 42.371094 29.222656 97.617188 32 142.707032 7.167969 45.089844-24.828125 72.277344-73.003906 70.234375-124.433594-2.042969-51.433593-32.96875-97.296875-79.886719-118.472656zm-80-24c0-4.417969 3.582031-8 8-8s8 3.582031 8 8v24h-16zm-80 0c0-4.417969 3.582031-8 8-8s8 3.582031 8 8v24h-16zm-80 0c0-4.417969 3.582031-8 8-8s8 3.582031 8 8v24h-16zm-80 0c0-4.417969 3.582031-8 8-8s8 3.582031 8 8v24h-16zm-48 24c0-4.417969 3.582031-8 8-8h24v16c0 4.417968 3.582031 8 8 8h32c4.417969 0 8-3.582032 8-8v-16h32v16c0 4.417968 3.582031 8 8 8h32c4.417969 0 8-3.582032 8-8v-16h32v16c0 4.417968 3.582031 8 8 8h32c4.417969 0 8-3.582032 8-8v-16h32v16c0 4.417968 3.582031 8 8 8h32c4.417969 0 8-3.582032 8-8v-16h24c4.417969 0 8 3.582031 8 8v40h-352zm32 344h170.265625c4.082031 5.671875 8.597656 11.019531 13.503906 16h-183.769531zm400-80c0 66.273437-53.726562 120-120 120s-120-53.726563-120-120c0-66.273438 53.726562-120 120-120 66.242188.074218 119.925781 53.757812 120 120zm-120-136c-47.785156-.03125-92.074219 25.03125-116.648438 66.011718-24.574218 40.976563-25.824218 91.855469-3.289062 133.988282h-192.0625v-272h352v78.023437c-12.957031-3.996093-26.441406-6.027343-40-6.023437zm0 0"/> 
                                        <path d="m72 136.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m152 136.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m232 136.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m72 200.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m152 200.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m72 264.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m152 264.496094c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582032-8-8 0-4.417969 3.582031-8 8-8s8 3.582031 8 8c0 4.417968-3.582031 8-8 8zm0 0"/> 
                                        <path d="m224 312.496094c0 57.4375 46.5625 104 104 104s104-46.5625 104-104-46.5625-104-104-104c-57.410156.066406-103.933594 46.589844-104 104zm192 0h-16c-4.417969 0-8 3.582031-8 8 0 4.417968 3.582031 8 8 8h14.472656c-7.214844 38.722656-39.253906 67.953125-78.472656 71.59375v-15.59375c0-4.417969-3.582031-8-8-8s-8 3.582031-8 8v15.59375c-39.21875-3.640625-71.257812-32.871094-78.472656-71.59375h14.472656c4.417969 0 8-3.582032 8-8 0-4.417969-3.582031-8-8-8h-16c.058594-45.46875 34.722656-83.421875 80-87.589844v15.589844c0 4.417968 3.582031 8 8 8s8-3.582032 8-8v-15.589844c45.277344 4.167969 79.941406 42.121094 80 87.589844zm0 0"/> 
                                        <path d="m329.71875 308.65625-11.0625-16.597656c-2.453125-3.675782-7.421875-4.667969-11.097656-2.21875-3.675782 2.453125-4.667969 7.421875-2.214844 11.097656l16 24c1.261719 1.882812 3.261719 3.144531 5.503906 3.472656.382813.058594.765625.089844 1.152344.085938 1.871094.003906 3.683594-.652344 5.121094-1.847656l48-40c3.398437-2.828126 3.859375-7.875 1.03125-11.269532-2.828125-3.398437-7.875-3.863281-11.273438-1.035156zm0 0"/> </svg>
                                    </div>
                                    <div class="lower_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> 
                                        <g> <g> <path d="M256,0c-74.439,0-135,60.561-135,135s60.561,135,135,135s135-60.561,135-135S330.439,0,256,0z"/> </g> </g> 
                                        <g> <g> <path d="M423.966,358.195C387.006,320.667,338.009,300,286,300h-60c-52.008,0-101.006,20.667-137.966,58.195 C51.255,395.539,31,444.833,31,497c0,8.284,6.716,15,15,15h420c8.284,0,15-6.716,15-15 C481,444.833,460.745,395.539,423.966,358.195z"/> </g> </g>
                                        </svg>   
                                    </div>
                                </div>
                                <div class="service_text_box saas2-headline pera-content">
                                    <h3>Export Promotion Code & Program</h3>
                                    <p>Earn dollar-based rewards by promoting African-made products globally through BIMarket...</p>
                                </div>
                            </div>
                        </div>
                        <!-- /service-content -->
                        <div class="col-lg-4 col-md-6 wow fadeFromUp" data-wow-delay="300ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                                <div class="service_icon_box relative-position">
                                    <div class="upper_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M503.706,230.013h-10.817c-5.851-53.728-29.947-104.087-68.381-142.522c-23.295-23.295-50.978-41.316-81.129-53.21 h118.012c3.47,10.273,13.193,17.693,24.622,17.693c14.329,0,25.987-11.658,25.987-25.987C512,11.658,500.342,0,486.013,0 c-11.43,0-21.152,7.42-24.622,17.693H281.987v-9.4c0-4.58-3.713-8.294-8.294-8.294h-35.387c-4.58,0-8.294,3.713-8.294,8.294v9.4 H50.609C47.139,7.42,37.417,0,25.987,0C11.658,0,0,11.658,0,25.987c0,14.329,11.658,25.987,25.987,25.987 c11.43,0,21.152-7.42,24.622-17.693h118.013c-30.153,11.894-57.834,29.915-81.13,53.212 c-38.435,38.434-62.53,88.793-68.381,142.521H8.294c-4.58,0-8.294,3.713-8.294,8.294v35.387c0,4.58,3.713,8.294,8.294,8.294H43.68 c4.58,0,8.294-3.713,8.294-8.294v-35.387c0-4.58-3.713-8.294-8.294-8.294h-7.882c5.779-49.305,28.091-95.46,63.424-130.792 c35.331-35.331,81.487-57.644,130.791-63.423v7.882c0,3.236,1.858,6.032,4.562,7.399l-109.95,236.815 c-1.295,2.789-0.94,6.065,0.921,8.513c0.563,0.741,54.672,72.695,59.892,147.406c-10.096,3.568-17.351,13.204-17.351,24.506 v17.693c0,14.329,11.658,25.987,25.987,25.987h123.853c14.329,0,25.987-11.658,25.987-25.987V468.32 c0-11.303-7.255-20.937-17.35-24.505c5.221-74.595,59.33-146.668,59.892-147.406c1.861-2.447,2.216-5.724,0.921-8.513 L277.425,51.079c2.704-1.367,4.562-4.163,4.562-7.399v-7.882c49.305,5.779,95.46,28.091,130.792,63.424 c35.332,35.332,57.644,81.488,63.423,130.792h-7.882c-4.58,0-8.294,3.713-8.294,8.294v35.387c0,4.58,3.713,8.294,8.294,8.294 h35.387c4.58,0,8.294-3.713,8.294-8.294v-35.387C512,233.726,508.287,230.013,503.706,230.013z M486.013,16.587 c5.183,0,9.4,4.217,9.4,9.4c0,5.183-4.217,9.4-9.4,9.4s-9.4-4.217-9.4-9.4C476.613,20.804,480.83,16.587,486.013,16.587z M25.987,35.387c-5.183,0-9.4-4.217-9.4-9.4c0-5.183,4.217-9.4,9.4-9.4c5.183,0,9.4,4.217,9.4,9.4 C35.387,31.17,31.17,35.387,25.987,35.387z M35.387,265.4H16.587V246.6H26.61c0.019,0,0.038,0.002,0.056,0.002 c0.016,0,0.03-0.002,0.045-0.002h8.675V265.4z M246.6,16.587H265.4v18.799H246.6V16.587z M327.326,468.32v17.693 c0,5.183-4.216,9.4-9.4,9.4H194.073c-5.183,0-9.4-4.217-9.4-9.4V468.32c0-5.183,4.216-9.4,9.4-9.4h123.853 C323.11,458.92,327.326,463.137,327.326,468.32z M370.271,290.443c-11.983,16.831-55.262,82.018-60.229,151.889H201.958 c-4.967-69.871-48.246-135.058-60.229-151.889L247.706,62.184v195.374c-15.215,3.731-26.54,17.479-26.54,33.828 c0,19.207,15.626,34.834,34.834,34.834s34.834-15.627,34.834-34.834c0-16.35-11.325-30.096-26.54-33.828V62.184L370.271,290.443z M256,273.14c10.061,0,18.246,8.185,18.246,18.246c0,10.061-8.185,18.246-18.246,18.246s-18.246-8.185-18.246-18.246 S245.939,273.14,256,273.14z M495.413,265.4h-18.799V246.6h8.676c0.016,0,0.03,0.002,0.045,0.002c0.019,0,0.038-0.002,0.056-0.002 h10.021V265.4z"/> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>
                                    </div>
                                    <div class="lower_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M0,45.511V307.2h512V45.511H0z M221.176,96.021l24.136,24.136l-45.511,45.511l-24.136-24.136L221.176,96.021z M290.823,256.69l-24.136-24.136l45.511-45.511l24.136,24.136L290.823,256.69z M199.801,256.69l-24.136-24.136L312.198,96.021 l24.136,24.136L199.801,256.69z"/> </g> </g> <g> <g> <polygon points="512,398.222 512,341.333 0,341.333 0,398.222 182.044,398.222 182.044,432.356 108.089,432.356 108.089,466.489 403.911,466.489 403.911,432.356 329.956,432.356 329.956,398.222 "/> </g> </g> </svg>
                                    </div>
                                </div>
                                <div class="service_text_box saas2-headline pera-content">
                                    <h3>YouTube Monetization<br>Support</h3>
                                    <p>Empowering content creators to grow organic followership and meet YouTube monetization requirements...</p>
                                </div>
                            </div>
                        </div>
                        <!-- /service-content -->
                        <div class="col-lg-4 col-md-6 wow fadeFromUp" data-wow-delay="600ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                                <div class="service_icon_box relative-position">
                                    <div class="upper_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M437.4,95.856L437.4,95.856L512,21.277L490.79,0.06L416.289,74.54H93.872V10.669H63.871V74.54H0v30.001h63.871v343.528 h343.528v63.871H437.4v-63.871h63.871v-30.001H437.4V95.856z M93.872,104.542h292.407L93.872,396.864V104.542z M407.4,418.069 h-0.001H115.096L407.4,125.85V418.069z"></path> </g> </g> <g> </g></svg> </div><div class="lower_icon"> <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M437.4,95.856L437.4,95.856L512,21.277L490.79,0.06L416.289,74.54H93.872V10.669H63.871V74.54H0v30.001h63.871v343.528 h343.528v63.871H437.4v-63.871h63.871v-30.001H437.4V95.856z M93.872,104.542h292.407L93.872,396.864V104.542z M407.4,418.069 h-0.001H115.096L407.4,125.85V418.069z"></path> </g> </g> <g> </g></svg>
                                        </div>
                                    </div>
                                    <div class="service_text_box saas2-headline pera-content">
                                        <h3>Renewable Solar Assessment Tool</h3>
                                        <p>Become a certified solar consultant with hands-on training using our digital solar planning tool...</p>
                                    </div>
                                </div>
                            </div>
                        <!-- /service-content -->
                        <div class="col-lg-4 col-md-6 wow fadeFromUp" data-wow-delay="0ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                             <div class="service_icon_box relative-position">
                                 <div class="upper_icon">
                                     <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.002 512.002"  xml:space="preserve"> <g> <g> <path d="M507.461,355.884l-108.127-46.461l19.47-8.283c3.812-1.623,5.589-6.028,3.966-9.84c-1.621-3.812-6.024-5.59-9.841-3.966 l-35.615,15.152l-121.312,51.611l-121.311-51.611c-0.005-0.002-0.009-0.003-0.014-0.005L26.586,256.495l105.18-45.193 l121.297,51.604c0.939,0.399,1.939,0.599,2.938,0.599c0.999,0,1.999-0.2,2.938-0.599l121.297-51.604l105.179,45.194 l-44.713,19.022c-3.814,1.621-5.59,6.027-3.967,9.839c1.622,3.812,6.025,5.591,9.841,3.966l60.86-25.892 c2.764-1.175,4.56-3.886,4.565-6.89c0.006-3.004-1.781-5.721-4.541-6.906l-108.126-46.461l108.102-45.99 c2.764-1.175,4.56-3.886,4.565-6.89c0.006-3.004-1.781-5.721-4.541-6.906L258.962,36.613c-1.892-0.813-4.032-0.813-5.924,0 L97.815,103.31c-3.807,1.636-5.567,6.048-3.931,9.855c1.637,3.806,6.048,5.568,9.855,3.931L256,51.672l229.414,98.576L256,247.848 l-229.413-97.6l49.421-21.236c3.807-1.636,5.567-6.048,3.931-9.854c-1.637-3.806-6.047-5.568-9.855-3.931L4.541,143.39 c-2.76,1.185-4.547,3.902-4.541,6.906c0.006,3.003,1.802,5.714,4.565,6.89l108.102,45.991L4.541,249.637 c-2.76,1.185-4.547,3.902-4.541,6.906c0.006,3.004,1.802,5.714,4.565,6.89l108.102,45.991L4.541,355.884 c-2.76,1.185-4.547,3.902-4.541,6.906c0.006,3.003,1.802,5.714,4.565,6.89l248.497,105.719c0.939,0.399,1.939,0.599,2.938,0.599 c0.999,0,1.999-0.2,2.938-0.599l38.029-16.178c3.812-1.623,5.589-6.028,3.966-9.84c-1.623-3.814-6.029-5.588-9.841-3.966 l-35.091,14.929L26.586,362.742l105.18-45.193l121.297,51.604c0.939,0.399,1.939,0.599,2.938,0.599c0.999,0,1.999-0.2,2.938-0.599 l121.297-51.604l105.18,45.194l-166.55,70.855c-3.812,1.623-5.589,6.028-3.966,9.84c1.622,3.814,6.028,5.588,9.841,3.966 l182.696-77.724c2.764-1.175,4.56-3.886,4.565-6.89C512.008,359.786,510.221,357.069,507.461,355.884z"/> </g> </g> </svg>
                                 </div>
                                 <div class="lower_icon">
                                     <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <g> <path d="M469.333,170.667H106.667c-19.781,0-36.667,13.292-41.375,32.427c-0.021,0.073-0.052,0.156-0.073,0.229L2.771,414.177 c-0.677,2.302-0.563,4.771,0.333,7C9.646,437.469,25.167,448,42.667,448h362.667c19.104,0,35.719-12.646,40.938-30.948 c0.094-0.229,0.177-0.458,0.25-0.698l63.375-189.833c0.208-0.604,0.344-1.229,0.438-1.854C511.448,220.719,512,217,512,213.333 C512,189.802,492.865,170.667,469.333,170.667z"/> <path d="M9.135,285.396c0.521,0.083,1.031,0.115,1.542,0.115c4.656,0,8.865-3.052,10.219-7.635l23.771-80.271 c0.031-0.125,0.063-0.24,0.094-0.365c7.292-28.208,32.74-47.906,61.906-47.906h328.708c3.469,0,6.719-1.688,8.719-4.521 c1.99-2.823,2.49-6.448,1.333-9.719c-6.042-17-22.156-28.427-40.094-28.427h-198.25l-39.542-39.542c-2-2-4.708-3.125-7.542-3.125 H42.667C19.135,64,0,83.135,0,106.667v168.177C0,280.146,3.896,284.635,9.135,285.396z"/> </g> </g> </g> </svg>
                                 </div>
                             </div>
                             <div class="service_text_box saas2-headline pera-content">
                                <h3>MYNGUL – Social Media Platform</h3>
                                <p>Engage with Africa’s first identity-based, revenue-sharing social media platform...</p>
                            </div>
                            </div>
                        </div>
                        <!-- /service-content -->
                        <div class="col-lg-4 col-md-6 wow fadeFromUp" data-wow-delay="300ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                                <div class="service_icon_box relative-position">
                                    <div class="upper_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 496 496"  xml:space="preserve">
                                        </svg>
                                    </div>
                                    <div class="lower_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M256,0c-74.439,0-135,60.561-135,135s60.561,135,135,135s135-60.561,135-135S330.439,0,256,0z"/> </g> </g> <g> <g> <path d="M423.966,358.195C387.006,320.667,338.009,300,286,300h-60c-52.008,0-101.006,20.667-137.966,58.195 C51.255,395.539,31,444.833,31,497c0,8.284,6.716,15,15,15h420c8.284,0,15-6.716,15-15 C481,444.833,460.745,395.539,423.966,358.195z"/> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>
                                    </div>
                                </div>
                                <div class="service_text_box saas2-headline pera-content">
                                    <h3>Donors & Donation Application</h3>
                                    <p>A transparent donation platform enabling international donors to contribute to BPI...</p>
                                </div>
                            </div>
                        </div>
                        <!-- /service-content -->
                        <div class="col-lg-4 col-md-6 wow fadeFromUp" data-wow-delay="600ms" data-wow-duration="1500ms">
                            <div class="service_content_box relative-position">
                                <div class="service_icon_box relative-position">
                                    <div class="upper_icon">
                                        <svg height="504pt" viewBox="0 0 504.10605 504" width="504pt" xmlns="http://www.w3.org/2000/svg"><path d="m482.390625 134.929688 16.964844-17.457032.007812-.007812c3.050781-3.140625 4.753907-7.351563 4.742188-11.726563l-.144531-80.210937c.082031-6.738282-2.566407-13.222656-7.335938-17.988282-4.777344-4.703124-11.203125-7.363281-17.914062-7.414062l-82.367188-.0703125c-.183594.1679685-.695312.0195313-1.050781.0625005-4.164063.65625-7.992188 2.679687-10.878907 5.753906l-178.839843 178.847656c-59.933594-16.519531-124.039063 2.625-165.101563 49.300781-41.0625 46.679688-51.875 112.703125-27.855468 170.039063 24.023437 57.339844 78.671874 95.9375 140.742187 99.40625 3.023437.167968 6.039063.25 9.054687.25 50.695313.027344 98.492188-23.621094 129.230469-63.933594s40.890625-92.667969 27.445313-141.546875l14.605468-14.613281c2.84375-2.835938 4.277344-6.796875 3.902344-10.796875l-3.726562-40.78125 37.03125 3.382812c4 .371094 7.960937-1.058593 10.800781-3.898437 2.84375-2.839844 4.273437-6.796875 3.910156-10.796875l-3.378906-37.042969 37.042969 3.390625c4 .363281 7.949218-1.066406 10.789062-3.902344 2.839844-2.839843 4.273438-6.789062 3.914063-10.785156l-3.339844-37.148437 40.957031 3.683593c4.015625.351563 7.976563-1.113281 10.792969-3.996093zm-54.132813-16.753907c-3.996093-.359375-7.941406 1.074219-10.777343 3.910157-2.835938 2.835937-4.269531 6.785156-3.910157 10.777343l3.339844 37.144531-37.054687-3.390624c-4-.363282-7.953125 1.070312-10.792969 3.910156-2.839844 2.835937-4.269531 6.792968-3.90625 10.792968l3.386719 37.039063-37.039063-3.390625c-4-.363281-7.957031 1.066406-10.796875 3.910156-2.839843 2.839844-4.269531 6.796875-3.902343 10.796875l3.941406 43.15625-17.035156 17.039063c-2.203126 2.195312-3.003907 5.429687-2.085938 8.402344 18.550781 60.0625-3.535156 125.25-54.777344 161.664062-51.238281 36.417969-120.0625 35.84375-170.6875-1.425781s-71.617187-102.816407-52.0625-162.558594c19.550782-59.746094 75.234375-100.199219 138.097656-100.328125 14.691407.015625 29.296876 2.226562 43.332032 6.558594 2.972656.914062 6.203125.113281 8.402344-2.085938l182.34375-182.347656c.332031-.328125.6875-.628906 1.058593-.910156l81.410157.074218h.035156c2.257812 0 4.417968.90625 5.996094 2.515626 1.578124 1.613281 2.441406 3.789062 2.398437 6.046874l.148437 80.277344-.007812.023438-15.824219 16.285156zm0 0"/><path d="m83.929688 349.917969c-19.316407 19.316406-19.316407 50.636719.003906 69.953125 19.316406 19.316406 50.632812 19.316406 69.949218 0 19.316407-19.316406 19.320313-50.636719.003907-69.953125-19.332031-19.289063-50.625-19.289063-69.957031 0zm58.082031 58.082031c-12.757813 12.75-33.433594 12.742188-46.1875-.011719-12.75-12.753906-12.75-33.433593 0-46.1875 12.753906-12.753906 33.429687-12.761719 46.1875-.011719 12.746093 12.765626 12.75 33.441407.007812 46.210938zm0 0"/><path d="m367.089844 81.28125-130.6875 130.6875c-2.179688 2.105469-3.054688 5.226562-2.289063 8.160156.769531 2.9375 3.0625 5.226563 5.996094 5.996094s6.054687-.105469 8.164063-2.289062l130.683593-130.683594c2.175781-2.109375 3.042969-5.226563 2.277344-8.15625-.769531-2.929688-3.058594-5.21875-5.988281-5.988282-2.929688-.769531-6.046875.097657-8.15625 2.273438zm0 0"/><path d="m389.054688 61.164062c-1.566407 1.480469-2.457032 3.539063-2.457032 5.695313 0 2.152344.890625 4.214844 2.457032 5.691406 3.332031 3.144531 8.539062 3.144531 11.871093 0 1.570313-1.476562 2.460938-3.539062 2.460938-5.691406 0-2.15625-.890625-4.214844-2.460938-5.695313-3.332031-3.144531-8.539062-3.144531-11.871093 0zm0 0"/></svg>
                                    </div>
                                    <div class="lower_icon">
                                        <svg version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve"> <g> <g> <path d="M396,252.125H171V115c0-46.869,38.131-85,85-85s85,38.131,85,85v41.642h-25c-8.284,0-15,6.716-15,15s6.716,15,15,15h40 c8.284,0,15-6.716,15-15V115C371,51.589,319.411,0,256,0S141,51.589,141,115v137.125h-25c-8.284,0-15,6.716-15,15V357 c0,85.467,69.533,155,155,155s155-69.533,155-155v-89.875C411,258.84,404.284,252.125,396,252.125z M271,399.133v27.929 c0,8.284-6.716,15-15,15s-15-6.716-15-15v-27.929c-14.643-5.947-25-20.318-25-37.071c0-22.056,17.944-40,40-40 c22.056,0,40,17.944,40,40C296,378.815,285.643,393.186,271,399.133z"/> </g> </g> </svg>
                                    </div>
                                </div>
                                    <div class="service_text_box saas2-headline pera-content">
                                        <h3>More Programs</h3>
                                        <p>Capital Market Education, Blockchain, Web3, AI & Masternode Training, & Healthcare Education...</p>
                                    </div>
                                </div>
                            </div>
                        <!-- /service-content -->
                    </div>
                </div>
                <div class="service_read_more text-center">
                    <a href="programs.php">Explore Programs & Services</a>
                </div>
            </div>
        </section>
    <!-- End of Programs section    ============================================= -->

    <!-- Start of Feed section    
        ============================================= -->
        <section id="saas_two_about" class="saas_two_about_section relative-position">
            <div class="container">
                <div class="saas_two_section_title saas2-headline text-center">
                    <span class="title_tag">Incentives & Benefits</span>
                    <h2><span>Entitlements available<br></span> with BPI</h2>
                </div>
                <div class="bis-portfolio-filter-tab">
                    <div class="filtr-container-area grid clearfix" data-isotope="{ &quot;masonry&quot;: { &quot;columnWidth&quot;: 0 } }">
                        <div class="grid-sizer"></div>
                        <div class="grid-item grid-size-33  health" data-category="health">
                            <div class="bis-project-item-area">
                                <div class="bis-project-item">
                                    <div class="bis-project-img">
                                        <img src="assets/img/project/pr1.jpg" alt="">
                                    </div>
                                    <div class="bis-project-text saas2-headine d-flex justify-content-between align-items-center">
                                        <h3><a href="BPI-Community_Support" tabindex="0">BPI Community Support<br>A Social Intervention & Digital Lifeline</a></h3>
                                        <a class="read_more" href="BPI-Community_Support" tabindex="0"><i class="fas fa-arrow-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="grid-item grid-size-33  business" data-category="business">
                            <div class="bis-project-item-area">
                                <div class="bis-project-item">
                                    <div class="bis-project-img">
                                        <img src="assets/img/project/pr2.jpg" alt="">
                                    </div>
                                    <div class="bis-project-text saas2-headine d-flex justify-content-between align-items-center">
                                        <h3><a href="BPI-Landbanking" tabindex="0">BPI Early Retirement <br>with Landbanking</a></h3>
                                        <a class="read_more" href="BPI-Landbanking" tabindex="0"><i class="fas fa-arrow-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="grid-item grid-size-33  design" data-category="design">
                            <div class="bis-project-item-area">
                                <div class="bis-project-item">
                                    <div class="bis-project-img">
                                        <img src="assets/img/project/pr3.jpg" alt="">
                                    </div>
                                    <div class="bis-project-text saas2-headine d-flex justify-content-between align-items-center">
                                        <h3><a href="BPI-Solar_Package" tabindex="0">BPI Early Retirement <br>with Solar Power Station</a></h3>
                                        <a class="read_more" href="BPI-Solar_Package" tabindex="0"><i class="fas fa-arrow-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--<div class="grid-item grid-size-33  health business design" data-category="health business design">
                            <div class="bis-project-item-area">
                                <div class="bis-project-item">
                                    <div class="bis-project-img">
                                        <img src="assets/img/project/pr4.jpg" alt="">
                                    </div>
                                    <div class="bis-project-text saas2-headine d-flex justify-content-between align-items-center">
                                        <h3><a href="#" tabindex="0">Business Branding</a></h3>
                                        <a class="read_more" href="#" tabindex="0"><i class="fas fa-arrow-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>-->
                    </div>
                </div>
            </div>
        </section>
    <!-- End of Feed  section    ============================================= -->

    <!-- Start of News section    
        ============================================= 
        <section id="saas_two_about" class="saas_two_about_section relative-position">
            <div class="container">
                <div class="saas_two_section_title saas2-headline text-center">
                    <span class="title_tag">News & Updates</span>
                    <h2><span>Latest Updates from the<br></span>BPI Ecosystem</h2>
                </div>
                <div id="dia-blog" class="dia-blog-section">
                    <div class="dia-blog-content">
                        <div class="row">
                            <div class="col-lg-4 wow fadeFromUp" data-wow-delay="0ms" data-wow-duration="1500ms">
                                <div class="dia-blog-img-text">
                                    <div class="dia-blog-img">
                                        <img src="assets/images/blog/b1.jpg" alt="">
                                    </div>
                                    <div class="dia-blog-text">
                                        <span class="dia-blog-tag"><a href="news-1.php">BPI News</a></span>
                                        <h3><a href="news-1.php">Community Is the New Oil: Unlocking Africa’s Future Through Economic Virtual Cooperatives.</a></h3>
                                    </div>
                                    <div class="dia-blog-meta">
                                        <div class="dia-author-area d-inline-block">
                                            <div class="dia-athur-img float-left">
                                                <img src="assets/images/blog/ba1.jpg" alt="">
                                            </div>
                                            <div class="dia-author-name">
                                                <span>By<a href="#"> Admin</a></span>
                                            </div>
                                        </div>
                                        <div class="dia-date-meta float-right">
                                            <a href="#">12th June, 2025.</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 wow fadeFromUp" data-wow-delay="300ms" data-wow-duration="1500ms">
                                <div class="dia-blog-img-text">
                                    <div class="dia-blog-img">
                                        <img src="assets/img/d-agency/blog/b2.jpg" alt="">
                                    </div>
                                    <div class="dia-blog-text">
                                        <span class="dia-blog-tag"><a href="#">BPI News</a></span>
                                        <h3><a href="news-2">Introducing the BPI Economic Virtual Cooperative Model: The Blueprint for Africa’s...</a></h3>
                                    </div>
                                    <div class="dia-blog-meta">
                                        <div class="dia-author-area d-inline-block">
                                            <div class="dia-athur-img float-left">
                                                <img src="assets/img/d-agency/blog/ba1.jpg" alt="">
                                            </div>
                                            <div class="dia-author-name">
                                                <span>By <a href="#">Admin</a></span>
                                            </div>
                                        </div>
                                        <div class="dia-date-meta float-right">
                                            <a href="#">12th June, 2025.</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 wow fadeFromUp" data-wow-delay="600ms" data-wow-duration="1500ms">
                                <div class="dia-blog-img-text">
                                    <div class="dia-blog-img">
                                        <img src="assets/images/blog/b1.jpg" alt="">
                                    </div>
                                    <div class="dia-blog-text">
                                        <span class="dia-blog-tag"><a href="news-1.php">BPI News</a></span>
                                        <h3><a href="news-1.php">Community Is the New Oil: Unlocking Africa’s Future Through Economic Virtual Cooperatives.</a></h3>
                                    </div>
                                    <div class="dia-blog-meta">
                                        <div class="dia-author-area d-inline-block">
                                            <div class="dia-athur-img float-left">
                                                <img src="assets/images/blog/ba1.jpg" alt="">
                                            </div>
                                            <div class="dia-author-name">
                                                <span>By<a href="#"> Admin</a></span>
                                            </div>
                                        </div>
                                        <div class="dia-date-meta float-right">
                                            <a href="#">12th June, 2025.</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    <!-- End of News  section    ============================================= -->

    <!-- Start of Partners section   
        ============================================= -->
        <section id="sa-team-inner" class="sa-team-inner-section inner-page-padding">
            <div class="container">
                <div class="sa-team-=inner-contenb">
                    <div class="row">
                        <div class="col-lg-3 col-md-6">
                            <div class="sa-team-inner-inner-box">
                                <div class="str-team-img-text position-relative">
                                    <div class="str-team-img">
                                        <img src="assets/img/startup/team/tm1.jpg" alt="">
                                    </div>
                                    <div class="str-team-text text-center str-headline pera-content">
                                        <h4>G-wallet</h4>
                                        <span>USDT Transactions</span>
                                        <p>The Gwallet is a Tether-exclusive wallet built to solve Africa's barriers in  digital economy.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="sa-team-inner-inner-box">
                                <div class="str-team-img-text position-relative">
                                    <div class="str-team-img">
                                        <img src="assets/img/startup/team/tm2.jpg" alt="">
                                    </div>
                                    <div class="str-team-text text-center str-headline pera-content">
                                        <h4>Zenqira</h4>
                                        <span>Fueling AI Innovation</span>
                                        <p>Zenqira is a decentralized, community-driven solution to enhance AI data collection and distribution.</p>
                                    </div
                                </div>
                            </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="sa-team-inner-inner-box">
                                <div class="str-team-img-text position-relative">
                                    <div class="str-team-img">
                                        <img src="assets/img/startup/team/tm3.jpg" alt="">
                                    </div>
                                    <div class="str-team-text text-center str-headline pera-content">
                                        <h4>StepClub</h4>
                                        <span>Unlock your full potential</span>
                                        <p>STEPClub has everything you need to reach your goals and ensure you achieve optimal health and wealth.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="sa-team-inner-inner-box">
                                <div class="str-team-img-text position-relative">
                                    <div class="str-team-img">
                                        <img src="assets/img/startup/team/tm4.jpg" alt="">
                                    </div>
                                    <div class="str-team-text text-center str-headline pera-content">
                                        <h4>FreeLife</h4>
                                        <span>Healthy living, Made Easy</span>
                                        <p>FreeLife Global Ltd is a Leading Provider of integrated health and Wealth Management Solutions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
               </div>
            </div>
        </section>
    <!-- End  of Partners section   ============================================= -->

    <!-- Start of Footer section
        ============================================= -->
        <footer id="saas_two_footer" class="saas_two_footer_section relative-position">
            <?php include_once('subscribe_form.php'); ?>
            <div class="footer_content pera-content">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-4 col-md-12">
                            <div class="s2_footer_widget clearfix ul-li-block  saas2-headline">
                                <div class="s2_footer_about">
                                    <div class="s2-footer_logo">
                                        <img src="assets/img/saas-c/logo/logo.png" alt="">
                                    </div>
                                    <div class="footer_about">
                                        BeepAgro Africa is a pioneering agro-tech company operating at the 
                                        intersection of agriculture, technology, and social innovation. 
                                    </div>
                                    <div class="s2_footer_social">
                                        <a href="https://web.facebook.com/people/Beepagro-Africa/100088524616888/?_rdc=1&_rdr"><i class="fb-bg fab fa-facebook-f "></i></a>
                                        <a href="https://x.com/BeepagroAfrica"><i class="bh-bg fab fa-twitter"></i></a>
                                        <a href="https://www.instagram.com/beepagro/"><i class="ig-bg fab fa-instagram"></i></a>
                                        <a href="https://www.linkedin.com/company/beepagro-africa/"><i class="dr-bg fab fa-linkedin"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-12">
                            <div class="s2_footer_widget clearfix ul-li-block saas2-headline">
                                <div class="s2_footer_menu">
                                    <h3 class="s2_widget_title">
                                        <span>Links</span>
                                        <i></i>
                                    </h3>
                                    <ul>
                                        <li><a href="index.php"> Home</a></li>
                                        <li><a href="about.php"> About Us</a></li>
                                        <li><a href="contact.php"> Contact Us</a></li>
                                        <li><a href="training.php"> Training & Mentorship</a></li>
                                        <li><a href="model.php"> The BPI Model</a></li>
                                        <li><a href="news.php"> News & Updates</a></li>
                                        <li><a href="seed.php"> SEED Value Chain</a></li>
                                        <li><a href="programs.php"> Programs & Services</a></li>
                                        <li><a href="partners.php"> Our Partners</a></li>
                                        <li><a href="join.php"> Join the Movement</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-12">
                            <div class="s2_footer_widget clearfix ul-li-block saas2-headline">
                                <div class="s2_footer_social">
                                    <h3 class="s2_widget_title">
                                        <span>Info</span> 
                                        <i></i>
                                    </h3>
                                    <a class="float-left"><i class="fas fa-map-marker-alt"></i></a><p>15b Yinusa Adeniji Street, Off Muslim<br>Avenue, Ikeja, Lagos, Nigeria.</p><br>
                                    <a class="float-left"><i class="fas fa-envelope"></i></a><p>beepagro@gmail.com<br>partners@beepagro.com</p><br>
                                    <a class="float-left"><i class="fas fa-phone"></i></a><p>(+234) 706-710-8437<br>(+234) 909-200-3500</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    <!-- End of Footer section   ============================================= -->

    <!-- Copyright -->
        <div class="s2-copyright text-center">2025
           <meta name="keywords" content="accountant, advertising, advisor, agency, broker, business, clean, consulting, creative, elementor, finance, insurance, marketing, modern, portfolio">
            © All rights reserved by <a href="index.php">BeepAgro Africa</a>
        </div>

    <!-- JS library -->
        <script src="assets/js/jquery.js"></script>
        <script src="assets/js/popper.min.js"></script>
        <script src="assets/js/bootstrap.min.js"></script>
        <script src="assets/js/owl.js"></script>
        <script src="assets/js/aos.js"></script>
        <script src="assets/js/slick.js"></script>
        <script src="assets/js/wow.min.js"></script>
        <script src="assets/js/pagenav.js"></script>
        <script src="assets/js/jquery.barfiller.js"></script>
        <script src="assets/js/parallax-scroll.js"></script>
        <script src="assets/js/jquery.mCustomScrollbar.concat.min.js"></script>
        <script src="assets/js/side-demo.js"></script>
        <script src="assets/js/script.js"></script>
    </body>
    </html>