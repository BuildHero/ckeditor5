/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module clipboard/utils/normalizeclipboarddata
 */

/**
 * Removes some popular browser quirks out of the clipboard data (HTML).
 * Removes all HTML comments. These are considered an internal thing and it makes little sense if they leak into the editor data.
 *
 * @param {String} data The HTML data to normalize.
 * @returns {String} Normalized HTML.
 */
export default function normalizeClipboardData( data ) {
	const normalized = data
		.replace( /<span(?: class="Apple-converted-space"|)>(\s+)<\/span>/g, ( fullMatch, spaces ) => {
			// Handle the most popular and problematic case when even a single space becomes an nbsp;.
			// Decode those to normal spaces. Read more in https://github.com/ckeditor/ckeditor5-clipboard/issues/2.
			if ( spaces.length == 1 ) {
				return ' ';
			}

			return spaces;
		} );

	// Remove all HTML comments. Repeat the removal until no more comments are found because a single pass
	// could leave behind a new comment sequence formed by the concatenation of remnants left after removing
	// nested/adjacent comments (e.g. "<!--<!---->-->").
	let result = normalized;
	let previous;

	do {
		previous = result;
		result = result.replace( /<!--[\s\S]*?-->/g, '' );
	} while ( result !== previous );

	return result;
}
