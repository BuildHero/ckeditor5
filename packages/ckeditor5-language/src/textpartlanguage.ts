/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module language/textpartlanguage
 */

import type { LanguageDirection } from 'ckeditor5/src/utils';
import { Plugin, type PluginDependencies } from 'ckeditor5/src/core';

import TextPartLanguageEditing from './textpartlanguageediting';
import TextPartLanguageUI from './textpartlanguageui';

/**
 * The text part language feature.
 *
 * This feature allows setting a language of the document's text part to support
 * [WCAG 3.1.2 Language of Parts](https://www.w3.org/TR/UNDERSTANDING-WCAG20/meaning-other-lang-id.html) specification.
 *
 * To change the editor's UI language, refer to the {@glink features/ui-language Setting the UI language} guide.
 *
 * For more information about this feature, check the {@glink api/language package page} as well as the {@glink features/language
 * Text part language} feature guide.
 *
 * This is a "glue" plugin which loads the
 * {@link module:language/textpartlanguageediting~TextPartLanguageEditing text part language editing feature}
 * and the {@link module:language/textpartlanguageui~TextPartLanguageUI text part language UI feature}.
 */
export default class TextPartLanguage extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires(): PluginDependencies {
		return [ TextPartLanguageEditing, TextPartLanguageUI ];
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName(): 'TextPartLanguage' {
		return 'TextPartLanguage';
	}
}

/**
 * The text part language feature option descriptor.
 */
export interface TextPartLanguageOption {

	/**
	 * The user-readable title of the option.
	 */
	title: string;

	/**
	 * The language code in the ISO 639 format.
	 */
	languageCode: string;

	/**
	 * The language text direction. Automatically detected if omitted.
	 */
	textDirection?: LanguageDirection;
}

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ TextPartLanguage.pluginName ]: TextPartLanguage;
	}

	interface LanguageConfig {

		/**
		 * The available {@link module:language/textpartlanguage~TextPartLanguage}
		 * options that allow setting the language of parts of the content.
		 *
		 * This configuration option is available only with the {@glink api/language text part language feature} enabled.
		 *
		 * Refer to [WCAG 3.1.2 Language of Parts](https://www.w3.org/TR/UNDERSTANDING-WCAG20/meaning-other-lang-id.html) specification
		 * to learn more.
		 *
		 * To change the editor's UI language, refer to the {@glink features/ui-language Setting the UI language} guide.
		 *
		 * The default value is:
		 *
		 * ```ts
		 * const config = [
		 * 	{ title: 'Arabic', languageCode: 'ar' },
		 * 	{ title: 'French', languageCode: 'fr' },
		 * 	{ title: 'Spanish', languageCode: 'es' }
		 * ];
		 * ```
		 *
		 * The `title` property will be used by the text part language dropdown to render available options.
		 *
		 * The `languageCode` property is used for the `lang` attribute in [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) format.
		 *
		 * You can also specify the optional `textDirection` property indicating the reading direction of the language.
		 * Correct values are `ltr` and `rtl`. When the `textDirection` property is missing, the text part language feature will
		 * specify the text direction by itself.
		 */
		textPartLanguage?: Array<TextPartLanguageOption>;
	}
}
