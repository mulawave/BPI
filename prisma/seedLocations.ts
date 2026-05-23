/**
 * seedLocations.ts
 *
 * Seeds the countries, states, and cities tables with comprehensive world data.
 * IDs match the dr5hn countries-states-cities-database standard for cross-compatibility.
 * Run with: npx tsx prisma/seedLocations.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// COUNTRIES — all ISO 3166-1 countries (id matches dr5hn DB standard)
// ---------------------------------------------------------------------------
const COUNTRIES = [
  { id: 1, name: "Afghanistan", dialCode: 93, code: "AF" },
  { id: 2, name: "Aland Islands", dialCode: 358, code: "AX" },
  { id: 3, name: "Albania", dialCode: 355, code: "AL" },
  { id: 4, name: "Algeria", dialCode: 213, code: "DZ" },
  { id: 5, name: "American Samoa", dialCode: 1684, code: "AS" },
  { id: 6, name: "Andorra", dialCode: 376, code: "AD" },
  { id: 7, name: "Angola", dialCode: 244, code: "AO" },
  { id: 8, name: "Anguilla", dialCode: 1264, code: "AI" },
  { id: 9, name: "Antarctica", dialCode: 672, code: "AQ" },
  { id: 10, name: "Antigua And Barbuda", dialCode: 1268, code: "AG" },
  { id: 11, name: "Argentina", dialCode: 54, code: "AR" },
  { id: 12, name: "Armenia", dialCode: 374, code: "AM" },
  { id: 13, name: "Aruba", dialCode: 297, code: "AW" },
  { id: 14, name: "Australia", dialCode: 61, code: "AU" },
  { id: 15, name: "Austria", dialCode: 43, code: "AT" },
  { id: 16, name: "Azerbaijan", dialCode: 994, code: "AZ" },
  { id: 17, name: "Bahamas", dialCode: 1242, code: "BS" },
  { id: 18, name: "Bahrain", dialCode: 973, code: "BH" },
  { id: 19, name: "Bangladesh", dialCode: 880, code: "BD" },
  { id: 20, name: "Barbados", dialCode: 1246, code: "BB" },
  { id: 21, name: "Belarus", dialCode: 375, code: "BY" },
  { id: 22, name: "Belgium", dialCode: 32, code: "BE" },
  { id: 23, name: "Belize", dialCode: 501, code: "BZ" },
  { id: 24, name: "Benin", dialCode: 229, code: "BJ" },
  { id: 25, name: "Bermuda", dialCode: 1441, code: "BM" },
  { id: 26, name: "Bhutan", dialCode: 975, code: "BT" },
  { id: 27, name: "Bolivia", dialCode: 591, code: "BO" },
  { id: 28, name: "Bosnia and Herzegovina", dialCode: 387, code: "BA" },
  { id: 29, name: "Botswana", dialCode: 267, code: "BW" },
  { id: 30, name: "Bouvet Island", dialCode: 47, code: "BV" },
  { id: 31, name: "Brazil", dialCode: 55, code: "BR" },
  { id: 32, name: "British Indian Ocean Territory", dialCode: 246, code: "IO" },
  { id: 33, name: "Brunei", dialCode: 673, code: "BN" },
  { id: 34, name: "Bulgaria", dialCode: 359, code: "BG" },
  { id: 35, name: "Burkina Faso", dialCode: 226, code: "BF" },
  { id: 36, name: "Burundi", dialCode: 257, code: "BI" },
  { id: 37, name: "Cambodia", dialCode: 855, code: "KH" },
  { id: 38, name: "Cameroon", dialCode: 237, code: "CM" },
  { id: 39, name: "Canada", dialCode: 1, code: "CA" },
  { id: 40, name: "Cape Verde", dialCode: 238, code: "CV" },
  { id: 41, name: "Cayman Islands", dialCode: 1345, code: "KY" },
  { id: 42, name: "Central African Republic", dialCode: 236, code: "CF" },
  { id: 43, name: "Chad", dialCode: 235, code: "TD" },
  { id: 44, name: "Chile", dialCode: 56, code: "CL" },
  { id: 45, name: "China", dialCode: 86, code: "CN" },
  { id: 46, name: "Christmas Island", dialCode: 61, code: "CX" },
  { id: 47, name: "Cocos (Keeling) Islands", dialCode: 672, code: "CC" },
  { id: 48, name: "Colombia", dialCode: 57, code: "CO" },
  { id: 49, name: "Comoros", dialCode: 269, code: "KM" },
  { id: 50, name: "Congo", dialCode: 242, code: "CG" },
  { id: 51, name: "Democratic Republic Of Congo", dialCode: 243, code: "CD" },
  { id: 52, name: "Cook Islands", dialCode: 682, code: "CK" },
  { id: 53, name: "Costa Rica", dialCode: 506, code: "CR" },
  { id: 54, name: "Cote D'Ivoire (Ivory Coast)", dialCode: 225, code: "CI" },
  { id: 55, name: "Croatia", dialCode: 385, code: "HR" },
  { id: 56, name: "Cuba", dialCode: 53, code: "CU" },
  { id: 57, name: "Cyprus", dialCode: 357, code: "CY" },
  { id: 58, name: "Czech Republic", dialCode: 420, code: "CZ" },
  { id: 59, name: "Denmark", dialCode: 45, code: "DK" },
  { id: 60, name: "Djibouti", dialCode: 253, code: "DJ" },
  { id: 61, name: "Dominica", dialCode: 1767, code: "DM" },
  { id: 62, name: "Dominican Republic", dialCode: 1809, code: "DO" },
  { id: 63, name: "East Timor", dialCode: 670, code: "TL" },
  { id: 64, name: "Ecuador", dialCode: 593, code: "EC" },
  { id: 65, name: "Egypt", dialCode: 20, code: "EG" },
  { id: 66, name: "El Salvador", dialCode: 503, code: "SV" },
  { id: 67, name: "Equatorial Guinea", dialCode: 240, code: "GQ" },
  { id: 68, name: "Eritrea", dialCode: 291, code: "ER" },
  { id: 69, name: "Estonia", dialCode: 372, code: "EE" },
  { id: 70, name: "Ethiopia", dialCode: 251, code: "ET" },
  { id: 71, name: "Falkland Islands", dialCode: 500, code: "FK" },
  { id: 72, name: "Faroe Islands", dialCode: 298, code: "FO" },
  { id: 73, name: "Fiji Islands", dialCode: 679, code: "FJ" },
  { id: 74, name: "Finland", dialCode: 358, code: "FI" },
  { id: 75, name: "France", dialCode: 33, code: "FR" },
  { id: 76, name: "French Guiana", dialCode: 594, code: "GF" },
  { id: 77, name: "French Polynesia", dialCode: 689, code: "PF" },
  { id: 78, name: "French Southern Territories", dialCode: 262, code: "TF" },
  { id: 79, name: "Gabon", dialCode: 241, code: "GA" },
  { id: 80, name: "Gambia", dialCode: 220, code: "GM" },
  { id: 81, name: "Georgia", dialCode: 995, code: "GE" },
  { id: 82, name: "Germany", dialCode: 49, code: "DE" },
  { id: 83, name: "Ghana", dialCode: 233, code: "GH" },
  { id: 84, name: "Gibraltar", dialCode: 350, code: "GI" },
  { id: 85, name: "Greece", dialCode: 30, code: "GR" },
  { id: 86, name: "Greenland", dialCode: 299, code: "GL" },
  { id: 87, name: "Grenada", dialCode: 1473, code: "GD" },
  { id: 88, name: "Guadeloupe", dialCode: 590, code: "GP" },
  { id: 89, name: "Guam", dialCode: 1671, code: "GU" },
  { id: 90, name: "Guatemala", dialCode: 502, code: "GT" },
  { id: 91, name: "Guernsey and Alderney", dialCode: 44, code: "GG" },
  { id: 92, name: "Guinea", dialCode: 224, code: "GN" },
  { id: 93, name: "Guinea-Bissau", dialCode: 245, code: "GW" },
  { id: 94, name: "Guyana", dialCode: 592, code: "GY" },
  { id: 95, name: "Haiti", dialCode: 509, code: "HT" },
  { id: 96, name: "Heard Island and McDonald Islands", dialCode: 672, code: "HM" },
  { id: 97, name: "Honduras", dialCode: 504, code: "HN" },
  { id: 98, name: "Hong Kong S.A.R.", dialCode: 852, code: "HK" },
  { id: 99, name: "Hungary", dialCode: 36, code: "HU" },
  { id: 100, name: "Iceland", dialCode: 354, code: "IS" },
  { id: 101, name: "India", dialCode: 91, code: "IN" },
  { id: 102, name: "Indonesia", dialCode: 62, code: "ID" },
  { id: 103, name: "Iran", dialCode: 98, code: "IR" },
  { id: 104, name: "Iraq", dialCode: 964, code: "IQ" },
  { id: 105, name: "Ireland", dialCode: 353, code: "IE" },
  { id: 106, name: "Israel", dialCode: 972, code: "IL" },
  { id: 107, name: "Italy", dialCode: 39, code: "IT" },
  { id: 108, name: "Jamaica", dialCode: 1876, code: "JM" },
  { id: 109, name: "Japan", dialCode: 81, code: "JP" },
  { id: 110, name: "Jersey", dialCode: 44, code: "JE" },
  { id: 111, name: "Jordan", dialCode: 962, code: "JO" },
  { id: 112, name: "Kazakhstan", dialCode: 7, code: "KZ" },
  { id: 113, name: "Kenya", dialCode: 254, code: "KE" },
  { id: 114, name: "Kiribati", dialCode: 686, code: "KI" },
  { id: 115, name: "Kosovo", dialCode: 383, code: "XK" },
  { id: 116, name: "Kuwait", dialCode: 965, code: "KW" },
  { id: 117, name: "Kyrgyzstan", dialCode: 996, code: "KG" },
  { id: 118, name: "Laos", dialCode: 856, code: "LA" },
  { id: 119, name: "Latvia", dialCode: 371, code: "LV" },
  { id: 120, name: "Lebanon", dialCode: 961, code: "LB" },
  { id: 121, name: "Lesotho", dialCode: 266, code: "LS" },
  { id: 122, name: "Liberia", dialCode: 231, code: "LR" },
  { id: 123, name: "Libya", dialCode: 218, code: "LY" },
  { id: 124, name: "Liechtenstein", dialCode: 423, code: "LI" },
  { id: 125, name: "Lithuania", dialCode: 370, code: "LT" },
  { id: 126, name: "Luxembourg", dialCode: 352, code: "LU" },
  { id: 127, name: "Macau S.A.R.", dialCode: 853, code: "MO" },
  { id: 128, name: "Macedonia", dialCode: 389, code: "MK" },
  { id: 129, name: "Madagascar", dialCode: 261, code: "MG" },
  { id: 130, name: "Malawi", dialCode: 265, code: "MW" },
  { id: 131, name: "Malaysia", dialCode: 60, code: "MY" },
  { id: 132, name: "Maldives", dialCode: 960, code: "MV" },
  { id: 133, name: "Mali", dialCode: 223, code: "ML" },
  { id: 134, name: "Malta", dialCode: 356, code: "MT" },
  { id: 135, name: "Man (Isle of)", dialCode: 44, code: "IM" },
  { id: 136, name: "Marshall Islands", dialCode: 692, code: "MH" },
  { id: 137, name: "Martinique", dialCode: 596, code: "MQ" },
  { id: 138, name: "Mauritania", dialCode: 222, code: "MR" },
  { id: 139, name: "Mauritius", dialCode: 230, code: "MU" },
  { id: 140, name: "Mayotte", dialCode: 262, code: "YT" },
  { id: 141, name: "Mexico", dialCode: 52, code: "MX" },
  { id: 142, name: "Micronesia", dialCode: 691, code: "FM" },
  { id: 143, name: "Moldova", dialCode: 373, code: "MD" },
  { id: 144, name: "Monaco", dialCode: 377, code: "MC" },
  { id: 145, name: "Mongolia", dialCode: 976, code: "MN" },
  { id: 146, name: "Montenegro", dialCode: 382, code: "ME" },
  { id: 147, name: "Montserrat", dialCode: 1664, code: "MS" },
  { id: 148, name: "Morocco", dialCode: 212, code: "MA" },
  { id: 149, name: "Mozambique", dialCode: 258, code: "MZ" },
  { id: 150, name: "Myanmar", dialCode: 95, code: "MM" },
  { id: 151, name: "Namibia", dialCode: 264, code: "NA" },
  { id: 152, name: "Nauru", dialCode: 674, code: "NR" },
  { id: 153, name: "Nepal", dialCode: 977, code: "NP" },
  { id: 154, name: "Netherlands", dialCode: 31, code: "NL" },
  { id: 155, name: "Netherlands Antilles", dialCode: 599, code: "AN" },
  { id: 156, name: "New Caledonia", dialCode: 687, code: "NC" },
  { id: 157, name: "New Zealand", dialCode: 64, code: "NZ" },
  { id: 158, name: "Nicaragua", dialCode: 505, code: "NI" },
  { id: 159, name: "Niger", dialCode: 227, code: "NE" },
  { id: 160, name: "Nigeria", dialCode: 234, code: "NG" },
  { id: 161, name: "Niue", dialCode: 683, code: "NU" },
  { id: 162, name: "Norfolk Island", dialCode: 672, code: "NF" },
  { id: 163, name: "North Korea", dialCode: 850, code: "KP" },
  { id: 164, name: "Northern Mariana Islands", dialCode: 1670, code: "MP" },
  { id: 165, name: "Norway", dialCode: 47, code: "NO" },
  { id: 166, name: "Oman", dialCode: 968, code: "OM" },
  { id: 167, name: "Pakistan", dialCode: 92, code: "PK" },
  { id: 168, name: "Palau", dialCode: 680, code: "PW" },
  { id: 169, name: "Palestinian Territory Occupied", dialCode: 970, code: "PS" },
  { id: 170, name: "Panama", dialCode: 507, code: "PA" },
  { id: 171, name: "Papua New Guinea", dialCode: 675, code: "PG" },
  { id: 172, name: "Paraguay", dialCode: 595, code: "PY" },
  { id: 173, name: "Peru", dialCode: 51, code: "PE" },
  { id: 174, name: "Philippines", dialCode: 63, code: "PH" },
  { id: 175, name: "Pitcairn Island", dialCode: 870, code: "PN" },
  { id: 176, name: "Poland", dialCode: 48, code: "PL" },
  { id: 177, name: "Portugal", dialCode: 351, code: "PT" },
  { id: 178, name: "Puerto Rico", dialCode: 1787, code: "PR" },
  { id: 179, name: "Qatar", dialCode: 974, code: "QA" },
  { id: 180, name: "Reunion", dialCode: 262, code: "RE" },
  { id: 181, name: "Romania", dialCode: 40, code: "RO" },
  { id: 182, name: "Russia", dialCode: 7, code: "RU" },
  { id: 183, name: "Rwanda", dialCode: 250, code: "RW" },
  { id: 184, name: "Saint Helena", dialCode: 290, code: "SH" },
  { id: 185, name: "Saint Kitts And Nevis", dialCode: 1869, code: "KN" },
  { id: 186, name: "Saint Lucia", dialCode: 1758, code: "LC" },
  { id: 187, name: "Saint Pierre and Miquelon", dialCode: 508, code: "PM" },
  { id: 188, name: "Saint Vincent And The Grenadines", dialCode: 1784, code: "VC" },
  { id: 189, name: "Saint-Barthelemy", dialCode: 590, code: "BL" },
  { id: 190, name: "Saint-Martin (French part)", dialCode: 590, code: "MF" },
  { id: 191, name: "Samoa", dialCode: 685, code: "WS" },
  { id: 192, name: "San Marino", dialCode: 378, code: "SM" },
  { id: 193, name: "Sao Tome and Principe", dialCode: 239, code: "ST" },
  { id: 194, name: "Saudi Arabia", dialCode: 966, code: "SA" },
  { id: 195, name: "Senegal", dialCode: 221, code: "SN" },
  { id: 196, name: "Serbia", dialCode: 381, code: "RS" },
  { id: 197, name: "Seychelles", dialCode: 248, code: "SC" },
  { id: 198, name: "Sierra Leone", dialCode: 232, code: "SL" },
  { id: 199, name: "Singapore", dialCode: 65, code: "SG" },
  { id: 200, name: "Slovakia", dialCode: 421, code: "SK" },
  { id: 201, name: "Slovenia", dialCode: 386, code: "SI" },
  { id: 202, name: "Solomon Islands", dialCode: 677, code: "SB" },
  { id: 203, name: "Somalia", dialCode: 252, code: "SO" },
  { id: 204, name: "South Africa", dialCode: 27, code: "ZA" },
  { id: 205, name: "South Georgia", dialCode: 500, code: "GS" },
  { id: 206, name: "South Sudan", dialCode: 211, code: "SS" },
  { id: 207, name: "Spain", dialCode: 34, code: "ES" },
  { id: 208, name: "Sri Lanka", dialCode: 94, code: "LK" },
  { id: 209, name: "Sudan", dialCode: 249, code: "SD" },
  { id: 210, name: "Suriname", dialCode: 597, code: "SR" },
  { id: 211, name: "Svalbard And Jan Mayen Islands", dialCode: 47, code: "SJ" },
  { id: 212, name: "Swaziland", dialCode: 268, code: "SZ" },
  { id: 213, name: "Sweden", dialCode: 46, code: "SE" },
  { id: 214, name: "Switzerland", dialCode: 41, code: "CH" },
  { id: 215, name: "Syria", dialCode: 963, code: "SY" },
  { id: 216, name: "Taiwan", dialCode: 886, code: "TW" },
  { id: 217, name: "Tajikistan", dialCode: 992, code: "TJ" },
  { id: 218, name: "Tanzania", dialCode: 255, code: "TZ" },
  { id: 219, name: "Thailand", dialCode: 66, code: "TH" },
  { id: 220, name: "Togo", dialCode: 228, code: "TG" },
  { id: 221, name: "Tokelau", dialCode: 690, code: "TK" },
  { id: 222, name: "Tonga", dialCode: 676, code: "TO" },
  { id: 223, name: "Trinidad And Tobago", dialCode: 1868, code: "TT" },
  { id: 224, name: "Tunisia", dialCode: 216, code: "TN" },
  { id: 225, name: "Turkey", dialCode: 90, code: "TR" },
  { id: 226, name: "Turkmenistan", dialCode: 993, code: "TM" },
  { id: 227, name: "Turks And Caicos Islands", dialCode: 1649, code: "TC" },
  { id: 228, name: "Tuvalu", dialCode: 688, code: "TV" },
  { id: 229, name: "Uganda", dialCode: 256, code: "UG" },
  { id: 230, name: "Ukraine", dialCode: 380, code: "UA" },
  { id: 231, name: "United Arab Emirates", dialCode: 971, code: "AE" },
  { id: 232, name: "United Kingdom", dialCode: 44, code: "GB" },
  { id: 233, name: "United States", dialCode: 1, code: "US" },
  { id: 234, name: "United States Minor Outlying Islands", dialCode: 1, code: "UM" },
  { id: 235, name: "Uruguay", dialCode: 598, code: "UY" },
  { id: 236, name: "Uzbekistan", dialCode: 998, code: "UZ" },
  { id: 237, name: "Vanuatu", dialCode: 678, code: "VU" },
  { id: 238, name: "Vatican City State (Holy See)", dialCode: 379, code: "VA" },
  { id: 239, name: "Venezuela", dialCode: 58, code: "VE" },
  { id: 240, name: "Vietnam", dialCode: 84, code: "VN" },
  { id: 241, name: "Virgin Islands (British)", dialCode: 1284, code: "VG" },
  { id: 242, name: "Virgin Islands (US)", dialCode: 1340, code: "VI" },
  { id: 243, name: "Wallis And Futuna Islands", dialCode: 681, code: "WF" },
  { id: 244, name: "Western Sahara", dialCode: 212, code: "EH" },
  { id: 245, name: "Yemen", dialCode: 967, code: "YE" },
  { id: 246, name: "Zambia", dialCode: 260, code: "ZM" },
  { id: 247, name: "Zimbabwe", dialCode: 263, code: "ZW" },
];

// ---------------------------------------------------------------------------
// STATES — All Nigerian states (countryId 160) + key African/global countries
// ---------------------------------------------------------------------------
const STATES = [
  // Nigeria (countryId: 160) — all 36 states + FCT
  { id: 303, countryId: 160, name: "Abia" },
  { id: 304, countryId: 160, name: "Adamawa" },
  { id: 305, countryId: 160, name: "Akwa Ibom" },
  { id: 306, countryId: 160, name: "Anambra" },
  { id: 307, countryId: 160, name: "Bauchi" },
  { id: 308, countryId: 160, name: "Bayelsa" },
  { id: 309, countryId: 160, name: "Benue" },
  { id: 310, countryId: 160, name: "Borno" },
  { id: 311, countryId: 160, name: "Cross River" },
  { id: 312, countryId: 160, name: "Delta" },
  { id: 313, countryId: 160, name: "Ebonyi" },
  { id: 314, countryId: 160, name: "Edo" },
  { id: 315, countryId: 160, name: "Ekiti" },
  { id: 316, countryId: 160, name: "Enugu" },
  { id: 317, countryId: 160, name: "Federal Capital Territory" },
  { id: 318, countryId: 160, name: "Gombe" },
  { id: 319, countryId: 160, name: "Imo" },
  { id: 320, countryId: 160, name: "Jigawa" },
  { id: 321, countryId: 160, name: "Kaduna" },
  { id: 322, countryId: 160, name: "Kano" },
  { id: 323, countryId: 160, name: "Katsina" },
  { id: 324, countryId: 160, name: "Kebbi" },
  { id: 325, countryId: 160, name: "Kogi" },
  { id: 326, countryId: 160, name: "Kwara" },
  { id: 327, countryId: 160, name: "Lagos" },
  { id: 328, countryId: 160, name: "Nasarawa" },
  { id: 329, countryId: 160, name: "Niger" },
  { id: 330, countryId: 160, name: "Ogun" },
  { id: 331, countryId: 160, name: "Ondo" },
  { id: 332, countryId: 160, name: "Osun" },
  { id: 333, countryId: 160, name: "Oyo" },
  { id: 334, countryId: 160, name: "Plateau" },
  { id: 335, countryId: 160, name: "Rivers" },
  { id: 336, countryId: 160, name: "Sokoto" },
  { id: 337, countryId: 160, name: "Taraba" },
  { id: 338, countryId: 160, name: "Yobe" },
  { id: 339, countryId: 160, name: "Zamfara" },

  // Ghana (countryId: 83)
  { id: 1330, countryId: 83, name: "Ashanti" },
  { id: 1331, countryId: 83, name: "Brong-Ahafo" },
  { id: 1332, countryId: 83, name: "Central" },
  { id: 1333, countryId: 83, name: "Eastern" },
  { id: 1334, countryId: 83, name: "Greater Accra" },
  { id: 1335, countryId: 83, name: "Northern" },
  { id: 1336, countryId: 83, name: "Upper East" },
  { id: 1337, countryId: 83, name: "Upper West" },
  { id: 1338, countryId: 83, name: "Volta" },
  { id: 1339, countryId: 83, name: "Western" },

  // Kenya (countryId: 113)
  { id: 1562, countryId: 113, name: "Nairobi" },
  { id: 1563, countryId: 113, name: "Mombasa" },
  { id: 1564, countryId: 113, name: "Kisumu" },
  { id: 1565, countryId: 113, name: "Nakuru" },
  { id: 1566, countryId: 113, name: "Eldoret" },
  { id: 1567, countryId: 113, name: "Central" },
  { id: 1568, countryId: 113, name: "Coast" },
  { id: 1569, countryId: 113, name: "Eastern" },
  { id: 1570, countryId: 113, name: "North Eastern" },
  { id: 1571, countryId: 113, name: "Nyanza" },
  { id: 1572, countryId: 113, name: "Rift Valley" },
  { id: 1573, countryId: 113, name: "Western" },

  // South Africa (countryId: 204)
  { id: 2993, countryId: 204, name: "Eastern Cape" },
  { id: 2994, countryId: 204, name: "Free State" },
  { id: 2995, countryId: 204, name: "Gauteng" },
  { id: 2996, countryId: 204, name: "KwaZulu-Natal" },
  { id: 2997, countryId: 204, name: "Limpopo" },
  { id: 2998, countryId: 204, name: "Mpumalanga" },
  { id: 2999, countryId: 204, name: "Northern Cape" },
  { id: 3000, countryId: 204, name: "North West" },
  { id: 3001, countryId: 204, name: "Western Cape" },

  // United Kingdom (countryId: 232)
  { id: 3741, countryId: 232, name: "England" },
  { id: 3742, countryId: 232, name: "Northern Ireland" },
  { id: 3743, countryId: 232, name: "Scotland" },
  { id: 3744, countryId: 232, name: "Wales" },

  // United States (countryId: 233)
  { id: 1416, countryId: 233, name: "Alabama" },
  { id: 1417, countryId: 233, name: "Alaska" },
  { id: 1418, countryId: 233, name: "Arizona" },
  { id: 1419, countryId: 233, name: "Arkansas" },
  { id: 1420, countryId: 233, name: "California" },
  { id: 1421, countryId: 233, name: "Colorado" },
  { id: 1422, countryId: 233, name: "Connecticut" },
  { id: 1423, countryId: 233, name: "Delaware" },
  { id: 1424, countryId: 233, name: "Florida" },
  { id: 1425, countryId: 233, name: "Georgia" },
  { id: 1426, countryId: 233, name: "Hawaii" },
  { id: 1427, countryId: 233, name: "Idaho" },
  { id: 1428, countryId: 233, name: "Illinois" },
  { id: 1429, countryId: 233, name: "Indiana" },
  { id: 1430, countryId: 233, name: "Iowa" },
  { id: 1431, countryId: 233, name: "Kansas" },
  { id: 1432, countryId: 233, name: "Kentucky" },
  { id: 1433, countryId: 233, name: "Louisiana" },
  { id: 1434, countryId: 233, name: "Maine" },
  { id: 1435, countryId: 233, name: "Maryland" },
  { id: 1436, countryId: 233, name: "Massachusetts" },
  { id: 1437, countryId: 233, name: "Michigan" },
  { id: 1438, countryId: 233, name: "Minnesota" },
  { id: 1439, countryId: 233, name: "Mississippi" },
  { id: 1440, countryId: 233, name: "Missouri" },
  { id: 1441, countryId: 233, name: "Montana" },
  { id: 1442, countryId: 233, name: "Nebraska" },
  { id: 1443, countryId: 233, name: "Nevada" },
  { id: 1444, countryId: 233, name: "New Hampshire" },
  { id: 1445, countryId: 233, name: "New Jersey" },
  { id: 1446, countryId: 233, name: "New Mexico" },
  { id: 1447, countryId: 233, name: "New York" },
  { id: 1448, countryId: 233, name: "North Carolina" },
  { id: 1449, countryId: 233, name: "North Dakota" },
  { id: 1450, countryId: 233, name: "Ohio" },
  { id: 1451, countryId: 233, name: "Oklahoma" },
  { id: 1452, countryId: 233, name: "Oregon" },
  { id: 1453, countryId: 233, name: "Pennsylvania" },
  { id: 1454, countryId: 233, name: "Rhode Island" },
  { id: 1455, countryId: 233, name: "South Carolina" },
  { id: 1456, countryId: 233, name: "South Dakota" },
  { id: 1457, countryId: 233, name: "Tennessee" },
  { id: 1458, countryId: 233, name: "Texas" },
  { id: 1459, countryId: 233, name: "Utah" },
  { id: 1460, countryId: 233, name: "Vermont" },
  { id: 1461, countryId: 233, name: "Virginia" },
  { id: 1462, countryId: 233, name: "Washington" },
  { id: 1463, countryId: 233, name: "West Virginia" },
  { id: 1464, countryId: 233, name: "Wisconsin" },
  { id: 1465, countryId: 233, name: "Wyoming" },

  // Canada (countryId: 39)
  { id: 870, countryId: 39, name: "Alberta" },
  { id: 871, countryId: 39, name: "British Columbia" },
  { id: 872, countryId: 39, name: "Manitoba" },
  { id: 873, countryId: 39, name: "New Brunswick" },
  { id: 874, countryId: 39, name: "Newfoundland and Labrador" },
  { id: 875, countryId: 39, name: "Northwest Territories" },
  { id: 876, countryId: 39, name: "Nova Scotia" },
  { id: 877, countryId: 39, name: "Nunavut" },
  { id: 878, countryId: 39, name: "Ontario" },
  { id: 879, countryId: 39, name: "Prince Edward Island" },
  { id: 880, countryId: 39, name: "Quebec" },
  { id: 881, countryId: 39, name: "Saskatchewan" },
  { id: 882, countryId: 39, name: "Yukon" },

  // Tanzania (countryId: 218)
  { id: 3225, countryId: 218, name: "Dar es Salaam" },
  { id: 3226, countryId: 218, name: "Dodoma" },
  { id: 3227, countryId: 218, name: "Arusha" },
  { id: 3228, countryId: 218, name: "Mwanza" },
  { id: 3229, countryId: 218, name: "Zanzibar" },

  // Uganda (countryId: 229)
  { id: 3500, countryId: 229, name: "Central Region" },
  { id: 3501, countryId: 229, name: "Eastern Region" },
  { id: 3502, countryId: 229, name: "Northern Region" },
  { id: 3503, countryId: 229, name: "Western Region" },

  // Ethiopia (countryId: 70)
  { id: 1177, countryId: 70, name: "Addis Ababa" },
  { id: 1178, countryId: 70, name: "Amhara" },
  { id: 1179, countryId: 70, name: "Oromia" },
  { id: 1180, countryId: 70, name: "Tigray" },
  { id: 1181, countryId: 70, name: "SNNPRS" },

  // UAE (countryId: 231)
  { id: 3720, countryId: 231, name: "Abu Dhabi" },
  { id: 3721, countryId: 231, name: "Ajman" },
  { id: 3722, countryId: 231, name: "Dubai" },
  { id: 3723, countryId: 231, name: "Fujairah" },
  { id: 3724, countryId: 231, name: "Ras Al Khaimah" },
  { id: 3725, countryId: 231, name: "Sharjah" },
  { id: 3726, countryId: 231, name: "Umm Al Quwain" },

  // Cameroon (countryId: 38)
  { id: 851, countryId: 38, name: "Adamawa" },
  { id: 852, countryId: 38, name: "Centre" },
  { id: 853, countryId: 38, name: "East" },
  { id: 854, countryId: 38, name: "Far North" },
  { id: 855, countryId: 38, name: "Littoral" },
  { id: 856, countryId: 38, name: "North" },
  { id: 857, countryId: 38, name: "North West" },
  { id: 858, countryId: 38, name: "South" },
  { id: 859, countryId: 38, name: "South West" },
  { id: 860, countryId: 38, name: "West" },

  // Togo (countryId: 220)
  { id: 3400, countryId: 220, name: "Centrale" },
  { id: 3401, countryId: 220, name: "Kara" },
  { id: 3402, countryId: 220, name: "Maritime" },
  { id: 3403, countryId: 220, name: "Plateaux" },
  { id: 3404, countryId: 220, name: "Savanes" },

  // Senegal (countryId: 195)
  { id: 3100, countryId: 195, name: "Dakar" },
  { id: 3101, countryId: 195, name: "Diourbel" },
  { id: 3102, countryId: 195, name: "Fatick" },
  { id: 3103, countryId: 195, name: "Ziguinchor" },
];

// ---------------------------------------------------------------------------
// CITIES — All Nigerian LGA/cities + key global cities
// ---------------------------------------------------------------------------
const CITIES = [
  // Lagos State (stateId: 327)
  { id: 75001, name: "Lagos Island", stateId: 327 },
  { id: 75002, name: "Ikeja", stateId: 327 },
  { id: 75003, name: "Apapa", stateId: 327 },
  { id: 75004, name: "Surulere", stateId: 327 },
  { id: 75005, name: "Victoria Island", stateId: 327 },
  { id: 75006, name: "Lekki", stateId: 327 },
  { id: 75007, name: "Ajah", stateId: 327 },
  { id: 75008, name: "Ikorodu", stateId: 327 },
  { id: 75009, name: "Epe", stateId: 327 },
  { id: 75010, name: "Badagry", stateId: 327 },
  { id: 75011, name: "Mushin", stateId: 327 },
  { id: 75012, name: "Oshodi", stateId: 327 },
  { id: 75013, name: "Yaba", stateId: 327 },
  { id: 75014, name: "Ibeju-Lekki", stateId: 327 },
  { id: 75015, name: "Agboville", stateId: 327 },
  { id: 75016, name: "Alimosho", stateId: 327 },
  { id: 75017, name: "Ajeromi-Ifelodun", stateId: 327 },
  { id: 75018, name: "Kosofe", stateId: 327 },
  { id: 75019, name: "Ojo", stateId: 327 },
  { id: 75020, name: "Agege", stateId: 327 },

  // Federal Capital Territory (stateId: 317)
  { id: 74001, name: "Abuja", stateId: 317 },
  { id: 74002, name: "Gwagwalada", stateId: 317 },
  { id: 74003, name: "Kuje", stateId: 317 },
  { id: 74004, name: "Abaji", stateId: 317 },
  { id: 74005, name: "Bwari", stateId: 317 },
  { id: 74006, name: "Kwali", stateId: 317 },

  // Kano State (stateId: 322)
  { id: 72001, name: "Kano", stateId: 322 },
  { id: 72002, name: "Gwarzo", stateId: 322 },
  { id: 72003, name: "Kiru", stateId: 322 },
  { id: 72004, name: "Dawakin Tofa", stateId: 322 },
  { id: 72005, name: "Ungogo", stateId: 322 },
  { id: 72006, name: "Kibiya", stateId: 322 },
  { id: 72007, name: "Makoda", stateId: 322 },
  { id: 72008, name: "Gezawa", stateId: 322 },
  { id: 72009, name: "Tarauni", stateId: 322 },
  { id: 72010, name: "Fagge", stateId: 322 },

  // Rivers State (stateId: 335)
  { id: 73001, name: "Port Harcourt", stateId: 335 },
  { id: 73002, name: "Obio-Akpor", stateId: 335 },
  { id: 73003, name: "Ikwerre", stateId: 335 },
  { id: 73004, name: "Eleme", stateId: 335 },
  { id: 73005, name: "Tai", stateId: 335 },
  { id: 73006, name: "Gokana", stateId: 335 },
  { id: 73007, name: "Khana", stateId: 335 },
  { id: 73008, name: "Oyigbo", stateId: 335 },
  { id: 73009, name: "Omuma", stateId: 335 },

  // Oyo State (stateId: 333)
  { id: 71001, name: "Ibadan North", stateId: 333 },
  { id: 71002, name: "Ibadan South", stateId: 333 },
  { id: 71003, name: "Ogbomosho", stateId: 333 },
  { id: 71004, name: "Oyo", stateId: 333 },
  { id: 71005, name: "Iseyin", stateId: 333 },
  { id: 71006, name: "Saki", stateId: 333 },

  // Kaduna State (stateId: 321)
  { id: 70001, name: "Kaduna North", stateId: 321 },
  { id: 70002, name: "Kaduna South", stateId: 321 },
  { id: 70003, name: "Zaria", stateId: 321 },
  { id: 70004, name: "Kafanchan", stateId: 321 },
  { id: 70005, name: "Kajuru", stateId: 321 },
  { id: 70006, name: "Ikara", stateId: 321 },

  // Anambra State (stateId: 306)
  { id: 76001, name: "Onitsha", stateId: 306 },
  { id: 76002, name: "Awka", stateId: 306 },
  { id: 76003, name: "Nnewi", stateId: 306 },
  { id: 76004, name: "Ekwusigo", stateId: 306 },
  { id: 76005, name: "Idemili North", stateId: 306 },

  // Enugu State (stateId: 316)
  { id: 77001, name: "Enugu", stateId: 316 },
  { id: 77002, name: "Nsukka", stateId: 316 },
  { id: 77003, name: "Agbani", stateId: 316 },
  { id: 77004, name: "Oji River", stateId: 316 },

  // Edo State (stateId: 314)
  { id: 78001, name: "Benin City", stateId: 314 },
  { id: 78002, name: "Ekpoma", stateId: 314 },
  { id: 78003, name: "Auchi", stateId: 314 },
  { id: 78004, name: "Uromi", stateId: 314 },

  // Delta State (stateId: 312)
  { id: 79001, name: "Asaba", stateId: 312 },
  { id: 79002, name: "Warri", stateId: 312 },
  { id: 79003, name: "Sapele", stateId: 312 },
  { id: 79004, name: "Ughelli", stateId: 312 },

  // Imo State (stateId: 319)
  { id: 80001, name: "Owerri", stateId: 319 },
  { id: 80002, name: "Orlu", stateId: 319 },
  { id: 80003, name: "Okigwe", stateId: 319 },
  { id: 80004, name: "Mbaitoli", stateId: 319 },

  // Abia State (stateId: 303)
  { id: 81001, name: "Aba", stateId: 303 },
  { id: 81002, name: "Umuahia", stateId: 303 },
  { id: 81003, name: "Arochukwu", stateId: 303 },

  // Cross River (stateId: 311)
  { id: 82001, name: "Calabar", stateId: 311 },
  { id: 82002, name: "Ogoja", stateId: 311 },
  { id: 82003, name: "Ikom", stateId: 311 },

  // Akwa Ibom (stateId: 305)
  { id: 83001, name: "Uyo", stateId: 305 },
  { id: 83002, name: "Eket", stateId: 305 },
  { id: 83003, name: "Ikot Ekpene", stateId: 305 },

  // Bayelsa (stateId: 308)
  { id: 84001, name: "Yenagoa", stateId: 308 },
  { id: 84002, name: "Brass", stateId: 308 },

  // Borno (stateId: 310)
  { id: 85001, name: "Maiduguri", stateId: 310 },
  { id: 85002, name: "Biu", stateId: 310 },
  { id: 85003, name: "Gwoza", stateId: 310 },

  // Adamawa (stateId: 304)
  { id: 86001, name: "Yola", stateId: 304 },
  { id: 86002, name: "Mubi", stateId: 304 },
  { id: 86003, name: "Numan", stateId: 304 },

  // Sokoto (stateId: 336)
  { id: 87001, name: "Sokoto", stateId: 336 },
  { id: 87002, name: "Birnin Kebbi", stateId: 336 },
  { id: 87003, name: "Tambuwal", stateId: 336 },

  // Kebbi (stateId: 324)
  { id: 88001, name: "Birnin Kebbi", stateId: 324 },
  { id: 88002, name: "Argungu", stateId: 324 },

  // Zamfara (stateId: 339)
  { id: 89001, name: "Gusau", stateId: 339 },
  { id: 89002, name: "Kaura Namoda", stateId: 339 },

  // Katsina (stateId: 323)
  { id: 90001, name: "Katsina", stateId: 323 },
  { id: 90002, name: "Daura", stateId: 323 },
  { id: 90003, name: "Funtua", stateId: 323 },

  // Jigawa (stateId: 320)
  { id: 91001, name: "Dutse", stateId: 320 },
  { id: 91002, name: "Hadejia", stateId: 320 },

  // Bauchi (stateId: 307)
  { id: 92001, name: "Bauchi", stateId: 307 },
  { id: 92002, name: "Azare", stateId: 307 },
  { id: 92003, name: "Misau", stateId: 307 },

  // Gombe (stateId: 318)
  { id: 93001, name: "Gombe", stateId: 318 },
  { id: 93002, name: "Kaltungo", stateId: 318 },

  // Yobe (stateId: 338)
  { id: 94001, name: "Damaturu", stateId: 338 },
  { id: 94002, name: "Potiskum", stateId: 338 },

  // Taraba (stateId: 337)
  { id: 95001, name: "Jalingo", stateId: 337 },
  { id: 95002, name: "Wukari", stateId: 337 },

  // Benue (stateId: 309)
  { id: 96001, name: "Makurdi", stateId: 309 },
  { id: 96002, name: "Gboko", stateId: 309 },
  { id: 96003, name: "Otukpo", stateId: 309 },

  // Plateau (stateId: 334)
  { id: 97001, name: "Jos", stateId: 334 },
  { id: 97002, name: "Shendam", stateId: 334 },
  { id: 97003, name: "Pankshin", stateId: 334 },

  // Nasarawa (stateId: 328)
  { id: 98001, name: "Lafia", stateId: 328 },
  { id: 98002, name: "Keffi", stateId: 328 },
  { id: 98003, name: "Akwanga", stateId: 328 },

  // Niger (stateId: 329)
  { id: 99001, name: "Minna", stateId: 329 },
  { id: 99002, name: "Suleja", stateId: 329 },
  { id: 99003, name: "Bida", stateId: 329 },

  // Kogi (stateId: 325)
  { id: 100001, name: "Lokoja", stateId: 325 },
  { id: 100002, name: "Okene", stateId: 325 },
  { id: 100003, name: "Idah", stateId: 325 },

  // Kwara (stateId: 326)
  { id: 101001, name: "Ilorin", stateId: 326 },
  { id: 101002, name: "Offa", stateId: 326 },
  { id: 101003, name: "Jebba", stateId: 326 },

  // Ogun (stateId: 330)
  { id: 102001, name: "Abeokuta", stateId: 330 },
  { id: 102002, name: "Sagamu", stateId: 330 },
  { id: 102003, name: "Ijebu-Ode", stateId: 330 },
  { id: 102004, name: "Ota", stateId: 330 },

  // Ondo (stateId: 331)
  { id: 103001, name: "Akure", stateId: 331 },
  { id: 103002, name: "Ondo", stateId: 331 },
  { id: 103003, name: "Okitipupa", stateId: 331 },

  // Osun (stateId: 332)
  { id: 104001, name: "Osogbo", stateId: 332 },
  { id: 104002, name: "Ile-Ife", stateId: 332 },
  { id: 104003, name: "Ilesa", stateId: 332 },

  // Ekiti (stateId: 315)
  { id: 105001, name: "Ado-Ekiti", stateId: 315 },
  { id: 105002, name: "Ikere-Ekiti", stateId: 315 },

  // Ebonyi (stateId: 313)
  { id: 106001, name: "Abakaliki", stateId: 313 },
  { id: 106002, name: "Onueke", stateId: 313 },

  // Ghana cities (Greater Accra — stateId: 1334)
  { id: 200001, name: "Accra", stateId: 1334 },
  { id: 200002, name: "Tema", stateId: 1334 },
  // Ashanti — stateId: 1330
  { id: 200003, name: "Kumasi", stateId: 1330 },

  // Kenya cities (Nairobi — stateId: 1562)
  { id: 201001, name: "Nairobi", stateId: 1562 },
  // Mombasa — stateId: 1563
  { id: 201002, name: "Mombasa", stateId: 1563 },
  // Kisumu — stateId: 1564
  { id: 201003, name: "Kisumu", stateId: 1564 },

  // South Africa cities (Gauteng — stateId: 2995)
  { id: 202001, name: "Johannesburg", stateId: 2995 },
  { id: 202002, name: "Pretoria", stateId: 2995 },
  // Western Cape — stateId: 3001
  { id: 202003, name: "Cape Town", stateId: 3001 },
  // KwaZulu-Natal — stateId: 2996
  { id: 202004, name: "Durban", stateId: 2996 },

  // UK cities (England — stateId: 3741)
  { id: 203001, name: "London", stateId: 3741 },
  { id: 203002, name: "Manchester", stateId: 3741 },
  { id: 203003, name: "Birmingham", stateId: 3741 },
  // Scotland — stateId: 3743
  { id: 203004, name: "Glasgow", stateId: 3743 },
  { id: 203005, name: "Edinburgh", stateId: 3743 },

  // US cities (New York — stateId: 1447)
  { id: 204001, name: "New York City", stateId: 1447 },
  // California — stateId: 1420
  { id: 204002, name: "Los Angeles", stateId: 1420 },
  { id: 204003, name: "San Francisco", stateId: 1420 },
  // Texas — stateId: 1458
  { id: 204004, name: "Houston", stateId: 1458 },
  { id: 204005, name: "Dallas", stateId: 1458 },

  // UAE cities (Dubai — stateId: 3722)
  { id: 205001, name: "Dubai", stateId: 3722 },
  // Abu Dhabi — stateId: 3720
  { id: 205002, name: "Abu Dhabi", stateId: 3720 },
];

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌍 Seeding geo tables...\n");

  // Check existing counts
  const [existingCountries, existingStates, existingCities] = await Promise.all([
    prisma.country.count(),
    prisma.state.count(),
    prisma.city.count(),
  ]);

  console.log(`Existing: countries=${existingCountries} states=${existingStates} cities=${existingCities}`);

  // --- Countries ---
  if (existingCountries === 0) {
    console.log(`Inserting ${COUNTRIES.length} countries...`);
    await prisma.country.createMany({ data: COUNTRIES, skipDuplicates: true });
    console.log(`✅ Countries seeded: ${COUNTRIES.length}`);
  } else {
    console.log(`⏭  Countries already seeded (${existingCountries}), upserting any missing...`);
    let added = 0;
    for (const c of COUNTRIES) {
      const exists = await prisma.country.findUnique({ where: { id: c.id } });
      if (!exists) {
        await prisma.country.create({ data: c });
        added++;
      }
    }
    if (added > 0) console.log(`✅ Added ${added} missing countries`);
    else console.log("✅ All countries present");
  }

  // --- States ---
  if (existingStates === 0) {
    console.log(`Inserting ${STATES.length} states...`);
    await prisma.state.createMany({ data: STATES, skipDuplicates: true });
    console.log(`✅ States seeded: ${STATES.length}`);
  } else {
    console.log(`⏭  States already seeded (${existingStates}), upserting any missing...`);
    let added = 0;
    for (const s of STATES) {
      const exists = await prisma.state.findUnique({ where: { id: s.id } });
      if (!exists) {
        await prisma.state.create({ data: s });
        added++;
      }
    }
    if (added > 0) console.log(`✅ Added ${added} missing states`);
    else console.log("✅ All states present");
  }

  // --- Cities ---
  if (existingCities === 0) {
    console.log(`Inserting ${CITIES.length} cities...`);
    await prisma.city.createMany({ data: CITIES, skipDuplicates: true });
    console.log(`✅ Cities seeded: ${CITIES.length}`);
  } else {
    console.log(`⏭  Cities already seeded (${existingCities}), upserting any missing...`);
    let added = 0;
    for (const c of CITIES) {
      const exists = await prisma.city.findUnique({ where: { id: c.id } });
      if (!exists) {
        await prisma.city.create({ data: c });
        added++;
      }
    }
    if (added > 0) console.log(`✅ Added ${added} missing cities`);
    else console.log("✅ All cities present");
  }

  // Final counts
  const [finalCountries, finalStates, finalCities] = await Promise.all([
    prisma.country.count(),
    prisma.state.count(),
    prisma.city.count(),
  ]);

  console.log(`\n✅ Seeding complete:`);
  console.log(`   Countries: ${finalCountries}`);
  console.log(`   States:    ${finalStates}`);
  console.log(`   Cities:    ${finalCities}`);
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (err) => { console.error("❌ Seed failed:", err.message); await prisma.$disconnect(); process.exit(1); });
