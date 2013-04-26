BrowseHappy Toolbar
===================

I thought redirecting too old or unrecognized browsers to [browsehappy.com](http://browsehappy.com) without any error message is not the proper way to handle this problem, so I created a validator with error messages and a toolbar.

**Why should I use it?**

I know that capability check is recommended instead of browser check, but I think browser check is a lot easier than write custom capability checker for every website. Generally I use a lot of external libraries, and I don't <del>care</del> know which technology they use. They mention in their documentation the browser support, instead of the list of applied technologies...

**Requirements**

You'll need the [BrowserDetect](http://www.quirksmode.org/js/detect.html) library, which I added to the vendor directory, because it does not have a git repo, or any other page you can download the raw js file from.

**Usage**

You have to add the script files to your html head and something like the following code to your html body:


    new BrowseHappy({
    	appendTo: document.body, //any dom element you want to use as container, default: document.body
    	icons: {
    		baseLocation: "images" //the location of the images, default: /images
    	},
    	schema: {
    		cookie: true, //check whether cookie is enabled
    		browser: {
    			Firefox: 4, //check wheter browser is Mozilla Firefox 4+
    			Chrome: 7,
    			Safari: 5,
    			Opera: 12,
    			Explorer: 10
    		}
    	},
    	mode: "toolbar", //which view will render the error messages, options: toolbar, link, redirect, default: toolbar
    	done: Your.Application.bootstrap //the callback function if the browser is valid, or the user skipped the message
    });

**Persistency**

When the browser is valid, or the user clicked on skip, it will be saved to a permanent cookie (browser=true) for 2 years. So after that the browser check will never run again until the cookie is in the browser.

You can check the existence of cookies on server side too, so when you get that cookie from the client, you can evaluate an alternative html template without browser check.

**Alternate browser detector**

You can use an alternative server pr client side tool for browser detection, the only thing you need is overriding the ***BrowserDetect*** global variable with the results of the browser identification. For example:

	{
		browser: "Firefox",
		version: 4
	}

If you want to use another syntax or browsers, you have to modify the code.

**Lincense**

[WTFPL](http://en.wikipedia.org/wiki/WTFPL)