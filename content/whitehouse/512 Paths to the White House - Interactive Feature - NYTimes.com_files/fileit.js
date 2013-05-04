 /*      
 $Id: fileit.js 7478 2008-12-23 19:39:35Z helckt $       
 (c) 2008 The New York Times Company        
 */


/**
 * The Times File feature is discontinued. These functions are only used to 
 * redirect the "SAVE" links to a marketing page that explains why Times File
 * is no longer supported.
 */

function articleSaveRedirect() {
	var timesFileUrl = "http://www.nytimes.com/marketing/timesfile/timesfile.html"; 
	document.location.href = timesFileUrl;
    return false;
}

/**
 *	furlItNoPop and dropDownToolsSave are function calls in the Article Tools and
 *  My Account Drop Downs respectively. We are assigning the articleSavedRedirect
 *  function to them. (This is like a Function Pointer in C++ or a Function Reference
 *  in Perl.)
 */
furlItNoPop = dropDownToolsSave = articleSaveRedirect;
