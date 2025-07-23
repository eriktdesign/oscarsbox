/**
 * gigs.js
 * Loads gigs.json and populates the Upcoming Shows list.
 */

document.addEventListener( 'DOMContentLoaded', function() {
	var gigsList = document.querySelector( '.show-list' );
	if ( ! gigsList ) {
		return;
	}

	fetch( 'gigs.json' )
		.then( function( response ) {
			if ( ! response.ok ) {
				throw new Error( 'Network response was not ok.' );
			}
			return response.json();
		} )
		.then( function( gigs ) {
			var yesterday = new Date();
			yesterday.setHours( yesterday.getHours() - 6 ); // Assume we don't play more than 6 hours

			gigs.forEach( function( gig ) {
				var li = document.createElement( 'li' );
				li.id = getGigId( gig.date, gig.venue );
				li.classList.add( 'gig-item' );
				// If the gig is in the past, add a class
				if ( new Date( gig.date ) < yesterday ) {
					li.classList.add( 'past-gig' );
				}

				var dateSpan = document.createElement( 'span' );
				dateSpan.className = 'date';

				// Add poster link if poster property exists
				if ( gig.poster ) {
					var dateLink = document.createElement( 'a' );
					dateLink.href = gig.poster;
					dateLink.textContent = formatDate( gig.date );
					dateSpan.appendChild( dateLink );
				} else {
					dateSpan.textContent = formatDate( gig.date );
				}
				li.appendChild( dateSpan );

				var timeSpan = document.createElement( 'span' );
				timeSpan.className = 'time';
				timeSpan.textContent = formatTime( gig.date );
				li.appendChild( timeSpan );

				var venueSpan = document.createElement( 'span' );
				venueSpan.className = 'venue';
				var venueLink = document.createElement( 'a' );
				venueLink.textContent = gig.venue.name;
				venueLink.target = '_blank';
				venueLink.title = 'Get directions';
				venueLink.href = getVenueMapLink( gig.venue );
				venueSpan.appendChild( venueLink );
				li.appendChild( venueSpan );

				if ( gig.description ) {
					var detailsSpan = document.createElement( 'span' );
					detailsSpan.className = 'details';
					detailsSpan.textContent = gig.description;
					li.appendChild( detailsSpan );
				}

				gigsList.appendChild( li );
			} );
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
	var options = { hour: 'numeric', minute: '2-digit', hour12: true };
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
} );
