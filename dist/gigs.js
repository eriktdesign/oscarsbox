/**
 * gigs.js
 * Loads gigs.json and populates the Upcoming Shows list.
 */
document.addEventListener( 'DOMContentLoaded', function() {
	// Select the gigs list element
	var gigsList = document.querySelector( '.show-list' );
	if ( ! gigsList ) {
		return;
	}

	// Fetch the gigs data from gigs.json
	fetch( 'gigs.json?v=20251110' )
	.then( function( response ) {
		if ( ! response.ok ) {
			throw new Error( 'Network response was not ok.' );
		}
		return response.json();
	} )
	.then( function( gigs ) {
		// Get the current date minus 6 hours to filter past gigs
		var yesterday = new Date();
		yesterday.setHours( yesterday.getHours() - 6 ); // Assume we don't play more than 6 hours

		// Loop through each gig and create list items
		gigs.forEach( function( gig ) {
			// Create a list item for each gig
			var li = document.createElement( 'li' );
			
			// Set the ID and class for the list item
			li.id = getGigId( gig.date, gig.venue );
			li.classList.add( 'gig-item' );
			
			// If the gig is in the past, add a class
			if ( new Date( gig.date ) < yesterday ) {
				li.classList.add( 'past-gig' );
			}

			// Create the date span
			var dateSpan = document.createElement( 'span' );
			dateSpan.className = 'date';
			// Add poster link if poster property exists
			if ( gig.poster ) {
				var dateLink = document.createElement( 'a' );
				dateLink.href = gig.poster;
				dateLink.textContent = formatDate( gig.date );
				dateLink.classList.add( 'gig-poster-link' );
				dateSpan.appendChild( dateLink );
				li.classList.add( 'has-poster' );
			} else {
				dateSpan.textContent = formatDate( gig.date );
			}
			li.appendChild( dateSpan );

			// Create the time span
			var timeSpan = document.createElement( 'span' );
			timeSpan.className = 'time';
			timeSpan.textContent = formatTime( gig.date );
			li.appendChild( timeSpan );

			// Create the venue span
			var venueSpan = document.createElement( 'span' );
			venueSpan.className = 'venue';
			var venueLink = document.createElement( 'a' );
			venueLink.textContent = gig.venue.name;
			venueLink.target = '_blank';
			venueLink.title = 'Get directions';
			venueLink.href = getVenueMapLink( gig.venue );
			venueSpan.appendChild( venueLink );
			li.appendChild( venueSpan );

			// If the gig has a description, create the details span
			if ( gig.description ) {
				var detailsSpan = document.createElement( 'span' );
				detailsSpan.className = 'details';
				detailsSpan.textContent = gig.description;
				li.appendChild( detailsSpan );
			}

			// Append the list item to the gigs list
			gigsList.appendChild( li );
			
			// Add an event listener to show the lightbox if poster exists
			if ( gig.poster ) {
				li.addEventListener( 'click', function() {
					showGigLightbox( gig );
				} );
			}
		} );

		return gigs; // Return the gigs array for further processing
	} )
	.then( function( gigs ) {
		console.log( 'Gigs loaded successfully:', gigs );
		// Create MusicEvents schema for future gigs
		var futureGigs = gigs.filter( function( gig ) {
			return new Date( gig.date ) >= new Date();
		} );
		if ( futureGigs.length === 0 ) {
			console.warn( 'No future gigs found for schema generation.' );
			return;
		}
		// MusicGroup schema
		var musicGroupSchema = {
			"@context": "https://schema.org",
			"@type": "MusicGroup",
			"name": "Oscar's Box",
			"description": "Oscar's Box - Your favorite rock from the 70's, 80's, 90's and 2000's. Live music from Lancaster, Pennsylvania.",
			"genre": ["Rock", "Classic Rock", "Cover Band"],
			"url": "https://oscarsbox.com",
			"image": "https://oscarsbox.com/images/oscars-box-logo.webp",
			"member": [
				{ "@type": "Person", "name": "Greg Naylor", "role": "Guitar and Vocals" },
				{ "@type": "Person", "name": "Karl Boltz", "role": "Lead Guitar" },
				{ "@type": "Person", "name": "Tom Barnett", "role": "Drums" },
				{ "@type": "Person", "name": "Iggy Taylor", "role": "Keys" },
				{ "@type": "Person", "name": "Erik Teichmann", "role": "Bass" }
			]
		};

		var groupScript = document.createElement( 'script' );
		groupScript.type = 'application/ld+json';
		groupScript.textContent = JSON.stringify( musicGroupSchema, null, 2 );
		document.head.appendChild( groupScript );

		// MusicEvent schema
		var schemaScript = document.createElement( 'script' );
		schemaScript.type = 'application/ld+json';
		var events = futureGigs.map( function( gig ) {
			return {
				"@type": "MusicEvent",
				"name": "Oscar's Box at " + gig.venue.name,
				"startDate": gig.date,
				"location": {
					"@type": "Place",
					"name": gig.venue.name,
					"address": gig.venue.address || ''
				},
				"performer": {
					"@type": "MusicGroup",
					"name": "Oscar's Box"
				},
				"image": gig.poster || '',
				"description": gig.description || ''
			};
		} );
		var schemaData = {
			"@context": "https://schema.org",
			"@graph": events
		};
		schemaScript.textContent = JSON.stringify( schemaData, null, 2 );
		document.head.appendChild( schemaScript );
	} )
	.then( function() {
		// If there are any past gigs with .past-gig class, add a "show past gigs" button
		var pastGigs = document.querySelectorAll( '.past-gig' );
		if ( pastGigs.length > 0 ) {
			var showPastButton = document.createElement( 'a' );
			showPastButton.textContent = 'Show Past Gigs';
			showPastButton.className = 'show-past-gigs';
			showPastButton.href = '#';
			showPastButton.addEventListener( 'click', function(e) {
				e.preventDefault();
				pastGigs.forEach( function( gig ) {
					gig.classList.add( 'show' );
				} );
				showPastButton.style.display = 'none'; // Hide the button after clicking
			} );
			gigsList.parentElement.appendChild( showPastButton );
		}
	} )
	.then( function() {
		// If the page is loaded with a gig ID in the URL hash, show that gig's lightbox
		if ( window.location.hash ) {
			var gigId = window.location.hash.substring( 1 ); // Remove the #
			var gigItem = document.getElementById( gigId );
			if ( ! gigItem ) {
				console.warn( 'No gig found with ID:', gigId );
			} else if ( ! gigItem.classList.contains( 'has-poster' ) ) {
				console.warn( 'No poster for gig with ID:', gigId );
			} else {
				gigItem.click(); // Trigger the click event to show the lightbox
			}
		}
	} )
	.catch( function( error ) {
		console.error( 'Error loading gigs:', error );
	} );

	/**
	 * Get the gig ID
	 */
	function getGigId( dateStr, venue ) {
		// Slugify the venue name
		var venueSlug = venue.name
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
		
		// Get the date part from the date string
		var datePart = dateStr.split( 'T' )[0]; // e.g. "2025-12-25"

		// Return the unique ID combining venue slug and date part
		return venueSlug + '-' + datePart;
	}
	/**
	 * Format date as Day, Month Day, Year
	 */
	function formatDate( dateStr ) {
		var dateObj = new Date( dateStr );
		var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return dateObj.toLocaleDateString( 'en-US', options );
	}

	/**
	 * Format time as h:mm AM/PM
	 */
	function formatTime( dateStr ) {
		var dateObj = new Date( dateStr );
		var options = { 
			hour: 'numeric', 
			minute: '2-digit', 
			hour12: true,
			timeZone: 'America/New_York'
		};
		return dateObj.toLocaleTimeString( 'en-US', options );
	}

	/**
	 * Get Google Maps link for venue
	 */
	function getVenueMapLink( venue ) {
		var link = 'https://google.com/maps/search/?api=1';
		if ( ! venue.address && ! venue.name ) {
			link = '#'; // No address provided
		} else {
			link += '&query=' + encodeURIComponent( venue.address );
			link += '&query_place_id=' + encodeURIComponent( venue.name );
		}

		return link;
	}

	/**
	 * Show lightbox for gig details
	 *
	 * @param {HTMLElement} li The gig list item element.
	 */
	function showGigLightbox( gig ) {
		if ( ! gig || ! gig.poster ) {
			console.warn( 'No poster found for gig.' );
			return;
		}

		// Save the current page title
		var documentTitle = document.title;

		// Get the info for the title tag
		posterTitle = formatDate( gig.date ) + ', ' + formatTime( gig.date ) + ' @ ' + gig.venue.name;
		
		// Create lightbox content
		lightBoxContent = '<img src="' + gig.poster + '" alt="' + posterTitle + '" title="' + posterTitle + '" class="gig-poster">';

		// Set up the lightbox
		var lightboxInstance = basicLightbox.create( lightBoxContent, {
			onShow: function( instance ) {
				// Set the browser URL to the gig ID
				window.history.pushState( null, '', '#' + getGigId( gig.date, gig.venue ) );
				// Set the title tag for the lightbox
				document.title = 'Oscar\'s Box | ' + posterTitle;
			},
			onClose: function( instance ) {
				// Reset the URL when lightbox is closed
				window.history.pushState( null, '', window.location.pathname );
				// Reset the title tag
				document.title = documentTitle;
			}
		} );

		lightboxInstance.show();
	}
} );
