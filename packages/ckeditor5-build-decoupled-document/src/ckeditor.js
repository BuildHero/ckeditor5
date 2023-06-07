/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import DecoupledEditorBase from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize';
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily';
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CKBox from '@ckeditor/ckeditor5-ckbox/src/ckbox';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import ListProperties from '@ckeditor/ckeditor5-list/src/listproperties';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import Pagination from '@ckeditor/ckeditor5-pagination/src/pagination';
import PageBreak from '@ckeditor/ckeditor5-page-break/src/pagebreak';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PictureEditing from '@ckeditor/ckeditor5-image/src/pictureediting';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableColumnResize from '@ckeditor/ckeditor5-table/src/tablecolumnresize';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TableProperties from '@ckeditor/ckeditor5-table/src/tableproperties';
import TableCellProperties from '@ckeditor/ckeditor5-table/src/tablecellproperties';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import CloudServices from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import { Plugin } from '@ckeditor/ckeditor5-core/src';
import { createDropdown, addListToDropdown } from 'ckeditor5/src/ui';
import smartfieldIcon from './smartfieldIcon.svg';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
// import LineHeight from 'ckeditor5-line-height-plugin/src/lineheight';

class InsertSmartField extends Plugin {
	init() {
		const editor = this.editor;
		const componentFactory = editor.ui.componentFactory;
		const t = editor.t;
		const smartFieldsConfig = editor.config._config.smartFields;
		const {
			cbFn = () => {},
			smartFieldsDropdownList: smartFields = []
		} = smartFieldsConfig;

		componentFactory.add( 'insertSmartField', locale => {
			const dropdownView = createDropdown( locale );

			dropdownView.buttonView.set( {
				class: 'smartfield-icon',
				icon: smartfieldIcon,
				label: t( 'Insert smart field' ),
				tooltip: true
			} );

			// The collection of list items
			const items = new Collection();

			smartFields.map( option =>
				items.add( {
					type: 'button',
					model: new Model( {
						label: option,
						withText: true,
						tooltip: true
					} )
				} )
			);
			// Create a dropdown with list of smartfields inside the panel.
			addListToDropdown( dropdownView, items );
			dropdownView.on( 'execute', evt => {
				const formattedText = `[[${ evt.source.label.replace(
					/ /g,
					''
				) }]]`;
				editor.model.change( () => {
					cbFn( editor, formattedText );
				} );
			} );
			return dropdownView;
		} );
	}
}

class CustomImageUploadAdapter {
	constructor( loader, editor ) {
		this.loader = loader;
		this.editor = editor;
	}

	// Starts the upload process.
	upload() {
		return this.loader.file.then(
			file =>
				new Promise( ( resolve, reject ) => {
					this._initRequest();
					this._initListeners( resolve, reject, file );
					this._sendRequest( file );
				} )
		);
	}

	// Aborts the upload process.
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	// Initializes the XMLHttpRequest object using the URL passed to the constructor.
	_initRequest() {
		// eslint-disable-next-line no-undef
		const xhr = this.xhr = new XMLHttpRequest();
		const editor = this.editor;
		const { uploadUrl } = editor.config._config.simpleUpload;
		xhr.open( 'POST', uploadUrl, true );
		xhr.responseType = 'json';
	}

	// Initializes XMLHttpRequest listeners.
	_initListeners( resolve, reject, file ) {
		const xhr = this.xhr;
		const loader = this.loader;
		const genericErrorText = `Couldn't upload file: ${ file.name }.`;

		xhr.addEventListener( 'error', () => reject( genericErrorText ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'readystatechange', () => {
			xhr.onreadystatechange = function( e ) {
				const {
					responseHeaders = {},
					responseText = '{}',
					status = '',
					statusText = ''
				} = e.target;
				if ( xhr.readyState === 4 && responseHeaders[ 'X-Cld-Error' ] ) {
					const errorMessage = responseHeaders[ 'X-Cld-Error' ];
					reject( `invoke::cloudinary-helper::ERROR ${ errorMessage }` );
				}
				if ( xhr.readyState === 4 && status === 413 ) {
					// 413 Payload Too Large error
					const errorMessage = statusText;
					reject( `invoke::cloudinary-helper::ERROR ${ errorMessage }` );
				}
				if ( xhr.readyState === 4 && status === 400 ) {
					// 400 Bad request - invalid image file
					let resp;
					try {
						resp = JSON.parse( responseText );
					} catch ( err ) {
						reject( 'Unable to parse error message' );
					}
					const errorMessage = statusText;
					reject(
						`invoke::cloudinary-helper::ERROR ${
							( resp.error && resp.error.message ) || errorMessage
						}`
					);
				}
			};
		} );
		xhr.addEventListener( 'load', () => {
			const response = xhr.response;

			if ( !response || response.error ) {
				return reject(
					response && response.error ?
						response.error.message :
						genericErrorText
				);
			}

			resolve( {
				default: response.url
			} );
		} );

		// Upload progress when it is supported. The file loader has the #uploadTotal and #uploaded
		// properties which are used e.g. to display the upload progress bar in the editor
		// user interface.
		if ( xhr.upload ) {
			xhr.upload.addEventListener( 'progress', evt => {
				if ( evt.lengthComputable ) {
					loader.uploadTotal = evt.total;
					loader.uploaded = evt.loaded;
				}
			} );
		}
	}

	// Prepares the data and sends the request.
	async _sendRequest( file ) {
		const xhr = this.xhr;
		const editor = this.editor;
		const {
			// eslint-disable-next-line camelcase
			authorization: api_key,
			cloudinaryParams,
			generateSignatureCallback,
			getPublicId,
			tenantId
		} = editor.config._config.simpleUpload;
		// eslint-disable-next-line no-undef
		const data = new FormData();
		const publicId = getPublicId();
		const fileExt = file.name.split( '.' ).pop() || '';
		const tags = `${ tenantId }${ publicId }.${ fileExt }`;
		const signature = await generateSignatureCallback( {
			...cloudinaryParams,
			tags,
			public_id: publicId
		} );
		// eslint-disable-next-line no-undef
		// eslint-disable-next-line space-in-parens
		// eslint-disable-next-line no-undef
		data.append( 'eager', cloudinaryParams.eager );
		data.append( 'public_id', publicId );
		data.append( 'folder', cloudinaryParams.folder );
		data.append( 'timestamp', cloudinaryParams.timestamp );
		data.append( 'api_key', api_key );
		data.append( 'signature', signature.data.getCloudinarySignature );
		data.append( 'tags', tags );
		data.append( 'file', file );

		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

		this.xhr.send( data );
	}
}

function CustomImageUploadAdapterPlugin( editor ) {
	editor.plugins.get( 'FileRepository' ).createUploadAdapter = loader => {
		return new CustomImageUploadAdapter( loader, editor );
	};
}

// const items = [
// 	{ id: '@swarley', userId: '1', name: 'Barney Stinson', link: 'https://www.imdb.com/title/tt0460649/characters/nm0000439' },
// 	{ id: '@lilypad', userId: '2', name: 'Lily Aldrin', link: 'https://www.imdb.com/title/tt0460649/characters/nm0004989' },
// 	{ id: '@marry', userId: '3', name: 'Marry Ann Lewis', link: 'https://www.imdb.com/title/tt0460649/characters/nm1130627' },
// 	{ id: '@marshmallow', userId: '4', name: 'Marshall Eriksen', link: 'https://www.imdb.com/title/tt0460649/characters/nm0781981' },
// 	{ id: '@rsparkles', userId: '5', name: 'Robin Scherbatsky', link: 'https://www.imdb.com/title/tt0460649/characters/nm1130627' },
// 	{ id: '@tdog', userId: '6', name: 'Ted Mosby', link: 'https://www.imdb.com/title/tt0460649/characters/nm1102140' }
// ];

// function getFeedItems( queryText ) {
// 	// As an example of an asynchronous action, return a promise
// 	// that resolves after a 100ms timeout.
// 	// This can be a server request or any sort of delayed action.
// 	return new Promise( resolve => {
// 		const itemsToDisplay = items
// 			// Filter out the full list of all items to only those matching the query text.
// 			.filter( isItemMatching )
// 			// Return 10 items max - needed for generic queries when the list may contain hundreds of elements.
// 			.slice( 0, 10 );

// 		resolve( itemsToDisplay );
// 	} );

// 	// Filtering function - it uses `name` and `username` properties of an item to find a match.
// 	function isItemMatching( item ) {
// 		// Make the search case-insensitive.
// 		const searchString = queryText.toLowerCase();

// 		// Include an item in the search results if name or username includes the current user input.
// 		return (
// 			item.name.toLowerCase().includes( searchString ) ||
//             item.id.toLowerCase().includes( searchString )
// 		);
// 	}
// }

function MentionCustomization( editor ) {
	// eslint-disable-next-line no-undef
	console.log( { editor } );

	editor.conversion.for( 'upcast' ).elementToAttribute( {
		view: {
			name: 'span',
			key: 'data-mention',
			classes: 'mention',
			attributes: {
				'data-user-id': true,
				id: 'mention-id'
			}
		},
		model: {
			key: 'mention',
			value: viewItem => {
			// The mention feature expects that the mention attribute value
			// in the model is a plain object with a set of additional attributes.
			// In order to create a proper object, use the toMentionAttribute helper method:
				const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
				// Add any other properties that you need.
				} );
				return mentionAttribute;
			}
		},
		converterPriority: 'high'
	} );

	// Downcast the model 'mention' text attribute to a view <a> element.
	editor.conversion.for( 'downcast' ).attributeToElement( {
		model: 'mention',
		view: ( modelAttributeValue, { writer } ) => {
		// Do not convert empty attributes (lack of value means no mention).
			if ( !modelAttributeValue ) {
				return;
			}

			writer.createAttributeElement(
				'span',
				{
					class: 'mention',
					id: 'mention-id'
				},
				{
					// Make mention attribute to be wrapped by other attribute elements.
					priority: 20,
					// Prevent merging mentions together.
					id: modelAttributeValue.uid
				}
			);

			const smartFieldsConfig = editor.config._config.smartFields;
			const {
				cbFn = () => {}
			} = smartFieldsConfig;
			// eslint-disable-next-line no-undef
			console.log( { writer } );
			// writer.removeAttribute( 'mention' );

			const formattedText = `[[${ modelAttributeValue.id.replace(
				/#/g,
				''
			) }]]`;
			editor.model.change( () => {
				cbFn( editor, formattedText );
			} );
		},
		converterPriority: 'high'
	} );
}

export default class DecoupledEditor extends DecoupledEditorBase {}

const customColorPalette = [
	{
		color: 'hsl(4, 90%, 58%)',
		label: 'Red'
	},
	{
		color: 'hsl(340, 82%, 52%)',
		label: 'Pink'
	},
	{
		color: 'hsl(291, 64%, 42%)',
		label: 'Purple'
	},
	{
		color: 'hsl(262, 52%, 47%)',
		label: 'Deep Purple'
	},
	{
		color: 'hsl(231, 48%, 48%)',
		label: 'Indigo'
	},
	{
		color: 'hsl(207, 90%, 54%)',
		label: 'Blue'
	},
	{
		color: 'hsl(207, 90%, 54%, 0)',
		label: 'transparent'
	}
];

// Plugins to include in the build.
DecoupledEditor.builtinPlugins = [
	Essentials,
	Alignment,
	FontSize,
	FontFamily,
	FontColor,
	FontBackgroundColor,
	UploadAdapter,
	Autoformat,
	Bold,
	Italic,
	Strikethrough,
	Underline,
	BlockQuote,
	CKBox,
	CKFinder,
	CloudServices,
	EasyImage,
	Heading,
	Image,
	ImageCaption,
	ImageResize,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	IndentBlock,
	InsertSmartField,
	// LineHeight,
	Link,
	List,
	ListProperties,
	MediaEmbed,
	Mention,
	MentionCustomization,
	PageBreak,
	Pagination,
	Paragraph,
	PasteFromOffice,
	PictureEditing,
	Table,
	TableCellProperties,
	TableColumnResize,
	TableProperties,
	TableToolbar,
	TextTransformation,
	Widget,
	CustomImageUploadAdapterPlugin
];

// Editor configuration.
DecoupledEditor.defaultConfig = {
	toolbar: {
		items: [
			'heading',
			'|',
			'fontfamily',
			'fontsize',
			'fontColor',
			'fontBackgroundColor',
			'|',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'|',
			'alignment',
			'|',
			'numberedList',
			'bulletedList',
			'|',
			'outdent',
			'indent',
			'|',
			// 'lineHeight',
			'|',
			'link',
			'blockquote',
			'uploadImage',
			'insertTable',
			'mediaEmbed',
			'|',
			'undo',
			'redo',
			'pageBreak',
			'previousPage',
			'nextPage',
			'pageNavigation',
			'|',
			'insertSmartField'
		]
	},
	// mention: {
	// 	dropdownLimit: 4,
	// 	feeds: [
	// 		{
	// 			marker: '@',
	// 			feed: getFeedItems
	// 		}
	// 	]
	// },
	image: {
		styles: [ 'full', 'alignLeft', 'alignRight' ],
		resizeUnit: 'px',
		toolbar: [
			'imageStyle:inline',
			'imageStyle:wrapText',
			'imageStyle:breakText',
			'|',
			'toggleImageCaption',
			'imageTextAlternative'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells',
			'tableProperties',
			'tableCellProperties'
		],
		tableProperties: {
			borderColors: customColorPalette,
			backgroundColors: customColorPalette
		},
		tableCellProperties: {
			borderColors: customColorPalette,
			backgroundColors: customColorPalette
		}
	},
	// lineHeight: {
	// 	options: [ 1, 1.15, 1.5, 2, 2.5 ]
	// },
	list: {
		properties: {
			styles: true,
			startIndex: true,
			reversed: true
		}
	},
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'en'
};
